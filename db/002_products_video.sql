-- 为 products 表添加 video 字段
ALTER TABLE `products` ADD COLUMN `video` VARCHAR(500) DEFAULT NULL COMMENT '视频URL' AFTER `images`;