// File: client/src/redux/store.js
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
  createTransform,
} from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import uiReducer from './uiSlice'
import userReducer from './userSlice'

// Strip transient request flags before they hit localStorage. Without this,
// an in-flight login or profile update that gets interrupted (page refresh,
// dev hot-reload, tab close) leaves `loading: true` persisted forever — and
// the next mount picks that up so the Sign In / Save buttons render mid-spin
// before the user has done anything. We restore the same fields to safe
// defaults on rehydrate so the app starts in a clean idle state.
const TRANSIENT_USER_KEYS = ['loading', 'error']
const TRANSIENT_NETWORK_KEYS = ['loading', 'error']

const stripTransientUser = createTransform(
  // outbound — what gets written to storage
  (inboundState) => {
    if (!inboundState || typeof inboundState !== 'object') return inboundState
    const next = { ...inboundState }
    for (const k of TRANSIENT_USER_KEYS) delete next[k]
    if (next.network && typeof next.network === 'object') {
      const nextNetwork = { ...next.network }
      for (const k of TRANSIENT_NETWORK_KEYS) delete nextNetwork[k]
      next.network = nextNetwork
    }
    return next
  },
  // inbound — what gets read back on rehydrate
  (outboundState) => {
    if (!outboundState || typeof outboundState !== 'object') return outboundState
    return {
      ...outboundState,
      loading: false,
      error: null,
      network: {
        ...(outboundState.network || {}),
        loading: false,
        error: null,
      },
    }
  },
  { whitelist: ['user'] },
)

const persistConfig = {
  key: 'signil-root',
  version: 1,
  storage,
  whitelist: ['user'], // Only persist user state
  transforms: [stripTransientUser],
}

const rootReducer = combineReducers({
  user: userReducer,
  ui: uiReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)
