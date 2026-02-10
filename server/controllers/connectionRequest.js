// File: server/controllers/connectionRequest.js
import mongoose from 'mongoose'
import { createError } from '../error.js'
import { Conversation, Message } from '../models/Message.js'
import Notification from '../models/Notification.js'
import Profile from '../models/Profile.js'
import { ProfileView } from '../models/ProfileView.js'
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
      from: userId,
      to: targetUserId,
    })

    if (existingRequest) {
      existingRequest.status = 'pending'
      existingRequest.message = message || ''
      existingRequest.matchScore = await calculateMatchScore(userId, targetUserId)
      existingRequest.respondedAt = null
      existingRequest.respondedBy = null
      await existingRequest.save()

      return res.status(200).json({
        status: 'success',
        message: 'Connection request updated',
        data: {
          requestId: existingRequest._id,
        },
      })
    }

    const reversePending = await ConnectionRequest.findOne({
      from: targetUserId,
      to: userId,
      status: 'pending',
    })

    if (reversePending) {
      return next(createError(400, 'Connection request already received'))
    }

    // Calculate match score for the request
    const matchScore = await calculateMatchScore(userId, targetUserId)
 
    // Create connection request
    let request
    try {
      request = await ConnectionRequest.create({
        from: userId,
        to: targetUserId,
        status: 'pending',
        message: message || '',
        matchScore: matchScore,
      })
    } catch (err) {
      if (err?.code === 11000) {
        return next(createError(400, 'Connection request already sent'))
      }
      throw err
    }

    // If a message is provided, start a conversation and send the message
    if (message) {
      try {
        // Find or create conversation
        let conversation = await Conversation.findOne({
          $or: [
            { participant1: userId, participant2: targetUserId },
            { participant1: targetUserId, participant2: userId },
          ],
        })

        if (!conversation) {
          conversation = await Conversation.create({
            participant1: userId,
            participant2: targetUserId,
          })
        }

        // Create the initial message
        const newMessage = await Message.create({
          conversation: conversation._id,
          sender: userId,
          content: message,
          type: 'text',
        })

        // Update conversation's last message
        conversation.lastMessage = newMessage._id
        conversation.lastMessageAt = new Date()
        conversation.messageCount = (conversation.messageCount || 0) + 1
        await conversation.save()
      } catch (msgError) {
        console.error('Error creating initial message for connection request:', msgError)
        // We don't fail the whole request if message creation fails
      }
    }

    // Create notification for recipient
    await Notification.create({
      recipient: targetUserId,
      sender: userId,
      type: 'connection_request',
      priority: 'medium',
      title: `${sender.name} sent you a connection request`,
      description: message ? `"${message}"` : `${sender.name} wants to connect`,
      actionUrl: `/profile/public/${userId}`,
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
        const profile = await Profile.findOne({ user: req.from._id })
          .select('profileImage title location about certifications expertise bannerImage themeId ratings experience')

        return {
          requestId: req._id,
          sender: {
            userId: req.from._id,
            name: req.from.name,
            email: req.from.email,
          },
          from: {
            _id: req.from._id,
            name: req.from.name,
            profileImage: profile?.profileImage,
            title: profile?.title,
            location: profile?.location,
            about: profile?.aboutMe || profile?.bio,
            certifications: profile?.certifications,
            expertise: profile?.specialization || profile?.specialties,
            bannerImage: profile?.bannerImage,
            themeId: profile?.themeId,
            rating: profile?.ratings?.averageRating,
            reviewCount: profile?.ratings?.totalReviews,
            experience: profile?.experience,
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
      recipient: request.from,
      sender: request.to,
      type: 'connection_accepted',
      priority: 'medium',
      title: `${recipient.name} accepted your connection request`,
      description: `You're now connected with ${recipient.name}`,
      actionUrl: `/profile/public/${request.to}`,
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

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      pendingCount,
      sentCount,
      acceptedCount,
      profileViews,
      recentViews,
      previousViews,
      unreadMessages,
      weeklyStats,
      monthlyStats,
      yearlyStats,
      allTimeStats
    ] = await Promise.all([
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
      ProfileView.countDocuments({ profileOwner: userId }),
      ProfileView.countDocuments({
        profileOwner: userId,
        lastViewedAt: { $gte: sevenDaysAgo }
      }),
      ProfileView.countDocuments({
        profileOwner: userId,
        lastViewedAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
      }),
      Message.countDocuments({
        conversation: {
          $in: await Conversation.find({
            $or: [{ participant1: userId }, { participant2: userId }]
          }).distinct('_id')
        },
        sender: { $ne: userId },
        isRead: false
      }),
      // 1W: Daily stats for the last 7 days
      Connection.aggregate([
        {
          $match: {
            $or: [
              { user1: new mongoose.Types.ObjectId(userId) },
              { user2: new mongoose.Types.ObjectId(userId) }
            ],
            status: 'active',
            connectedAt: { $gte: sevenDaysAgo }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$connectedAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ]),
      // 1M: Weekly stats for the last 30 days
      Connection.aggregate([
        {
          $match: {
            $or: [
              { user1: new mongoose.Types.ObjectId(userId) },
              { user2: new mongoose.Types.ObjectId(userId) }
            ],
            status: 'active',
            connectedAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $isoWeek: "$connectedAt" },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ]),
      // 1Y: Monthly stats for the last year
      Connection.aggregate([
        {
          $match: {
            $or: [
              { user1: new mongoose.Types.ObjectId(userId) },
              { user2: new mongoose.Types.ObjectId(userId) }
            ],
            status: 'active',
            connectedAt: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$connectedAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ]),
      // ALL: Yearly stats
      Connection.aggregate([
        {
          $match: {
            $or: [
              { user1: new mongoose.Types.ObjectId(userId) },
              { user2: new mongoose.Types.ObjectId(userId) }
            ],
            status: 'active'
          }
        },
        {
          $group: {
            _id: { $year: "$connectedAt" },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ])
    ])

    // Format analytics data
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const analytics = {
      '1W': days.map((day, i) => {
        const date = new Date(now)
        date.setDate(now.getDate() - (6 - i))
        const dateStr = date.toISOString().split('T')[0]
        const match = weeklyStats.find(s => s._id === dateStr)
        return { day, value: match ? match.count : 0 }
      }),
      '1M': [1, 2, 3, 4].map(w => {
        // Simple mapping for 4 weeks
        const match = monthlyStats[w - 1]
        return { week: `W${w}`, value: match ? match.count : 0 }
      }),
      '1Y': months.map((month, i) => {
        const yearMonth = `${now.getFullYear()}-${(i + 1).toString().padStart(2, '0')}`
        const match = yearlyStats.find(s => s._id === yearMonth)
        return { month, value: match ? match.count : 0 }
      }),
      'ALL': allTimeStats.map(s => ({ year: s._id.toString(), value: s.count }))
    }

    // Calculate trend percentage
    let viewsTrend = '0%';
    if (previousViews > 0) {
      const trend = ((recentViews - previousViews) / previousViews) * 100;
      viewsTrend = `${trend > 0 ? '+' : ''}${Math.round(trend)}%`;
    } else if (recentViews > 0) {
      viewsTrend = '+100%';
    }

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          pendingRequests: pendingCount,
          sentRequests: sentCount,
          acceptedConnections: acceptedCount,
          profileViews: profileViews,
          viewsTrend: viewsTrend,
          unreadMessages: unreadMessages,
          analytics: analytics
        },
      },
    })
  } catch (error) {
    console.error('Error in getRequestsSummary:', error)
    next(error)
  }
}
/**
 * Get all active connections for a user
 */
export const getUserConnections = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 50 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Find connections where user is either user1 or user2
    const connections = await Connection.find({
      $or: [{ user1: userId }, { user2: userId }],
      status: 'active',
    })
      .populate('user1', 'name email userType')
      .populate('user2', 'name email userType')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ connectedAt: -1 })

    const total = await Connection.countDocuments({
      $or: [{ user1: userId }, { user2: userId }],
      status: 'active',
    })

    // Format connections to show the "other" user
    const formattedConnections = await Promise.all(
      connections.map(async (conn) => {
        const otherUser =
          conn.user1._id.toString() === userId ? conn.user2 : conn.user1
        
        // Get profile image/title for the other user
        const profile = await Profile.findOne({ user: otherUser._id }).select('profileImage title location')

        return {
          connectionId: conn._id,
          connectedUser: {
            userId: otherUser._id,
            name: otherUser.name,
            email: otherUser.email,
            userType: otherUser.userType,
            profileImage: profile?.profileImage,
            title: profile?.title,
            location: profile?.location,
          },
          connectedAt: conn.connectedAt,
        }
      })
    )

    res.status(200).json({
      status: 'success',
      results: formattedConnections.length,
      totalResults: total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        connections: formattedConnections,
      },
    })
  } catch (error) {
    console.error('Error in getUserConnections:', error)
    next(error)
  }
}

/**
 * Get public connections for a user (limited fields)
 */
export const getPublicConnections = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 50 } = req.query

    const profile = await Profile.findOne({ user: userId }).select('isPublic')
    if (!profile || !profile.isPublic) {
      return next(createError(403, 'This profile is private'))
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const connections = await Connection.find({
      $or: [{ user1: userId }, { user2: userId }],
      status: 'active',
    })
      .populate('user1', 'name userType')
      .populate('user2', 'name userType')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ connectedAt: -1 })

    const total = await Connection.countDocuments({
      $or: [{ user1: userId }, { user2: userId }],
      status: 'active',
    })

    const formattedConnections = await Promise.all(
      connections.map(async (conn) => {
        const otherUser =
          conn.user1._id.toString() === userId ? conn.user2 : conn.user1

        const profileDoc = await Profile.findOne({ user: otherUser._id }).select(
          'profileImage title location'
        )

        return {
          connectionId: conn._id,
          connectedUser: {
            userId: otherUser._id,
            name: otherUser.name,
            userType: otherUser.userType,
            profileImage: profileDoc?.profileImage,
            title: profileDoc?.title,
            location: profileDoc?.location,
          },
          connectedAt: conn.connectedAt,
        }
      })
    )

    res.status(200).json({
      status: 'success',
      results: formattedConnections.length,
      totalResults: total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        connections: formattedConnections,
      },
    })
  } catch (error) {
    console.error('Error in getPublicConnections:', error)
    next(error)
  }
}

/**
 * Remove an active connection (unfollow)
 */
export const removeConnection = async (req, res, next) => {
  try {
    const { userId, connectionId } = req.params

    const connection = await Connection.findById(connectionId)
    if (!connection) {
      return next(createError(404, 'Connection not found'))
    }

    const isParticipant =
      connection.user1.toString() === userId ||
      connection.user2.toString() === userId

    if (!isParticipant) {
      return next(createError(403, 'Not authorized to remove this connection'))
    }

    await Connection.findByIdAndDelete(connectionId)
    await ConnectionRequest.deleteMany({
      $or: [
        { from: connection.user1, to: connection.user2 },
        { from: connection.user2, to: connection.user1 },
      ],
    })

    res.status(200).json({
      status: 'success',
      message: 'Connection removed',
    })
  } catch (error) {
    console.error('Error in removeConnection:', error)
    next(error)
  }
}
