import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, getPlanById, plans } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    // Verificar se o stripe está disponível (só no servidor)
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe não configurado corretamente' },
        { status: 500 }
      )
    }

    const { planName, userEmail } = await request.json()

    if (!planName) {
      return NextResponse.json(
        { error: 'Nome do plano é obrigatório' },
        { status: 400 }
      )
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Obter informações do plano
    const planInfo = getPlanById(planName.toLowerCase())
    
    if (!planInfo) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 400 }
      )
    }

    // Usar o priceId real do Stripe
    const priceId = planInfo.priceId

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/`,
      metadata: {
        plan: planName.toLowerCase(),
        app: 'mercado-magico',
        credits: planInfo.credits.toString(),
        user_email: userEmail,
      },
      subscription_data: {
        metadata: {
          plan: planName.toLowerCase(),
          app: 'mercado-magico',
          credits: planInfo.credits.toString(),
          user_email: userEmail,
        },
      },
      billing_address_collection: 'required',
      locale: 'pt-BR',
      customer_email: userEmail,
      allow_promotion_codes: true,
    })

    // Log da sessão criada para debug
    console.log('Sessão de checkout criada:', {
      sessionId: session.id,
      plan: planName,
      priceId: priceId,
      userEmail: userEmail,
    })

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url,
      plan: planName,
      priceId: priceId,
      userEmail: userEmail,
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