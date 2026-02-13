// File: server/index.js - MINIMAL VERSION TO GET STARTED
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import mongoose from 'mongoose'

// Only import existing routes
import advisorRoute from './routes/advisor.js'
import athleteRoute from './routes/athlete.js'
import authRoute from './routes/auth.js'
import connectionRoute from './routes/connectionRoutes.js'
import documentManagerRoutes from './routes/documentManager.js'
import eventRoutes from './routes/eventRoutes.js'
import exploreRoute from './routes/exploreRoutes.js'
import messageRoutes from './routes/messageRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import subscriptionRoutes from './routes/subscriptionRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import pushRoutes from './routes/pushRoutes.js'
import { seedStripePlans } from './seeds/stripePlanSeed.js'

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true })

app.use(cookieParser())
app.use(express.json())
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || 'https://signilai.com/'
        : ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// Serve uploads
app.use('/uploads', express.static('uploads'))

// Routes
app.use('/api/auth/', authRoute)
app.use('/api/advisor', advisorRoute)
app.use('/api/athlete', athleteRoute)
app.use('/api/explore', exploreRoute)
app.use('/api/connections', connectionRoute)
app.use('/api/messages', messageRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/push', pushRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/documents', documentManagerRoutes)
app.use('/api/subscriptions', subscriptionRoutes)

// Error handler middleware
app.use((err, req, res, next) => {
  const isFileTooLarge = err?.code === 'LIMIT_FILE_SIZE'
  const statusCode = isFileTooLarge ? 413 : err.statusCode || 500
  const message = isFileTooLarge
    ? 'File too large. Please upload a smaller file.'
    : err.message || 'Something went wrong!'
  console.error(`[Error] ${statusCode} - ${message}`)
  res.status(statusCode).json({
    success: false,
    status: err.status || 'error',
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : {},
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
  })
})

// Database connection
const connect = () => {
  mongoose
    .connect(process.env.MONGO)
    .then(() => {
      console.log('✅ Connected to MongoDB')
      seedStripePlans().catch((error) => {
        console.error('❌ Stripe plan seed failed:', error.message || error)
      })
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err)
      process.exit(1)
    })
}

import { createServer } from 'http'
import { initSocket } from './socket.js'

const PORT = process.env.PORT || 8800
const server = createServer(app)

// Initialize Socket.io
initSocket(server)

server.listen(PORT, () => {
  connect()
  console.log(`🚀 Server running on port ${PORT}`)
})
