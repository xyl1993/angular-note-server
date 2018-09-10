var mysql = require('mysql');
var $conf = require('../config/db');
var log = require('log4js').getLogger("articleService");
// 使用连接池，提升性能
var pool = mysql.createPool($conf.mysql);
const constants = require('../config/constants');
const config = require('../config/config');
const hashidsUtil = require('../utils/hashidsUtili');
const hashKeyObject = require('../config/hashKey');

module.exports = {
  selectDetail: function (req, res, next) {
    var resultMap = {
      // renderName:'',
      // renderObj:{}
    };
    pool.getConnection(function (err, connection) {
      let params = [
        req.query._id ? hashidsUtil.decode(req.query._id, hashKeyObject.noteHashKey) : ''
      ]
      let _sql = 'select a.*,IFNULL(c.nike_name,b.nike_name) nike_name,IFNULL(c.portrait,b.portrait) portrait from note a left join users b on a.create_id = b.id left join open_users c on c.open_id = a.open_id where a.id = ?';
      _sql = mysql.format(_sql, params);
      log.info(_sql);
      connection.query(_sql, function (err, rows, result) {
        if (err) {
          resultMap.renderName = 'err';
          resultMap.renderObj = {
            message: '文章不存在'
          };
          log.error(err);
        } else {
          console.log(rows.length);
          if (rows.length > 0) {
            let detail = rows[0];
            resultMap.renderName = 'template';
            resultMap.renderObj = {
              title: detail.title,
              content:detail.content,
              userInfo:{
                nike_name:detail.nike_name,
                portrait:detail.portrait
              }
            }
          } else {
            resultMap.renderName = 'err';
            resultMap.renderObj = {
              message: '文章不存在'
            }
          }
        }
        res.render(resultMap.renderName, resultMap.renderObj);
        connection.release();
      });
    });

  }
};