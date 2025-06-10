import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  console.log('🔧 [CHECK] Verificando configurações do Stripe...')
  
  // Verificar variáveis de ambiente
  const config = {
    stripe: {
      secretKey: !!process.env.STRIPE_SECRET_KEY,
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      cliWebhookSecret: !!process.env.STRIPE_CLI_WEBHOOK_SECRET,
      publishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    },
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    webhook: {
      endpoint: '/api/webhooks/stripe',
      expectedUrl: 'https://site54874935.netlify.app/api/webhooks/stripe'
    }
  }

  // Mapeamento de preços configurado no webhook
  const PRICE_TO_PLAN_MAP = {
    // Plus - R$ 9,99
    'price_1RU9zyG8Yafp5KeiJQGhJhzP': { plan: 'plus', credits: 100, price: 'R$ 9,99' },
    // Pro - R$ 29,99  
    'price_1RU9zZG8Yafp5KeiCqGhJhzP': { plan: 'pro', credits: 200, price: 'R$ 29,99' },
    // Premium - R$ 99,99
    'price_1RU9zAG8Yafp5KeiDqGhJhzP': { plan: 'premium', credits: 500, price: 'R$ 99,99' },
    // Super - Vários preços
    'price_1RUDdZG8Yafp5KeicZq0428N': { plan: 'super', credits: -1, price: 'R$ 49,99+' },
    'price_1RUDdLG8Yafp5Kei4xfIQDAI': { plan: 'super', credits: -1, price: 'R$ 49,99+' },
    'price_1RUDe3G8Yafp5Kei639zByNb': { plan: 'super', credits: -1, price: 'R$ 49,99+' },
    'price_1RUDeXG8Yafp5KeiTTaLqZ1o': { plan: 'super', credits: -1, price: 'R$ 49,99+' },
    'price_1RUDgAG8Yafp5KeiBWna5OKy': { plan: 'super', credits: -1, price: 'R$ 49,99+' }
  }

  // Verificar configurações críticas
  const issues = []
  
  if (!config.stripe.secretKey) {
    issues.push('❌ STRIPE_SECRET_KEY não configurada')
  }
  
  if (!config.stripe.webhookSecret && !config.stripe.cliWebhookSecret) {
    issues.push('❌ Nenhum webhook secret configurado')
  }
  
  if (!config.supabase.serviceKey) {
    issues.push('❌ SUPABASE_SERVICE_ROLE_KEY não configurada')
  }

  // Status geral
  const allGood = issues.length === 0
  
  const result = {
    status: allGood ? 'success' : 'warning',
    message: allGood ? 'Todas as configurações estão corretas!' : 'Algumas configurações precisam ser verificadas',
    config,
    priceMapping: PRICE_TO_PLAN_MAP,
    webhook: {
      url: config.webhook.expectedUrl,
      events: [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed'
      ]
    },
    issues,
    recommendations: [
      '1. Verifique se o webhook está configurado no Stripe Dashboard',
      '2. URL do webhook: https://site54874935.netlify.app/api/webhooks/stripe',
      '3. Eventos necessários: checkout.session.completed (mínimo)',
      '4. Copie o Webhook Secret do Stripe e adicione como STRIPE_WEBHOOK_SECRET no Netlify',
      '5. Teste com um pagamento real usando cartão 4242 4242 4242 4242'
    ],
    timestamp: new Date().toISOString()
  }

  console.log('📊 [CHECK] Resultado da verificação:', result)
  
  return NextResponse.json(result, { 
    status: allGood ? 200 : 206,
    headers: {
      'Cache-Control': 'no-cache'
    }
  })
} 