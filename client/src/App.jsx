// File: client/src/App.jsx

import { MotionConfig } from 'framer-motion'
import { Provider } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { AdminRoute, PrivateRoute, PublicLandingRoute } from './components/Auth/ProtectedRoutes'
import ScrollToTop from './components/Common/ScrollToTop'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdvisorsPage from './pages/Advisors/AdvisorsPage'
import AthletesPage from './pages/Athletes/AthletesPage'
import AuthPage from './pages/Auth/AuthPage'
import ResetPasswordPage from './pages/Auth/ResetPasswordPage'
import CalendarPage from './pages/Calendar/CalendarPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import ExplorePage from './pages/Explore/ExplorePage'
import HomePage from './pages/Home/HomePage'
import MessagePage from './pages/Message/MessagePage'
import NewsPage from './pages/News/NewsPage'
import ScoutPage from './pages/Scout/ScoutPage'
import AdvisorProfilePage from './pages/Profile/AdvisorProfilePage'
import AthleteProfilePage from './pages/Profile/AthleteProfilePage'
import PublicProfilePage from './pages/Profile/PublicProfilePage'
import { persistor, store } from './redux/store'

import { useDispatch, useSelector } from 'react-redux'
import SettingsPage from './pages/Settings/SettingsPage'
import { closeAuthModal, selectAuthModalInitialStep, selectIsAuthModalOpen } from './redux/uiSlice'
import { selectCurrentUser } from './redux/userSlice'

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  )
}

const AppContent = () => {
  const dispatch = useDispatch()
  const isAuthModalOpen = useSelector(selectIsAuthModalOpen)
  const authModalInitialStep = useSelector(selectAuthModalInitialStep)
  const currentUser = useSelector(selectCurrentUser)

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthPage
        isOpen={isAuthModalOpen}
        initialStep={authModalInitialStep}
        onClose={() => dispatch(closeAuthModal())}
      />
      <MotionConfig transition={{ duration: 0 }}>
      <Routes>
            <Route path='/'>
              {/* ... existing routes ... */}
              <Route
                path='/settings'
                element={
                  <PrivateRoute>
                    <SettingsPage />
                  </PrivateRoute>
                }
              />
              <Route
                index
                element={
                  currentUser
                    ? <Navigate to={currentUser.role === 'admin' ? '/admin' : '/dashboard'} replace />
                    : <HomePage />
                }
              />
              <Route
                path='/advisor'
                element={<Navigate to='/advisors' replace />}
              />
              <Route
                path='/athlete'
                element={<Navigate to='/athletes' replace />}
              />
              <Route
                path='/advisors'
                element={
                  <PublicLandingRoute>
                    <AdvisorsPage />
                  </PublicLandingRoute>
                }
              />
              <Route
                path='/athletes'
                element={
                  <PublicLandingRoute>
                    <AthletesPage />
                  </PublicLandingRoute>
                }
              />
              <Route
                path='/dashboard'
                element={
                  <PrivateRoute>
                    <DashboardPage />
                  </PrivateRoute>
                }
              />
              <Route
                path='/admin'
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path='/explore'
                element={
                  <PrivateRoute>
                    <ExplorePage />
                  </PrivateRoute>
                }
              />
              <Route
                path='/inbox'
                element={
                  <PrivateRoute>
                    <MessagePage />
                  </PrivateRoute>
                }
              />
              <Route
                path='/calendar'
                element={
                  <PrivateRoute>
                    <CalendarPage />
                  </PrivateRoute>
                }
              />
              <Route
                path='/news'
                element={
                  <PrivateRoute>
                    <NewsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path='/scout'
                element={
                  <PrivateRoute>
                    <ScoutPage />
                  </PrivateRoute>
                }
              />
              <Route
                path='/profile/athlete'
                element={
                  <PrivateRoute>
                    <AthleteProfilePage />
                  </PrivateRoute>
                }
              />
              <Route
                path='/profile/advisor'
                element={
                  <PrivateRoute>
                    <AdvisorProfilePage type='advisor' />
                  </PrivateRoute>
                }
              />
              <Route
                path='/profile/agent'
                element={
                  <PrivateRoute>
                    <AdvisorProfilePage type='agent' />
                  </PrivateRoute>
                }
              />
              <Route
                path='/profile/public/:id'
                element={
                  <PrivateRoute>
                    <PublicProfilePage />
                  </PrivateRoute>
                }
              />
              <Route path='/reset-password' element={<ResetPasswordPage />} />
            </Route>
          </Routes>
      </MotionConfig>
    </BrowserRouter>
  )
}

export default App
