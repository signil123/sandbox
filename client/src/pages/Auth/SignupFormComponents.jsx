// File: client/src/pages/Auth/SignupFormComponents.jsx
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { PASSWORD_REQUIREMENTS } from './authUtils'

export const FormInput = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  required,
  icon,
}) => (
  <div className='space-y-1'>
    <label className='block text-xs font-medium text-gray-700'>
      {label} {required && <span className='text-red-500'>*</span>}
    </label>
    <div className='relative'>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-all ${
          icon ? 'pl-9' : ''
        } ${
          error
            ? 'border-red-300 focus:ring-1 focus:ring-red-200'
            : 'border-gray-200 focus:ring-1 focus:ring-[#163146]/20 focus:border-[#163146]'
        }`}
      />
      {icon && (
        <div className='absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm'>
          {icon}
        </div>
      )}
    </div>
    {error && <p className='text-xs text-red-600'>{error}</p>}
  </div>
)

export const PasswordInput = ({
  label,
  value,
  onChange,
  error,
  placeholder = '••••••••',
  onFocus,
  showStrength = true,
  onKeyDown,
}) => {
  const [showPassword, setShowPassword] = useState(false)

  const getPasswordChecks = (password) => [
    {
      label: '8+ characters',
      met: password.length >= PASSWORD_REQUIREMENTS.minLength,
    },
    {
      label: 'Uppercase',
      met: PASSWORD_REQUIREMENTS.hasUpperCase.test(password),
    },
    {
      label: 'Lowercase',
      met: PASSWORD_REQUIREMENTS.hasLowerCase.test(password),
    },
    {
      label: 'Number',
      met: PASSWORD_REQUIREMENTS.hasNumber.test(password),
    },
    {
      label: 'Special char',
      met: PASSWORD_REQUIREMENTS.hasSpecial.test(password),
    },
  ]

  const passwordChecks = getPasswordChecks(value)
  const metCount = passwordChecks.filter((c) => c.met).length
  const strengthPercent = (metCount / passwordChecks.length) * 100

  const getStrengthColor = () => {
    if (strengthPercent < 40) return 'bg-red-500'
    if (strengthPercent < 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className='space-y-1 relative'>
      <label className='block text-xs font-medium text-gray-700'>
        {label} <span className='text-red-500'>*</span>
      </label>
      <div className='relative'>
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-all ${
            error
              ? 'border-red-300 focus:ring-1 focus:ring-red-200'
              : 'border-gray-200 focus:ring-1 focus:ring-[#163146]/20 focus:border-[#163146]'
          }`}
        />
        <button
          type='button'
          onClick={() => setShowPassword(!showPassword)}
          className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {value && showStrength && (
        <div className='bg-white border border-gray-200 rounded p-2 space-y-1.5 text-xs'>
          <div className='h-1 bg-gray-200 rounded-full overflow-hidden'>
            <div
              className={`h-full ${getStrengthColor()}`}
              style={{ width: `${strengthPercent}%` }}
            />
          </div>
          <div className='space-y-1'>
            {passwordChecks.map((req, idx) => (
              <div key={idx} className='flex items-center gap-1.5'>
                <div
                  className={`flex-shrink-0 w-3 h-3 rounded-full ${
                    req.met ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  {req.met && <Check size={8} className='text-white' />}
                </div>
                <span className={req.met ? 'text-green-700' : 'text-gray-500'}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <p className='text-xs text-red-600'>{error}</p>}
    </div>
  )
}

export const ErrorAlert = ({ message }) => (
  <div className='flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg'>
    <AlertCircle size={14} className='text-red-600 flex-shrink-0' />
    <p className='font-semibold text-red-800 text-xs'>{message}</p>
  </div>
)

export const LoadingSpinner = () => (
  <div className='animate-spin w-4 h-4 border-2 border-[#163146] border-t-transparent rounded-full' />
)

export const PrimaryButton = ({ onClick, disabled, loading, children }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className='px-5 py-2 bg-gradient-to-r from-[#163146] to-[#0f2229] text-white rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-[#163146]/20 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2'
  >
    {loading && <LoadingSpinner />}
    {children}
  </button>
)

export const RoleSelector = ({ selectedRole, onSelect, error }) => {
  const roles = [
    { role: 'athlete', title: 'Athlete' },
    { role: 'agent', title: 'Agent' },
    { role: 'advisor', title: 'Advisor' },
  ]

  return (
    <div className='space-y-1'>
      <label className='block text-xs font-medium text-gray-700'>
        I am a <span className='text-red-500'>*</span>
      </label>
      <div className='grid grid-cols-3 gap-2'>
        {roles.map((opt) => (
          <button
            key={opt.role}
            onClick={() => onSelect(opt.role)}
            type='button'
            className={`py-2 px-2 rounded-lg font-medium text-xs transition-all border ${
              selectedRole === opt.role
                ? 'border-[#163146] bg-[#163146]/10 text-[#163146]'
                : 'border-gray-200 text-gray-700 hover:border-[#163146]'
            }`}
          >
            {opt.title}
          </button>
        ))}
      </div>
      {error && <p className='text-xs text-red-600'>{error}</p>}
    </div>
  )
}

export const QuestionField = ({ question, value, onChange, error }) => {
  return (
    <div className='space-y-1'>
      <label className='block text-xs font-medium text-gray-700'>
        {question.label}{' '}
        {!question.optional && <span className='text-red-500'>*</span>}
      </label>

      {question.type === 'text' && (
        <input
          type='text'
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-all ${
            error
              ? 'border-red-300 focus:ring-1 focus:ring-red-200'
              : 'border-gray-200 focus:ring-1 focus:ring-[#163146]/20 focus:border-[#163146]'
          }`}
        />
      )}

      {question.type === 'date' && (
        <input
          type='date'
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-all ${
            error
              ? 'border-red-300 focus:ring-1 focus:ring-red-200'
              : 'border-gray-200 focus:ring-1 focus:ring-[#163146]/20 focus:border-[#163146]'
          }`}
        />
      )}

      {question.type === 'select' && (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-all appearance-none cursor-pointer ${
            error
              ? 'border-red-300 focus:ring-1 focus:ring-red-200'
              : 'border-gray-200 focus:ring-1 focus:ring-[#163146]/20 focus:border-[#163146]'
          }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundSize: '14px',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 6px center',
            paddingRight: '24px',
          }}
        >
          <option value=''>Select...</option>
          {question.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {question.type === 'checkbox' && (
        <div className='space-y-1.5'>
          {question.options?.map((opt) => {
            const currentArray = Array.isArray(value) ? value : []
            const isChecked = currentArray.includes(opt)
            return (
              <label
                key={opt}
                className='flex items-center gap-2 cursor-pointer'
              >
                <div
                  className={`relative w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    isChecked
                      ? 'bg-[#163146] border-[#163146]'
                      : 'border-gray-300'
                  }`}
                >
                  {isChecked && <Check size={10} className='text-white' />}
                </div>
                <input
                  type='checkbox'
                  checked={isChecked}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...currentArray, opt]
                      : currentArray.filter((item) => item !== opt)
                    onChange(updated)
                  }}
                  className='hidden'
                />
                <span className='text-xs text-gray-700'>{opt}</span>
              </label>
            )
          })}
        </div>
      )}

      {question.help && (
        <p className='text-xs text-gray-500'>{question.help}</p>
      )}
      {error && <p className='text-xs text-red-600'>{error}</p>}
    </div>
  )
}
