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
  const token = jwt.sign(payload, secret)
  // 输出签发的 Token
  return {
    token: token,
    data: {
      nikeName: nikeName,
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
        if (!user.password) {
          let _date = new Date();
          let userId = user._id;
          //说明是第三方登录注册的邮箱
          //更新那条信息
          bcrypt.hash(req.body.password, saltRounds, function (err, encryptPassword) {
            let userDup = {
              email: req.body.email,
              password: encryptPassword,
              loginAt: _date,
              portrait: config.defaultImg
            };
            User.updateOne({
                userId
              }, {
                '$set': userDup
              },
              function (err, result) {
                if (err) return res.send(err);
                res.status(constants.SUCCESS_CODE).json(loginSuccess(userId,req.body.email, config.QNdomain + config.defaultImg));
              });
          });
        } else {
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
    const {openId} = req;
    User.findOne({
      'openUser.openId': openId
    }, function (err, user) {
      if (err) return handleError(res, err);
      if (user) {
        //存在第三方用户 更新第三方信息
        let openUserModel = {
          portrait: user.openUser[0].portrait,
          nikeName: user.openUser[0].nikeName,
          openId: user.openUser[0].openId
        }
        User.updateOne({
          'openUser.openId': openId
        }, {
          '$set': {
            'openUser.$': openUserModel,
          }
        }, {
          safe: true,
          upsert: true,
          new: true
        }, function (err, result) {
          if (err) return handleError(res, err);
          //授权表存在用户
          const { password,_id } = user;
          if (password) {
            //说明绑定了邮箱
            // 签发 Token
            res.json(constants.SUCCESS_CODE).json(loginSuccess(_id, req.nikeName, req.portrait, openId));
          } else {
            res.json(constants.SUCCESS_CODE).json({openId: openId});
          }
        })
      }else{
        let userDup = {
          email:`${req.openId}@temp.com`,
          openUser:[
            {
              genre:'github',
              openId:req.openId,
              portrait:req.portrait,
              nikeName:req.nikeName
            }
          ]
        };
        const newUser = new User(userDup);
        newUser.save(function (err, user) {
          if (err) return handleError(res, err);
          console.log('openId============'+openId);
          res.status(constants.SUCCESS_CODE).json({openId});
        });
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
    //先查询邮箱是否注册
    const { email,openId } = req.body;
    console.log(openId);
    User.findOne({'openUser.openId':openId},function(err,userInfo){
      if (err) return handleError(res, err);
      if(userInfo){
        const openUser =  userInfo.openUser[0]
        User.findOne({email:email},function(err,user){
          if(user){
            //邮箱存在
            User.updateOne({ email: email},
              {
                $addToSet: {
                  openUser,
                },
              },
              {safe: true, upsert: true,new: true},
              function(err, result) {
                if (err) return handleError(res, err);
                //删除之前的信息
                User.deleteOne(
                  {
                    email: `${openId}@temp.com`,
                  },
                  function(err) {
                    if (err) return handleError(res, err);
                    resultMap = loginSuccess(userInfo._id, openUser.nikeName, openUser.portrait,openId);
                    res.status(constants.SUCCESS_CODE).json(resultMap);
                  },
                );
              },
            );
          }else{
            //邮箱不存在 
            //更新临时邮箱为正式邮箱
            User.updateOne({email:userInfo.email},{
              email:email
            },{ new: true }).exec(function(err,user){
              if (err) return handleError(res, err);
              resultMap = loginSuccess(userInfo._id, openUser.nikeName, openUser.portrait,openId);
              res.status(constants.SUCCESS_CODE).json(resultMap);
            })
          }
        })
      }else{
        res.status(constants.FAIL_CODE).json(constants.NOUSER);
      }
    })
  }
};