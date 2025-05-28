import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPlanByStripePrice } from '@/lib/stripe'
import { supabase, users, subscriptions } from '@/lib/supabase'

// Configurar Stripe diretamente com verificação
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  console.warn('⚠️ STRIPE_SECRET_KEY não está definida')
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-04-30.basil',
}) : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  console.log('🚀 Webhook do Stripe recebido')
  
  if (!stripe) {
    console.error('❌ Stripe não está configurado')
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    console.log('📝 Verificando assinatura do webhook...')
    console.log('📋 Headers recebidos:', Object.fromEntries(request.headers.entries()))
    
    if (!signature || !webhookSecret) {
      console.error('❌ Webhook signature ou secret não encontrado')
      console.log('🔑 Webhook secret configurado:', !!webhookSecret)
      console.log('✍️ Signature recebida:', !!signature)
      return NextResponse.json({ error: 'Webhook signature missing' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('✅ Assinatura do webhook verificada com sucesso')
    } catch (err) {
      console.error('❌ Erro na verificação do webhook:', err)
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
    }

    console.log(`📨 Evento recebido: ${event.type}`)
    console.log(`📊 Dados do evento:`, JSON.stringify(event.data.object, null, 2))

    // Processar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`⚠️ Evento não tratado: ${event.type}`)
    }

    console.log('✅ Webhook processado com sucesso')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

// Lidar com checkout completado
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('=== 🛒 CHECKOUT COMPLETADO ===')
    console.log('Session ID:', session.id)
    console.log('Metadados da sessão:', session.metadata)
    console.log('Customer email:', session.customer_details?.email)
    console.log('Amount total:', session.amount_total)

    const customerEmail = session.customer_details?.email
    const planName = session.metadata?.plan
    const subscriptionId = session.subscription as string

    if (!customerEmail) {
      console.error('❌ Email do cliente não encontrado no checkout')
      return
    }

    if (!planName) {
      console.error('❌ Plano não encontrado nos metadados do checkout')
      return
    }

    console.log(`🔄 Processando checkout para ${customerEmail} com plano ${planName}`)

    // Definir créditos baseado no plano
    let creditsToAdd = 10 // padrão free
    switch (planName.toLowerCase()) {
      case 'plus':
        creditsToAdd = 50
        break
      case 'pro':
        creditsToAdd = 200
        break
      case 'premium':
        creditsToAdd = -1 // ilimitado
        break
    }

    console.log(`💳 Créditos a serem adicionados: ${creditsToAdd}`)

    // Testar conexão com Supabase
    console.log('🔗 Testando conexão com Supabase...')
    const { data: testConnection, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (connectionError) {
      console.error('❌ Erro de conexão com Supabase:', connectionError)
      return
    }

    console.log('✅ Conexão com Supabase estabelecida')

    // Buscar usuário existente no Supabase
    console.log(`🔍 Buscando usuário: ${customerEmail}`)
    const { data: existingUser, error: userSearchError } = await supabase
      .from('users')
      .select('id, email, subscription_plan, credits_remaining')
      .eq('email', customerEmail)
      .single()

    if (userSearchError && userSearchError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar usuário:', userSearchError)
      return
    }

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      console.log(`✅ Usuário existente encontrado: ${userId}`)
      console.log(`📊 Plano atual: ${existingUser.subscription_plan}, Créditos atuais: ${existingUser.credits_remaining}`)
      
      // Atualizar plano do usuário existente
      console.log(`🔄 Atualizando plano para ${planName}...`)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          subscription_plan: planName,
          subscription_status: 'active',
          credits_remaining: creditsToAdd,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('❌ Erro ao atualizar usuário existente:', updateError)
        return
      }

      console.log(`✅ Plano do usuário ${customerEmail} atualizado para ${planName} com ${creditsToAdd} créditos`)
    } else {
      console.log('🆕 Usuário não encontrado, criando novo usuário')
      
      // Criar novo usuário no Auth
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email: customerEmail,
        email_confirm: true,
      })

      if (userError || !newUser.user) {
        console.error('❌ Erro ao criar usuário:', userError)
        return
      }

      userId = newUser.user.id

      // Criar perfil do usuário na tabela users
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: customerEmail,
          subscription_plan: planName,
          subscription_status: 'active',
          credits_remaining: creditsToAdd,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('❌ Erro ao criar perfil do usuário:', profileError)
        return
      }

      console.log(`✅ Novo usuário criado: ${customerEmail} com plano ${planName} e ${creditsToAdd} créditos`)
    }

    // Se houver subscription_id, criar registro na tabela subscriptions
    if (subscriptionId) {
      console.log('📝 Criando registro de assinatura...')
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan: planName as any,
          status: 'active',
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: session.customer as string,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (subscriptionError) {
        console.error('❌ Erro ao criar/atualizar assinatura:', subscriptionError)
      } else {
        console.log(`✅ Assinatura criada/atualizada para ${customerEmail}`)
      }
    }

    // Criar registro de transação de crédito
    console.log('💰 Criando registro de compra...')
    const { error: transactionError } = await supabase
      .from('purchase_history')
      .insert({
        user_id: userId,
        total_amount: (session.amount_total || 0) / 100, // converter de centavos para reais
        store_name: `Mercado Mágico - Plano ${planName}`,
        purchase_date: new Date().toISOString()
      })

    if (transactionError) {
      console.error('❌ Erro ao criar registro de compra:', transactionError)
    } else {
      console.log(`✅ Registro de compra criado para ${customerEmail}`)
    }

    console.log(`🎉 Checkout processado com sucesso para ${customerEmail}`)
    console.log('=== ✅ FIM DO PROCESSAMENTO ===')
  } catch (error) {
    console.error('❌ Erro ao processar checkout completado:', error)
  }
}

// Lidar com assinatura criada
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    console.log('Assinatura criada:', subscription.id)

    const customerId = subscription.customer as string
    const planName = subscription.metadata?.plan
    const priceId = subscription.items.data[0]?.price.id

    if (!planName) {
      console.error('Plano não encontrado na assinatura')
      return
    }

    if (!stripe) {
      console.error('Stripe não está configurado')
      return
    }

    // Buscar cliente no Stripe para obter email
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer

    if (!customer.email) {
      console.error('Email do cliente não encontrado')
      return
    }

    // Buscar usuário no Supabase
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', customer.email)
      .single()

    if (!user) {
      console.error('Usuário não encontrado no Supabase')
      return
    }

    // Criar registro de assinatura
    await subscriptions.create({
      user_id: user.id,
      plan: planName as any,
      status: 'active',
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    })

    console.log(`Assinatura criada para usuário ${customer.email}`)
  } catch (error) {
    console.error('Erro ao processar assinatura criada:', error)
  }
}

// Lidar com assinatura atualizada
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    console.log('Assinatura atualizada:', subscription.id)

    const status = subscription.status === 'active' ? 'active' : 'inactive'

    // Atualizar assinatura no Supabase
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: status as any,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id)
      .select('user_id')

    if (error) {
      console.error('Erro ao atualizar assinatura:', error)
      return
    }

    // Atualizar status do usuário
    if (data && data[0]) {
      await users.updateSubscriptionPlan(data[0].user_id, subscription.metadata?.plan || 'free', status)
    }

    console.log(`Assinatura ${subscription.id} atualizada para status ${status}`)
  } catch (error) {
    console.error('Erro ao processar assinatura atualizada:', error)
  }
}

// Lidar com assinatura cancelada
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    console.log('Assinatura cancelada:', subscription.id)

    // Cancelar assinatura no Supabase
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id)
      .select('user_id')

    if (error) {
      console.error('Erro ao cancelar assinatura:', error)
      return
    }

    // Reverter usuário para plano gratuito
    if (data && data[0]) {
      await users.updateSubscriptionPlan(data[0].user_id, 'free', 'inactive')
    }

    console.log(`Assinatura ${subscription.id} cancelada`)
  } catch (error) {
    console.error('Erro ao processar assinatura cancelada:', error)
  }
}

// Lidar com pagamento bem-sucedido
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log('Pagamento bem-sucedido:', invoice.id)

    const subscriptionId = (invoice as any).subscription as string

    if (subscriptionId) {
      // Renovar créditos do usuário baseado no plano
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('user_id, plan')
        .eq('stripe_subscription_id', subscriptionId)
        .single()

      if (subscription) {
        // Resetar créditos mensais (implementar lógica específica)
        console.log(`Renovando créditos para usuário ${subscription.user_id} no plano ${subscription.plan}`)
      }
    }
  } catch (error) {
    console.error('Erro ao processar pagamento bem-sucedido:', error)
  }
}

// Lidar com pagamento falhado
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log('Pagamento falhado:', invoice.id)

    const subscriptionId = (invoice as any).subscription as string

    if (subscriptionId) {
      // Marcar assinatura como com problema de pagamento
      await supabase
        .from('subscriptions')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscriptionId)
    }
  } catch (error) {
    console.error('Erro ao processar pagamento falhado:', error)
  }
} 