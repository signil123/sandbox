// File: client/src/App.jsx

import { Provider } from 'react-redux'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { AdminRoute, PrivateRoute, PublicRoute } from './components/Auth/ProtectedRoutes'
import ScrollToTop from './components/Common/ScrollToTop'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AuthPage from './pages/Auth/AuthPage'
import CalendarPage from './pages/Calendar/CalendarPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import ExplorePage from './pages/Explore/ExplorePage'
import MessagePage from './pages/Message/MessagePage'
import NewsPage from './pages/News/NewsPage'
import AdvisorProfilePage from './pages/Profile/AdvisorProfilePage'
import ProfilePage from './pages/Profile/ProfilePage'
import PublicProfilePage from './pages/Profile/PublicProfilePage'
import { persistor, store } from './redux/store'

import SettingsPage from './pages/Settings/SettingsPage'

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <ScrollToTop />
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
                  <PublicRoute>
                    <AuthPage />
                  </PublicRoute>
                }
              />
              <Route
                path='/auth'
                element={
                  <PublicRoute>
                    <AuthPage />
                  </PublicRoute>
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
                path='/profile/athlete'
                element={
                  <PrivateRoute>
                    <ProfilePage />
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
            </Route>
          </Routes>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  )
}
export default App
