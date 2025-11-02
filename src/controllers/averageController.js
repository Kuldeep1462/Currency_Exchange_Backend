const cache = require('../utils/cache');
const helpers = require('../utils/helpers');

const CACHE_KEY = 'quotes_v1';
const CACHE_TTL = 60;

async function getAverage(req, res, next) {
  try {
    const quotes = cache.get(CACHE_KEY, CACHE_TTL);
    if (!quotes) {
      return res.status(503).json({ message: 'Quotes not available yet. Try again in a moment.' });
    }
    const avg = helpers.calculateAverage(quotes);
    console.log('[getAverage] quotes count:', quotes.length, 'average:', avg);
    res.json(avg);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAverage
};
