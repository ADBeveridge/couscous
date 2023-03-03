import { createPool } from "mysql2/promise";

export const pool = createPool({
    host: "HOSTNAME_HERE",
    user: "USER_HERE",
    password: "PASSWORD_HERE",
    database: "DATABASE_HERE"
});

export default pool;
