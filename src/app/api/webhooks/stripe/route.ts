import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPlanByStripePrice } from '@/lib/stripe'
import { supabase, users, subscriptions } from '@/lib/supabase'

// Configurar Stripe diretamente com verificação
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY não está definida')
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-04-30.basil',
}) : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  if (!stripe) {
    console.error('Stripe não está configurado')
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature || !webhookSecret) {
      console.error('Webhook signature ou secret não encontrado')
      return NextResponse.json({ error: 'Webhook signature missing' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Erro na verificação do webhook:', err)
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
    }

    console.log('Webhook recebido:', event.type)

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
        console.log(`Evento não tratado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro no webhook:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

// Lidar com checkout completado
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('Checkout completado:', session.id)

    const customerEmail = session.customer_details?.email
    const planName = session.metadata?.plan
    const subscriptionId = session.subscription as string

    if (!customerEmail || !planName) {
      console.error('Email do cliente ou plano não encontrado no checkout')
      return
    }

    // Buscar ou criar usuário no Supabase
    let userId: string

    // Tentar encontrar usuário existente
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', customerEmail)
      .single()

    if (existingUser) {
      userId = existingUser.id
    } else {
      // Criar novo usuário
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email: customerEmail,
        email_confirm: true,
      })

      if (userError || !newUser.user) {
        console.error('Erro ao criar usuário:', userError)
        return
      }

      userId = newUser.user.id

      // Criar perfil do usuário
      await users.createProfile(userId, {
        email: customerEmail,
        subscription_plan: planName as any,
        subscription_status: 'active',
      })
    }

    // Atualizar plano do usuário
    await users.updateSubscriptionPlan(userId, planName, 'active')

    console.log(`Usuário ${customerEmail} atualizado para plano ${planName}`)
  } catch (error) {
    console.error('Erro ao processar checkout completado:', error)
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