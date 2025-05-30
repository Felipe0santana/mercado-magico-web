import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

// Configurar Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  console.warn('⚠️ STRIPE_SECRET_KEY não está definida')
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-04-30.basil',
}) : null

// Webhook secrets
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const cliWebhookSecret = process.env.STRIPE_CLI_WEBHOOK_SECRET || 'whsec_9d104f15c71f8060969218e5e78948f82d374d9c7385048a47632d0b4382ea80'

// MODO DEBUG - aceita CLI webhook secret se não houver webhook secret configurado
const effectiveSecret = webhookSecret || cliWebhookSecret

console.log('🔧 [WEBHOOK] Configuração:', {
  stripeConfigured: !!stripeSecretKey,
  webhookSecret: !!webhookSecret ? '✅ Configurado' : '❌ Usando CLI secret',
  effectiveSecret: effectiveSecret ? '✅ Disponível' : '❌ Não disponível'
})

// Mapeamento de preços para planos
const PRICE_TO_PLAN_MAP: Record<string, { plan: string; credits: number }> = {
  // Plus - R$ 19,99
  'price_1RU9zyG8Yafp5KeiJQGhJhzP': { plan: 'plus', credits: 100 },
  // Pro - R$ 29,99  
  'price_1RU9zZG8Yafp5KeiCqGhJhzP': { plan: 'pro', credits: 200 },
  // Premium - R$ 39,99
  'price_1RU9zAG8Yafp5KeiDqGhJhzP': { plan: 'premium', credits: 500 },
  // Super - R$ 49,99+
  'price_1RUDdZG8Yafp5KeicZq0428N': { plan: 'super', credits: -1 }, // ilimitado
  'price_1RUDdLG8Yafp5Kei4xfIQDAI': { plan: 'super', credits: -1 },
  'price_1RUDe3G8Yafp5Kei639zByNb': { plan: 'super', credits: -1 },
  'price_1RUDeXG8Yafp5KeiTTaLqZ1o': { plan: 'super', credits: -1 },
  'price_1RUDgAG8Yafp5KeiBWna5OKy': { plan: 'super', credits: -1 }
}

export async function POST(request: NextRequest) {
  console.log('📨 [WEBHOOK] Recebendo webhook do Stripe...')
  
  if (!stripe) {
    console.error('❌ [WEBHOOK] Stripe não configurado')
    return NextResponse.json({ error: 'Stripe não configurado' }, { status: 500 })
  }

  if (!effectiveSecret) {
    console.error('❌ [WEBHOOK] Webhook secret não configurado')
    return NextResponse.json({ error: 'Webhook secret não configurado' }, { status: 500 })
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('❌ [WEBHOOK] Assinatura não encontrada')
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 400 })
    }

    // Verificar assinatura do webhook
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, effectiveSecret)
      console.log(`✅ [WEBHOOK] Evento verificado: ${event.type} [${event.id}]`)
    } catch (err) {
      console.error('❌ [WEBHOOK] Erro na verificação da assinatura:', err)
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
    }

    // Processar apenas eventos de checkout completado
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      console.log(`💳 [WEBHOOK] Processando checkout: ${session.id}`)
      console.log(`📧 [WEBHOOK] Email do cliente: ${session.customer_details?.email}`)

      const customerEmail = session.customer_details?.email
      
      // Buscar line items para obter o price_id
      let priceId: string | undefined
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
        priceId = lineItems.data[0]?.price?.id
        console.log(`💰 [WEBHOOK] Price ID encontrado: ${priceId}`)
      } catch (error) {
        console.error('❌ [WEBHOOK] Erro ao buscar line items:', error)
      }

      if (!customerEmail) {
        console.error('❌ [WEBHOOK] Email do cliente não encontrado')
        return NextResponse.json({ error: 'Email não encontrado' }, { status: 400 })
      }

      if (!priceId) {
        console.error('❌ [WEBHOOK] Price ID não encontrado')
        return NextResponse.json({ error: 'Price ID não encontrado' }, { status: 400 })
      }

      // Buscar configuração do plano
      const planConfig = PRICE_TO_PLAN_MAP[priceId]
      if (!planConfig) {
        console.error(`❌ [WEBHOOK] Price ID não mapeado: ${priceId}`)
        console.log('📋 [WEBHOOK] Price IDs disponíveis:', Object.keys(PRICE_TO_PLAN_MAP))
        return NextResponse.json({ error: 'Plano não encontrado' }, { status: 400 })
      }

      console.log(`📋 [WEBHOOK] Plano identificado: ${planConfig.plan} (${planConfig.credits === -1 ? 'ilimitado' : planConfig.credits} créditos)`)

      // Atualizar usuário no Supabase
      if (!supabaseAdmin) {
        console.error('❌ [WEBHOOK] Cliente admin do Supabase não disponível')
        return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 })
      }

      try {
        // Buscar usuário pelo email
        console.log(`🔍 [WEBHOOK] Buscando usuário: ${customerEmail}`)
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (listError) {
          console.error('❌ [WEBHOOK] Erro ao listar usuários:', listError)
          return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 })
        }

        const user = users.users.find(u => u.email === customerEmail)
        if (!user) {
          console.error(`❌ [WEBHOOK] Usuário não encontrado: ${customerEmail}`)
          return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        console.log(`👤 [WEBHOOK] Usuário encontrado: ${user.id}`)
        console.log(`📊 [WEBHOOK] Metadados atuais:`, user.user_metadata)

        // Preparar dados de atualização
        const currentMetadata = user.user_metadata || {}
        const updateData = {
          user_metadata: {
            ...currentMetadata,
            subscription_plan: planConfig.plan,
            subscription_status: 'active',
            credits_remaining: planConfig.credits,
            updated_at: new Date().toISOString(),
            last_payment: session.id,
            last_payment_date: new Date().toISOString(),
            stripe_customer_id: session.customer,
            // Forçar mudança para trigger do Realtime
            webhook_update_count: (currentMetadata.webhook_update_count || 0) + 1
          }
        }

        console.log(`🔄 [WEBHOOK] Atualizando usuário com dados:`, updateData.user_metadata)

        // Atualizar user_metadata
        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, updateData)

        if (updateError) {
          console.error('❌ [WEBHOOK] Erro ao atualizar usuário:', updateError)
          return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
        }

        console.log(`✅ [WEBHOOK] Usuário ${customerEmail} atualizado para plano ${planConfig.plan}`)
        console.log(`📊 [WEBHOOK] Novos metadados:`, updatedUser.user?.user_metadata)

        // Log de sucesso detalhado
        console.log(`🎉 [WEBHOOK] SUCESSO COMPLETO:`)
        console.log(`   - Evento: ${event.type} [${event.id}]`)
        console.log(`   - Session: ${session.id}`)
        console.log(`   - Email: ${customerEmail}`)
        console.log(`   - User ID: ${user.id}`)
        console.log(`   - Price ID: ${priceId}`)
        console.log(`   - Plano: ${planConfig.plan}`)
        console.log(`   - Créditos: ${planConfig.credits === -1 ? 'ilimitado' : planConfig.credits}`)

      } catch (error) {
        console.error('❌ [WEBHOOK] Erro inesperado:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
      }
    } else {
      console.log(`ℹ️ [WEBHOOK] Evento ignorado: ${event.type}`)
    }

    return NextResponse.json({ received: true, event_type: event.type, event_id: event.id })

  } catch (error) {
    console.error('❌ [WEBHOOK] Erro geral:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}