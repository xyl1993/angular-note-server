/*创建数据库*/
DROP DATABASE IF EXISTS summer_note;
CREATE DATABASE IF NOT EXISTS summer_note DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE summer_note;

/*
* 第三方登录表
*/
DROP TABLE IF EXISTS  `open_users`;
CREATE TABLE `open_users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `genre` varchar(50) DEFAULT NULL,   /*登录类型 微信 qq等*/
  `open_id` varchar(50) DEFAULT NULL,  /*第三方openid*/
  `user_id` bigint(20) DEFAULT NULL,   /*主id*/
  `create_time` datetime DEFAULT NULL,
  `portrait` varchar(1000) DEFAULT NULL,  /*第三方头像*/
  `nike_name` varchar(200) DEFAULT NULL,   /*第三方昵称*/
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


/*
* 用户表
*/
DROP TABLE IF EXISTS  `users`;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(32) DEFAULT NULL,
  `nike_name` varchar(20) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `login_time` datetime DEFAULT NULL,
  `portrait` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*
* 用户id与第三方id关联表
*/
DROP TABLE IF EXISTS  `user_aliases`;
CREATE TABLE `user_aliases` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `open_user_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*
* 账户表
*/
DROP TABLE IF EXISTS  `accounts`;
CREATE TABLE `accounts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `balance` double(18,0) DEFAULT NULL,
  `user_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*
* 笔记表
*/
DROP TABLE IF EXISTS  `note`;
CREATE TABLE `note` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `title` varchar(500) DEFAULT NULL,
  `tag` varchar(500) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `preview_content` VARCHAR(500) DEFAULT NULL,/*用于列表展示的纯文本*/
  `file` text DEFAULT NULL, /*附件*/
  `create_id` bigint(20) NOT NULL,
  `create_time` datetime DEFAULT NULL,
  `modify_time` datetime DEFAULT NULL,
  `status` bit DEFAULT 1,    /*1表示正常 0表示已被删除（回收站功能30天自动清理删除数据）*/
  `open_id` varchar(200) DEFAULT NULL, /*OPENID*/
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*评论表*/
DROP TABLE IF EXISTS  `comments`;
CREATE TABLE `comments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `article_id` bigint(20) NOT NULL,
  `comment_body` varchar(500) DEFAULT NULL,
  `create_id` bigint(20) NOT NULL,
  `create_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*评论父子关系表*/
DROP TABLE IF EXISTS  `comments_tree`;
CREATE TABLE `comments_tree` (
  `ancestor` bigint(20) NOT NULL,     /*代表祖先节点*/
  `descendant` bigint(20) NOT NULL,   /*代表后代节点*/
  `distance ` bigint(20) NOT NULL,  /*祖先距离后代的距离*/
  PRIMARY KEY (`ancestor`,`descendant`),
  KEY `descendant` (`descendant`),
  CONSTRAINT `ancestor` FOREIGN KEY (`ancestor`) REFERENCES `comments` (`id`),
  CONSTRAINT `descendant` FOREIGN KEY (`descendant`) REFERENCES `comments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

drop table if exists `contents`;
CREATE TABLE `contents` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,  /*id*/
  `name` varchar(100) DEFAULT NULL,  /*目录名称*/
  `parent_id` bigint(20) DEFAULT NULL,  /*父id*/
  `create_id` bigint(20) NOT NULL,   /*创建人*/
  `create_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;