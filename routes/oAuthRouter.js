var express = require('express');
var router = express.Router();
var OAuthConfig = require('../config/config').OAuthConfig;
var axios = require('axios');
const timeout = 30000;
var log = require('log4js').getLogger("oAuther");

var service = require('../service/loginService');

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
router.get("/github_callback", function (req, res, next) {
  let code = req.query.code;
  let state = req.query.state;
  let path = "/login/oauth/access_token";
  let headers = {};
  headers.host = 'github.com';

  path += '?client_id=' + OAuthConfig.GITHUB_CLIENT_ID;
  path += '&client_secret=' + OAuthConfig.GITHUB_CLIENT_SECRET;
  path += '&code=' + code;
  try {
    var reqUrl = `https://github.com${path}`;
    axios.post(reqUrl, {}, {}).then((response) => {
      let { data } = response
      var args = data.split('&');
      var tokenInfo = args[0].split("=");
      var token = tokenInfo[1];
      //利用access_token向资源服务器请求用户授权数据
      var url = `https://api.github.com/user?access_token=${token}&scope=user`;
      axios({
        method: 'get',
        url: url,
        timeout: timeout
      }).then((response) => {
        let { data } = response;
        let params = {
          openId: data.node_id,
          portrait: data.avatar_url,
          nikeName: data.name
        };
        service.insertOAuthUser(params, res, next);
      })
    });
  } catch (err) {
    log.error(err);
    return res.json({ code: 500 })
  }
});
module.exports = router;
