/** Permissions lusers (and susers too) share. */
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

export const renderAddDonation = async (req, res) => {
	if (!check(req, res)) { return; };
	const [data] = await pool.query('SELECT * FROM donors');
	res.render("donation_create", { info: req.session, donors: data });
};

export const addDonation = async (req, res) => {
	/* We need access to the id of the donor's email specified. */
	const [data] = await pool.query('SELECT * FROM donors WHERE email = ?', [req.body.donor]);
	if (data.length == 0) {
		res.send('Could not find that donor!');
		return;
	}

	/* Create the donation. */
	await pool.query('INSERT INTO donations SET ?',
		{
			paymentAmount: req.body.paymentAmount,
			paymentDetails: req.body.paymentDetails,
			paymentType: req.body.paymentType,
			paymentMethod: req.body.paymentMethod,
			paymentDateTime: req.body.paymentDateTime,
			inputDateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
			donor: data[0].id,
			creator: req.session.userid
		});

	/* Update the donor's most recent donation datetime. */
	const [donations] = await pool.query('SELECT * FROM donations WHERE donor = ? ORDER BY paymentDateTime DESC', [data[0].id]);
	await pool.query('UPDATE donors SET lastPaymentDateTime = ? WHERE id = ?', [donations[0].paymentDateTime, data[0].id]);

	res.redirect("/createdonation");
};

export const renderAddDonor = async (req, res) => {
	if (!check(req, res)) { return; };
	res.render("donor_create", { info: req.session });
};

export const addDonor = async (req, res) => {
	await pool.query('INSERT INTO donors SET ?',
		{
			fname: req.body.fname,
			lname: req.body.lname,
			email: req.body.email,
			phone: req.body.phone,
			address: req.body.address,
			preferredContactMethod: req.body.preferredContactMethod,
			frequency: req.body.frequency,
			creator: req.session.userid
		});
	/* Is this needed? */
	res.redirect("/createdonation");
};