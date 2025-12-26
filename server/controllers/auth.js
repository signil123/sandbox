// File: server/controllers/auth.js
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { createError } from '../error.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'

const signToken = (id) => {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in the environment variables')
  }
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

const createSendToken = (user, statusCode, res) => {
  try {
    const token = signToken(user._id)
    const cookieOptions = {
      expires: new Date(
        Date.now() +
          (parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 7) *
            24 *
            60 *
            60 *
            1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    }

    res.cookie('jwt', token, cookieOptions)
    user.password = undefined

    res.status(statusCode).json({
      status: 'success',
      token,
      data: { user },
    })
  } catch (error) {
    console.error('Error in createSendToken:', error)
    throw error
  }
}

export const signup = async (req, res, next) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { firstName, lastName, email, password, phone, userType } = req.body

    if (!firstName || !lastName || !email || !password) {
      await session.abortTransaction()
      return next(
        createError(
          400,
          'Please provide firstName, lastName, email and password'
        )
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      await session.abortTransaction()
      return next(createError(400, 'Please provide a valid email address'))
    }

    if (password.length < 8) {
      await session.abortTransaction()
      return next(
        createError(400, 'Password must be at least 8 characters long')
      )
    }

    const existingUser = await User.findOne({ email }).session(session)
    if (existingUser) {
      await session.abortTransaction()
      return next(createError(400, 'User with this email already exists'))
    }

    const newUserData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.toLowerCase().trim(),
      password,
      phone: phone ? phone.trim() : undefined,
      role: 'user',
      userType: userType || null,
    }

    const [newUser] = await User.create([newUserData], { session })

    await session.commitTransaction()

    const user = await User.findById(newUser._id).select('-password')
    createSendToken(user, 201, res)
  } catch (err) {
    await session.abortTransaction()
    console.error('Error in signup:', err)

    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0]
      return next(createError(400, `${field} already exists`))
    }

    next(createError(500, 'An unexpected error occurred during signup'))
  } finally {
    session.endSession()
  }
}

export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return next(createError(400, 'Please provide email and password'))
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isActive: true,
      isDeleted: false,
    }).select('+password')

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(createError(401, 'Incorrect email or password'))
    }

    user.lastLogin = new Date()
    await user.save({ validateBeforeSave: false })

    const populatedUser = await User.findById(user._id).select('-password')

    createSendToken(populatedUser, 200, res)
  } catch (err) {
    console.error('Error in signin:', err)
    next(createError(500, 'An unexpected error occurred during login'))
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const {
      gender,
      language,
      dateOfBirth,
      school,
      sport,
      nilNeeds,
      specialties,
      experience,
      communicationPreference,
      userType,
    } = req.body

    const updateData = {}

    if (gender !== undefined) updateData.gender = gender
    if (language !== undefined) updateData.language = language
    if (communicationPreference !== undefined) {
      updateData.communicationPreference = communicationPreference
    }
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth
    if (school !== undefined) updateData.school = school
    if (sport !== undefined) updateData.sport = sport
    if (nilNeeds !== undefined) updateData.nilNeeds = nilNeeds
    if (specialties !== undefined) updateData.specialties = specialties
    if (experience !== undefined) updateData.experience = experience
    if (userType !== undefined) updateData.userType = userType

    updateData.isProfileComplete = true

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password')

    res.status(200).json({
      status: 'success',
      data: { user: updatedUser },
    })
  } catch (error) {
    console.error('Error in updateProfile:', error)
    next(error)
  }
}

export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password')

    if (!user) {
      return next(createError(404, 'No user found with that ID'))
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    })
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    next(error)
  }
}

export const updateUser = async (req, res, next) => {
  try {
    const { role, firstName, lastName, email, phone } = req.body
    const userId = req.params.id

    const existingUser = await User.findById(userId)

    if (!existingUser) {
      return next(createError(404, 'No user found with that ID'))
    }

    if (role && !['admin', 'user'].includes(role)) {
      return next(createError(400, 'Invalid role provided'))
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return next(createError(400, 'Please provide a valid email address'))
      }

      const emailExists = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: userId },
      })

      if (emailExists) {
        return next(createError(400, 'Email is already taken by another user'))
      }
    }

    const updateData = {}
    if (role) updateData.role = role
    if (firstName) updateData.firstName = firstName.trim()
    if (lastName) updateData.lastName = lastName.trim()
    if (firstName || lastName) {
      updateData.name = `${firstName || existingUser.firstName || ''} ${
        lastName || existingUser.lastName || ''
      }`.trim()
    }
    if (email) updateData.email = email.toLowerCase().trim()
    if (phone) updateData.phone = phone.trim()

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password')

    // Notify user of security update
    if (email || firstName || lastName) {
      let changeDesc = []
      if (email) changeDesc.push('email')
      if (firstName || lastName) changeDesc.push('name')

      await Notification.create({
        recipient: userId,
        type: 'security_update',
        title: 'Security Update: Personal Information Changed',
        description: `Your ${changeDesc.join(
          ' and '
        )} has been successfully updated. If you did not make this change, please contact support immediately.`,
        priority: 'high',
      })
    }

    res.status(200).json({
      status: 'success',
      data: { user: updatedUser },
    })
  } catch (error) {
    console.error('Error in updateUser:', error)
    next(error)
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
      },
      { new: true }
    )

    if (!user) {
      return next(createError(404, 'No user found with that ID'))
    }

    res.status(204).json({
      status: 'success',
      data: null,
    })
  } catch (error) {
    console.error('Error in deleteUser:', error)
    next(error)
  }
}

export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const users = await User.find({ isDeleted: false })
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const totalUsers = await User.countDocuments({ isDeleted: false })

    res.status(200).json({
      status: 'success',
      results: users.length,
      totalResults: totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      data: { users },
    })
  } catch (error) {
    console.error('Error in getAllUsers:', error)
    next(error)
  }
}

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body

    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(
        createError(
          400,
          'Please provide current password, new password, and confirm password'
        )
      )
    }

    if (newPassword !== confirmPassword) {
      return next(
        createError(400, 'New password and confirm password do not match')
      )
    }

    if (newPassword.length < 8) {
      return next(
        createError(400, 'New password must be at least 8 characters long')
      )
    }

    const user = await User.findById(req.user.id).select('+password')

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    if (!(await user.correctPassword(currentPassword, user.password))) {
      return next(createError(401, 'Your current password is incorrect'))
    }

    user.password = newPassword
    await user.save()

    // Notify user of security update (password change)
    await Notification.create({
      recipient: user._id,
      type: 'security_update',
      title: 'Security Update: Password Changed',
      description:
        'Your password has been successfully changed. If you did not make this change, please contact support immediately.',
      priority: 'high',
    })

    const updatedUser = await User.findById(user._id).select('-password')

    createSendToken(updatedUser, 200, res)
  } catch (error) {
    console.error('Error in changePassword:', error)
    next(error)
  }
}

export const logout = async (req, res, next) => {
  try {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    })

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Error in logout:', error)
    next(error)
  }
}
