import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import React, { useEffect, useMemo, useState } from 'react'
import { subscriptionService } from '../../services/subscriptionService'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

const CardForm = ({ onClose, onSuccess, onError }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [clientSecret, setClientSecret] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadIntent = async () => {
      try {
        const response = await subscriptionService.createSetupIntent()
        const secret = response?.data?.clientSecret
        if (isMounted) {
          setClientSecret(secret || '')
        }
      } catch (error) {
        if (isMounted) {
          const message = error || 'Failed to start card setup'
          setLocalError(message)
          onError?.(message)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadIntent()

    return () => {
      isMounted = false
    }
  }, [onError])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLocalError('')

    if (!stripe || !elements || !clientSecret) {
      const message = 'Stripe is not ready yet. Please try again.'
      setLocalError(message)
      onError?.(message)
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      const message = 'Card input is unavailable. Please refresh.'
      setLocalError(message)
      onError?.(message)
      return
    }

    setIsSubmitting(true)

    const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    })

    if (error) {
      const message = error.message || 'Failed to save card'
      setLocalError(message)
      onError?.(message)
      setIsSubmitting(false)
      return
    }

    if (setupIntent?.status === 'succeeded') {
      onSuccess?.(setupIntent?.payment_method || null)
      onClose?.()
      return
    }

    const message = 'Card setup was not completed. Please try again.'
    setLocalError(message)
    onError?.(message)
    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="rounded-2xl border border-gray-200 p-4 bg-white">
          <div className="h-4 w-32 rounded-full bg-gray-200" />
          <div className="h-10 mt-3 rounded-xl bg-gray-200" />
        </div>
        <div className="flex items-center justify-end gap-3">
          <div className="h-9 w-24 rounded-xl bg-gray-200" />
          <div className="h-9 w-28 rounded-xl bg-gray-200" />
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-gray-200 p-4 bg-white">
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                fontSize: '16px',
                color: '#0f172a',
                '::placeholder': { color: '#94a3b8' },
              },
              invalid: { color: '#dc2626' },
            },
          }}
        />
      </div>

      {localError && (
        <div className="text-sm text-red-600">{localError}</div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" className="rounded-xl font-bold" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="rounded-xl font-bold" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Card'}
        </Button>
      </div>
    </form>
  )
}

const AddCardModal = ({ isOpen, onClose, onSuccess, onError }) => {
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  const canRenderStripe = Boolean(stripeKey)

  const elementsOptions = useMemo(() => ({
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#163146',
        colorText: '#0f172a',
        colorBackground: '#ffffff',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        borderRadius: '12px',
      },
    },
  }), [])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg w-[90vw] rounded-[28px] p-6">
        <div className="space-y-2 mb-5">
          <h3 className="text-2xl font-black text-[#163146]">Add a Card</h3>
          <p className="text-sm text-gray-500">Securely save a card to your account before purchasing a plan.</p>
        </div>

        {!canRenderStripe ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            Missing `VITE_STRIPE_PUBLISHABLE_KEY`. Add it to your environment and reload.
          </div>
        ) : (
          <Elements stripe={stripePromise} options={elementsOptions}>
            <CardForm onClose={onClose} onSuccess={onSuccess} onError={onError} />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AddCardModal
