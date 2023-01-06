import path from "path";
import { fileURLToPath } from "url";
import pool from "./database.js"
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function check(req, res) {
	if (!req.session.loggedin) {
		res.sendFile(path.join(__dirname + '/login.html'));
		return 0;
	}
    if (req.session.status == "admin") { 
        res.sendStatus(404);
        return 0; 
    }
    if (req.session.status == "owner") { 
        res.sendStatus(404);
        return 0; 
    }
	return 1;
}
