import { useState } from 'react'
import { getStripe } from '@/lib/stripe'
import { useAuthState } from '@/hooks/useAuth'

interface CheckoutData {
  planName: string
  planPrice: number
  priceId?: string
  userEmail?: string
}

export const useCheckout = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, userProfile } = useAuthState()

  const redirectToCheckout = async ({ planName, planPrice, priceId, userEmail }: CheckoutData) => {
    try {
      setLoading(true)
      setError(null)

      // Usar email do usuário logado ou email fornecido
      const emailToUse = user?.email || userEmail

      // Fazer chamada para criar sessão de checkout
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planName,
          planPrice,
          priceId,
          userEmail: emailToUse,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar sessão de checkout')
      }

      // Redirecionar para o Stripe Checkout
      const stripe = await getStripe()
      
      if (!stripe) {
        throw new Error('Erro ao carregar Stripe')
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }
    } catch (err) {
      console.error('Erro no checkout:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return {
    redirectToCheckout,
    loading,
    error,
    user,
    userProfile,
    isAuthenticated: !!user,
  }
} 