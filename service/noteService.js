const mysql = require('mysql');
const $conf = require('../config/db');
const $sql = require('../mapper/noteMapper');
const log = require('log4js').getLogger("noteService");
// 使用连接池，提升性能
const pool = mysql.createPool($conf.mysql);
const constants = require('../config/constants');
const verifyToken = require('../utils/verifyToken');
const hashidsUtil = require('../utils/hashidsUtili');
const hashKeyObject = require('../config/hashKey');
module.exports = {
  addNote: function (req, res, next) {
    let resultMap = {};
    let token = req.headers.token;
    let user = verifyToken.verify(token);
    log.info(user);
    if (user != null) {
      pool.getConnection(function (err, connection) {
        // 建立连接，向表中插入值
        let params = [
          req.body.title,
          req.body.tag.toString(),
          req.body.content,
          req.body.file,
          user.userId,
          new Date(),
        ]
        log.info($sql.addNote);
        connection.query($sql.addNote, params, function (err, rows, result) {
          if (err) {
            resultMap[constants.CODE] = constants.FAIL_CODE;
            resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
            log.error(err);
          } else {
            let insertId = rows.insertId;//获取自动生成的id
            console.log(`id为${insertId}`);
            resultMap[constants.DATA] = hashidsUtil.encode(insertId,hashKeyObject.noteHashKey);
            resultMap[constants.CODE] = constants.SUCCESS_CODE;
          }
          res.json(resultMap);
          connection.release();
        });
      });
    } else {
      resultMap[constants.CODE] = constants.FAIL_CODE;
      resultMap[constants.MESSAGE] = constants.LOGIN_TIME_OUT;
      res.json(resultMap);
    }
  }
};