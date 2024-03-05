const express = require('express');
const router = express.Router();
const optionsScraperController = require('../controllers/options/options-scraper');

router.post('/options/options-data', optionsScraperController.getOptionsData);

router.post('/options/options-data2', optionsScraperController.getOptionsData2);

module.exports = router;