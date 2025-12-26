// File: server/controllers/connectionRequest.js
import { createError } from '../error.js'
import Notification from '../models/Notification.js'
import { Connection, ConnectionRequest } from '../models/Relationship.js'
import User from '../models/User.js'
import { calculateMatchScore } from './matching.js'

// ═══════════════════════════════════════════════════════════════════════════
// CONNECTION REQUEST MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Send a connection request
 * Optional message limited to 150 characters
 */
export const sendConnectionRequest = async (req, res, next) => {
  try {
    const { userId, targetUserId } = req.params
    const { message = '' } = req.body

    // Ownership check via middleware ✓

    // Validate inputs
    if (!targetUserId) {
      return next(createError(400, 'targetUserId is required'))
    }

    if (userId === targetUserId) {
      return next(
        createError(400, 'Cannot send connection request to yourself')
      )
    }

    // Check message length
    if (message && message.length > 150) {
      return next(createError(400, 'Message must be 150 characters or less'))
    }

    // Check if users exist
    const [sender, recipient] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId),
    ])

    if (!sender || !recipient) {
      return next(createError(404, 'One or both users not found'))
    }

    // Check if already connected
    const existingConnection = await Connection.findOne({
      $or: [
        { user: userId, connectedUser: targetUserId },
        { user: targetUserId, connectedUser: userId },
      ],
    })

    if (existingConnection) {
      return next(createError(400, 'Already connected with this user'))
    }

    // Check if request already sent
    const existingRequest = await ConnectionRequest.findOne({
      sender: userId,
      recipient: targetUserId,
      status: 'sent',
    })

    if (existingRequest) {
      return next(createError(400, 'Connection request already sent'))
    }

    // Calculate match score for the request
    const matchScore = await calculateMatchScore(userId, targetUserId)
 
    // Create connection request
    const request = await ConnectionRequest.create({
      from: userId,
      to: targetUserId,
      status: 'pending',
      message: message || '',
      matchScore: matchScore,
    })

    // Create notification for recipient
    await Notification.create({
      user: targetUserId,
      type: 'connection_request',
      priority: 'normal',
      recipient: targetUserId,
      relatedUser: userId,
      title: `${sender.name} sent you a connection request`,
      message: message ? `"${message}"` : `${sender.name} wants to connect`,
      actionUrl: `/messages/requests/${request._id}`,
      isRead: false,
    })

    res.status(201).json({
      status: 'success',
      message: 'Connection request sent',
      data: {
        request,
      },
    })
  } catch (error) {
    console.error('Error in sendConnectionRequest:', error)
    next(error)
  }
}

/**
 * Get pending connection requests for a user
 */
export const getPendingRequests = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 10 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Get pending requests sent to this user
    const requests = await ConnectionRequest.find({
      to: userId,
      status: 'pending',
    })
      .populate('from', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })

    const total = await ConnectionRequest.countDocuments({
      to: userId,
      status: 'pending',
    })

    // Get additional info for each request
    const enrichedRequests = await Promise.all(
      requests.map(async (req) => {
        return {
          requestId: req._id,
          sender: {
            userId: req.from._id,
            name: req.from.name,
            email: req.from.email,
          },
          message: req.message,
          sentAt: req.createdAt,
        }
      })
    )

    res.status(200).json({
      status: 'success',
      results: enrichedRequests.length,
      totalResults: total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        requests: enrichedRequests,
      },
    })
  } catch (error) {
    console.error('Error in getPendingRequests:', error)
    next(error)
  }
}

/**
 * Get sent connection requests from a user
 */
export const getSentRequests = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 10 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const requests = await ConnectionRequest.find({
      from: userId,
      status: 'pending',
    })
      .populate('to', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })

    const total = await ConnectionRequest.countDocuments({
      from: userId,
      status: 'pending',
    })

    res.status(200).json({
      status: 'success',
      results: requests.length,
      totalResults: total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        requests: requests.map((req) => ({
          requestId: req._id,
          recipient: {
            userId: req.to._id,
            name: req.to.name,
            email: req.to.email,
          },
          sentAt: req.createdAt,
          status: req.status,
        })),
      },
    })
  } catch (error) {
    console.error('Error in getSentRequests:', error)
    next(error)
  }
}

/**
 * Accept connection request
 */
export const acceptConnectionRequest = async (req, res, next) => {
  try {
    const { userId, requestId } = req.params

    // Get the request
    const request = await ConnectionRequest.findById(requestId)
    if (!request) {
      return next(createError(404, 'Connection request not found'))
    }

    // Verify user is the recipient
    if (request.to.toString() !== userId) {
      return next(createError(403, 'You can only accept requests sent to you'))
    }

    if (request.status !== 'pending') {
      return next(
        createError(400, `Cannot accept request with status: ${request.status}`)
      )
    }

    // Update request status
    request.status = 'accepted'
    request.respondedAt = new Date()
    request.respondedBy = userId
    await request.save()

    // Create two-way connection records
    const connection = await Connection.create({
      user1: request.from,
      user2: request.to,
      status: 'active',
      connectedAt: new Date(),
    })

    // Notify sender
    const [sender, recipient] = await Promise.all([
      User.findById(request.from),
      User.findById(request.to),
    ])

    await Notification.create({
      user: request.from,
      type: 'connection_accepted',
      priority: 'normal',
      recipient: request.from,
      relatedUser: request.to,
      title: `${recipient.name} accepted your connection request`,
      message: `You're now connected with ${recipient.name}`,
      actionUrl: `/messages/conversations/${request.to}`,
      isRead: false,
    })

    res.status(200).json({
      status: 'success',
      message: 'Connection request accepted',
      data: {
        request,
        connection: connection,
      },
    })
  } catch (error) {
    console.error('Error in acceptConnectionRequest:', error)
    next(error)
  }
}

/**
 * Decline connection request
 */
export const declineConnectionRequest = async (req, res, next) => {
  try {
    const { userId, requestId } = req.params

    const request = await ConnectionRequest.findById(requestId)
    if (!request) {
      return next(createError(404, 'Connection request not found'))
    }

    // Verify user is the recipient
    if (request.to.toString() !== userId) {
      return next(createError(403, 'You can only decline requests sent to you'))
    }

    if (request.status !== 'pending') {
      return next(
        createError(
          400,
          `Cannot decline request with status: ${request.status}`
        )
      )
    }

    // Update request status
    request.status = 'rejected'
    request.respondedAt = new Date()
    request.respondedBy = userId
    await request.save()

    res.status(200).json({
      status: 'success',
      message: 'Connection request declined',
      data: { request },
    })
  } catch (error) {
    console.error('Error in declineConnectionRequest:', error)
    next(error)
  }
}

/**
 * Cancel sent connection request
 */
export const cancelConnectionRequest = async (req, res, next) => {
  try {
    const { userId, requestId } = req.params

    const request = await ConnectionRequest.findById(requestId)
    if (!request) {
      return next(createError(404, 'Connection request not found'))
    }

    // Verify user is the sender
    if (request.from.toString() !== userId) {
      return next(createError(403, 'You can only cancel requests you sent'))
    }

    if (request.status !== 'pending') {
      return next(
        createError(400, `Cannot cancel request with status: ${request.status}`)
      )
    }

    // Delete the request
    await ConnectionRequest.findByIdAndDelete(requestId)

    res.status(200).json({
      status: 'success',
      message: 'Connection request cancelled',
    })
  } catch (error) {
    console.error('Error in cancelConnectionRequest:', error)
    next(error)
  }
}

/**
 * Get connection requests summary (counts)
 */
export const getRequestsSummary = async (req, res, next) => {
  try {
    const { userId } = req.params

    const [pendingCount, sentCount, acceptedCount] = await Promise.all([
      ConnectionRequest.countDocuments({
        to: userId,
        status: 'pending',
      }),
      ConnectionRequest.countDocuments({
        from: userId,
        status: 'pending',
      }),
      Connection.countDocuments({
        $or: [{ user1: userId }, { user2: userId }],
        status: 'active',
      }),
    ])

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          pendingRequests: pendingCount,
          sentRequests: sentCount,
          acceptedConnections: acceptedCount,
        },
      },
    })
  } catch (error) {
    console.error('Error in getRequestsSummary:', error)
    next(error)
  }
}
