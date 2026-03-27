import { CheckCircle2, KeyRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../../services/authService'
import { ErrorAlert, PasswordInput, PrimaryButton } from './SignupFormComponents'
import { validatePassword } from './authUtils'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!token) {
      setError('This reset link is invalid. Request a new one.')
      return
    }

    if (!validatePassword(password)) {
      setError(
        'Password must contain 8+ characters, uppercase, lowercase, number, and special character.'
      )
      return
    }

    if (password !== confirmPassword) {
      setError('Password and confirm password do not match.')
      return
    }

    try {
      setLoading(true)
      setError('')
      await authService.resetPassword(token, password, confirmPassword)
      setDone(true)
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Unable to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#f6f7f9] to-[#eceff4] flex items-center justify-center p-4'>
      <div className='w-full max-w-md bg-white border border-gray-200 rounded-3xl shadow-xl p-8 space-y-6'>
        <div className='text-center space-y-3'>
          <div className='mx-auto w-14 h-14 rounded-2xl bg-[#163146]/10 flex items-center justify-center'>
            {done ? (
              <CheckCircle2 className='text-green-600' size={28} />
            ) : (
              <KeyRound className='text-[#163146]' size={28} />
            )}
          </div>
          <h1 className='text-3xl font-serif font-bold text-gray-900'>
            {done ? 'Password Reset Complete' : 'Set New Password'}
          </h1>
          <p className='text-sm text-gray-500'>
            {done
              ? 'You are being signed in and redirected.'
              : 'Choose a strong new password for your Signil account.'}
          </p>
        </div>

        {!done && (
          <form onSubmit={handleSubmit} className='space-y-4'>
            {error && <ErrorAlert message={error} />}

            <PasswordInput
              label='New Password'
              value={password}
              onChange={setPassword}
              showStrength={true}
            />

            <PasswordInput
              label='Confirm Password'
              value={confirmPassword}
              onChange={setConfirmPassword}
              showStrength={false}
            />

            <PrimaryButton onClick={handleSubmit} loading={loading}>
              Update Password
            </PrimaryButton>
          </form>
        )}

        <div className='text-center'>
          <Link to='/' className='text-sm text-[#986a41] hover:underline font-medium'>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
