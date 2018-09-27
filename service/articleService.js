// 使用连接池，提升性能
const { model: Note } = require('../models/note');
const { model: User } = require('../models/user');
const { to } = require('await-to-js');

module.exports = {
  selectDetail: async function (req, res, next) {
    var resultMap = {};
    const [uerr, note] = await to(Note.findById(req.params.noteId));
    if (uerr || !note) return res.status(401).send('no note');
    const [err, user] = await to(User.findById(note.createId));
    if (err || !user) return res.status(401).send('no note');
    if(user){
      resultMap.renderName = 'template';
      resultMap.renderObj = {
        title: note.title,
        content: note.content,
      }
      if(note.openId){
        const openUser = user.openUser.filter((item)=>{
          return item.openId === note.openId
        })[0];
        const userInfo = {
          nikeName:openUser.nikeName,
          portrait:openUser.portrait
        }
        resultMap.renderObj.userInfo = userInfo;
      }else{
        resultMap.renderObj.userInfo = {
          nikeName:user.nikeName,
          portrait:user.portrait
        }
      }
      res.render(resultMap.renderName, resultMap.renderObj);
    }
  }
};