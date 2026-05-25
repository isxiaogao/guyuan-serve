-- 资源管理表：记录所有上传文件的引用关系
CREATE TABLE IF NOT EXISTS `resources` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `filename` VARCHAR(255) NOT NULL UNIQUE COMMENT '文件名，如 20260525_143022_product_123456.jpg',
  `file_type` ENUM('image', 'video') NOT NULL COMMENT '文件类型',
  `mime_type` VARCHAR(100) DEFAULT NULL COMMENT 'MIME 类型',
  `file_size` INT DEFAULT NULL COMMENT '文件大小（字节）',
  `ref_count` INT DEFAULT 0 COMMENT '引用计数，0 表示可清理',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ref_count` (`ref_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
