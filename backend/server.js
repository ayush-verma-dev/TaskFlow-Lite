require('dotenv').config()

const dns = require('dns')
dns.setServers(['8.8.8.8'])

const cors = require('cors')
const express = require('express')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')

const app = express()
const PORT = process.env.PORT || 5000

const authRoutes = require('./routes/authRoutes')
const taskRoutes = require('./routes/taskRoutes')
const { protect } = require('./middleware/authMiddleware')

const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))

app.use(express.json())
app.use(cookieParser())

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TaskFlow Lite API is running'
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)

app.get('/api/auth/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  })
})

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB connected successfully')

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

startServer()
