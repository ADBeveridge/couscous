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
    if (req.session.status == "owner") { 
        res.sendStatus(404);
        return 0; 
    }
	return 1;
}

/** Luser management. */
export const renderLusers = async (req, res) => {
	if (!check(req, res)) { return; };
	const [result] = await pool.query("SELECT * FROM accounts WHERE status = 'luser' && hidden = 0");
	console.log("RES" + result);
	const [rows] = await pool.query("SELECT * FROM donors");
	res.render("users", { users: result, info: req.session, donors: rows });
};

export const addLuser = async (req, res) => {
	const newUser = req.body;
	newUser["hidden"] = 0;
    newUser["status"] = "luser";
	await pool.query("INSERT INTO accounts set ?", [newUser]);
	res.redirect("/lusers");
}

export const renderUpdateLuser = async (req, res) => {
	if (!check(req, res)) { return; };
	if (req.session.status == "luser") { res.sendStatus(404); return; }
	const { id } = req.params;
	const [result] = await pool.query("SELECT * FROM accounts where id = ?", [
		id,
	]);
	res.render("user_edit", { user: result[0], info: req.session });
}
export const updateLuser = async (req, res) => {
	const { id } = req.params;
	const newuser = req.body;
	await pool.query("UPDATE accounts set ? WHERE id = ?", [newuser, id]);
	res.redirect("/lusers");
}
export const renderDeleteLuser = async (req, res) => {
	if (!check(req, res)) { return; };
	if (req.session.status == "luser") { res.sendStatus(404); return; }
	const { id } = req.params;
	const [result] = await pool.query("SELECT * FROM accounts WHERE id = ?", [
		id,
	]);
	res.render("user_delete", { user: result[0], info: req.session });
}
export const deleteLuser = async (req, res) => {
	const { id } = req.params;
	await pool.query("UPDATE accounts set hidden = 1 WHERE id = ?", [id]);
	res.redirect("/lusers");
}

/** Only Admin's can delete and edit donors. Lusers can add them, but that is it. */
export const renderUpdateDonor = async (req, res) => {
	if (!check(req, res)) { return; };
	const { id } = req.params;
	const [result] = await pool.query("SELECT * FROM donors WHERE id = ?", [
		id,
	]);
	res.render("donor_edit", { donor: result[0], info: req.session });
};

export const updateDonor = async (req, res) => {
	const { id } = req.params;
	const newDonor = req.body;
	await pool.query("UPDATE donors set ? WHERE id = ?", [newDonor, id]);
	res.redirect("/lusers");
};

export const renderDeleteDonor = async (req, res) => {
	if (!check(req, res)) { return; };
	const { id } = req.params;
	const [result] = await pool.query("SELECT * FROM donors WHERE id = ?", [
		id,
	]);
	res.render("donor_delete", { donor: result[0], info: req.session });
};

export const deleteDonor = async (req, res) => {
	const { id } = req.params;
	await pool.query("DELETE FROM donations WHERE donor = ?", [id]);
	await pool.query("DELETE FROM donors WHERE id = ?", [id]);
	res.redirect("/lusers");
};