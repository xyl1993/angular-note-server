var express = require('express');
var config = require('../config/config.js');
var axios = require('axios');
var router = express.Router();
var log = require('log4js').getLogger("middle");
const timeout = 30000;
var querystring = require('qs');
// 定义一个通用 Get 接口，转接所有数据，不再一个个写
router.get('*', (req, res) => {
  try {
    axios({
      method: 'get',
      url: config.origin + req.url,
      timeout: timeout,
      headers: req.headers
    }).then((response) => {
      log.info(response);
      return res.json(response.data)
    })
  } catch (err) {
    log.error(err);
    return res.json({ code: 500 })
  }
})

// 定义一个通用的 Post 接口，转接所有数据
router.post('*', (req, res) => {
  try {
    var reqUrl = config.origin + req.url;
    var reqContentType = req.headers['content-type'];
    var reqBody = req.body;
    // 根据 请求的 content-type 判断用哪种格式化方式
    var reqData = reqBody ?
      (reqContentType ?
        reqContentType.indexOf('json') !== -1 ? JSON.stringify(reqBody) : querystring.stringify(reqBody)
        :
        querystring.stringify(reqBody))
      : Jsong.stringify({});
    axios.post(reqUrl, reqData, {
      headers: req.headers
    }).then((response) => {
      log.info(response);
      return res.json(response.data)
    });
  } catch (err) {
    log.error(err);
    return res.json({ code: 500 })
  }
})

module.exports = router;