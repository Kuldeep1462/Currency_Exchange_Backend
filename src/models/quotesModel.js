const { pool } = require('../config/db');

async function saveQuotesBulk(quotes) {
  if (!pool) return; 
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const text = 'INSERT INTO quotes(source, buy_price, sell_price, currency, created_at) VALUES($1,$2,$3,$4,$5)';
    for (const q of quotes) {
      const currency = process.env.REGION || 'UNKNOWN';
      await client.query(text, [q.source, q.buy_price, q.sell_price, currency, new Date()]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { saveQuotesBulk };
