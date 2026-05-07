const express = require('express')
const router = express.Router()
const products = require('../data/products')

// GET /api/products - 获取商品列表（支持分类筛选、标签筛选）
router.get('/', (req, res) => {
  const { category, tag, page = 1, pageSize = 20 } = req.query
  let list = [...products]

  if (category !== undefined && category !== '0') {
    list = list.filter(p => p.category === Number(category))
  }
  if (tag) {
    list = list.filter(p => p.tag === tag)
  }

  const offset = (Number(page) - 1) * Number(pageSize)
  const total = list.length
  list = list.slice(offset, offset + Number(pageSize))

  res.json({ code: 200, data: { list, total, page: Number(page), pageSize: Number(pageSize) } })
})

// GET /api/products/hot - 获取热卖商品
router.get('/hot', (req, res) => {
  const list = products.filter(p => p.tag === '热卖')
  res.json({ code: 200, data: list })
})

// GET /api/products/new - 获取新品
router.get('/new', (req, res) => {
  const list = products.filter(p => p.tag === '新品' || p.tag === '上新')
  res.json({ code: 200, data: list })
})

// GET /api/products/:id - 获取商品详情
router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === Number(req.params.id))
  if (!product) {
    return res.json({ code: 404, message: '商品不存在' })
  }
  res.json({ code: 200, data: product })
})

module.exports = router
