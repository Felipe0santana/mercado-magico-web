import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripeConfig, getPlanById } from '@/lib/stripe'
import { supabase, auth } from '@/lib/supabase'

const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    const { priceId, planName, planPrice, userEmail } = await request.json()

    if (!priceId && !planPrice) {
      return NextResponse.json(
        { error: 'Price ID ou preço do plano é obrigatório' },
        { status: 400 }
      )
    }

    // Se não tiver priceId, criar um produto e preço dinamicamente
    let finalPriceId = priceId

    if (!priceId && planPrice && planName) {
      // Criar produto
      const product = await stripe.products.create({
        name: `Mercado Mágico - ${planName}`,
        description: `Plano ${planName} do Mercado Mágico`,
        metadata: {
          plan: planName.toLowerCase(),
          app: 'mercado-magico',
        },
      })

      // Criar preço
      const price = await stripe.prices.create({
        unit_amount: Math.round(planPrice * 100), // Converter para centavos
        currency: 'brl',
        recurring: {
          interval: 'month',
        },
        product: product.id,
        metadata: {
          plan: planName.toLowerCase(),
          app: 'mercado-magico',
        },
      })

      finalPriceId = price.id
    }

    // Obter informações do plano
    const planInfo = getPlanById(planName?.toLowerCase() || 'unknown')

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix'],
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/`,
      metadata: {
        plan: planName?.toLowerCase() || 'unknown',
        app: 'mercado-magico',
        credits: planInfo?.credits?.toString() || '0',
      },
      subscription_data: {
        metadata: {
          plan: planName?.toLowerCase() || 'unknown',
          app: 'mercado-magico',
          credits: planInfo?.credits?.toString() || '0',
        },
      },
      customer_creation: 'always',
      billing_address_collection: 'required',
      locale: 'pt-BR',
      customer_email: userEmail || undefined,
      allow_promotion_codes: true,
    })

    // Log da sessão criada para debug
    console.log('Sessão de checkout criada:', {
      sessionId: session.id,
      plan: planName,
      price: planPrice,
      userEmail: userEmail || 'não fornecido',
    })

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url,
      plan: planName,
      price: planPrice,
    })
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error)
    
    // Retornar erro mais específico
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Erro do Stripe: ${error.message}` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 