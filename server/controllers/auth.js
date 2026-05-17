// File: server/controllers/auth.js
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import crypto from 'crypto'
import { Resend } from 'resend'
import { createError } from '../error.js'
import Notification from '../models/Notification.js'
import Profile from '../models/Profile.js'
import User from '../models/User.js'

const BRAND_PRIMARY = '#163146'
const BRAND_ACCENT = '#986a41'
const APP_NAME = 'Signil'

let resendClient

const getResendClient = () => {
  if (resendClient) return resendClient

  const resendKey = process.env.RESEND_KEY
  if (!resendKey) {
    throw new Error('RESEND_KEY is not configured')
  }

  resendClient = new Resend(resendKey)
  return resendClient
}

const escapeHtml = (value = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const buildEmailTemplate = ({
  preheader,
  title,
  intro,
  actionLabel,
  actionUrl,
  bodyItems = [],
  closing,
}) => {
  const safeTitle = escapeHtml(title)
  const safeIntro = escapeHtml(intro)
  const safeClosing = escapeHtml(closing)
  const safePreheader = escapeHtml(preheader)
  const safeActionLabel = escapeHtml(actionLabel)
  const safeActionUrl = escapeHtml(actionUrl)
  const bodyItemsHtml = bodyItems
    .map((item) => `<li style="margin-bottom: 8px;">${escapeHtml(item)}</li>`)
    .join('')

  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreheader}</div>
    <div style="background:#f2f5f8;padding:28px 12px;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e6ebf0;">
        <tr>
          <td style="background:linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_ACCENT});padding:24px 28px;color:#ffffff;">
            <p style="margin:0;font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:0.92;">${APP_NAME}</p>
            <h1 style="margin:8px 0 0;font-size:28px;line-height:1.25;">${safeTitle}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:26px 28px 10px;">
            <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#334155;">${safeIntro}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 28px 2px;">
            <a href="${safeActionUrl}" style="display:inline-block;background:${BRAND_PRIMARY};color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;font-size:14px;">${safeActionLabel}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px 0;">
            <p style="margin:0 0 10px;font-size:13px;color:#64748b;">If the button does not work, copy this link into your browser:</p>
            <p style="margin:0;font-size:13px;line-height:1.7;word-break:break-all;"><a href="${safeActionUrl}" style="color:${BRAND_PRIMARY};">${safeActionUrl}</a></p>
          </td>
        </tr>
        ${
          bodyItemsHtml
            ? `<tr>
          <td style="padding:18px 28px 0;">
            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:14px 16px;">
              <ul style="margin:0;padding-left:18px;color:#334155;font-size:14px;line-height:1.65;">
                ${bodyItemsHtml}
              </ul>
            </div>
          </td>
        </tr>`
            : ''
        }
        <tr>
          <td style="padding:18px 28px 28px;">
            <p style="margin:0;font-size:14px;line-height:1.7;color:#334155;">${safeClosing}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #edf2f7;background:#fafcff;">
            <p style="margin:0;font-size:12px;color:#64748b;line-height:1.7;">
              Need help? Contact <a href="mailto:${escapeHtml(process.env.SUPPORT_EMAIL || 'support@signilai.com')}" style="color:${BRAND_PRIMARY};">${escapeHtml(process.env.SUPPORT_EMAIL || 'support@signilai.com')}</a>
              <br />
              &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `
}

const sendEmail = async ({ to, subject, html, text }) => {
  const client = getResendClient()
  const fromEmail = process.env.RESEND_FROM || 'Signil <onboarding@resend.dev>'

  const { data, error } = await client.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
    text,
  })

  if (error) {
    throw new Error(error.message || 'Email provider rejected the request')
  }

  return data
}

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

const sendPasswordResetEmail = async ({ email, firstName, resetUrl }) => {
  const safeFirstName = firstName?.trim() || 'there'
  const html = buildEmailTemplate({
    preheader: 'Reset your Signil password',
    title: 'Reset Your Password',
    intro: `Hi ${safeFirstName}, we received a request to reset your ${APP_NAME} password.`,
    actionLabel: 'Reset Password',
    actionUrl: resetUrl,
    bodyItems: [
      'This reset link expires in 10 minutes.',
      'If you did not request this, you can safely ignore this email.',
    ],
    closing: 'Security matters to us. If this was not you, contact support immediately.',
  })
  const text = [
    `Hi ${safeFirstName},`,
    `We received a request to reset your ${APP_NAME} password.`,
    `Reset password: ${resetUrl}`,
    'This link expires in 10 minutes.',
    'If you did not request this, you can safely ignore this email.',
  ].join('\n')

  await sendEmail({
    to: email,
    subject: 'Reset your Signil password',
    html,
    text,
  })
}

const sendWelcomeEmail = async ({ email, firstName }) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const dashboardUrl = `${frontendUrl}/dashboard`
  const safeFirstName = firstName?.trim() || 'there'

  const html = buildEmailTemplate({
    preheader: `Welcome to ${APP_NAME}`,
    title: `Welcome to ${APP_NAME}`,
    intro: `Hi ${safeFirstName}, your account is ready. You can now access your dashboard and start building meaningful connections.`,
    actionLabel: 'Open Dashboard',
    actionUrl: dashboardUrl,
    bodyItems: [
      'Complete your profile to get better recommendations.',
      'Explore advisors, athletes, and agents that match your goals.',
      'Use secure in-app messaging to start conversations quickly.',
    ],
    closing: `Thanks for joining ${APP_NAME}. We are excited to have you with us.`,
  })
  const text = [
    `Hi ${safeFirstName},`,
    `Welcome to ${APP_NAME}. Your account is ready.`,
    `Open your dashboard: ${dashboardUrl}`,
    'Complete your profile and start exploring connections.',
  ].join('\n')

  await sendEmail({
    to: email,
    subject: `Welcome to ${APP_NAME}`,
    html,
    text,
  })
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
    try {
      await sendWelcomeEmail({
        email: user.email,
        firstName: user.firstName,
      })
    } catch (emailError) {
      console.error('Welcome email send failed:', emailError?.message || emailError)
    }

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
    const { role, userType, name, firstName, lastName, email, phone } = req.body
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

    // Check if userType is changing
    if (userType !== undefined && userType !== existingUser.userType) {
        updateData.userType = userType

        // Delete existing profile to force re-onboarding
        await Profile.findOneAndDelete({ user: userId })

        // Reset type-specific fields on User model
        updateData.school = null
        updateData.sport = null
        updateData.nilNeeds = []
    } else if (userType !== undefined) {
        updateData.userType = userType
    }

    // Name handling — `name` (the combined field) is authoritative.
    // We split it ourselves so a client that omits the trailing token
    // (e.g. "John" instead of "John Admin") fully clears lastName instead
    // of inheriting the previous value.
    if (name !== undefined) {
      const trimmed = String(name).trim()
      const parts = trimmed ? trimmed.split(/\s+/) : []
      updateData.name = trimmed
      updateData.firstName = parts[0] || ''
      updateData.lastName = parts.slice(1).join(' ')
    } else if (firstName !== undefined || lastName !== undefined) {
      const nextFirst = firstName !== undefined ? String(firstName).trim() : (existingUser.firstName || '')
      const nextLast = lastName !== undefined ? String(lastName).trim() : (existingUser.lastName || '')
      updateData.firstName = nextFirst
      updateData.lastName = nextLast
      updateData.name = `${nextFirst} ${nextLast}`.trim()
    }
    if (email) updateData.email = email.toLowerCase().trim()
    if (phone !== undefined) updateData.phone = String(phone).trim()

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password')

    // Notify user that their account profile was updated (generic, regardless of which field)
    if (email !== undefined || name !== undefined || firstName !== undefined || lastName !== undefined || phone !== undefined) {
      await Notification.create({
        recipient: userId,
        type: 'security_update',
        title: 'Account profile updated',
        description: 'Your account profile was updated. If you did not make this change, please contact support immediately.',
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
    const { search, role, userType } = req.query

    const query = { isDeleted: false }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    if (role && role !== 'all') {
      query.role = role
    }

    if (userType && userType !== 'all') {
      query.userType = userType
    }

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const totalUsers = await User.countDocuments(query)

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

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body

    if (!email) {
      return next(createError(400, 'Please provide your email address'))
    }

    const normalizedEmail = email.toLowerCase().trim()
    const user = await User.findOne({
      email: normalizedEmail,
      isActive: true,
      isDeleted: false,
    })

    if (!user) {
      return next(createError(404, 'No account exists with this email address'))
    }

    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`

    try {
      await sendPasswordResetEmail({
        email: user.email,
        firstName: user.firstName,
        resetUrl,
      })
    } catch (error) {
      user.passwordResetToken = undefined
      user.passwordResetExpires = undefined
      await user.save({ validateBeforeSave: false })
      console.error('Reset email send failed:', error?.message || error)
      const message =
        process.env.NODE_ENV === 'development'
          ? `Unable to send reset email: ${error?.message || 'Unknown error'}`
          : 'Unable to send reset email right now'
      return next(createError(500, message))
    }

    res.status(200).json({
      status: 'success',
      message: 'Password reset link sent to your email.',
    })
  } catch (error) {
    console.error('Error in forgotPassword:', error)
    next(error)
  }
}

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params
    const { password, confirmPassword } = req.body

    if (!password || !confirmPassword) {
      return next(createError(400, 'Please provide password and confirmPassword'))
    }

    if (password !== confirmPassword) {
      return next(createError(400, 'Password and confirm password do not match'))
    }

    if (password.length < 8) {
      return next(createError(400, 'Password must be at least 8 characters long'))
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
      isActive: true,
      isDeleted: false,
    })

    if (!user) {
      return next(createError(400, 'Reset token is invalid or has expired'))
    }

    user.password = password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    await Notification.create({
      recipient: user._id,
      type: 'security_update',
      title: 'Security Update: Password Reset',
      description:
        'Your password has been successfully reset. If this was not you, please contact support immediately.',
      priority: 'high',
    })

    const updatedUser = await User.findById(user._id).select('-password')
    createSendToken(updatedUser, 200, res)
  } catch (error) {
    console.error('Error in resetPassword:', error)
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
