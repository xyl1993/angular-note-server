const config = require('../config/config')
const jwt = require('jsonwebtoken');
const constants= require('../config/constants')

exports.verify = function (req, res, next) {
  const token = req.headers.token;
  if (token) {
    jwt.verify(token, config.secret, function (err, decoded) {
      if(err) return res.status(constants.NOUSER_CODE).json(err);
      req.userId = decoded.user_id;
      req.openId = req.headers.openId;
      next();
    })
  } else {
    return res.status(constants.NOUSER_CODE).json(constants.NOUSER);
  }
}