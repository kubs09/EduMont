import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import process from 'process';
import console from 'console';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.test'), override: true });

const { Pool } = pg;

const targetDb = process.env.POSTGRES_DB || 'montessori_test';
if (!/^[a-zA-Z0-9_]+$/.test(targetDb)) {
  console.error(`Refusing to create database with unsafe name: ${targetDb}`);
  process.exit(1);
}

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: process.env.POSTGRES_PORT || 5432,
});

try {
  await pool.query(`CREATE DATABASE ${targetDb}`);
  console.log(`Created ${targetDb}`);
} catch (error) {
  if (error.code === '42P04') {
    console.log(`${targetDb} already exists`);
  } else {
    console.error('FAILED:', error.message);
    process.exitCode = 1;
  }
} finally {
  await pool.end();
}
