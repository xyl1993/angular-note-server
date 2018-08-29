module.exports = {
  addNote: 'insert into note(title,tag,content,file,create_id,create_time) values (?,?,?,?,?,?)',
  editNote: 'update note set title= ?,tag=?,content=?,file=?,modify_time=? where id = ?'
};
