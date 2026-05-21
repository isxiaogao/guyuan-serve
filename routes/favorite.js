const express = require('express')
const router = express.Router()
const pool = require('../db')
const { asyncHandler } = require('../middleware/errorHandler')
const openidAuth = require('../middleware/openidAuth')
const { mapProduct } = require('../utils/productMapper')

function mapFavoriteProduct(row) {
  const base = mapProduct(row)
  if (!base) return null
  base.favorite_id = row.favorite_id
  return base
}

router.get('/', openidAuth(), asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT p.*, f.id AS favorite_id FROM favorites f JOIN products p ON f.product_id = p.id WHERE f.user_openid = ? ORDER BY f.created_at DESC',
    [req.openid]
  )
  res.json({ code: 200, data: rows.map(mapFavoriteProduct) })
}))

router.post('/', openidAuth(), asyncHandler(async (req, res) => {
  const { product_id } = req.body
  if (!product_id) {
    return res.json({ code: 400, message: '商品ID不能为空' })
  }

  const [products] = await pool.query('SELECT id FROM products WHERE id = ?', [Number(product_id)])
  if (products.length === 0) {
    return res.json({ code: 404, message: '商品不存在' })
  }

  const [result] = await pool.query(
    'INSERT IGNORE INTO favorites (user_openid, product_id) VALUES (?, ?)',
    [req.openid, Number(product_id)]
  )
  res.json({ code: 200, data: { affected: result.affectedRows } })
}))

router.delete('/', openidAuth(), asyncHandler(async (req, res) => {
  const { product_id } = req.body
  if (!product_id) {
    return res.json({ code: 400, message: '商品ID不能为空' })
  }

  const [result] = await pool.query(
    'DELETE FROM favorites WHERE user_openid = ? AND product_id = ?',
    [req.openid, Number(product_id)]
  )
  if (result.affectedRows === 0) {
    return res.json({ code: 404, message: '收藏不存在' })
  }
  res.json({ code: 200, message: '取消收藏成功' })
}))

module.exports = router
