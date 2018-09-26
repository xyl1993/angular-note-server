var express = require('express');
var service = require('../service/loginService');


var OAuthConfig = require('../config/config').OAuthConfig;
var axios = require('axios');
const timeout = 30000;
var log = require('log4js').getLogger("oAuther");

var router = express.Router();

router.post('/regist',function(req,res,next){
  return service.insertUsers(req, res, next);
});
router.post('/dtlogin',function(req,res,next){
  return service.dtlogin(req, res, next);
});
router.post('/bindEmail',function(req,res,next){
  return service.bindEmail(req, res, next);
});
/**
 * 第三方登录成功后回调页面请求
 */
router.get("/github_callback", function (req, res, next) {
  let {code,state} = req.query;
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
      console.log(data);
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
        console.log(params);
        service.insertOAuthUser(params, res, next);
      })
    });
  } catch (err) {
    log.error(err);
    return res.json({ code: 500 })
  }
});
module.exports = router;