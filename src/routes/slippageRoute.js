const express = require('express');
const router = express.Router();
const { getSlippage } = require('../controllers/slippageController');

router.get('/', getSlippage);

module.exports = router;
