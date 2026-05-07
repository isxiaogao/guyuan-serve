const express = require('express')
const router = express.Router()
const categories = require('../data/categories')

// GET /api/categories - 获取所有分类
router.get('/', (req, res) => {
  res.json({ code: 200, data: categories })
})

module.exports = router
