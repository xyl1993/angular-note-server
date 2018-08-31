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
          create_time: new Date(),
          preview_content:req.body.preview_content
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
          requestBody.tag?requestBody.tag.join():undefined,
          requestBody.content,
          requestBody.preview_content,
          requestBody.file,
          new Date(),
          hashidsUtil.decode(requestBody._id, hashKeyObject.noteHashKey)
        ];
        let _sql = 'update note set title= ?,tag=?,content=?,preview_content=?,file=?,modify_time=? where id = ?';
        _sql = mysql.format(_sql, params);
        log.info(_sql);
        connection.query(_sql, function (err, rows, result) {
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
        let _sql = `select id,title,preview_content,create_time from note where create_id = ?`;
        _sql = req.body.keyword ? _sql + ` and (content like '%${req.body.keyword}%' or title like '%${req.body.keyword}%')` : _sql;
        let params = [user.userId];
        if(req.body.keyword){
          params.push(req.body.keyword);
        }
        _sql=mysql.format(_sql,params);
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
        let _sql = `select 
          id,
          title,
          tag,
          ifnull(content,'') as content,
          file,
          create_time,
          modify_time
        from note where id = ${hashidsUtil.decode(req.body._id, hashKeyObject.noteHashKey)}`;
        log.info(_sql);
        connection.query(_sql, function (err, rows, result) {
          if (err) {
            resultMap[constants.CODE] = constants.FAIL_CODE;
            resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
            log.error(err);
          } else {
            rows[0]._id = hashidsUtil.encode(rows[0].id, hashKeyObject.noteHashKey);
            rows[0].tag = rows[0].tag?rows[0].tag.split(','):[];
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