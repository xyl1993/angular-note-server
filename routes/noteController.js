var express = require('express');
var service = require('../service/noteService');
var router = express.Router();

router.post('/addNote',function(req,res,next){
  return service.addNote(req, res, next);
});

router.post('/selNoteList',function(req,res,next){
  return service.selNoteList(req, res, next);
});
router.post('/selNoteDetail',function(req,res,next){
  return service.selNoteDetail(req, res, next);
});
router.post('/editNote',function(req,res,next){
  return service.editNote(req, res, next);
});

module.exports = router;