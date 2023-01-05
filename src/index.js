import express from "express";
import session from "express-session";
import path from "path";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { Router } from "express";
import { createPool } from "mysql2/promise";
import mysql from "mysql";
import { request } from "http";
import { channel } from "diagnostics_channel";

// Used by login system.
const connection = mysql.createConnection({
	host: "awseb-e-aztph9uyyz-stack-awsebrdsdatabase-ta4zdp05fs81.c3kwci5hfksz.us-east-1.rds.amazonaws.com",
	user: "admin",
	password: "WwlzJ9gIVXQe",
	database: "ebdb"
});

// Used by customers system.
const pool = createPool({
	host: "awseb-e-aztph9uyyz-stack-awsebrdsdatabase-ta4zdp05fs81.c3kwci5hfksz.us-east-1.rds.amazonaws.com",
	user: "admin",
	password: "WwlzJ9gIVXQe",
	database: "ebdb"
});

/* App. Configure what it uses. */
const app = express();
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

/* The first called function, just reroutes to auth or customers. */
app.get('/', async (request, response) => {
	if (!check(request, response)) {return;};
	
	/** Render schedule. */
	/* Get a customers last donation, and coupled with his given donation frequency, calculate if he needs to donate today. */
	var renderContents = [];

	const [result] = await pool.query("SELECT * FROM donors");
	for (var i = 0; i < result.length; i++) {
		const [rows] = await pool.query('SELECT * FROM donations WHERE donor = ? ORDER BY paymentDateTime DESC', [result[i].id]);
		if (rows.length === 0) {
			break;
		}

		/* Calculate if the last donation date plus the frequency (which is in days) equals today. */
		var frequency = result[i].frequency;
		var fDate = new Date(rows[0].paymentDateTime);
		fDate.setDate(fDate.getDate() + frequency); // Set the date forward by the frequency days.
		var today = new Date();

		if (sameDay(fDate, today) === true) {
			renderContents.push(result[i]);
		}
	}

	response.render("sched", { donations: renderContents });

});

/** Login and logout. */
app.post('/auth', function (request, response) {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;

	if (!username || !password) {
		response.send('Please enter Username and Password!');
		return;
	}

	// Execute SQL query that'll select the account from the database based on the specified username and password
	connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
		// If there is an issue with the query, output the error
		if (error) throw error;
		// If the account exists
		if (results.length == 0) {
			response.send('Incorrect Email and/or Password!');
			return;
		}
		// Authenticate the user
		request.session.loggedin = true;
		request.session.username = username;
		request.session.userid = results[0].id;
		response.redirect('/');
	});
});
app.get('/logout', function (request, response) {
	// Authenticate the user
	request.session.loggedin = false;
	request.session.username = null;
	request.session.userid = null;
	response.redirect('/');
});

/** Utility functions. */
function sameDay(d1, d2) {
	return d1.getFullYear() === d2.getFullYear() &&
		d1.getMonth() === d2.getMonth() &&
		d1.getDate() === d2.getDate();
}
function check(request, res) {
	if (!request.session.loggedin) {
		res.sendFile(path.join(__dirname + '/login.html'));
		return 0;
	}
	return 1;
}

/** Create donation (and donor too if needed.) */
app.post("/add", async (req, res) => {
	/* See if the donor has already donated to the organization. Identifed only by email. */
	const [data] = await pool.query('SELECT * FROM donors WHERE email = ?', [req.body.email]);

	/* If the donor specified has not been created, then create him here. */
	if (data.length === 0) {
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
	res.redirect("/");
});


/** Schedule */
app.get("/donations", async (req, res) => {
	res.render("home");
});

/** Donor managment. Does not create donor as donation creation does that. */
app.get("/donors", async (req, res) => {
	const [rows] = await pool.query("SELECT * FROM donors");
	res.render("donor_management", { donors: rows });
});
app.get("/update/:id", async (req, res) => {
	const { id } = req.params;
	const [result] = await pool.query("SELECT * FROM donors WHERE id = ?", [
		id,
	]);
	res.render("donor_edit", { donor: result[0] });
});
app.post("/update/:id", async (req, res) => {
	const { id } = req.params;
	const newDonor = req.body;
	await pool.query("UPDATE donors set ? WHERE id = ?", [newDonor, id]);
	res.redirect("/donors");
});
app.get("/delete/:id", async (req, res) => {
	const { id } = req.params;
	const [result] = await pool.query("SELECT * FROM donors WHERE id = ?", [
		id,
	]);
	res.render("donor_delete", { donor: result[0] });
});
app.post("/delete/:id", async (req, res) => {
	const { id } = req.params;
	await pool.query("DELETE FROM donations WHERE donor = ?", [id]);
	await pool.query("DELETE FROM donors WHERE id = ?", [id]);
	res.redirect("/donors");
});

/** User management. */
app.get("/users", async (req, res) => {
	if (!check(req, res)) {return;};
	const [result] = await pool.query("SELECT * FROM accounts WHERE status is NULL");
	res.render("user_management", { users: result });
});
app.post("/adduser", async (req, res) => {
	const newUser = req.body;
	await pool.query("INSERT INTO accounts set ?", [newUser]);
	res.redirect("/users");
});
app.get("/updateuser/:id", async (req, res) => {
	if (!check(req, res)) {return;};
	const { id } = req.params;
	const [result] = await pool.query("SELECT * FROM accounts where id = ?", [
		id,
	]);
	res.render("user_edit", { user: result[0] });
});
app.post("/updateuser/:id", async (req, res) => {
	const { id } = req.params;
	const newuser = req.body;
	await pool.query("UPDATE accounts set ? WHERE id = ?", [newuser, id]);
	res.redirect("/users");
});
app.get("/deleteuser/:id", async (req, res) => {
	if (!check(req, res)) {return;};
	const { id } = req.params;
	const [result] = await pool.query("SELECT * FROM accounts WHERE id = ?", [
		id,
	]);
	res.render("user_delete", { user: result[0] });
});
app.post("/deleteuser/:id", async (req, res) => {
	const { id } = req.params;
	await pool.query("DELETE FROM accounts WHERE id = ?", [id]);
	res.redirect("/users");
});


// Port to run server on.
const port = process.env.PORT || 3000;

app.listen(port);
console.log(`Running server on port ${port}`);
