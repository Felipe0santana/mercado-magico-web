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

// 🔑 SERVICE_ROLE_KEY CONFIGURADA - Deploy forçado
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
        // ✨ NOVA VERSÃO: Usar função do banco de dados para maior robustez
        console.log(`🔍 [WEBHOOK] Usando função do banco para processar: ${customerEmail}`)
        
        const { data: webhookResult, error: webhookError } = await supabaseAdmin
          .rpc('process_stripe_webhook', {
            customer_email: customerEmail,
            subscription_plan: planConfig.plan,
            subscription_status: 'active',
            credits_amount: planConfig.credits,
            stripe_customer_id: session.customer || null,
            stripe_subscription_id: session.subscription || null
          })

        if (webhookError) {
          console.error('❌ [WEBHOOK] Erro na função do banco:', webhookError)
          return NextResponse.json({ error: 'Erro na função do banco' }, { status: 500 })
        }

        const result = webhookResult as any

        if (!result.success) {
          console.error(`❌ [WEBHOOK] Função retornou erro: ${result.error}`)
          
          // Se usuário não foi encontrado, tentar buscar com sugestões
          if (result.error === 'User not found') {
            const { data: searchResult, error: searchError } = await supabaseAdmin
              .rpc('find_user_by_email', { search_email: customerEmail })
            
            if (!searchError && searchResult) {
              console.log(`🔍 [WEBHOOK] Busca por usuário:`, searchResult)
              if (searchResult.suggestions?.length > 0) {
                console.log(`💡 [WEBHOOK] Emails similares encontrados:`, searchResult.suggestions)
              }
            }
          }
          
          return NextResponse.json({ 
            error: result.error,
            details: result,
            webhook_session: session.id 
          }, { status: 404 })
        }

        console.log(`✅ [WEBHOOK] Usuário ${customerEmail} atualizado com sucesso via função do banco`)
        console.log(`📊 [WEBHOOK] Resultado:`, {
          user_id: result.user_id,
          email: result.email,
          normalized_email: result.normalized_email,
          plan: result.plan,
          credits: result.credits,
          status: result.status
        })

        // ✅ Log de sucesso detalhado  
        console.log(`🎉 [WEBHOOK] SUCESSO COMPLETO (v2):`)
        console.log(`   - Evento: ${event.type} [${event.id}]`)
        console.log(`   - Session: ${session.id}`)
        console.log(`   - Email Original: ${customerEmail}`)
        console.log(`   - Email Normalizado: ${result.normalized_email}`)
        console.log(`   - User ID: ${result.user_id}`)
        console.log(`   - Price ID: ${priceId}`)
        console.log(`   - Plano: ${planConfig.plan}`)
        console.log(`   - Créditos: ${planConfig.credits === -1 ? 'ilimitado' : planConfig.credits}`)
        console.log(`   - Processado em: ${result.processed_at}`)

        // ⚡ ADICIONAL: Notificar via realtime que houve mudança
        try {
          const { error: realtimeError } = await supabaseAdmin
            .from('users')
            .update({ 
              last_webhook_update: new Date().toISOString(),
              webhook_session_id: session.id 
            })
            .eq('id', result.user_id)
          
          if (realtimeError) {
            console.warn('⚠️ [WEBHOOK] Aviso: Erro ao atualizar realtime:', realtimeError)
          } else {
            console.log('⚡ [WEBHOOK] Realtime atualizado com sucesso')
          }
        } catch (realtimeErr) {
          console.warn('⚠️ [WEBHOOK] Aviso: Erro no realtime:', realtimeErr)
        }

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