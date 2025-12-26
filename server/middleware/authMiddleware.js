// File: middleware/authMiddleware.js
import jwt from 'jsonwebtoken'
import { createError } from '../error.js'
import User from '../models/User.js'

export const verifyToken = async (req, res, next) => {
  try {
    let token

    // Check for token in different places
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt
    }

    if (!token || token === 'loggedout') {
      return next(
        createError(
          401,
          'You are not logged in. Please log in to access this resource.'
        )
      )
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Check if user still exists and is active
    const currentUser = await User.findById(decoded.id).select('+password')

    if (!currentUser) {
      return next(
        createError(401, 'The user belonging to this token no longer exists')
      )
    }

    if (!currentUser.isActive || currentUser.isDeleted) {
      return next(
        createError(
          401,
          'Your account has been deactivated. Please contact support.'
        )
      )
    }

    // Check if user changed password after the token was issued (optional security feature)
    if (currentUser.passwordChangedAt) {
      const changedTimestamp = parseInt(
        currentUser.passwordChangedAt.getTime() / 1000,
        10
      )
      if (decoded.iat < changedTimestamp) {
        return next(
          createError(
            401,
            'User recently changed password. Please log in again.'
          )
        )
      }
    }

    // Grant access to protected route
    req.user = currentUser
    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(createError(401, 'Invalid token. Please log in again.'))
    } else if (err.name === 'TokenExpiredError') {
      return next(
        createError(401, 'Your token has expired. Please log in again.')
      )
    }

    console.error('Token verification error:', err)
    next(createError(401, 'Invalid token'))
  }
}

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        createError(401, 'You must be logged in to access this resource')
      )
    }

    if (!roles.includes(req.user.role)) {
      return next(
        createError(403, 'You do not have permission to perform this action')
      )
    }
    next()
  }
}

// Middleware to check if user is active
export const checkActiveUser = (req, res, next) => {
  if (!req.user.isActive || req.user.isDeleted) {
    return next(
      createError(403, 'Your account is not active. Please contact support.')
    )
  }
  next()
}

// Middleware to check if user owns the resource or is admin
export const checkOwnershipOrAdmin = (userIdField = 'id') => {
  return (req, res, next) => {
    const resourceUserId = req.params[userIdField] || req.body[userIdField]

    if (
      req.user.role === 'admin' ||
      req.user._id.toString() === resourceUserId
    ) {
      next()
    } else {
      next(createError(403, 'You can only access your own resources'))
    }
  }
}

// Middleware to attach current user ID to request body (useful for creating resources)
export const attachUserId = (req, res, next) => {
  if (!req.body.userId && req.user) {
    req.body.userId = req.user._id
  }
  next()
}

// Middleware to log user activity (optional)
export const logUserActivity = (action) => {
  return (req, res, next) => {
    if (req.user) {
      console.log(
        `User ${
          req.user.email
        } performed action: ${action} at ${new Date().toISOString()}`
      )
      // You can implement proper logging here (e.g., save to database, log files, etc.)
    }
    next()
  }
}
