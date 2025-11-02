const express = require('express');
const router = express.Router();
const { getQuotes } = require('../controllers/quotesController');

router.get('/', getQuotes);

module.exports = router;
