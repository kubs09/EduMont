import pool, { db } from '../config/database.js';

export const closePool = () => pool.end();

export { pool, db };

export default db;
