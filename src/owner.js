import path from "path";
import { fileURLToPath } from "url";
import pool from "./database.js"
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function check(req, res) {
	if (!req.session.loggedin) {
		res.sendFile(path.join(__dirname + '/login.html'));
		return 0;
	}
    if (req.session.status == "luser") { 
        res.sendStatus(404);
        return 0; 
    }
    if (req.session.status == "admin") { 
        res.sendStatus(404);
        return 0; 
    }
	return 1;
}

export const renderAdmins = async (req, res) => {
	if (!check(req, res)) { return; };
	const [result] = await pool.query("SELECT * FROM accounts WHERE status = 'administrator' && hidden = 0");
	const [rows] = await pool.query("SELECT * FROM donors");
	res.render("users", { users: result, info: req.session, donors: rows });
};

export const addAdmin = async (req, res) => {
	const newUser = req.body;
	newUser["hidden"] = 0;
    newUser["status"] = "administrator";
	await pool.query("INSERT INTO accounts set ?", [newUser]);
	res.redirect("/admins");
}

export const renderUpdateAdmin = async (req, res) => {
	if (!check(req, res)) { return; };
	if (req.session.status == "luser") { res.sendStatus(404); return; }
	const { id } = req.params;
	const [result] = await pool.query("SELECT * FROM accounts where id = ?", [
		id,
	]);
	res.render("user_edit", { user: result[0], info: req.session });
}
export const updateAdmin = async (req, res) => {
	const { id } = req.params;
	const newuser = req.body;
	await pool.query("UPDATE accounts set ? WHERE id = ?", [newuser, id]);
	res.redirect("/admins");
}
export const renderDeleteAdmin = async (req, res) => {
	if (!check(req, res)) { return; };
	if (req.session.status == "luser") { res.sendStatus(404); return; }
	const { id } = req.params;
	const [result] = await pool.query("SELECT * FROM accounts WHERE id = ?", [
		id,
	]);
	res.render("user_delete", { user: result[0], info: req.session });
}
export const deleteAdmin = async (req, res) => {
	const { id } = req.params;
	await pool.query("UPDATE accounts set hidden = 1 WHERE id = ?", [id]);
	res.redirect("/admins");
}
