const config = require('../config/config')
const jwt = require('jsonwebtoken');
const constants= require('../config/constants')

exports.verifyToken = function (req, res, next) {
  const token = req.headers.token;
  if (token) {
    jwt.verify(token, config.secret, function (err, decoded) {
      if(err) return res.status(constants.NOUSER_CODE).json(err);
      req.userId = decoded.userId;
      req.openId = decoded.openId;
      next();
    })
  } else {
    return res.status(constants.NOUSER_CODE).json(constants.NOUSER);
  }
}