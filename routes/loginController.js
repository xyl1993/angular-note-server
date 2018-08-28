var express = require('express');
var service = require('../service/loginService');
var router = express.Router();
var log = require('log4js').getLogger("loginController");

router.post('/regist',function(req,res,next){
  return service.insertUsers(req, res, next);
});
router.post('/dtlogin',function(req,res,next){
  return service.dtlogin(req, res, next);
});
module.exports = router;