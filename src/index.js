import express from "express";
import session from "express-session";
import path from "path";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { Router } from "express";
import { createPool } from "mysql2/promise";
import mysql from "mysql";
import { request } from "http";

// Used by login system
const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'WwlzJ9gIVXQe',
	database: 'customersdb'
});

// Used by customers system.
const pool = createPool({
	host: "localhost",
	user: "root",
	password: "WwlzJ9gIVXQe",
	database: "customersdb",
});

const createDonation = async (req, res) => {

	/*let fname = request.body.fname;
	let lname = request.body.lname;*/

	/* See if the donor has already donated to the organization. */
	connection.query('SELECT * FROM donors WHERE email = ?', [req.body.email], function (error, results, fields) {
		if (error) throw error;
		if (results.length >= 1) {
			connection.query('INSERT INTO donations SET ?',
				{ paymentAmount: req.body.paymentAmount,
				  paymentDetails: req.body.paymentDetails,
			      paymentType: req.body.paymentType,
				  paymentMethod: req.body.paymentMethod,
				  paymentDate: req.body.paymentDate,
				  paymentTime: req.body.paymentTime,
				  donor: results[0].id,
				  creator: req.session.userid
			    },

				function (error, results, fields) {
					if (error) throw error;
				});

			res.redirect("/customers");
		} else {
			res.send('That person does not exist!');
		}
	});

	//await pool.query("INSERT INTO donations set ?", [newCustomer]);

};

const editDonation = async (req, res) => {
	const { id } = req.params;
	const [result] = await pool.query("SELECT * FROM customer WHERE id = ?", [
		id,
	]);
	res.render("customers_edit", { customer: result[0] });
};

const updateDonation = async (req, res) => {
	const { id } = req.params;
	const newCustomer = req.body;
	await pool.query("UPDATE customer set ? WHERE id = ?", [newCustomer, id]);
	res.redirect("/customers");
};

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
app.get('/', function (request, response) {
	// If the user is loggedin
	if (!request.session.loggedin) {
		response.sendFile(path.join(__dirname + '/login.html'));
		return;
	}
	response.redirect('/customers');
	console.log("Called!");
	response.end();
});

/* This function is called by the action name in the html file. */
app.post('/auth', function (request, response) {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;

	if (!username || !password) {
		response.send('Please enter Username and Password!');
		response.end();
		return;
	}

	// Execute SQL query that'll select the account from the database based on the specified username and password
	connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
		// If there is an issue with the query, output the error
		if (error) throw error;
		// If the account exists
		if (results.length == 0) {
			response.send('Incorrect Username and/or Password!');
			return;
		}
		// Authenticate the user
		request.session.loggedin = true;
		request.session.username = username;
		request.session.userid = results[0].id;
		response.redirect('/customers');
		response.end();
	});
});

/* "miniapp" for routing with adding, editing, and deleting customers. */
const customerRoutes = Router();
app.use(customerRoutes);

customerRoutes.get("/customers", function (req, res) {
	res.sendFile(path.join(__dirname + '/home.html'));
});

customerRoutes.post("/add", createDonation);
/*
customerRoutes.get("/update/:id", editCustomer);
customerRoutes.post("/update/:id", updateCustomer);
customerRoutes.get("/delete/:id", deleteCustomer);
*/

// Port to run server on.
const port = process.env.PORT || 3000;

app.listen(port);
console.log(`Running server on port ${port}`);
