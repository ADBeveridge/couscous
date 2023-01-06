import { createPool } from "mysql2/promise";

export const pool = createPool({
    host: "awseb-e-aztph9uyyz-stack-awsebrdsdatabase-ta4zdp05fs81.c3kwci5hfksz.us-east-1.rds.amazonaws.com",
    user: "admin",
    password: "WwlzJ9gIVXQe",
    database: "ebdb"
});

export default pool;
