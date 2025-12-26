// File: client/src/pages/Auth/authConstants.js
const commonQuestions = [
  {
    id: 'gender',
    label: 'Gender',
    type: 'select',
    optional: true,
    options: ['Male', 'Female', 'Other', 'Prefer not to say'],
  },
  {
    id: 'language',
    label: 'Preferred Language',
    type: 'select',
    optional: true,
    options: ['English', 'Spanish', 'French', 'Mandarin', 'Other'],
  },
]

const commonCommunicationQuestion = {
  id: 'communicationPreference',
  label: 'How would you prefer to communicate?',
  type: 'checkbox',
  optional: false,
  options: ['Email', 'Chat', 'Phone Call', 'Video Call'],
}

export const athleteQuestions = [
  ...commonQuestions,
  {
    id: 'dateOfBirth',
    label: 'Date of Birth',
    type: 'date',
    optional: false,
    help: 'To confirm NIL eligibility',
  },
  {
    id: 'school',
    label: 'School / University',
    type: 'text',
    optional: false,
    placeholder: 'Enter your school name',
  },
  {
    id: 'sport',
    label: 'Sport',
    type: 'select',
    optional: false,
    options: [
      'Basketball',
      'Football',
      'Baseball',
      'Soccer',
      'Tennis',
      'Track & Field',
      'Volleyball',
      'Other',
    ],
  },
  {
    id: 'niilNeeds',
    label: 'What type of NIL support do you need?',
    type: 'checkbox',
    optional: false,
    options: ['Contract Review', 'Tax Help', 'Brand Matching', 'Legal Advice'],
  },
  commonCommunicationQuestion,
]

export const advisorAgentQuestions = [
  ...commonQuestions,
  {
    id: 'specialties',
    label: 'What are your specialties?',
    type: 'checkbox',
    optional: false,
    options: [
      'Contract Review',
      'Tax Planning',
      'Brand Matching',
      'Legal Advice',
      'Marketing',
    ],
  },
  {
    id: 'experience',
    label: 'Years of Experience',
    type: 'select',
    optional: false,
    options: ['0-2 years', '2-5 years', '5-10 years', '10+ years'],
  },
  {
    ...commonCommunicationQuestion,
    label: 'Preferred communication methods',
  },
]

export const FEATURES = [
  { text: 'Fast & Easy Setup' },
  { text: 'Secure & Verified' },
  { text: 'Smart Matching' },
]

export const STEP_ORDER = [
  'method',
  'email-form',
  'login-form',
  'verify',
  'role',
  'welcome',
  'questions',
  'complete',
]

export const getStepNumber = (step) => {
  return STEP_ORDER.indexOf(step) + 1
}
