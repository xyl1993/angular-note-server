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
const {
  model: Note
} = require('../models/note');
const {
  model: User
} = require('../models/user');
function handleError(res, err) {
  return res.status(constants.FAIL_CODE).send(err);
}


module.exports = {
  addNote: function (req, res, next) {
    let requestBody = req.body;
    requestBody.tag = req.body.tag ? req.body.tag.toString() : undefined;
    requestBody.content = req.body.content ? req.body.content : '';
    requestBody.openId = req.openId;
    requestBody.modifyAt = new Date();

    const newNote = new Note(requestBody);

    newNote.save(function (err, note) {
      if (err) return handleError(res, err);
      res.status(constants.SUCCESS_CODE).json(note);
    })

  },
  editNote: function (req, res, next) {
    let requestBody = req.body;
    requestBody.tag = requestBody.tag ? requestBody.tag.join() : undefined;
    requestBody.modifyAt = new Date();

    Note.updateOne({
      _id: req.params.noteId
    }, {
      '$set': {
        requestBody
      },
      function (err, note) {
        if (err) return handleError(res, err);
        res.status(200).json('note edit');
      }
    })
  },
  selNoteList: function (req, res, next) {
    let params = {
      createId:req.userId,
      status: req.body.status,
      content:{
        $regex:req.body.keyword
      },
      title:{
        $regex:req.body.keyword
      }
    }
    let sort = {};
    if (req.body.sortType === 1) {
      //创建日期排序
      sort = {
        createAt:req.body.sortStatus
      }
    } else if (req.body.sortType === 2) {
      //修改日期排序
      sort = {
        modifyAt:req.body.sortStatus
      }
    } else {
      //标题排序
      sort = {
        title:req.body.sortStatus
      }
    }
    Note.find().sort(sort).exec(function(err,noteList){
      if (err) return handleError(res, err);
      res.status(200).json(noteList)
    })

  },
  selNoteDetail: function (req, res, next) {
    Note.findOne({_id:req.params.noteId},function(err,note){
      if (err) return handleError(res, err);
      User.findOne({_id:note.createId},function(err,user){
        let responseBody = {};
        if(note.openId){
          user.openUser.filter(function(openUser) {
            return openUser.openId = note.openId
          })
          responseBody.nikeName = user.openUser[0].nikeName
          responseBody.thirdPortrait = user.openUser[0].portrait
        }
        responseBody.userPortrait = user.portrait;
        responseBody._id = note._id;
        responseBody.title = note.title;
        responseBody.content = note.content?note.content:'';
        responseBody.file = note.file;
        responseBody.createAt = note.createAt;
        responseBody.modifyAt = note.modifyAt;
        if (err) return handleError(res, err);
        res.status(200).json(responseBody);
      })
    })
  },
  /**
   * 逻辑删除
   */
  logicDelete: function (req, res, next) {
    Note.updateOne({_id:req.params.noteId},{
      '$set':{
        status:0
      }
    },function(err,note){
      if (err) return handleError(res, err);
      res.status(200).json('note delete');
    })
  },
  /**
   * 物理删除
   */
  physicsDelete: function (req, res, next) {
    Note.remove({_id:req.params.noteId},function(err,data){
      if (err) return handleError(res, err);
      res.status(200).json('note delete');
    })
  },
  /**
   * 恢复文章
   */
  recovery: function (req, res, next) {
    Note.updateOne({_id:req.params.noteId},{
      '$set':{
        status:1
      }
    },function(err,note){
      if (err) return handleError(res, err);
      res.status(200).json('note delete');
    })
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