const express = require('express')
const router = express.Router()
const { asyncHandler } = require('../middleware/errorHandler')
const openidAuth = require('../middleware/openidAuth')
const { cleanupOrphans } = require('../utils/resourceManager')

// 获取资源列表（仅管理员）
router.get('/', openidAuth({ adminOnly: true }), asyncHandler(async (req, res) => {
  const { orphan } = req.query
  let sql = 'SELECT filename, file_type, mime_type, file_size, ref_count, created_at FROM resources'
  if (orphan === '1') {
    sql += ' WHERE ref_count <= 0'
  }
  sql += ' ORDER BY ref_count ASC, created_at DESC'
  const [rows] = await require('../db').query(sql)
  res.json({ code: 200, data: rows })
}))

// 清理孤儿文件（仅管理员）
router.delete('/orphan', openidAuth({ adminOnly: true }), asyncHandler(async (req, res) => {
  const result = await cleanupOrphans()
  res.json({ code: 200, data: result, message: `已清理 ${result.count} 个孤儿文件` })
}))

module.exports = router
