const express = require('express')
const router = express.Router()

const banners = [
  { id: 1, image: '/images/banner1.png', title: '春季新品' },
  { id: 2, image: '/images/banner2.png', title: '限时特惠' },
  { id: 3, image: '/images/banner3.png', title: '明星同款' }
]

// GET /api/banners - 获取轮播图
router.get('/', (req, res) => {
  res.json({ code: 200, data: banners })
})

module.exports = router
