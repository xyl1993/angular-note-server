const {
  model: User
} = require('../models/user');
const {
  model: OpenUser
} = require('../models/openUser');
const constants = require('../config/constants');
const config = require('../config/config');
const jwt = require('jsonwebtoken');
const secret = 'SUMMERNOTE';
var bcrypt = require('bcrypt'); //加密对象
const saltRounds = 10; //慢哈希轮数

function handleError(res, err) {
  return res.status(constants.FAIL_CODE).send(err);
}

/**
 * 登录成功后返回对象
 * @param {*} resultMap 
 * @param {*} userId 
 * @param {*} nikeName 
 * @param {*} portrait 
 */
const loginSuccess = function (userId, nikeName, portrait, openId) {
  const payload = {
    userId: userId,
    openId: openId
  }
  // 签发 Token
  const token = jwt.sign(payload, secret, {
    expiresIn: '1day'
  })
  // 输出签发的 Token
  return {
    token: token,
    data: {
      nike_name: nikeName,
      portrait: portrait
    }
  };
}

module.exports = {
  insertUsers: function (req, res, next) {
    User.findOne({
      email: req.body.email
    }, function (err, user) {
      if (err) {
        return res.status(constants.FAIL_CODE).send(err);
      }
      if (!user) {
        //邮箱不存在
        let _date = new Date();
        bcrypt.hash(req.body.password, saltRounds, function (err, encryptPassword) {
          let userDup = {
            email: req.body.email,
            nikeName: req.body.email,
            password: encryptPassword,
            loginAt: _date,
            createAt: _date,
            portrait: config.defaultImg
          };
          const newUser = new User(userDup);
          newUser.save(function (err, user) {
            if (err) return handleError(res, err);
            res.status(constants.SUCCESS_CODE).json(loginSuccess(user.insertId, req.body.email, config.QNdomain + config.defaultImg));
          });
        })
      } else {
        //说明存在邮箱
        if (user.password) {
          let _date = new Date();
          let userId = user._id;
          //说明是第三方登录注册的邮箱
          //更新那条信息
          bcrypt.hash(req.body.password, saltRounds, function (err, encryptPassword) {
            let userDup = {
              email: req.body.email,
              password: encryptPassword,
              loginAt: _date,
              createAt: _date,
              portrait: config.defaultImg
            };
            const newUser = new User(userDup);
            User.updateOne({
                userId
              }, {
                '$set': userDup
              },
              function (err, result) {
                if (err) return res.send(err);
                res.status(constants.SUCCESS_CODE).json(loginSuccess(req.body.email, config.QNdomain + config.defaultImg));
              });
          });
        } else {
          console.log(123);
          //邮箱已被注册
          res.status(constants.FAIL_CODE).json(constants.EMAILUSE);
        }
      }
    });
  },
  /**
   * 第三方登录用户插入
   */
  insertOAuthUser: function (req, res, next) {
    //查询这个第三方用户是否存在
    //查询是否绑定了邮箱
    User.findOne({
      'openUser.openId': req.openId
    }, function (err, user) {
      if (err) return handleError(res, err);
      if (user) {
        let openUserModel = {
          portrait: user.openUser[0].portrait,
          nikeName: user.openUser[0].nikeName,
          openId: user.openUser[0].openId
        }
        User.findOneAndUpdate({
          'openUser.openId': req.openId
        }, {
          '$set': {
            'openUser': openUserModel,
          }
        }, {
          safe: true,
          upsert: true,
          new: true
        }, function (err, result) {
          if (err) return handleError(res, err);
          //授权表存在用户
          const { userId } = result.openUser;
          if (userId) {
            //说明绑定了邮箱
            // 签发 Token
            res.json(constants.SUCCESS_CODE).json(loginSuccess(userId, req.nikeName, req.portrait, req.openId));
          } else {
            // let path = `${config.appServerIp}/page/bindEmail?openId=${req.openId}`;
            // //跳转到绑定邮箱的页面
            // res.redirect(path);
            let _returnMap = loginSuccess(userId, req.nikeName, req.portrait, req.openId);
            _returnMap['openId'] = req.openId;
            res.json(constants.SUCCESS_CODE).json(_returnMap);
          }
        })
      }
    })
  },
  dtlogin: function (req, res, next) {

    User.findOne({
      email: req.body.email
    }, function (err, user) {
      if (err) return handleError(res, err);
      if (user) {
        bcrypt.compare(req.body.password, user.password, function (error, status) {
          if (status === true) {
            console.log(user);
            User.updateOne({_id:user._id}, {
              '$set': {
                loginAt: new Date()
              }
            }, function (err, result) {
              if (err) return handleError(res, err);
              res.status(constants.SUCCESS_CODE).json(loginSuccess(user._id, user.nikeName, config.QNdomain + user.portrait));
            })
          } else {
            res.status(constants.FAIL_CODE).json(constants.PASSWORDERR);
          }
        })
      } else {
        res.status(constants.FAIL_CODE).json(constants.NOUSER);
      }
    })
  },
  bindEmail: function (req, res, next) {
    pool.getConnection(function (err, connection) {
      //先查询邮箱是否注册
      User.findOne({
        'openUser.openId': req.body.openId
      }, function (err, user) {
        if (err) return handleError(res, err);
        if (user) {
          //邮箱存在
          //更新第三方登录表的userid
          let openUser = user.openUser;
          if (openUser.userId) {
            User.findOneAndUpdate({
              'openUser.openId': req.body.openId
            }, {
              $set: {
                'openUser.openUser': openUser.userId
              }
            }, function (err, user) {
              if (err) return handleError(res, err);
              resultMap = loginSuccess(openUser.userId, user.nikeName, user.portrait, req.body.openId);
              res.json(resultMap);
            })
          } else {
            //邮箱不存在 
            //在主表中插入一天模拟注册数据，密码为空表示不是正常注册而是第三方绑定数据
            let userDup = {
              email: req.body.email
            }
            const newUser = new User(userDup);
            newUser.save(function (err, user) {
              if (err) return handleError(res, err);
              User.findOneAndUpdate({
                'openUser.openId': req.body.openId
              }, {
                $set: {
                  'openUser.userId': user._id
                }
              }, function (err, user) {
                if (err) return handleError(res, err);
                res.json(loginSuccess(user._id, openUser.nikeName, openUser.portrait, req.body.openId));
              })
            });
          }
        } else {
          res.status(constants.FAIL_CODE).json(constants.NOUSER);
        }
      })
    });
  }
};