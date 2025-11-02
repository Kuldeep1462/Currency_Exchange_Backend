const cache = require('../utils/cache');
const helpers = require('../utils/helpers');

const CACHE_KEY = 'quotes_v1';
const CACHE_TTL = 60;

async function getSlippage(req, res, next) {
  try {
    const quotes = cache.get(CACHE_KEY, CACHE_TTL);
    if (!quotes) {
      return res.status(503).json({ message: 'Quotes not available yet. Try again in a moment.' });
    }
    const averages = helpers.calculateAverage(quotes);
    const slippage = helpers.calculateSlippage(quotes, averages);
    console.log('[getSlippage] quotes count:', quotes.length, 'averages:', averages, 'slippage sample:', slippage.slice(0,3));
    res.json(slippage);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSlippage
};
