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
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 轮播图表
CREATE TABLE IF NOT EXISTS `banners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `image` VARCHAR(500) NOT NULL,
  `title` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 初始数据
INSERT IGNORE INTO `categories` (`id`, `name`) VALUES
(0, '全部'), (1, '连衣裙'), (2, '上衣'), (3, '裤装'), (4, '裙装'), (5, '外套'), (6, '套装');

INSERT IGNORE INTO `products` (`id`, `name`, `price`, `original_price`, `image`, `tag`, `category_id`, `description`, `detail`, `images`) VALUES
(1, '法式碎花连衣裙 春夏新款', 299.00, 499.00, '/images/product1.png', '热卖', 1, '法式复古碎花连衣裙，精选轻盈雪纺面料，V领设计修饰颈部线条，高腰版型拉长身材比例。春夏必备浪漫裙装，约会度假皆宜。', '面料：100%聚酯纤维\n尺码：S/M/L/XL\n颜色：碎花粉/碎花蓝\n洗涤：建议手洗，低温熨烫', '["/images/product1.png","/images/product1.png","/images/product1.png"]'),
(2, '高腰阔腿裤 显瘦休闲裤', 189.00, 329.00, '/images/product2.png', '新品', 3, '高腰阔腿版型，遮肉显瘦。垂坠面料不易皱，通勤休闲两相宜。松紧腰设计，舒适不勒。', '面料：涤纶混纺\n尺码：S/M/L/XL\n颜色：黑色/米白/卡其\n洗涤：机洗，不可漂白', '["/images/product2.png","/images/product2.png","/images/product2.png"]'),
(3, '真丝衬衫 优雅气质上衣', 359.00, 599.00, '/images/product3.png', '', 2, '100%桑蚕丝面料，丝滑亲肤。经典翻领设计，知性优雅。可通勤可休闲，百搭不挑人。', '面料：100%桑蚕丝\n尺码：S/M/L\n颜色：珍珠白/雾霾蓝\n洗涤：建议干洗', '["/images/product3.png","/images/product3.png","/images/product3.png"]'),
(4, '针织开衫 温柔慵懒风', 229.00, 399.00, '/images/product4.png', '热卖', 5, '柔软针织面料，慵懒宽松版型。春秋百搭单品，内搭外穿皆可。', '面料：针织混纺\n尺码：均码\n颜色：米白/浅灰/粉色\n洗涤：手洗，平铺晾干', '["/images/product4.png","/images/product4.png"]'),
(5, '一字肩连衣裙 约会战裙', 269.00, 459.00, '/images/product5.png', '上新', 1, '一字肩设计展现锁骨线条，收腰A字裙摆修饰身材。约会聚会首选。', '面料：棉混纺\n尺码：S/M/L\n颜色：黑色/红色/白色\n洗涤：机洗，低温熨烫', '["/images/product5.png","/images/product5.png"]'),
(6, '雪纺半身裙 A字高腰裙', 159.00, 289.00, '/images/product6.png', '', 4, '轻盈雪纺面料，A字版型遮胯显瘦。高腰设计拉长腿部比例。', '面料：雪纺\n尺码：S/M/L/XL\n颜色：黑色/粉色/碎花\n洗涤：手洗，不可拧干', '["/images/product6.png","/images/product6.png"]'),
(7, '小香风外套 短款精致', 399.00, 699.00, '/images/product7.png', '新品', 5, '经典小香风粗花呢面料，短款设计拉高腰线。精致优雅通勤必备。', '面料：粗花呢\n尺码：S/M/L\n颜色：黑白/粉白\n洗涤：建议干洗', '["/images/product7.png","/images/product7.png"]'),
(8, 'V领针织衫 百搭打底衫', 139.00, 239.00, '/images/product8.png', '', 2, '经典V领修饰脸型，柔软针织面料舒适亲肤。单穿内搭都好看。', '面料：针织\n尺码：S/M/L/XL\n颜色：黑色/白色/驼色\n洗涤：机洗', '["/images/product8.png","/images/product8.png"]'),
(9, '碎花吊带裙 温柔仙女风', 199.00, 359.00, '/images/product9.png', '热卖', 4, '清新碎花图案，可调节吊带设计。内搭外穿都温柔。', '面料：雪纺\n尺码：S/M/L\n颜色：碎花蓝/碎花粉\n洗涤：手洗', '["/images/product9.png","/images/product9.png"]'),
(10, '西装外套 通勤气质款', 459.00, 799.00, '/images/product10.png', '新品', 5, '利落剪裁，挺括面料。职场通勤必备的气质单品。', '面料：聚酯纤维\n尺码：S/M/L\n颜色：黑色/灰色/驼色\n洗涤：建议干洗', '["/images/product10.png","/images/product10.png"]'),
(11, '休闲套装 运动两件套', 329.00, 559.00, '/images/product11.png', '', 6, '舒适运动面料，上衣+裤子套装。休闲运动都好穿。', '面料：棉+氨纶\n尺码：S/M/L/XL\n颜色：灰色/黑色\n洗涤：机洗', '["/images/product11.png","/images/product11.png"]'),
(12, '衬衫连衣裙 知性通勤款', 279.00, 469.00, '/images/product12.png', '热卖', 1, '衬衫领+连衣裙的组合，知性优雅。通勤约会都能穿。', '面料：棉\n尺码：S/M/L\n颜色：白色/蓝色/条纹\n洗涤：机洗', '["/images/product12.png","/images/product12.png"]');

INSERT IGNORE INTO `banners` (`id`, `image`, `title`) VALUES
(1, '/images/banner1.png', '春季新品'),
(2, '/images/banner2.png', '限时特惠'),
(3, '/images/banner3.png', '明星同款');
