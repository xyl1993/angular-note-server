var express = require('express');
var router = express.Router();
var OAuthConfig = require('../config/config').OAuthConfig;

/* GET home page. */
router.get('/github', function (req, res, next) {
  var dataStr = (new Date()).valueOf();
  //重定向到认证接口,并配置参数
  var path = "https://github.com/login/oauth/authorize";
  path += '?client_id=' + OAuthConfig.GITHUB_CLIENT_ID;
  path += '&scope=' + OAuthConfig.GITHUB_CLIENT_SCOPE;
  path += '&state=' + dataStr;
  //转发到授权服务器
  res.redirect(path);
});

module.exports = router;
