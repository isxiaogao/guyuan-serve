const express = require('express')
const cors = require('cors')
const productRouter = require('./routes/product')
const categoryRouter = require('./routes/category')
const bannerRouter = require('./routes/banner')

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors())
app.use(express.json())

// 路由
app.use('/api/categories', categoryRouter)
app.use('/api/products', productRouter)
app.use('/api/banners', bannerRouter)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: '服务运行中', timestamp: Date.now() })
})

app.listen(PORT, () => {
  console.log(`故媛后端服务已启动: http://localhost:${PORT}`)
})
