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
} from '../../redux/userSlice'
import {
    ErrorAlert,
    FormInput,
    LoadingSpinner,
    PasswordInput,
    PrimaryButton,
    RoleSelector,
} from './SignupFormComponents'
import {
    getButtonText,
    validateEmail,
    validatePassword,
    validatePhone,
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
  })
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
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
        if (signupUser.fulfilled.match(result)) {
          onSignupComplete?.()
          onClose()
          navigate('/dashboard')
        } else {
          // Error is handled by reduxError selector
        }
      } catch (error) {
        console.error('Signup error:', error)
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
        if (loginUser.fulfilled.match(result)) {
          onSignupComplete?.()
          onClose()
          navigate('/dashboard')
        } else {
          // Error is handled by reduxError selector
        }
      } catch (error) {
        console.error('Login error:', error)
      }
      return
    }

    if (step === 'method') {
      setStep('email-form')
    }
  }

  const handleBack = () => {
    if (step === 'email-form' || step === 'login-form') {
      setStep('method')
      setErrors({})
      dispatch(clearError())
    }
  }

  if (!isOpen) return null

  const featureIcons = [Zap, Shield, Users, Target]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4'
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className='bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl h-[min(800px,90vh)] flex overflow-hidden border border-white/20'
        >
          {/* Left Section - Decorative & Branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className='hidden lg:flex flex-col justify-between items-center relative overflow-hidden flex-1'
          >
            <div 
              className='absolute inset-0 z-0'
              style={{
                backgroundImage: 'url("/authbg.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className='absolute inset-0 bg-gradient-to-br from-[#163146]/60 via-[#986a41]/50 to-[#0f2229]/80 z-[1]' />
            
            {/* Animated background highlights */}
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3] 
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#986a41]/30 rounded-full blur-[100px] z-[2]"
            />

            <div className='relative z-10 text-white text-center px-12 pt-16 w-full'>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className='w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl mx-auto mb-8 flex items-center justify-center border border-white/30'
              >
                 <Zap size={24} className="text-white fill-white" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className='text-5xl font-serif font-bold mb-6 leading-[1.1]'
              >
                Build Your<br />Success Story
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className='text-xl text-white/90 font-light mb-8'
              >
                Connect with the right people at the right time.
              </motion.p>
            </div>

            <div className='relative z-10 w-full px-12 space-y-4 mb-auto'>
              {[
                { text: 'Instant Access', icon: Zap },
                { text: 'Verified Profiles', icon: Shield },
                { text: 'Smart Connections', icon: Target },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className='flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10 hover:bg-white/10 transition-all group pointer-events-none'
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <feature.icon size={20} className='text-white' />
                  </div>
                  <span className='text-white font-medium text-lg'>
                    {feature.text}
                  </span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className='relative z-10 pb-12'
            >
              <div className="px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/70 text-sm font-medium">
                Start your journey today
              </div>
            </motion.div>
          </motion.div>

          {/* Right Section - Form */}
          <div className='flex-[1.2] flex flex-col w-full overflow-hidden bg-gray-50/50'>
            {/* Header */}
            <div className='px-8 py-6 flex items-center justify-between flex-shrink-0'>
              <div className='flex items-center gap-4'>
                 {step !== 'method' && (
                    <button
                      onClick={handleBack}
                      className='p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-900 group'
                    >
                      <motion.div
                        whileHover={{ x: -2 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                         <ArrowRight className="rotate-180" size={20} />
                      </motion.div>
                    </button>
                 )}
                 <div>
                    <h2 className="text-sm font-medium text-gray-400 tracking-wider uppercase">
                      Portal Access
                    </h2>
                 </div>
              </div>
              <button
                onClick={onClose}
                className='p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all text-gray-400'
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Form Content */}
            <div className='flex-1 overflow-y-auto px-8 lg:px-12 pb-8'>
              <AnimatePresence mode='wait'>
                {step === 'method' && (
                  <motion.div
                    key='method'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className='h-full flex flex-col justify-center max-w-lg mx-auto space-y-8 lg:space-y-12'
                  >
                    <div className="space-y-2 lg:space-y-3 text-center lg:text-left px-4">
                      <motion.h3 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='text-3xl lg:text-5xl font-serif font-bold text-gray-900 leading-tight'
                      >
                        Welcome to Signil
                      </motion.h3>
                      <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className='text-gray-500 text-base lg:text-lg max-w-sm mx-auto lg:mx-0'
                      >
                        Elevate your journey with secure, premium access.
                      </motion.p>
                    </div>

                    <div className='flex flex-col gap-4 lg:gap-5 px-4'>
                      {[
                        { 
                          id: 'email-form', 
                          title: 'Get Started', 
                          desc: 'Create your account in seconds', 
                          icon: Zap, 
                          color: '#163146' 
                        },
                        { 
                          id: 'login-form', 
                          title: 'Sign In', 
                          desc: 'Already have an account?', 
                          icon: Users, 
                          color: '#986a41' 
                        }
                      ].map((item, i) => (
                        <motion.button
                          key={item.id}
                          whileHover={{ scale: 1.01, backgroundColor: '#f9fafb' }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setStep(item.id)}
                          className='flex items-center gap-4 lg:gap-6 p-4 lg:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-left group relative overflow-hidden'
                          style={{ borderColor: step === item.id ? item.color : '' }}
                        >
                          <div 
                            className="flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center transition-all duration-300"
                            style={{ backgroundColor: `${item.color}10`, color: item.color }}
                          >
                            <item.icon size={24} className="group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1">
                            <span className='block text-lg lg:text-xl font-bold text-gray-900 leading-tight'>{item.title}</span>
                            <span className='text-gray-500 text-xs lg:text-sm'>{item.desc}</span>
                          </div>
                          <ArrowRight size={18} className="text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                        </motion.button>
                      ))}
                    </div>

                    <div className="pt-2 lg:pt-4 text-center">
                       <p className="text-[10px] lg:text-xs text-gray-400 font-medium tracking-widest uppercase">
                         Precision Crafted Excellence
                       </p>
                    </div>
                  </motion.div>
                )}

                {step === 'email-form' && (
                  <motion.div
                    key='email-form'
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className='space-y-6 max-w-md mx-auto pt-4'
                  >
                    <div className='space-y-2'>
                      <h3 className='text-3xl font-serif font-bold text-gray-900 text-center'>
                        Create Account
                      </h3>
                      <div className="h-1 w-12 bg-[#163146] mx-auto rounded-full" />
                    </div>

                    <div className='space-y-4'>
                      <div className="pb-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                          Select Your Perspective
                        </label>
                        <RoleSelector
                          selectedRole={formData.role}
                          onSelect={(role) =>
                            setFormData((p) => ({ ...p, role }))
                          }
                          error={errors.role}
                        />
                      </div>

                      <div className='grid grid-cols-2 gap-4'>
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
                        label='Email Address'
                        value={formData.email}
                        onChange={(value) =>
                          setFormData((p) => ({ ...p, email: value }))
                        }
                        type='email'
                        placeholder={formData.role === 'athlete' ? 'name@university.edu' : 'john@example.com'}
                        error={errors.email}
                        required
                        icon={<Mail size={18} className="text-gray-400" />}
                      />
                      
                      <FormInput
                        label='Phone Number (Optional)'
                        value={formData.phone}
                        onChange={(value) =>
                          setFormData((p) => ({ ...p, phone: value }))
                        }
                        type='tel'
                        placeholder='+1 (555) 000-0000'
                        error={errors.phone}
                        icon={<Phone size={18} className="text-gray-400" />}
                      />

                      <PasswordInput
                        label='Create Password'
                        value={formData.password}
                        onChange={(value) =>
                          setFormData((p) => ({ ...p, password: value }))
                        }
                        error={errors.password}
                        showStrength={true}
                      />

                      <PrimaryButton
                        onClick={handleNext}
                        loading={completionLoading}
                        className='w-full py-4 text-lg mt-4 shadow-xl shadow-[#163146]/20'
                      >
                        Create Your Account
                      </PrimaryButton>
                    </div>
                  </motion.div>
                )}

                {step === 'login-form' && (
                  <motion.div
                    key='login-form'
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className='space-y-8 max-w-md mx-auto pt-8'
                  >
                    <div className='space-y-2'>
                        <h3 className='text-3xl font-serif font-bold text-gray-900 text-center'>
                          Welcome Back
                        </h3>
                        <div className="h-1 w-12 bg-[#986a41] mx-auto rounded-full" />
                    </div>

                    {reduxError && <ErrorAlert message={typeof reduxError === 'string' ? reduxError : 'Authentication failed'} />}
                    
                    <div className='space-y-5'>
                      <FormInput
                        label='Email Address'
                        value={loginForm.email}
                        onChange={(value) =>
                          setLoginForm((p) => ({ ...p, email: value }))
                        }
                        type='email'
                        placeholder='john@example.com'
                        required
                        icon={<Mail size={18} className="text-gray-400" />}
                      />
                      
                      <div className="space-y-1">
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
                        <button className="text-sm font-medium text-[#986a41] hover:underline transition-all">
                          Forgot password?
                        </button>
                      </div>

                      <PrimaryButton
                        onClick={handleNext}
                        loading={completionLoading}
                        className='w-full py-4 text-lg mt-4 shadow-xl shadow-[#986a41]/20'
                        style={{ background: 'linear-gradient(135deg, #986a41, #855b38)' }}
                      >
                        Sign In Access
                      </PrimaryButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
