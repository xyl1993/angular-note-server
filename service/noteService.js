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
const async = require("async");
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
          content: req.body.content ? req.body.content : '',
          file: req.body.file,
          userId: user.userId,
          create_time: new Date(),
          preview_content: req.body.preview_content,
          open_id: user.openId
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
          requestBody.tag ? requestBody.tag.join() : undefined,
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
        let _sql = `select id,title,preview_content,create_time from note where create_id = ? and status = ?`;
        _sql = req.body.keyword ? _sql + ` and (content like '%${req.body.keyword}%' or title like '%${req.body.keyword}%')` : _sql;
        if (req.body.sortType === 1) {
          //创建日期排序
          _sql = _sql + ` order by create_time ${req.body.sortStatus}`;
        } else if (req.body.sortType === 2) {
          //修改日期排序
          _sql = _sql + ` order by modify_time ${req.body.sortStatus}`;
        } else {
          //标题排序
          _sql = _sql + ` order by title ${req.body.sortStatus}`;
        }
        let params = [user.userId, req.body.status];
        if (req.body.keyword) {
          params.push(req.body.keyword);
        }
        _sql = mysql.format(_sql, params);
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
        let _sql = `select a.id,a.title,a.tag,
            ifnull(a.content,'') as content,
          a.file,a.create_time,a.modify_time,
          IFNULL(c.nike_name,b.nike_name) nike_name,
          c.portrait as third_portrait,
          b.portrait as user_portrait 
          from note a 
          left join users b on a.create_id = b.id 
          left join open_users c on c.open_id = a.open_id 
          where a.id = ?`;

        let params = [hashidsUtil.decode(req.body._id, hashKeyObject.noteHashKey)];
        _sql = mysql.format(_sql, params);
        log.info(_sql);
        connection.query(_sql, function (err, rows, result) {
          if (err) {
            resultMap[constants.CODE] = constants.FAIL_CODE;
            resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
            log.error(err);
          } else {
            rows[0]._id = hashidsUtil.encode(rows[0].id, hashKeyObject.noteHashKey);
            rows[0].tag = rows[0].tag ? rows[0].tag.split(',') : [];
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
  },
  /**
   * 逻辑删除
   */
  logicDelete: function (req, res, next) {
    let resultMap = {};
    let token = req.headers.token;
    let user = verifyToken.verify(token);
    if (user != null) {
      pool.getConnection(function (err, connection) {
        let _sql = `update note set status = 0 where id =  ?`;
        let params = [hashidsUtil.decode(req.body._id, hashKeyObject.noteHashKey)];
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
  /**
   * 物理删除
   */
  physicsDelete: function (req, res, next) {
    let resultMap = {};
    let token = req.headers.token;
    let user = verifyToken.verify(token);
    if (user != null) {
      pool.getConnection(function (err, connection) {
        let _sql = `delete from note where id =  ?`;
        let params = [hashidsUtil.decode(req.body._id, hashKeyObject.noteHashKey)];
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
  /**
   * 恢复文章
   */
  recovery: function (req, res, next) {
    let resultMap = {};
    let token = req.headers.token;
    let user = verifyToken.verify(token);
    if (user != null) {
      pool.getConnection(function (err, connection) {
        let _sql = `update note set status = 1 where id =  ?`;
        let params = [hashidsUtil.decode(req.body._id, hashKeyObject.noteHashKey)];
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
  /**
   * 评论
   */
  comment: function (req, res, next) {
    let resultMap = {};
    let token = req.headers.token;
    let user = verifyToken.verify(token);
    if (user != null) {
      pool.getConnection(function (err, connection) {
        var tasks = [function (callback) {
          // 开启事务
          connection.beginTransaction(function (err) {
            callback(err);
          });
        }, function (callback) {
          //插入评论表
          let createTime = new Date();
          let params = [
            hashidsUtil.decode(req.body.articleId, hashKeyObject.noteHashKey),
            req.body.commentBody,
            user.userId,
            createTime
          ];
          let _sql = `insert into comments (article_id,comment_body,create_id,create_time) values(?,?,?,?)`;
          _sql = mysql.format(_sql, params);
          log.info(_sql);
          connection.query(_sql, function (err, rows, result) {
            callback(err, rows.insertId); // 生成的ID会传给下一个任务
          });
        }, function (insertId, callback) {
          // 接收到上一条任务生成的ID
          let params = [
            insertId,
            insertId,
            0
          ];
          //在父子关系表中插入一条自己到自己的数据
          let _sql = `insert into comments_tree (ancestor,descendant,distance) values(?,?,?)`;
          _sql = mysql.format(_sql, params);
          log.info(_sql);
          connection.query(_sql, function (err, rows, result) {
            callback(err, insertId);
          });
        }, function (insertId, callback) {
          // 如果是评论的别人的回复
          if (req.body.ancestor) {
            //插入父子关系表
            let _sql = `insert into comments_tree (ancestor,descendant,distance) 
            SELECT ancestor,${insertId},distance+1 from comments_tree where descendant = ${req.body.ancestor}
            `;
            // _sql = mysql.format(_sql, params);
            log.info(_sql);
            connection.query(_sql, function (err, rows, result) {
              callback(err, insertId);
            });
          } else {
            callback(null, insertId);
          }
        }, function (insertId, callback) {
          // 提交事务
          connection.commit(function (err) {
            callback(err, insertId);
          });
        }];
        async.waterfall(tasks, function (err, results) {
          if (err) {
            resultMap[constants.CODE] = constants.FAIL_CODE;
            resultMap[constants.MESSAGE] = constants.SYSTEM_ERROR;
            log.error(err);
            connection.rollback(); // 发生错误事务回滚
          } else {
            resultMap[constants.CODE] = constants.SUCCESS_CODE;
            resultMap['commentId'] = results;
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
};