const constants = require('../config/constants');
const { model: Note } = require('../models/note');
const { model: User } = require('../models/user');
const status = require('http-status');
function handleError(res, err) {
  return res.status(status.INTERNAL_SERVER_ERROR).send(err);
}

module.exports = {
  addNote: function (req, res, next) {
    let requestBody = req.body;
    requestBody.tag = req.body.tag ? req.body.tag.toString() : undefined;
    requestBody.content = req.body.content ? req.body.content : '';
    requestBody.openId = req.openId;
    requestBody.createId = req.userId;
    const newNote = new Note(requestBody);

    newNote.save(function (err, note) {
      if (err) return handleError(res, err);
      res.status(status.OK).json(note);
    })

  },
  editNote: function (req, res, next) {
    let requestBody = req.body;
    requestBody.tag = requestBody.tag ? requestBody.tag.join() : undefined;
    requestBody.updatedAt = new Date();
    
    delete requestBody._id;
    Note.updateOne({
      _id: req.params.noteId
    }, 
      requestBody
    ).exec(function(err,note){
      if (err) return handleError(res, err);
      res.status(status.OK).json('note edit');
    })
  },
  selNoteList: function (req, res, next) {
    const { status, keyword,sortType,sortStatus} = req.query;
    let params = {
      createId:req.userId,
      status: status
    }
    if(keyword){
      params.content = {$regex:keyword};
      params.title = {$regex:keyword};
    }
    let sort = {};
    if (sortType === 1) {
      //创建日期排序
      sort.createddAt = sortStatus==='desc'?-1:1
    } else if (sortType === 2) {
      //修改日期排序
      sort.updatedAt = sortStatus==='desc'?-1:1
    } else {
      //标题排序
      sort.title = sortStatus==='desc'?-1:1
    }
    console.log(sort);
    Note.find(params).sort(sort).exec(function(err,noteList){
      if (err) return handleError(res, err);
      res.status(status.OK).json(noteList)
    })

  },
  selNoteDetail: function (req, res, next) {
    Note.findOne({_id:req.params.noteId},function(err,note){
      if (err) return handleError(res, err);
      if(!note) return res.status(constants.FAIL_CODE).send('文章不存在');
      User.findOne({_id:note.createId},function(err,user){
        let responseBody = {};
        if(note.openId){
          user.openUser.filter(function(openUser) {
            return openUser.openId = note.openId
          })
          responseBody.nikeName = user.openUser[0].nikeName
          responseBody.thirdPortrait = user.openUser[0].portrait
        }else{
          responseBody.nikeName = user.email;
        }
        responseBody.userPortrait = user.portrait;
        responseBody._id = note._id;
        responseBody.title = note.title;
        responseBody.content = note.content?note.content:'';
        responseBody.file = note.file;
        responseBody.createdAt = note.createdAt;
        responseBody.updatedAt = note.updatedAt;
        if (err) return handleError(res, err);
        res.status(status.OK).json(responseBody);
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
      res.status(status.OK).json('note delete');
    })
  },
  /**
   * 物理删除
   */
  physicsDelete: function (req, res, next) {
    Note.remove({_id:req.params.noteId},function(err,data){
      if (err) return handleError(res, err);
      res.status(status.OK).json('note delete');
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
      res.status(status.OK).json('note delete');
    })
  },
};