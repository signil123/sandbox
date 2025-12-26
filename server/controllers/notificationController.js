import { createError } from '../error.js'
import Notification from '../models/Notification.js'

export const getNotifications = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const notifications = await Notification.find({
      recipient: req.user.id,
      isDeleted: false,
      createdAt: { $gte: thirtyDaysAgo },
    })
      .populate('sender', 'name profileImage firstName lastName')
      .sort({ createdAt: -1 })
      .limit(50)

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: { notifications },
    })
  } catch (error) {
    next(error)
  }
}

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true, readAt: Date.now() },
      { new: true }
    )

    if (!notification) {
      return next(createError(404, 'Notification not found'))
    }

    res.status(200).json({
      status: 'success',
      data: { notification },
    })
  } catch (error) {
    next(error)
  }
}

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true, readAt: Date.now() }
    )

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
    })
  } catch (error) {
    next(error)
  }
}

export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isDeleted: true },
      { new: true }
    )

    if (!notification) {
      return next(createError(404, 'Notification not found'))
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted',
    })
  } catch (error) {
    next(error)
  }
}
