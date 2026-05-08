const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const router = express.Router()
const uploadDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

// 仅允许图片文件
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const storage = multer.diskStorage({
  destination: uploadDir,
  filename(req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase()
    const extAllowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)
    const mimeAllowed = ALLOWED_TYPES.includes(file.mimetype)
    if (extAllowed && mimeAllowed) {
      cb(null, true)
    } else {
      cb(new Error('仅支持 jpg/png/gif/webp 格式图片'))
    }
  }
})

router.post('/', (req, res) => {
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
