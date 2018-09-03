var express = require('express');
var service = require('../service/articleService');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  service.selectDetail(req, res, next);
});

module.exports = router;
