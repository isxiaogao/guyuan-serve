const express = require('express')
const cors = require('cors')
const path = require('path')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const productRouter = require('./routes/product')
const categoryRouter = require('./routes/category')
const bannerRouter = require('./routes/banner')
const uploadRouter = require('./routes/upload')

const app = express()
const PORT = process.env.PORT || 8080
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'guyuan-admin-token'

// 限制允许的来源（小程序域名 + 开发环境）
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost', 'http://127.0.0.1']

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true)
    const allowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o))
    callback(null, allowed)
  }
}))

app.use(express.json({ limit: '2mb' }))

// 全局速率限制
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { code: 429, message: '请求过于频繁，请稍后再试' }
}))

// 上传接口单独限制
app.use('/api/upload', rateLimit({
  windowMs: 60 * 1000,
  max: 20
}))

// 管理接口鉴权中间件
function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token']
  if (!token || token !== ADMIN_TOKEN) {
    return res.json({ code: 403, message: '无操作权限' })
  }
  next()
}

// 静态文件：禁止列出目录
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  dotfiles: 'ignore',
  index: false
}))

app.use('/api/categories', categoryRouter)
app.use('/api/products', productRouter)
app.use('/api/banners', bannerRouter)
app.use('/api/upload', uploadRouter)

app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: '服务运行中', timestamp: Date.now() })
})

app.listen(PORT, () => {
  console.log(`故媛后端服务已启动: http://localhost:${PORT}`)
})
