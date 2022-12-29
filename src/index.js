import express from "express";
import session from "express-session";
import path from "path";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { Router } from "express";
import { createPool } from "mysql2/promise";
import mysql from "mysql";

const connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : '{XI#;9}!@nsh',
	database : 'customersdb'
});

const pool = createPool({
  host: "localhost",
  user: "alanbeveridge",
  password: "{XI#;9}!@nsh",
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
  res.redirect("/");
};

const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query("DELETE FROM customer WHERE id = ?", [id]);
  if (result.affectedRows === 1) {
    res.json({ message: "Customer deleted" });
  }
  res.redirect("/");
};

const login = async (req, res) => {
  res.sendFile(path.join(__dirname + '/login.html'));
}

const app = express();
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', login);
app.post('/auth', function(request, response) {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;
  console.log(username + " " + password);
  
	// Ensure the input fields exists and are not empty
	if (username && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
      // If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				request.session.loggedin = true;
				request.session.username = username;
				// Redirect to home page
				response.redirect('/home');
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});
// http://localhost:3000/home
app.get('/home', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
		// Output username
		response.redirect('/customers');
	} else {
		// Not logged in
		response.send('Please login to view this page!');
	}
	response.end();
});


const customerRoutes = Router();


app.use(express.json());
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(morgan("dev"));
app.use(customerRoutes);
app.use(express.static(path.join(__dirname, "public")));


customerRoutes.get("/customers", renderCustomers);
customerRoutes.post("/add", createCustomers);
customerRoutes.get("/update/:id", editCustomer);
customerRoutes.post("/update/:id", updateCustomer);
customerRoutes.get("/delete/:id", deleteCustomer);


// Port to run server on.
const port = process.env.PORT || 3000;

app.listen(port);
console.log(`Running server on port ${port}`);
