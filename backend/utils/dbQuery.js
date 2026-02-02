/* eslint-disable */
const pool = require('../config/database');

/**
 * Execute a query with automatic connection handling
 * Optimized for serverless environments (Vercel/Lambda)
 * Avoids pool.connect() which can timeout in serverless
 *
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @param {number} retries - Number of retries on timeout
 * @returns {Promise} Query result
 */
const executeQuery = async (query, params = [], retries = 2) => {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await pool.query(query, params);
      return result;
    } catch (error) {
      lastError = error;

      // Only retry on timeout or ECONNREFUSED
      if (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.message.includes('timeout')
      ) {
        if (attempt < retries) {
          console.warn(
            `⚠️ Query attempt ${attempt + 1} failed, retrying... Error: ${error.message}`
          );
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError;
};

/**
 * Execute a transaction safely in serverless
 * Note: Long-running transactions may still timeout in Vercel (10s limit)
 * Keep transactions very short
 */
const executeTransaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  executeQuery,
  executeTransaction,
};
