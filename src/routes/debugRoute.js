const express = require('express');
const router = express.Router();
const { refreshQuotesCache } = require('../controllers/quotesController');

router.get('/refresh', async (req, res, next) => {
  try {
    const annotated = await refreshQuotesCache();
    res.json({ refreshed: true, count: annotated.length, data: annotated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
