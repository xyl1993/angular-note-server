var express = require('express');
var service = require('../service/noteService');
const constants = require('../config/constants');
var router = express.Router();
const qn = require('qn');
const multerUpload = require('../utils/multerUpload');
const QNdomain = require('../config/config').QNdomain;
const {verify} = require('../utils/verifyToken');
var qiniuConfig = require('../config/config').qiniuConfig;

var log = require('log4js').getLogger("noteController");

router.post('/addNote',verify, function (req, res, next) {
  return service.addNote(req, res, next);
});

router.get('/selNoteList',verify, function (req, res, next) {
  return service.selNoteList(req, res, next);
});
router.get('/selNoteDetail/:nodeId',verify, function (req, res, next) {
  return service.selNoteDetail(req, res, next);
});
router.put('/editNote/:nodeId', verify,function (req, res, next) {
  return service.editNote(req, res, next);
});
/**
 * 逻辑删除
 */
router.put('/logicDelete/:noteId',verify, function (req, res, next) {
  return service.logicDelete(req, res, next);
});
/**
 * 物理删除
 */
router.delete('/physicsDelete/:noteId',verify,function (req, res, next) {
  return service.physicsDelete(req, res, next);
});
/**
 * 恢复文章
 */
router.put('/recovery/:noteId', verify,function (req, res, next) {
  return service.recovery(req, res, next);
});
/**
 * 评论
 */
router.post('/comment', function (req, res, next) {
  return service.comment(req, res, next);
});


/**
 * 接收前台file文件上传到七牛云
 */
router.post('/upload', function (req, res, next) {
  // 七牛相关配置信息
  let client = qn.create(qiniuConfig);
  // 上传单个文件
  // 这里`avatar`对应前端form中input的name值
  let resultMap = {};
  multerUpload.single('file')(req, res, function (err) {
    if (err) {
      resultMap[constants.CODE] = constants.FAIL_CODE;
      resultMap[constants.MESSAGE] = err;
      log.error(err);
      return res.json(resultMap);
    }
    let file = req.file;
    console.log(file);
    if (file && file.buffer) {
      //获取源文件后缀名
      var fileFormat = (file.originalname).split(".");
      //设置上传到七牛云的文件命名
      var filePath = file.fieldname + '-' + Date.now() + '.' + fileFormat[fileFormat.length - 1];
      log.info("文件为:" + filePath);
      // 上传到七牛 
      client.upload(req.file.buffer, {
        key: filePath
      }, function (err, result) {
        if (err) {
          resultMap[constants.CODE] = constants.FAIL_CODE;
          log.error(err);
          return res.json(resultMap);
        }
        resultMap[constants.CODE] = constants.SUCCESS_CODE;
        resultMap[constants.DATA] = {
          url:QNdomain+filePath
        };
        // resultMap['url'] = filePath;
        return res.json(resultMap);
      });
    } else {
      resultMap[constants.CODE] = constants.FAIL_CODE;
      resultMap[constants.MESSAGE] = '文件不存在';
      return res.json(resultMap);
    }
  });
});
module.exports = router;