import express from "express";
import session from "express-session";
import path from "path";
import morgan from "morgan";
import { fileURLToPath } from "url";
import mysql from "mysql";
import { request } from "http";
import { channel } from "diagnostics_channel";

import pool from "./database.js";

/* Suser urls. */
import {
	deleteLuser,
	renderDeleteLuser,
	renderLusers,
	addLuser,
	renderUpdateLuser,
	updateLuser,
	renderUpdateDonor,
	updateDonor,
	renderDeleteDonor,
	deleteDonor,
	renderDonations
} from "./suser.js";

/* Owner urls. */
import {
	deleteSuser,
	renderDeleteSuser,
	renderSusers,
	addSuser,
	renderUpdateSuser,
	updateSuser,
	renderCreateOrganization,
	createOrganization,
	renderUpdateOrganization,
	updateOrganization,
	renderDeleteOrganization,
	deleteOrganization
} from "./owner.js";

/* Lusers and Suser's urls. */
import {
	addDonation,
	renderAddDonation,
	addDonor,
	renderAddDonor
} from "./luser_suser.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* App. Configure what it uses. */
const app = express();
app.use(session({ secret: 'secret', resave: true, saveUninitialized: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

/* The first called function, shows the schedule. */
app.get('/', async (request, response) => {
	if (!check(request, response)) { return; };

	/** If owner, send the owner to the management page. He can't see the schedule. */
	if (request.session.status == "owner") {
		response.redirect('/susers');
		return 0;
	}

	/** Render schedule. */
	/* Get a customers last donation, and coupled with his given donation frequency, calculate if he needs to donate today. */
	var donorsDue = [];

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
			donorsDue.push(result[i]);
		}
	}
	response.render("sched", { donors: donorsDue, info: request.session });
});

/** Login and logout. */
app.post('/auth', async (request, response) => {
	// Capture the input fields
	let uname = request.body.username;
	let password = request.body.password;

	if (!uname || !password) {
		response.send('Please enter Username and Password!');
		return;
	}

	// Execute SQL query that'll select the account from the database based on the specified username and password
	const [data] = await pool.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [uname, password]);
	if (data.length == 0) {
		response.send('Incorrect Email and/or Password!');
		return;
	}

	// Authenticate the user
	request.session.loggedin = true;
	request.session.username = uname;
	request.session.status = data[0].status;
	if (request.session.status != "owner") {
		const [org] = await pool.query('SELECT * FROM organizations WHERE id = ?', [data[0].organization]);
		if (org.length == 0) {
			response.send('Error logging in. Please contact support.');
			return;
		}
		request.session.organization = data[0].organization;
		request.session.organizationName = org[0].name;
	}
	response.redirect('/');
});

/* Deinitialize variables that identify the user as logged in. */
app.get('/logout', function (request, response) {
	request.session.loggedin = false;
	request.session.username = null;
	request.session.status = null;
	request.session.organization = 0;
	response.redirect('/');
});

/** Compare a date without cosidering the time. */
function sameDay(d1, d2) {
	return d1.getFullYear() === d2.getFullYear() &&
		d1.getMonth() === d2.getMonth() &&
		d1.getDate() === d2.getDate();
}
/** Check if user is logged in. */
function check(request, res) {
	if (!request.session.loggedin) {
		res.sendFile(path.join(__dirname + '/login.html'));
		return 0;
	}
	return 1;
}

/** Donation management. Can be used by both susers and lusers. */
app.get("/donations", renderDonations);
app.get("/createdonation", renderAddDonation);
app.post("/createdonation", addDonation);

/** Donor management. Only edit and deletes, does not create donor as donation creation does that. */
app.get("/update/:id", renderUpdateDonor);
app.post("/update/:id", updateDonor);
app.get("/delete/:id", renderDeleteDonor);
app.post("/delete/:id", deleteDonor);
app.get("/add", renderAddDonor);
app.post("/add", addDonor);

/** User management. Actions limited only to Susers. */
app.get("/lusers", renderLusers);
app.post("/addluser", addLuser);
app.get("/updateluser/:id", renderUpdateLuser);
app.post("/updateluser/:id", updateLuser);
app.get("/deleteluser/:id", renderDeleteLuser);
app.post("/deleteluser/:id", deleteLuser);

/** User management. Actions limited only to Owners. */
app.get("/susers", renderSusers);
app.post("/addsuser", addSuser);
app.get("/updatesuser/:id", renderUpdateSuser);
app.post("/updatesuser/:id", updateSuser);
app.get("/deletesuser/:id", renderDeleteSuser);
app.post("/deletesuser/:id", deleteSuser);

/* Organization management. */
app.get("/addorganization", renderCreateOrganization);
app.post("/addorganization", createOrganization);
app.get("/updateorganization/:id", renderUpdateOrganization);
app.post("/updateorganization/:id", updateOrganization);
app.get("/deleteorganization/:id", renderDeleteOrganization);
app.post("/deleteorganization/:id", deleteOrganization);

/* 404 handler. */
app.use((req, res, next) => {
	res.sendStatus(404);
})

// Port to run server on.
const port = process.env.PORT || 3000;

app.listen(port);
console.log(`Running server on port ${port}`);
