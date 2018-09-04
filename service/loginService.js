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
          if (rows[0].count > 0) {
            resultMap[constants.CODE] = constants.FAIL_CODE;
            resultMap[constants.MESSAGE] = constants.EMAILUSE;
            res.json(resultMap);
          } else {
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
                  nike_name: req.body.email,
                  portrait: config.QNdomain + config.defaultImg
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
  /**
   * 第三方登录用户插入
   */
  insertOAuthUser: function (req, res, next) {
    let resultMap = {};
    pool.getConnection(function (err, connection) {
      //查询这个第三方用户是否存在
      //查询是否绑定了邮箱
      let selectOne = `select id,user_id from open_users where open_id = ?`;
      selectOne = mysql.format(selectOne, [req.openId]);
      log.info(selectOne);
      connection.query(selectOne, function (err, rows, result) {
        if (err) {
          resultMap[constants.CODE] = constants.FAIL_CODE;
          resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
          log.error(err);
          res.json(resultMap);
        } else {
          if (rows[0] && rows[0].id) {
            //授权表存在用户
            let userId = rows[0].user_id;
            if (userId) {
              //说明绑定了邮箱
              // 签发 Token
              const payload = {
                userId: userId
              }
              const token = jwt.sign(payload, secret, { expiresIn: '1day' })
              let path = `${config.appServerIp}/page/oauthCallback?${constants.TOKEN}=${token}&nike_name=${req.nikeName}&portrait=${req.portrait}`;
              //跳转到第三方授权回调页，并将token数据返回 保存到localstage中
              res.redirect(path);
            } else {
              let path = `${config.appServerIp}/page/bindEmail?openId=${req.openId}`;
              //跳转到绑定邮箱的页面
              res.redirect(path);
            }
          } else {
            //不存在授权
            //新增
            let _sql = `insert into open_users (genre,open_id,create_time,portrait,nike_name) values(?,?,?,?,?)`;
            let params = [
              'github',
              req.openId,
              new Date(),
              req.portrait,
              req.nikeName
            ];
            _sql = mysql.format(_sql, params);
            connection.query(_sql, function (err, rows, result) {
              if (err) {
                resultMap[constants.CODE] = constants.FAIL_CODE;
                resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
                log.error(err);
                res.json(resultMap);
              } else {
                let path = `${config.appServerIp}/page/bindEmail?openId=${req.openId}`;
                //跳转到绑定邮箱的页面
                res.redirect(path);
              }
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
              nike_name: rows[0].nike_name,
              portrait: config.QNdomain + rows[0].portrait
            }
          } else {
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