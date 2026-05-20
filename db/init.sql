-- 分类表
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `icon` VARCHAR(100) DEFAULT NULL COMMENT '图标文件名'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 商品表
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `original_price` DECIMAL(10,2) DEFAULT NULL,
  `image` VARCHAR(500) NOT NULL,
  `tag` VARCHAR(50) DEFAULT '',
  `category_id` INT NOT NULL,
  `description` TEXT,
  `detail` TEXT,
  `images` JSON,
  `size` VARCHAR(100) DEFAULT NULL COMMENT '尺码',
  `color` VARCHAR(200) DEFAULT NULL COMMENT '颜色',
  `fabric` VARCHAR(200) DEFAULT NULL COMMENT '面料',
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT,
  INDEX `idx_category_id` (`category_id`),
  INDEX `idx_tag` (`tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 标签字典表
CREATE TABLE IF NOT EXISTS `tags` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL COMMENT '标签显示名称，如"热卖"',
  `code` VARCHAR(50) NOT NULL COMMENT '标签代码，如 hot/new/featured',
  `sort` INT DEFAULT 0 COMMENT '排序，越小越靠前',
  `enabled` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_name` (`name`),
  INDEX `idx_enabled_code` (`enabled`, `code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 初始标签数据
INSERT IGNORE INTO `tags` (`name`, `code`, `sort`) VALUES
  ('热卖', 'hot', 1),
  ('新品', 'new', 2),
  ('上新', 'new', 3);

-- 轮播图表
CREATE TABLE IF NOT EXISTS `banners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `image` VARCHAR(500) NOT NULL,
  `title` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 收藏表
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_openid` VARCHAR(100) NOT NULL,
  `product_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_product` (`user_openid`, `product_id`),
  INDEX `idx_user_openid` (`user_openid`),
  INDEX `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openid` VARCHAR(100) NOT NULL UNIQUE,
  `is_admin` TINYINT(1) DEFAULT 0,
  `first_visit_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_visit_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_is_admin` (`is_admin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
