# angular-note-server
仿未知笔记服务端。基于express实现(开发中)

npm install

# 开发模式启动
npm run debug

# 线上启动
npm start

# 数据库配置文件
db.js
// MySQL数据库联接配置
module.exports = {
	mysql: {
		host: 'localhost', 
		user: 'root',
		password: 'root!',
		database:'summer_note', // 前面建的user表位于这个数据库中
		port: 3306
	}
};