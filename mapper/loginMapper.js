var loginMapper = {
  insertUsers: 'insert into users(email,nike_name,password,create_time,login_time) values (?,?,?,?,?)',
  dtlogin:'select * from users where email=? and password=? limit 1'
};

module.exports = loginMapper;