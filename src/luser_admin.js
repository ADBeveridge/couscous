/** Permissions lusers and admins share. */
import path from "path";
import { fileURLToPath } from "url";
import pool from "./database.js"
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function check(req, res) {
	if (!req.session.loggedin) {
		res.sendFile(path.join(__dirname + '/login.html'));
		return 0;
	}
    if (req.session.status == "owner") { 
        res.sendStatus(404);
        return 0; 
    }
	return 1;
}

export const renderDonations = async (req, res) => {
	if (!check(req, res)) { return; };
	const [rows] = await pool.query("SELECT * FROM donations");
	const [rows2] = await pool.query("SELECT * FROM donors"); // We need to display the email of the donor that issued the donation.
	res.render("donations", { donations: rows, donors: rows2, info: req.session });
};

export const renderAddDonation = async (req, res) => {
	if (!check(req, res)) { return; };
	res.render("donation_create", { info: req.session });
};

export const addDonation = async (req, res) => {
	/* See if the donor has already donated to the organization. Identifed only by email. */
	const [data] = await pool.query('SELECT * FROM donors WHERE email = ?', [req.body.email]);

	/* If the donor specified has not been created, then create him here. */
	if (data.length === 0) {
		console.log("Creating a new donor...");
		await pool.query('INSERT INTO donors SET ?',
			{
				fname: req.body.fname,
				lname: req.body.lname,
				email: req.body.email,
				phone: req.body.phone,
				address: req.body.address,
				preferredContactMethod: req.body.preferredContactMethod,
				frequency: req.body.frequency
			});
	}

	/* Now, repull it out, since he's gotta be in there. We need the id... Used when specifying the donor during donation creation. (FOREIGN KEY REFERENCES stuff...) */
	const [rows] = await pool.query('SELECT * FROM donors WHERE email = ?', [req.body.email]);

	/* Create the donation. */
	await pool.query('INSERT INTO donations SET ?',
		{
			paymentAmount: req.body.paymentAmount,
			paymentDetails: req.body.paymentDetails,
			paymentType: req.body.paymentType,
			paymentMethod: req.body.paymentMethod,
			paymentDateTime: req.body.paymentDateTime,
			inputDateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
			donor: rows[0].id,
			creator: req.session.userid
		});

	/* Set the donor's most recent donation datetime. */
	const [donations] = await pool.query('SELECT * FROM donations WHERE donor = ? ORDER BY paymentDateTime DESC', [rows[0].id]);
	await pool.query('UPDATE donors SET lastPaymentDateTime = ? WHERE id = ?', [donations[0].paymentDateTime, rows[0].id]);

	/* Is this needed? */
	res.redirect("/createdonation");
};
