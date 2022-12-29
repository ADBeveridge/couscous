import express from "express";
import session from "express-session";
import path from "path";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { Router } from "express";
import { createPool } from "mysql2/promise";
import mysql from "mysql";

const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'WwlzJ9gIVXQe',
	database: 'customersdb'
});

const pool = createPool({
	host: "localhost",
	user: "root",
	password: "WwlzJ9gIVXQe",
	database: "customersdb",
});

const renderCustomers = async (req, res) => {
	const [rows] = await pool.query("SELECT * FROM customer");
	res.render("customers", { customers: rows });
};

const createCustomers = async (req, res) => {
	const newCustomer = req.body;
	await pool.query("INSERT INTO customer set ?", [newCustomer]);
	res.redirect("/customers");
};

const editCustomer = async (req, res) => {
	const { id } = req.params;
	const [result] = await pool.query("SELECT * FROM customer WHERE id = ?", [
		id,
	]);
	res.render("customers_edit", { customer: result[0] });
};

const updateCustomer = async (req, res) => {
	const { id } = req.params;
	const newCustomer = req.body;
	await pool.query("UPDATE customer set ? WHERE id = ?", [newCustomer, id]);
	res.redirect("/customers");
};

const deleteCustomer = async (req, res) => {
	const { id } = req.params;
	const result = await pool.query("DELETE FROM customer WHERE id = ?", [id]);
	if (result.affectedRows === 1) {
		res.json({ message: "Customer deleted" });
	}
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

/* The first called function, just reroutes to login or customers. */
app.get('/', function (request, response) {

	// If the user is loggedin
	if (request.session.loggedin) {
		// Output username
		response.redirect('/customers');
		response.end();
	} else {
		response.sendFile(path.join(__dirname + '/login.html'));
	}

});

/* This function is called by the action name in the html file. */
app.post('/auth', function (request, response) {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;
	console.log(username + " " + password);

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
		if (results.length > 0) {
			// Authenticate the user
			request.session.loggedin = true;
			request.session.username = username;
			// Redirect to home page
			response.redirect('/customers');
		} else {
			response.send('Incorrect Username and/or Password!');
		}
		response.end();
	});
});

/* "miniapp" for routing with adding, editing, and deleting customers. */
const customerRoutes = Router();
app.use(customerRoutes);

customerRoutes.get("/customers", renderCustomers);
customerRoutes.post("/add", createCustomers);
customerRoutes.get("/update/:id", editCustomer);
customerRoutes.post("/update/:id", updateCustomer);
customerRoutes.get("/delete/:id", deleteCustomer);

// Port to run server on.
const port = process.env.PORT || 3000;

app.listen(port);
console.log(`Running server on port ${port}`);
