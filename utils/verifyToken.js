const config = require('../config/config')
const jwt = require('jsonwebtoken');
exports.verify = function (token) {
  let user = null;
  jwt.verify(token, config.secret, function (err, decoded) {
    if (!err) {
      user = decoded
    }
  })
  return user
}