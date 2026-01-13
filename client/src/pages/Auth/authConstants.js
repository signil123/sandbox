// File: client/src/pages/Auth/authConstants.js

export const FEATURES = [
  { text: 'Fast & Easy Setup' },
  { text: 'Secure & Verified' },
  { text: 'Smart Matching' },
]

export const STEP_ORDER = [
  'method',
  'email-form',
  'login-form',
]

export const getStepNumber = (step) => {
  return STEP_ORDER.indexOf(step) + 1
}
