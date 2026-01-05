// File: client/src/redux/userSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { authService } from '../services/authService'
import { connectionService } from '../services/connectionService'
import { messageService } from '../services/messageService'

const initialState = {
  currentUser: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  notifications: [],
  unreadCount: 0, // Notification unread count
  unreadMessagesCount: 0, // Message unread count
  activeConversationId: null,
  network: {
    advisors: [],
    roster: [],
    loading: false,
    error: null
  }
}

// Async thunks
export const signupUser = createAsyncThunk(
  'user/signup',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.signup(userData)
      return response.data.user
    } catch (error) {
      return rejectWithValue(error || 'Signup failed')
    }
  }
)

export const loginUser = createAsyncThunk(
  'user/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.login(email, password)
      return response.data.user
    } catch (error) {
      return rejectWithValue(error || 'Login failed')
    }
  }
)

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(profileData)
      return response.data.user
    } catch (error) {
      return rejectWithValue(error || 'Failed to update profile')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'user/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout()
      return null
    } catch (error) {
      console.error('Logout error:', error)
      return null
    }
  }
)

export const fetchUserNetwork = createAsyncThunk(
  'user/fetchNetwork',
  async ({ userId, userType }, { rejectWithValue }) => {
    try {
      const response = userType === 'athlete' 
        ? await connectionService.getAthletesAdvisors(userId)
        : await connectionService.getAdvisorsRoster(userId)
      
      return { 
        data: userType === 'athlete' ? response.data.data.advisors : response.data.data.roster,
        userType
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch network')
    }
  }
)

export const fetchUnreadMessages = createAsyncThunk(
  'user/fetchUnreadMessages',
  async (_, { rejectWithValue }) => {
    try {
      const response = await messageService.getConversations()
      if (response.data.status === 'success') {
        const conversations = response.data.data.conversations
        // Sum all unread counts from conversations
        const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
        return totalUnread
      }
      return 0
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread messages')
    }
  }
)

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload
      state.isAuthenticated = true
      state.error = null
    },
    clearUser: (state) => {
      state.currentUser = null
      state.isAuthenticated = false
    },
    clearError: (state) => {
      state.error = null
    },
    updateProfileImage: (state, action) => {
      if (state.currentUser) {
        state.currentUser.profileImage = action.payload
      }
    },
    setNotifications: (state, action) => {
      state.notifications = action.payload
      state.unreadCount = action.payload.filter((n) => !n.isRead).length
    },
    markNotificationRead: (state, action) => {
      const notificationId = action.payload
      state.notifications = state.notifications.map((n) =>
        n._id === notificationId ? { ...n, isRead: true } : n
      )
      state.unreadCount = state.notifications.filter((n) => !n.isRead).length
    },
    clearNotifications: (state) => {
      state.notifications = []
      state.unreadCount = 0
    },
    setActiveConversationId: (state, action) => {
        state.activeConversationId = action.payload
    },
    incrementUnreadMessagesCount: (state) => {
        state.unreadMessagesCount += 1
    }
  },
  extraReducers: (builder) => {
    // Signup
    builder
      .addCase(signupUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false
        state.currentUser = action.payload
        state.isAuthenticated = true
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.currentUser = action.payload
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.isAuthenticated = false
      })

    // Update Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false
        state.currentUser = action.payload
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.currentUser = null
      state.isAuthenticated = false
      state.error = null
      state.network = {
        advisors: [],
        roster: [],
        loading: false,
        error: null
      }
      state.unreadMessagesCount = 0
      state.activeConversationId = null
    })

    // Fetch Network
    builder
      .addCase(fetchUserNetwork.pending, (state) => {
        state.network.loading = true
        state.network.error = null
      })
      .addCase(fetchUserNetwork.fulfilled, (state, action) => {
        state.network.loading = false
        if (action.payload.userType === 'athlete') {
          state.network.advisors = action.payload.data
        } else {
          state.network.roster = action.payload.data
        }
      })
      .addCase(fetchUserNetwork.rejected, (state, action) => {
        state.network.loading = false
        state.network.error = action.payload
      })

    // Fetch Unread Messages
    builder.addCase(fetchUnreadMessages.fulfilled, (state, action) => {
        state.unreadMessagesCount = action.payload
    })
  },
})

// Export actions
export const {
  setUser,
  clearUser,
  clearError,
  updateProfileImage,
  setNotifications,
  markNotificationRead,
  clearNotifications,
  setActiveConversationId,
  incrementUnreadMessagesCount
} = userSlice.actions

// Selectors
export const selectCurrentUser = (state) => state.user.currentUser
export const selectIsAuthenticated = (state) => state.user.isAuthenticated
export const selectUserLoading = (state) => state.user.loading
export const selectUserError = (state) => state.user.error
export const selectUserRole = (state) => state.user.currentUser?.role
export const selectUserType = (state) => state.user.currentUser?.userType
export const selectNotifications = (state) => state.user.notifications
export const selectUnreadCount = (state) => state.user.unreadCount
export const selectUnreadMessagesCount = (state) => state.user.unreadMessagesCount
export const selectActiveConversationId = (state) => state.user.activeConversationId

// Helper selectors
export const selectIsAdmin = (state) => state.user.currentUser?.role === 'admin'
export const selectIsAthlete = (state) =>
  state.user.currentUser?.userType === 'athlete'
export const selectIsAdvisor = (state) =>
  state.user.currentUser?.userType === 'advisor'
export const selectIsAgent = (state) =>
  state.user.currentUser?.userType === 'agent'

export default userSlice.reducer
