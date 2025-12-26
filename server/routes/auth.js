// File: server/routes/auth.js
import express from 'express'
import {
  changePassword,
  deleteUser,
  getAllUsers,
  getUserProfile,
  logout,
  signin,
  signup,
  updateProfile,
  updateUser,
} from '../controllers/auth.js'
import { restrictTo, verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.post('/signup', signup)
router.post('/signin', signin)

// Protected routes
router.use(verifyToken)

// User routes
router.get('/profile/:id', getUserProfile)
router.put('/profile', updateProfile)
router.put('/change-password', changePassword)
router.post('/logout', logout)

// Self-profile
router.put(
  '/user',
  (req, res, next) => {
    req.params.id = req.user.id
    next()
  },
  updateUser
)

// User management
router.put(
  '/users/:id',
  (req, res, next) => {
    if (
      req.user.role === 'admin' ||
      req.user._id.toString() === req.params.id
    ) {
      next()
    } else {
      const error = new Error('You can only access your own profile')
      error.statusCode = 403
      next(error)
    }
  },
  updateUser
)

// Admin only
router.use(restrictTo('admin'))
router.get('/all-users', getAllUsers)
router.post('/create-user', signup)
router.put('/admin/users/:id', updateUser)
router.delete('/admin/users/:id', deleteUser)

export default router
