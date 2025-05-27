import Stripe from 'stripe';

// Código do servidor - só executa no servidor
let stripe: Stripe | null = null;

if (typeof window === 'undefined') {
  // Estamos no servidor
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY is not set');
  } else {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-30.basil',
    });
  }
}

// Exportar stripe apenas se estiver no servidor
export { stripe };

// Código do cliente - só executa no browser
export const getStripe = async () => {
  const { loadStripe } = await import('@stripe/stripe-js');
  
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
  }
  
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
};

// Alias para compatibilidade
export const getStripeJs = getStripe;

// Configuração dos planos
export const plans = {
  plus: {
    name: 'Plus',
    price: 999, // R$ 9,99 em centavos
    credits: 50,
    priceId: 'price_plus', // Será criado dinamicamente
  },
  pro: {
    name: 'Pro',
    price: 2999, // R$ 29,99 em centavos
    credits: 200,
    priceId: 'price_pro', // Será criado dinamicamente
  },
  premium: {
    name: 'Premium',
    price: 9999, // R$ 99,99 em centavos
    credits: -1, // Ilimitado
    priceId: 'price_premium', // Será criado dinamicamente
  },
};

// Função para obter plano por ID
export const getPlanById = (planId: string) => {
  return plans[planId as keyof typeof plans]
}

// Função para obter plano por preço do Stripe
export const getPlanByStripePrice = (stripePriceId: string) => {
  return Object.values(plans).find(plan => plan.priceId === stripePriceId)
}

// Função para calcular créditos restantes baseado no plano
export const calculateCreditsForPlan = (planId: string) => {
  const plan = getPlanById(planId)
  if (!plan) return 0
  
  if (plan.credits === -1) return -1 // -1 indica ilimitado
  return typeof plan.credits === 'number' ? plan.credits : 0
} 