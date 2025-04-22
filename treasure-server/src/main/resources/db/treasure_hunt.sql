-- 创建数据库
CREATE DATABASE IF NOT EXISTS treasure_hunt DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE treasure_hunt;

-- 用户表
CREATE TABLE IF NOT EXISTS `user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(100) NOT NULL COMMENT '密码',
  `nickname` varchar(50) DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像',
  `open_id` varchar(50) DEFAULT NULL COMMENT '微信OpenID',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `points` int(11) DEFAULT '0' COMMENT '积分',
  `status` varchar(20) NOT NULL DEFAULT 'active' COMMENT '状态：active-激活，inactive-未激活',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL COMMENT '更新时间',
  `deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 宝藏表
CREATE TABLE IF NOT EXISTS `treasure` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '宝藏ID',
  `name` varchar(100) NOT NULL COMMENT '宝藏名称',
  `description` text COMMENT '宝藏描述',
  `longitude` double NOT NULL COMMENT '经度',
  `latitude` double NOT NULL COMMENT '纬度',
  `points` int(11) NOT NULL DEFAULT '10' COMMENT '奖励积分',
  `status` varchar(20) NOT NULL DEFAULT 'active' COMMENT '状态：active-激活，inactive-未激活',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL COMMENT '更新时间',
  `deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='宝藏表';

-- 寻宝记录表
CREATE TABLE IF NOT EXISTS `treasure_record` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `treasure_id` bigint(20) NOT NULL COMMENT '宝藏ID',
  `longitude` double NOT NULL COMMENT '发现时经度',
  `latitude` double NOT NULL COMMENT '发现时纬度',
  `points` int(11) NOT NULL COMMENT '获得积分',
  `find_time` datetime NOT NULL COMMENT '发现时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_treasure` (`user_id`,`treasure_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='寻宝记录表';

-- 管理员
INSERT INTO `user` (`username`, `password`, `nickname`, `points`, `status`, `create_time`, `update_time`)
VALUES ('admin', '$2a$10$rDfJgRm14f8uIysSpA26a.IjjxXC5zAP.wy2XKERkW1VBSA5x2YCK', '管理员', 0, 'active', NOW(), NOW());
-- 密码为：admin123 