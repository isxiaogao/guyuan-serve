const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const router = express.Router()
const uploadDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadDir,
  filename(req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext)
  }
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.json({ code: 400, message: '请选择图片' })
  }
  const url = `/uploads/${req.file.filename}`
  res.json({ code: 200, data: { url } })
})

module.exports = router
