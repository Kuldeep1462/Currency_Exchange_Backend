const fetchRates = require('../services/fetchRates');
const cache = require('../utils/cache');
const QuotesModel = require('../models/quotesModel');

const CACHE_KEY = 'quotes_v1';
const CACHE_TTL = 60;

async function refreshQuotesCache() {
  const region = process.env.REGION || 'BRL';
  const quotes = await fetchRates.fetchAllQuotes(region.toUpperCase());
  const timestamp = new Date().toISOString();
  const annotated = quotes.map(q => ({ ...q, timestamp }));
  cache.set(CACHE_KEY, annotated);
  console.log('[refreshQuotesCache] Annotated quotes:', annotated);
  try {
    await QuotesModel.saveQuotesBulk(annotated);
  } catch (err) {
    console.warn('DB save failed:', err.message || err);
  }
  return annotated;
}

async function getQuotes(req, res, next) {
  try {
    const cached = cache.get(CACHE_KEY, CACHE_TTL);
    if (cached) {
      console.log('[getQuotes] Returning cached quotes:', cached);
      return res.json(cached);
    }
    const results = await refreshQuotesCache();
    console.log('[getQuotes] Returning fresh quotes:', results);
    return res.json(results);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getQuotes,
  refreshQuotesCache
};
