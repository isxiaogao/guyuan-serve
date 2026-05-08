-- 分类表
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL
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

-- 轮播图表
CREATE TABLE IF NOT EXISTS `banners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `image` VARCHAR(500) NOT NULL,
  `title` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
