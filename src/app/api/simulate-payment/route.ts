import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, amount = 999 } = await request.json()

    console.log(`🧪 Simulando pagamento Stripe para: ${email}`)

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email é obrigatório' 
      }, { status: 400 })
    }

    // Simular dados exatos do webhook do Stripe
    const mockStripeEvent = {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      api_version: '2025-04-30.basil',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `cs_test_${Date.now()}`,
          object: 'checkout.session',
          amount_total: amount,
          currency: 'brl',
          customer_details: {
            email: email,
            name: email.split('@')[0]
          },
          payment_status: 'paid',
          status: 'complete',
          mode: 'payment',
          metadata: {},
          created: Math.floor(Date.now() / 1000)
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: `req_test_${Date.now()}`,
        idempotency_key: null
      },
      type: 'checkout.session.completed'
    }

    console.log('📦 Evento Stripe simulado:', mockStripeEvent)

    // Chamar o webhook interno
    const webhookUrl = 'https://site54874935.netlify.app/api/webhooks/stripe'
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'whsec_9d104f15c71f8060969218e5e78948f82d374d9c7385048a47632d0b4382ea80'
      },
      body: JSON.stringify(mockStripeEvent)
    })

    const webhookResult = await webhookResponse.text()
    
    console.log('📨 Resposta do webhook:', webhookResponse.status, webhookResult)

    if (!webhookResponse.ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao processar webhook',
        webhook_status: webhookResponse.status,
        webhook_response: webhookResult
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Pagamento simulado com sucesso',
      stripe_event: mockStripeEvent,
      webhook_status: webhookResponse.status,
      webhook_response: webhookResult
    })

  } catch (error) {
    const err = error as Error
    console.error('❌ Erro ao simular pagamento:', err)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: err.message
    }, { status: 500 })
  }
} 