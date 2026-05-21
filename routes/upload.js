const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const openidAuth = require('../middleware/openidAuth')

const router = express.Router()
const uploadDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_一-龥]/g, '').slice(0, 30)
}

function buildFilename(type, ext) {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const random = Math.round(Math.random() * 1e6)
  return `${date}_${time}_${type}_${random}${ext}`
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      return cb(new Error('仅支持 jpg/png/gif/webp 格式图片'))
    }
    const type = sanitizeName(req.query.type || 'upload')
    cb(null, buildFilename(type, ext))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
})

router.post('/', openidAuth({ adminOnly: true }), (req, res) => {
  upload.single('file')(req, res, function (err) {
    if (err) {
      return res.json({ code: 400, message: err.message })
    }
    if (!req.file) {
      return res.json({ code: 400, message: '请选择图片' })
    }
    const url = `/uploads/${req.file.filename}`
    res.json({ code: 200, data: { url } })
  })
})

module.exports = router
