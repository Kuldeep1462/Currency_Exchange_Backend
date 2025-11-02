const express = require('express');
const dotenv = require('dotenv');
const cron = require('node-cron');
const quotesRoute = require('./routes/quotesRoute');
const averageRoute = require('./routes/averageRoute');
const slippageRoute = require('./routes/slippageRoute');
const debugRoute = require('./routes/debugRoute');
const { refreshQuotesCache } = require('./controllers/quotesController');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();
app.use(express.json());

app.use('/quotes', quotesRoute);
app.use('/average', averageRoute);
app.use('/slippage', slippageRoute);
app.use('/debug', debugRoute);

// Simple debug endpoint available directly on the server process to trigger a refresh
app.get('/debug/refresh', async (req, res, next) => {
  try {
    console.log('[debug] /debug/refresh called');
    const annotated = await refreshQuotesCache();
    return res.json({ refreshed: true, count: annotated.length, data: annotated });
  } catch (err) {
    next(err);
  }
});

// Helpful runtime log so you can verify the debug route is mounted in this process
console.log('[server] mounted routes: /quotes, /average, /slippage, /debug');

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Currency Exchange API running on port ${PORT}`);
});

// Auto-refresh once at startup so the running server has cache immediately
(async () => {
  try {
    console.log('[startup] Auto-refreshing quotes cache...');
    await refreshQuotesCache();
    console.log('[startup] Initial quotes cache populated');
  } catch (err) {
    console.warn('[startup] Initial refresh failed:', err && err.message ? err.message : err);
  }
})();

// Schedule refresh every minute (approx. every 60 seconds)
cron.schedule('* * * * *', async () => {
  try {
    console.log('[cron] Refreshing quotes cache...');
    await refreshQuotesCache();
    console.log('[cron] Quotes cache refreshed');
  } catch (err) {
    console.error('[cron] Failed to refresh quotes cache', err.message || err);
  }
});
