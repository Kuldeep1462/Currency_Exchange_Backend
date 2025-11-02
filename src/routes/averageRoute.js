const express = require('express');
const router = express.Router();
const { getAverage } = require('../controllers/averageController');

router.get('/', getAverage);

module.exports = router;
