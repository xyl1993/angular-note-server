var mysql = require('mysql');
var $conf = require('../config/db');
var $sql = require('../mapper/loginMapper');
var log = require('log4js').getLogger("loginService");
// 使用连接池，提升性能
var pool = mysql.createPool($conf.mysql);
const constants = require('../config/constants');
const config = require('../config/config');
const jwt = require('jsonwebtoken');
const secret = 'SUMMERNOTE';

module.exports = {
  insertUsers: function (req, res, next) {
    let resultMap = {};
    pool.getConnection(function (err, connection) {
      //查询此邮箱是否存在
      let selectOne = `select count(*) as count from (select 1 from users where email = ?) a`;
      selectOne = mysql.format(selectOne, [req.body.email]);
      log.info(selectOne);
      connection.query(selectOne, function (err, rows, result) {
        if (err) {
          resultMap[constants.CODE] = constants.FAIL_CODE;
          resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
          log.error(err);
          res.json(resultMap);
        } else {
          if(rows[0].count>0){
            resultMap[constants.CODE] = constants.FAIL_CODE;
            resultMap[constants.MESSAGE] = constants.EMAILUSE;
            res.json(resultMap);
          }else{
            let _date = new Date();
            let params = [
              req.body.email,
              req.body.email,
              req.body.password,
              _date,
              _date,
              config.defaultImg
            ];
            connection.query($sql.insertUsers, params, function (err, rows, result) {
              if (err) {
                resultMap[constants.CODE] = constants.FAIL_CODE;
                resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
                log.error(err);
              } else {
                let insertId = rows.insertId;//获取自动生成的id
                // Token 数据
                const payload = {
                  userId: insertId
                }
                // 签发 Token
                const token = jwt.sign(payload, secret, { expiresIn: '1day' })
                // 输出签发的 Token
                resultMap[constants.CODE] = constants.SUCCESS_CODE;
                resultMap[constants.TOKEN] = token
                resultMap[constants.DATA] = {
                  nike_name:req.body.email,
                  portrait:config.QNdomain+config.defaultImg
                }
              }
              res.json(resultMap);
              // connection.release();
            });
          }
        }
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
          log.error(err);
        } else {
          if (rows.length > 0) {
            const payload = {
              nikeName: rows[0].nike_name,
              userId: rows[0].id
            }
            // 签发 Token
            const token = jwt.sign(payload, secret, { expiresIn: '1day' })
            // 输出签发的 Token
            resultMap[constants.CODE] = constants.SUCCESS_CODE;
            resultMap[constants.TOKEN] = token;
            resultMap[constants.DATA] = {
              nike_name:rows[0].nike_name,
              portrait:config.QNdomain+rows[0].portrait
            }
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