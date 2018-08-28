var mysql = require('mysql');
var $conf = require('../config/db');
var $sql = require('../mapper/loginMapper');
var log = require('log4js').getLogger("loginService");
// 使用连接池，提升性能
var pool = mysql.createPool($conf.mysql);
const constants = require('../config/constants');
const jwt = require('jsonwebtoken');
const secret = 'SUMMERNOTE';

module.exports = {
  insertUsers: function (req, res, next) {
    let resultMap = {};
    pool.getConnection(function (err, connection) {
      // 建立连接，向表中插入值
      let params = [
        req.body.email,
        req.body.nikeName,
        req.body.password,
        new Date(),
        new Date(),
      ]
      connection.query($sql.insertUsers, params, function (err, rows, result) {
        if (err) {
          resultMap[constants.CODE] = constants.FAIL_CODE;
          resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
          log.error(resultMap);
        } else {
          let insertId = rows.insertId;//获取自动生成的id
          // Token 数据
          const payload = {
            userId: insertId,
            nikeName: req.body.nikeName
          }
          // 签发 Token
          const token = jwt.sign(payload, secret, { expiresIn: '1day' })
          // 输出签发的 Token
          resultMap[constants.CODE] = constants.SUCCESS_CODE;
          resultMap[constants.DATA] = token
        }
        res.json(resultMap);
        connection.release();
      });
    });
  },
  dtlogin: function (req, res, next) {
    let resultMap = {};
    pool.getConnection(function (err, connection) {
      let params = [
        req.body.email,
        req.body.password,
      ]
      connection.query($sql.dtlogin, params, function (err, rows, result) {
        if (err) {
          resultMap[constants.CODE] = constants.FAIL_CODE;
          resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
          log.error(resultMap);
        } else {
          if (rows.length > 0) {
            const payload = {
              nikeName: rows[0].nike_name,
              userId: rows[0].id
            }
            console.log(payload);
            // 签发 Token
            const token = jwt.sign(payload, secret, { expiresIn: '1day' })
            // 输出签发的 Token
            resultMap[constants.CODE] = constants.SUCCESS_CODE;
            resultMap[constants.DATA] = token
          }else{
            resultMap[constants.CODE] = constants.FAIL_CODE;
            resultMap[constants.MESSAGE] = constants.NOUSER;
          }
        }
        res.json(resultMap);
        connection.release();
      });
    });
  }
};