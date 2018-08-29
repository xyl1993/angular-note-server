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
        let requestBody = {
          title: req.body.title,
          tag: req.body.tag ? req.body.tag.toString() : undefined,
          content: req.body.content,
          file: req.body.file,
          userId: user.userId,
          create_time: new Date()
        }
        let params = [];
        Object.keys(requestBody).forEach(function (key) {
          params.push(requestBody[key]);
        });
        log.info($sql.addNote);
        connection.query($sql.addNote, params, function (err, rows, result) {
          if (err) {
            resultMap[constants.CODE] = constants.FAIL_CODE;
            resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
            log.error(err);
          } else {
            let insertId = rows.insertId;//获取自动生成的id
            requestBody._id = hashidsUtil.encode(insertId, hashKeyObject.noteHashKey);
            resultMap[constants.DATA] = requestBody;
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
  },
  editNote: function (req, res, next) {
    let resultMap = {};
    let token = req.headers.token;
    let user = verifyToken.verify(token);
    log.info(user);
    if (user != null) {
      let requestBody = req.body;
      pool.getConnection(function (err, connection) {
        let params = [
          requestBody.title,
          requestBody.tag,
          requestBody.content,
          requestBody.file,
          new Date(),
          hashidsUtil.decode(requestBody._id, hashKeyObject.noteHashKey)
        ];
        connection.query($sql.editNote, params, function (err, rows, result) {
          if (err) {
            resultMap[constants.CODE] = constants.FAIL_CODE;
            resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
            log.error(err);
          } else {
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
  },
  selNoteList: function (req, res, next) {
    let resultMap = {};
    let token = req.headers.token;
    let user = verifyToken.verify(token);
    if (user != null) {
      pool.getConnection(function (err, connection) {
        // 建立连接，向表中插入值
        let _sql = `select id,title,left(content,30) as content,create_time from note where create_id = ${user.userId}`;
        _sql = req.body.keyword ? _sql + ` and titke like concat('%',${req.body.keyword},'%')` : _sql;
        log.info(_sql);
        connection.query(_sql, function (err, rows, result) {
          if (err) {
            resultMap[constants.CODE] = constants.FAIL_CODE;
            resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
            log.error(err);
          } else {
            for (let item of rows) {
              item._id = hashidsUtil.encode(item.id, hashKeyObject.noteHashKey);
              delete item.id;
            }
            resultMap[constants.DATA] = rows;
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
  },
  selNoteDetail: function (req, res, next) {
    let resultMap = {};
    let token = req.headers.token;
    let user = verifyToken.verify(token);
    if (user != null) {
      pool.getConnection(function (err, connection) {
        // 建立连接，向表中插入值
        let _sql = `select * from note where id = ${hashidsUtil.decode(req.body._id, hashKeyObject.noteHashKey)}`;
        log.info(_sql);
        connection.query(_sql, function (err, rows, result) {
          if (err) {
            resultMap[constants.CODE] = constants.FAIL_CODE;
            resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
            log.error(err);
          } else {
            rows[0]._id = hashidsUtil.encode(rows[0].id, hashKeyObject.noteHashKey);
            delete rows[0].id;
            resultMap[constants.DATA] = rows[0];
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