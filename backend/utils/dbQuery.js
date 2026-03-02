import pool from '../config/database.js';
import console from 'console';
import { setTimeout as sleep } from 'timers/promises';

const executeQuery = async (query, params = [], retries = 2) => {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await pool.query(query, params);
      return result;
    } catch (error) {
      lastError = error;

      if (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.message.includes('timeout')
      ) {
        if (attempt < retries) {
          await sleep(Math.pow(2, attempt) * 100);
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError;
};

const executeTransaction = async (callback) => {
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch((rollbackErr) => {
      console.error('Error rolling back transaction:', rollbackErr);
    });
    throw error;
  } finally {
    client?.release();
  }
};

export { executeQuery, executeTransaction };
