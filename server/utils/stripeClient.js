const STRIPE_BASE_URL = 'https://api.stripe.com/v1'

const appendFormData = (params, key, value) => {
  if (value === undefined || value === null) return

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      appendFormData(params, `${key}[${index}]`, item)
    })
    return
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([nestedKey, nestedValue]) => {
      appendFormData(params, `${key}[${nestedKey}]`, nestedValue)
    })
    return
  }

  params.append(key, String(value))
}

export const stripeRequest = async (path, { method = 'POST', data = null, query = null } = {}) => {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }

  let url = `${STRIPE_BASE_URL}${path}`

  if (query && Object.keys(query).length > 0) {
    const queryParams = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      appendFormData(queryParams, key, value)
    })
    const qs = queryParams.toString()
    if (qs) {
      url = `${url}?${qs}`
    }
  }

  const headers = {
    Authorization: `Bearer ${secretKey}`,
  }

  const requestOptions = {
    method,
    headers,
  }

  if (data) {
    const formParams = new URLSearchParams()
    Object.entries(data).forEach(([key, value]) => {
      appendFormData(formParams, key, value)
    })
    requestOptions.body = formParams.toString()
    requestOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded'
  }

  const response = await fetch(url, requestOptions)
  const payload = await response.json()

  if (!response.ok) {
    const message = payload?.error?.message || 'Stripe API request failed'
    const error = new Error(message)
    error.statusCode = response.status
    error.details = payload?.error || null
    throw error
  }

  return payload
}
