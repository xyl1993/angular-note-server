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
var bcrypt = require('bcrypt');  //加密对象
const saltRounds = 10;   //慢哈希轮数
/**
 * 登录成功后返回对象
 * @param {*} resultMap 
 * @param {*} userId 
 * @param {*} nikeName 
 * @param {*} portrait 
 */
const loginSuccess = function (resultMap, userId, nikeName, portrait,openId) {
  const payload = {
    userId: userId,
    openId:openId
  }
  // 签发 Token
  const token = jwt.sign(payload, secret, { expiresIn: '1day' })
  // 输出签发的 Token
  resultMap[constants.CODE] = constants.SUCCESS_CODE;
  resultMap[constants.TOKEN] = token
  resultMap[constants.DATA] = {
    nike_name: nikeName,
    portrait: portrait
  }
  return resultMap;
}

const hashPassword = function (password) {
  let newPassWord = '';
  //返回hash加密后的字符串
  bcrypt.hash(password, saltRounds, function (err, encryptPassword) {
    newPassWord = encryptPassword;
  });
  return newPassWord;
}

module.exports = {
  insertUsers: function (req, res, next) {
    let resultMap = {};
    pool.getConnection(function (err, connection) {
      //查询此邮箱是否存在
      let selectOne = `select id,password from users where email = ?`;
      selectOne = mysql.format(selectOne, [req.body.email]);
      log.info(selectOne);
      connection.query(selectOne, function (err, rows, result) {
        if (err) {
          resultMap[constants.CODE] = constants.FAIL_CODE;
          resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
          log.error(err);
          res.json(resultMap);
        } else {
          if (rows[0]) {
            //说明存在邮箱
            if (!rows[0].password) {
              let _date = new Date();
              let userId = rows[0].id;
              //说明是第三方登录注册的邮箱
              //更新那条信息
              bcrypt.hash(req.body.password, saltRounds, function (err, encryptPassword) {
                let params = [
                  req.body.email,
                  encryptPassword,
                  _date,
                  _date,
                  config.defaultImg,
                  userId
                ];
                let _sql = `update users set nike_name = ?,password=?,create_time=?,login_time=?,portrait=? where id = ?`;
                _sql = mysql.format(_sql, params);
                log.info(_sql);
                connection.query(_sql, function (err, rows, result) {
                  if (err) {
                    resultMap[constants.CODE] = constants.FAIL_CODE;
                    resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
                    log.error(err);
                  } else {
                    resultMap = loginSuccess(resultMap, userId, req.body.email, config.QNdomain + config.defaultImg);
                  }
                  res.json(resultMap);
                });
              });
            } else {
              //邮箱已被注册
              resultMap[constants.CODE] = constants.FAIL_CODE;
              resultMap[constants.MESSAGE] = constants.EMAILUSE;
              res.json(resultMap);
            }
          } else {
            //没有邮箱 注册
            let _date = new Date();
            bcrypt.hash(req.body.password, saltRounds, function (err, encryptPassword) {
              let params = [
                req.body.email,
                req.body.email,
                encryptPassword,
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
                  resultMap = loginSuccess(resultMap, rows.insertId, req.body.email, config.QNdomain + config.defaultImg);
                }
                res.json(resultMap);
              });
            })
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
            //更新用户的第三方信息
            let updatesql = `update open_users set portrait = ?,nike_name=? where open_id = ?`;
            let params = [
              req.portrait,
              req.nikeName,
              req.openId
            ];
            updatesql = mysql.format(updatesql, params);
            log.info(updatesql);
            connection.query(updatesql, function (err, rows, result) {
              if (err) {
                resultMap[constants.CODE] = constants.FAIL_CODE;
                resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
                log.error(err);
                res.json(resultMap);
              }
            });
            //授权表存在用户
            let userId = rows[0].user_id;
            if (userId) {
              //说明绑定了邮箱
              // 签发 Token
              resultMap = loginSuccess(resultMap, userId, req.nikeName, req.portrait,req.openId);
            } else {
              // let path = `${config.appServerIp}/page/bindEmail?openId=${req.openId}`;
              // //跳转到绑定邮箱的页面
              // res.redirect(path);
              resultMap['openId'] = req.openId
            }
            resultMap[constants.CODE] = constants.SUCCESS_CODE;
            res.json(resultMap);
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
                // let path = `${config.appServerIp}/page/bindEmail?openId=${req.openId}`;
                // //跳转到绑定邮箱的页面
                // res.redirect(path);
                resultMap['openId'] = req.openId;
                resultMap[constants.CODE] = constants.SUCCESS_CODE;
                res.json(resultMap);
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
      let _sql = `select * from users where email = ?`;
      let params = [req.body.email];
      _sql = mysql.format(_sql, params);
      log.info(_sql);
      connection.query(_sql, function (err, rows, result) {
        if (err) {
          resultMap[constants.CODE] = constants.FAIL_CODE;
          resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
          log.error(err);
        } else {
          if (rows.length > 0) {
            bcrypt.compare(req.body.password, rows[0].password, function (error, status) {
              if (status === true) {
                resultMap = loginSuccess(resultMap, rows[0].id, rows[0].nike_name, config.QNdomain + rows[0].portrait);
                res.json(resultMap);
                let updateLoginTime = `update users set login_time = ? where id=?`;
                let params = [
                  new Date(),
                  rows[0].id
                ];
                updateLoginTime = mysql.format(updateLoginTime, params);
                log.info(updateLoginTime);
                connection.query(updateLoginTime, function (err, rows, result) {

                });
              } else {
                resultMap[constants.CODE] = constants.FAIL_CODE;
                resultMap[constants.MESSAGE] = constants.PASSWORDERR;
                res.json(resultMap);
              }
            })
          } else {
            resultMap[constants.CODE] = constants.FAIL_CODE;
            resultMap[constants.MESSAGE] = constants.NOUSER;
            res.json(resultMap);
          }
        }
        connection.release();
      });
    });
  },
  bindEmail: function (req, res, next) {
    pool.getConnection(function (err, connection) {
      //先查询邮箱是否注册
      let params = [
        req.body.email,
        req.body.openId
      ]
      let _sql = `select nike_name,portrait,(select id from users where email = ?) as userId 
        from open_users where open_id = ?`;
      _sql = mysql.format(_sql, params);
      log.info(_sql);
      connection.query(_sql, function (err, rows, result) {
        var resultMap = {};
        if (err) {
          resultMap[constants.CODE] = constants.FAIL_CODE;
          resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
          log.error(err);
          res.json(resultMap);
        } else {
          if (rows.length > 0) {
            //邮箱存在
            //更新第三方登录表的userid
            let userInfo = rows[0];
            if (rows[0].userId) {
              let params = [
                userInfo.userId,
                req.body.openId
              ]
              let _sql = `update open_users set user_id = ? where open_id =?`;
              _sql = mysql.format(_sql, params);
              log.info(_sql);
              connection.query(_sql, function (err, rows, result) {
                if (err) {
                  resultMap[constants.CODE] = constants.FAIL_CODE;
                  resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
                  log.error(err);
                } else {
                  resultMap = loginSuccess(resultMap, userInfo.userId, userInfo.nike_name, userInfo.portrait,req.body.openId);
                  res.json(resultMap);
                }
              });
            } else {
              //邮箱不存在 
              //在主表中插入一天模拟注册数据，密码为空表示不是正常注册而是第三方绑定数据
              let params = [
                req.body.email   //邮箱
              ]
              let _sql = `insert into users set email = ?`;
              _sql = mysql.format(_sql, params);
              log.info(_sql);
              connection.query(_sql, function (err, rows, result) {
                if (err) {
                  resultMap[constants.CODE] = constants.FAIL_CODE;
                  resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
                  log.error(err);
                } else {
                  let params = [
                    rows.insertId,
                    req.body.openId
                  ]
                  let _sql = `update open_users set user_id = ? where open_id =?`;
                  _sql = mysql.format(_sql, params);
                  log.info(_sql);
                  connection.query(_sql, function (err, rows, result) {
                    if (err) {
                      resultMap[constants.CODE] = constants.FAIL_CODE;
                      resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
                      log.error(err);
                    }
                  });
                  //更新第三方登录表的userid
                  resultMap = loginSuccess(resultMap, rows.insertId, userInfo.nike_name, userInfo.portrait,req.body.openId);
                  res.json(resultMap);
                }
              });
            }
          } else {
            resultMap[constants.CODE] = constants.FAIL_CODE;
            resultMap[constants.MESSAGE] = constants.NOUSER;
            res.json(resultMap);
          }
        }
        connection.release();
      });
    });
  }
};