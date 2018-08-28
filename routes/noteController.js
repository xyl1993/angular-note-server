var express = require('express');
var service = require('../service/noteService');
var router = express.Router();

router.post('/addNote',function(req,res,next){
  return service.addNote(req, res, next);
});

module.exports = router;