// File: client/src/pages/Auth/AuthPage.jsx
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Mail,
  Phone,
  Shield,
  Target,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  clearError,
  loginUser,
  selectCurrentUser,
  selectUserError,
  selectUserLoading,
  signupUser,
  updateUserProfile,
} from '../../redux/userSlice'
import {
  ErrorAlert,
  FormInput,
  LoadingSpinner,
  PasswordInput,
  PrimaryButton,
  QuestionField,
  RoleSelector,
} from './SignupFormComponents'
import {
  advisorAgentQuestions,
  athleteQuestions,
  getStepNumber,
} from './authConstants'
import {
  getButtonText,
  getLoadingMessage,
  validateEmail,
  validatePassword,
  validatePhone,
  validateQuestions,
} from './authUtils'

export default function AuthPage({
  isOpen = true,
  onClose = () => {},
  onSignupComplete,
}) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const completionLoading = useSelector(selectUserLoading)
  const reduxError = useSelector(selectUserError)
  const currentUser = useSelector(selectCurrentUser)

  const [step, setStep] = useState('method')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: null,
    gender: null,
    language: null,
    communicationPreference: [],
    dateOfBirth: '',
    school: '',
    sport: null,
    nilNeeds: [],
    specialties: [],
    experience: null,
  })
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Auto-proceed to complete if profile is already complete after login
  useEffect(() => {
    if (
      step === 'role' &&
      currentUser?.isProfileComplete &&
      currentUser?.userType
    ) {
      setFormData((prev) => ({
        ...prev,
        role: currentUser.userType,
      }))
      // Skip complete screen and go to dashboard
      onSignupComplete?.()
      onClose()
      navigate('/dashboard')
    }
  }, [step, currentUser?.isProfileComplete, currentUser?.userType, navigate])

  const handleNext = async () => {
    let newErrors = {}

    if (step === 'email-form') {
      if (!formData.firstName.trim())
        newErrors.firstName = 'First name required'
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name required'
      if (!validateEmail(formData.email)) newErrors.email = 'Invalid email'
      if (formData.role === 'athlete' && !formData.email.endsWith('.edu'))
        newErrors.email = 'Use .edu email for athletes'
      if (!validatePassword(formData.password))
        newErrors.password = 'Password too weak'
      if (formData.phone && !validatePhone(formData.phone))
        newErrors.phone = 'Invalid phone'
      if (!formData.role) newErrors.role = 'Select a role'

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      try {
        const signupData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          userType: formData.role,
        }

        const result = await dispatch(signupUser(signupData))
        if (result.payload) {
          setStep('verify')
        } else {
          newErrors.email = result.payload || 'Signup failed'
          setErrors(newErrors)
        }
      } catch (error) {
        newErrors.email = error.message || 'Signup failed'
        setErrors(newErrors)
      }
      return
    }

    if (step === 'login-form') {
      if (!validateEmail(loginForm.email)) newErrors.email = 'Invalid email'
      if (!loginForm.password) newErrors.password = 'Password required'

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      try {
        const result = await dispatch(
          loginUser({
            email: loginForm.email,
            password: loginForm.password,
          })
        )
        // Check if login was successful
        if (result.payload && result.payload.userType) {
          // Auto-populate role from login response
          setFormData((prev) => ({
            ...prev,
            role: result.payload.userType,
          }))
          setStep('role')
        } else {
          // Login failed
          newErrors.email =
            result.payload?.message || 'Invalid email or password'
          setErrors(newErrors)
        }
      } catch (error) {
        newErrors.email = error.message || 'Invalid email or password'
        setErrors(newErrors)
      }
      return
    }

    if (step === 'verify') {
      if (!verificationCode.trim()) {
        setVerificationError('Code required')
        return
      }

      try {
        // Simulate verification
        await new Promise((resolve) => setTimeout(resolve, 1200))
        setStep('welcome')
      } catch (error) {
        setVerificationError(error.message || 'Verification failed')
      }
      return
    }

    if (step === 'role') {
      if (!formData.role) {
        newErrors.role = 'Select a role'
        setErrors(newErrors)
        return
      }
      // Check if profile is already complete (from login)
      if (currentUser?.isProfileComplete) {
        setStep('complete')
      } else {
        setStep('welcome')
      }
      return
    }

    if (step === 'welcome') {
      setStep('questions')
      return
    }

    if (step === 'questions') {
      const questions =
        formData.role === 'athlete' ? athleteQuestions : advisorAgentQuestions
      newErrors = validateQuestions(questions, formData)

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      try {
        const profileData = {
          userType: formData.role,
          gender: formData.gender,
          language: formData.language,
          communicationPreference: formData.communicationPreference,
        }

        if (formData.role === 'athlete') {
          profileData.dateOfBirth = formData.dateOfBirth
          profileData.school = formData.school
          profileData.sport = formData.sport
          profileData.nilNeeds = formData.nilNeeds
        }

        if (formData.role === 'advisor' || formData.role === 'agent') {
          profileData.specialties = formData.specialties
          profileData.experience = formData.experience
        }

        const result = await dispatch(updateUserProfile(profileData))
        if (result.payload) {
          setStep('complete')
        } else {
          newErrors.form = result.payload || 'Failed to save profile'
          setErrors(newErrors)
        }
      } catch (error) {
        newErrors.form = error.message || 'Failed to save profile'
        setErrors(newErrors)
      }
      return
    }

    if (step === 'method') {
      setStep('email-form')
    }
  }

  const handleBack = () => {
    const steps = [
      'method',
      'email-form',
      'login-form',
      'verify',
      'role',
      'welcome',
      'questions',
      'complete',
    ]
    const currentIdx = steps.indexOf(step)
    if (currentIdx > 0) {
      setStep(steps[currentIdx - 1])
      setErrors({})
      setVerificationError('')
      dispatch(clearError())
    }
  }

  const handleCompleteSignup = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      role: null,
      gender: null,
      language: null,
      communicationPreference: [],
      dateOfBirth: '',
      school: '',
      sport: null,
      nilNeeds: [],
      specialties: [],
      experience: null,
    })
    setLoginForm({ email: '', password: '' })
    onSignupComplete?.()
    onClose()
    navigate('/dashboard')
  }

  if (!isOpen) return null

  const featureIcons = [Zap, Shield, Users, Target]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4'
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className='bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex overflow-hidden'
        >
          {/* Left Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className='hidden lg:flex flex-col justify-between items-center relative overflow-hidden flex-1'
            style={{
              backgroundImage: 'url("/authbg.png")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className='absolute inset-0 bg-gradient-to-b from-[#163146]/40 via-[#986a41]/50 to-[#0f2229]/70' />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className='relative z-10 text-white text-center px-8 pt-16 w-full'
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
                className='w-2 h-2 bg-white rounded-full mx-auto mb-6'
              />

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className='text-5xl font-serif font-bold mb-5 leading-tight'
              >
                Build Your
                <br />
                Success Story
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className='text-xl text-white/85 mb-2'
              >
                Connect with the right people
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className='text-base text-white/75 max-w-md mx-auto'
              >
                Whether you're an athlete seeking opportunities or an advisor
                building your network, this is where it begins.
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className='relative z-10 w-full px-8 space-y-4'
            >
              {[
                { text: 'Fast & Easy Setup' },
                { text: 'Secure & Verified' },
                { text: 'Smart Matching' },
              ].map((feature, idx) => {
                const IconComponent = featureIcons[idx % featureIcons.length]
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + idx * 0.1 }}
                    className='flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20 hover:bg-white/15 transition-all'
                  >
                    <IconComponent size={20} className='text-white' />
                    <span className='text-white font-medium text-sm'>
                      {feature.text}
                    </span>
                  </motion.div>
                )
              })}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className='relative z-10 pb-12 text-white/50'
            >
              <span className='text-sm font-medium'>Start your journey</span>
            </motion.div>

            <motion.div
              className='absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl'
              animate={{
                x: [0, 40, 0],
                y: [0, 30, 0],
              }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className='absolute top-1/3 right-0 w-80 h-80 bg-white/3 rounded-full blur-3xl'
              animate={{
                x: [0, -50, 0],
                y: [0, -30, 0],
              }}
              transition={{ duration: 10, repeat: Infinity }}
            />
          </motion.div>

          {/* Right Section */}
          <div className='flex-1 flex flex-col w-full overflow-hidden'>
            {/* Header */}
            <div className='px-6 py-3 border-b border-gray-100 bg-white flex items-center justify-between flex-shrink-0'>
              <div className='flex-1'>
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{
                    opacity: 1,
                    width: `${(getStepNumber(step) / 8) * 100}%`,
                  }}
                  transition={{ duration: 0.5 }}
                  className='h-1 bg-gradient-to-r from-[#163146] to-[#0f2229] rounded-full'
                />
              </div>
              <button
                onClick={onClose}
                className='ml-4 p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-600'
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className='flex-1 overflow-y-auto px-6 py-4'>
              {completionLoading && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 rounded-lg border border-blue-200 mb-3'
                >
                  <LoadingSpinner />
                  <span className='text-xs text-gray-600 font-medium'>
                    {getLoadingMessage(step)}
                  </span>
                </motion.div>
              )}

              {reduxError && step !== 'login-form' && (
                <ErrorAlert
                  message={
                    typeof reduxError === 'string'
                      ? reduxError
                      : 'An error occurred'
                  }
                />
              )}

              <AnimatePresence mode='wait'>
                {/* Method */}
                {step === 'method' && (
                  <motion.div
                    key='method'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='space-y-3'
                  >
                    <div className='text-center'>
                      <h2 className='text-2xl font-serif font-bold text-gray-900'>
                        Get Started
                      </h2>
                      <p className='text-sm text-gray-600 mt-0.5'>
                        Choose how you want to join
                      </p>
                    </div>
                    <div className='space-y-2 pt-3'>
                      <button
                        onClick={() => setStep('email-form')}
                        className='w-full p-3 border-2 border-gray-200 hover:border-[#163146] rounded-lg transition-all text-left'
                      >
                        <p className='font-semibold text-sm text-gray-900'>
                          Create New Account
                        </p>
                        <p className='text-xs text-gray-600'>
                          Sign up with email
                        </p>
                      </button>
                      <button
                        onClick={() => setStep('login-form')}
                        className='w-full p-3 border-2 border-gray-200 hover:border-[#163146] rounded-lg transition-all text-left'
                      >
                        <p className='font-semibold text-sm text-gray-900'>
                          Sign In
                        </p>
                        <p className='text-xs text-gray-600'>
                          Already have an account?
                        </p>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Email Form */}
                {step === 'email-form' && (
                  <motion.div
                    key='email-form'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='space-y-3'
                  >
                    <div className='text-center'>
                      <h2 className='text-2xl font-serif font-bold text-gray-900'>
                        Create Account
                      </h2>
                    </div>
                    <div className='space-y-2.5'>
                      <RoleSelector
                        selectedRole={formData.role}
                        onSelect={(role) =>
                          setFormData((p) => ({ ...p, role }))
                        }
                        error={errors.role}
                      />
                      <div className='grid grid-cols-2 gap-2'>
                        <FormInput
                          label='First Name'
                          value={formData.firstName}
                          onChange={(value) =>
                            setFormData((p) => ({ ...p, firstName: value }))
                          }
                          placeholder='John'
                          error={errors.firstName}
                          required
                        />
                        <FormInput
                          label='Last Name'
                          value={formData.lastName}
                          onChange={(value) =>
                            setFormData((p) => ({ ...p, lastName: value }))
                          }
                          placeholder='Doe'
                          error={errors.lastName}
                          required
                        />
                      </div>
                      <FormInput
                        label='Email'
                        value={formData.email}
                        onChange={(value) =>
                          setFormData((p) => ({ ...p, email: value }))
                        }
                        type='email'
                        placeholder={
                          formData.role === 'athlete'
                            ? 'name@university.edu'
                            : 'you@example.com'
                        }
                        error={errors.email}
                        required
                        icon={<Mail size={16} />}
                      />
                      <FormInput
                        label='Phone'
                        value={formData.phone}
                        onChange={(value) =>
                          setFormData((p) => ({ ...p, phone: value }))
                        }
                        type='tel'
                        placeholder='+1 (555) 123-4567'
                        error={errors.phone}
                        icon={<Phone size={16} />}
                      />
                      <PasswordInput
                        label='Password'
                        value={formData.password}
                        onChange={(value) =>
                          setFormData((p) => ({ ...p, password: value }))
                        }
                        error={errors.password}
                        showStrength={true}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Login Form */}
                {step === 'login-form' && (
                  <motion.div
                    key='login-form'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='space-y-3'
                  >
                    <div className='text-center'>
                      <h2 className='text-2xl font-serif font-bold text-gray-900'>
                        Welcome Back
                      </h2>
                    </div>
                    {errors.email && <ErrorAlert message={errors.email} />}
                    <div className='space-y-2.5'>
                      <FormInput
                        label='Email'
                        value={loginForm.email}
                        onChange={(value) =>
                          setLoginForm((p) => ({ ...p, email: value }))
                        }
                        type='email'
                        placeholder='you@example.com'
                        required
                        icon={<Mail size={16} />}
                      />
                      <PasswordInput
                        label='Password'
                        value={loginForm.password}
                        onChange={(value) =>
                          setLoginForm((p) => ({ ...p, password: value }))
                        }
                        showStrength={false}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !completionLoading) {
                            e.preventDefault()
                            handleNext()
                          }
                        }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Verify */}
                {step === 'verify' && (
                  <motion.div
                    key='verify'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='flex flex-col items-center justify-center space-y-4 py-6'
                  >
                    <div className='w-16 h-16 bg-gradient-to-br from-[#163146] to-[#0f2229] rounded-full flex items-center justify-center'>
                      <Mail size={32} className='text-white' />
                    </div>
                    <div className='text-center space-y-1'>
                      <h2 className='text-xl font-serif font-bold text-gray-900'>
                        Check Your Email
                      </h2>
                      <p className='text-xs text-gray-600'>
                        We sent a code to {formData.email}
                      </p>
                    </div>
                    <div className='w-full max-w-xs space-y-2'>
                      <input
                        type='text'
                        value={verificationCode}
                        onChange={(e) =>
                          setVerificationCode(
                            e.target.value.replace(/\D/g, '').slice(0, 6)
                          )
                        }
                        placeholder='000000'
                        maxLength={6}
                        className={`w-full px-4 py-2.5 text-center text-2xl font-semibold tracking-widest border rounded-lg focus:outline-none transition-all ${
                          verificationError
                            ? 'border-red-300 focus:ring-1 focus:ring-red-200 bg-red-50'
                            : 'border-gray-200 focus:ring-1 focus:ring-[#163146]/20 focus:border-[#163146]'
                        }`}
                      />
                      {verificationError && (
                        <ErrorAlert message={verificationError} />
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Role */}
                {step === 'role' && (
                  <motion.div
                    key='role'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='space-y-3'
                  >
                    <div className='text-center'>
                      <h2 className='text-2xl font-serif font-bold text-gray-900'>
                        Choose Your Role
                      </h2>
                    </div>
                    <div className='space-y-2'>
                      {[
                        {
                          role: 'athlete',
                          title: 'Athlete',
                          desc: 'Find NIL opportunities',
                        },
                        {
                          role: 'agent',
                          title: 'Agent',
                          desc: 'Manage careers',
                        },
                        {
                          role: 'advisor',
                          title: 'Advisor',
                          desc: 'Provide consultation',
                        },
                        {
                          role: 'admin',
                          title: 'Admin',
                          desc: 'Manage platform',
                        },
                      ].map((opt) => (
                        <button
                          key={opt.role}
                          onClick={() =>
                            setFormData((p) => ({ ...p, role: opt.role }))
                          }
                          className={`w-full p-3 border-2 rounded-lg transition-all text-left ${
                            formData.role === opt.role
                              ? 'border-[#163146] bg-[#163146]/5'
                              : 'border-gray-200 hover:border-[#163146]'
                          }`}
                        >
                          <p className='font-semibold text-sm text-gray-900'>
                            {opt.title}
                          </p>
                          <p className='text-xs text-gray-600'>{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Welcome */}
                {step === 'welcome' && (
                  <motion.div
                    key='welcome'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='text-center space-y-4 py-6 flex flex-col justify-center'
                  >
                    <div className='w-16 h-16 bg-gradient-to-br from-[#163146] to-[#0f2229] rounded-full flex items-center justify-center mx-auto'>
                      <Check size={32} className='text-white' />
                    </div>
                    <div>
                      <h3 className='text-xl font-serif font-bold text-gray-900'>
                        Welcome!
                      </h3>
                      <p className='text-xs text-gray-600'>
                        Complete your profile
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Questions */}
                {step === 'questions' && (
                  <motion.div
                    key='questions'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='space-y-3'
                  >
                    <div className='text-center'>
                      <h2 className='text-2xl font-serif font-bold text-gray-900'>
                        Complete Profile
                      </h2>
                    </div>
                    <div className='space-y-2.5'>
                      {(formData.role === 'athlete'
                        ? athleteQuestions
                        : advisorAgentQuestions
                      ).map((question) => (
                        <QuestionField
                          key={question.id}
                          question={question}
                          value={formData[question.id]}
                          onChange={(value) =>
                            setFormData((p) => ({ ...p, [question.id]: value }))
                          }
                          error={errors[question.id]}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Complete */}
                {step === 'complete' && (
                  <motion.div
                    key='complete'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='text-center space-y-4 py-6 flex flex-col justify-center'
                  >
                    <div className='w-16 h-16 bg-gradient-to-br from-[#163146] to-[#0f2229] rounded-full flex items-center justify-center mx-auto'>
                      <Check size={32} className='text-white' />
                    </div>
                    <div>
                      <h3 className='text-xl font-serif font-bold text-gray-900'>
                        All Set!
                      </h3>
                      <p className='text-xs text-gray-600'>
                        Ready to explore opportunities
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className='px-6 py-3 border-t border-gray-100 bg-gray-50 flex gap-2 items-center justify-between flex-shrink-0'>
              <div className='flex-1'>
                {step !== 'method' && step !== 'complete' && (
                  <button
                    onClick={handleBack}
                    disabled={completionLoading}
                    className='text-xs font-medium text-gray-600 hover:text-[#163146] py-1 px-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50'
                  >
                    Back
                  </button>
                )}
              </div>
              {step !== 'complete' && step !== 'method' && (
                <button
                  onClick={handleNext}
                  disabled={
                    completionLoading ||
                    (step === 'verify' &&
                      (!verificationCode || verificationCode.length < 6))
                  }
                  className='ml-auto px-4 py-2 bg-gradient-to-r from-[#163146] to-[#0f2229] text-white rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-[#163146]/20 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-1.5'
                >
                  {completionLoading && <LoadingSpinner />}
                  <span>{getButtonText(step)}</span>
                  {!completionLoading && <ArrowRight size={14} />}
                </button>
              )}
              {step === 'complete' && (
                <PrimaryButton
                  onClick={handleCompleteSignup}
                  className='ml-auto'
                >
                  Go to Dashboard
                </PrimaryButton>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
