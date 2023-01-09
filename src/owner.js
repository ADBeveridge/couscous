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
	if (req.session.status == "suser") {
		res.sendStatus(404);
		return 0;
	}
	return 1;
}

export const renderSusers = async (req, res) => {
	if (!check(req, res)) { return; };
	const [result] = await pool.query("SELECT * FROM accounts WHERE status = 'suser' && hidden = 0");
	const [rows] = await pool.query("SELECT * FROM donors");
	const [orgs] = await pool.query("SELECT * FROM organizations");
	res.render("management", { users: result, info: req.session, donors: rows, organizations: orgs });
};

export const addSuser = async (req, res) => {
	const [resu] = await pool.query("SELECT * FROM organizations WHERE name = ?", [req.body.organization]);
	if (resu.length == 0) {
		res.send('Could not find that organization!');
		return;
	}

	await pool.query('INSERT INTO accounts SET ?',
		{
			status: "suser",
			username: req.body.username,
			email: req.body.email,
			password: req.body.password,
			hidden: 0,
			organization: resu[0].id
		});

	res.redirect("/susers");
}

export const renderUpdateSuser = async (req, res) => {
	if (!check(req, res)) { return; };
	const { id } = req.params;
	const [result] = await pool.query("SELECT * FROM accounts where id = ?", [id]);
	res.render("account_edit", { user: result[0], info: req.session });
}
export const updateSuser = async (req, res) => {
	const { id } = req.params;
	const suser = req.body;
	await pool.query("UPDATE accounts set ? WHERE id = ?", [suser, id]);
	res.redirect("/susers");
}
export const renderDeleteSuser = async (req, res) => {
	if (!check(req, res)) { return; };
	const { id } = req.params;
	const [result] = await pool.query("SELECT * FROM accounts WHERE id = ?", [id]);
	res.render("account_delete", { user: result[0], info: req.session });
}
export const deleteSuser = async (req, res) => {
	const { id } = req.params;
	await pool.query("UPDATE accounts set hidden = 1 WHERE id = ?", [id]);
	res.redirect("/susers");
}
/** Organization management. */
export const renderCreateOrganization = async (req, res) => {
	if (!check(req, res)) { return; };
	res.render("organization_create", { info: req.session });
}
export const createOrganization = async (req, res) => {
	await pool.query('INSERT INTO organizations SET ?',
		{
			name: req.body.oname,
			governmentId: req.body.governmentId
		});
	res.redirect("/susers");
}
export const renderUpdateOrganization = async (req, res) => {
	if (!check(req, res)) { return; };
	const { id } = req.params;
	const [result] = await pool.query("SELECT * FROM organizations WHERE id = ?", [id]);
	res.render("organization_edit", { organization: result[0], info: req.session });
}
export const updateOrganization = async (req, res) => {
	const { id } = req.params;
	const org = req.body;
	await pool.query("UPDATE organizations SET ? WHERE id = ?", [org, id]);
	res.redirect("/susers");
}
export const renderDeleteOrganization = async (req, res) => {
	if (!check(req, res)) { return; };
	const { id } = req.params;
	const [result] = await pool.query("SELECT * FROM organizations WHERE id = ?", [id]);
	res.render("organization_delete", { organization: result[0], info: req.session });
}
export const deleteOrganization = async (req, res) => {
	const { id } = req.params;
	await pool.query("DELETE FROM accounts WHERE organization = ?", [id]);
	await pool.query("DELETE FROM organizations WHERE id = ?", [id]);
	res.redirect("/susers");
}