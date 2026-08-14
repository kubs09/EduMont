// Re-exports the Drizzle db/pool from config/database.js, plus a
// closePool() helper for one-off scripts (migrate.js, seed.js, tests) that
// need to exit cleanly after they finish.
import pool, { db } from '../config/database.js';

export const closePool = () => pool.end();

export { pool, db };

export default db;
