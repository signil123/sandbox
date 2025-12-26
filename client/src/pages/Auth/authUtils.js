// File: client/src/pages/Auth/authUtils.js
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 100,
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasNumber: /\d/,
  hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
}

export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const validatePhone = (phone) => {
  if (!phone) return true
  return /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(
    phone
  )
}

export const validatePassword = (password) => {
  return (
    password.length >= PASSWORD_REQUIREMENTS.minLength &&
    PASSWORD_REQUIREMENTS.hasUpperCase.test(password) &&
    PASSWORD_REQUIREMENTS.hasLowerCase.test(password) &&
    PASSWORD_REQUIREMENTS.hasNumber.test(password) &&
    PASSWORD_REQUIREMENTS.hasSpecial.test(password)
  )
}

export const validateQuestions = (questions, formData) => {
  const errors = {}
  for (const q of questions) {
    const value = formData[q.id]
    if (!q.optional) {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        errors[q.id] = `${q.label} is required`
      }
    }
  }
  return errors
}

export const getLoadingMessage = (step) => {
  const messages = {
    'email-form': 'Creating your account...',
    'login-form': 'Signing in...',
    verify: 'Verifying your email...',
    questions: 'Saving your profile...',
  }
  return messages[step] || 'Processing...'
}

export const getButtonText = (step) => {
  const buttonTexts = {
    verify: 'Verify',
    questions: 'Complete',
    'login-form': 'Sign In',
  }
  return buttonTexts[step] || 'Next'
}
