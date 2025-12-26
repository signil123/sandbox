// File: client/src/components/Auth/ProtectedRoutes.jsx

import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { selectCurrentUser } from '../../redux/userSlice'

// Route for authenticated users only
export const PrivateRoute = ({ children }) => {
  const currentUser = useSelector(selectCurrentUser)

  if (!currentUser) {
    return <Navigate to='/auth' replace />
  }

  return children
}

// Route for unauthenticated users only
export const PublicRoute = ({ children }) => {
  const currentUser = useSelector(selectCurrentUser)

  if (currentUser) {
    return <Navigate to='/dashboard' replace />
  }

  return children
}
