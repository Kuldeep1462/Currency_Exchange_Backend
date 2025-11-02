const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
}

module.exports = {
  pool
};
