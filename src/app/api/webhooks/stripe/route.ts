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

// Mapear valores do Stripe para planos
function mapStripeAmountToPlan(amount: number) {
  console.log(`💰 Mapeando valor: R$ ${amount/100}`)
  if (amount >= 2999) return { plan: 'premium', credits: -1 }
  if (amount >= 1999) return { plan: 'pro', credits: 200 }
  if (amount >= 999) return { plan: 'plus', credits: 50 }
  return { plan: 'free', credits: 10 }
}

// Função para determinar o melhor plano entre dois
function getBetterPlan(currentPlan: string, newPlan: string) {
  const planHierarchy = { 'free': 0, 'plus': 1, 'pro': 2, 'premium': 3 }
  const currentLevel = planHierarchy[currentPlan as keyof typeof planHierarchy] || 0
  const newLevel = planHierarchy[newPlan as keyof typeof planHierarchy] || 0
  
  return newLevel >= currentLevel ? newPlan : currentPlan
}

export async function POST(request: NextRequest) {
  console.log('🚀 Webhook do Stripe recebido')
  
  if (!stripe) {
    console.error('❌ Stripe não está configurado')
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('❌ Webhook signature não encontrada')
      return NextResponse.json({ error: 'Webhook signature missing' }, { status: 400 })
    }

    let event: Stripe.Event
    let secretUsed = ''

    // Tentar verificar assinatura
    const secretsToTry = [
      { secret: cliWebhookSecret, name: 'CLI' },
      { secret: webhookSecret, name: 'Production' }
    ].filter(s => s.secret)

    let verificationError: Error | null = null

    for (const { secret, name } of secretsToTry) {
      if (!secret) continue
      
      try {
        event = stripe.webhooks.constructEvent(body, signature, secret)
        secretUsed = name
        console.log(`✅ Assinatura verificada com sucesso usando secret ${name}`)
        break
      } catch (err) {
        const error = err as Error
        console.log(`⚠️ Falha na verificação com secret ${name}:`, error.message)
        verificationError = error
      }
    }

    if (!event!) {
      console.error('❌ Falha na verificação com todos os secrets disponíveis')
      return NextResponse.json({ 
        error: 'Webhook signature verification failed',
        details: verificationError?.message || 'Unknown error'
      }, { status: 400 })
    }

    console.log(`📨 Evento recebido: ${event.type} (verificado com ${secretUsed})`)

    // Processar apenas checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
    } else {
      console.log(`⚠️ Evento ${event.type} ignorado (não implementado)`)
    }

    console.log('✅ Webhook processado com sucesso')
    return NextResponse.json({ received: true, secret_used: secretUsed })
  } catch (error) {
    const err = error as Error
    console.error('❌ Erro no webhook:', err)
    return NextResponse.json({ 
      error: 'Webhook handler failed',
      details: err.message 
    }, { status: 500 })
  }
}

// Função simplificada para lidar com checkout completado
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('🛒 Processando checkout.session.completed')
    
    const email = session.customer_details?.email
    const amount = session.amount_total || 0

    if (!email) {
      console.error('❌ Email do cliente não encontrado')
      return
    }

    const { plan, credits } = mapStripeAmountToPlan(amount)
    console.log(`📊 Processando: ${email} → ${plan} (${credits === -1 ? 'ilimitados' : credits} créditos) - R$ ${amount/100}`)

    if (!supabaseAdmin) {
      console.error('❌ Cliente admin não configurado')
      return
    }

    // Buscar usuário usando força bruta
    await updateUserWithBestPlan(email, plan, credits, session, amount)

  } catch (error) {
    console.error('❌ Erro ao processar checkout completed:', error)
  }
}

// Função inteligente para atualizar usuário sempre com o melhor plano
async function updateUserWithBestPlan(email: string, newPlan: string, newCredits: number, session: Stripe.Checkout.Session, amount: number) {
  try {
    console.log(`🔄 Buscando usuário ${email} para atualização inteligente...`)
    
    // Tentar buscar usuário via listUsers
    let userId: string | null = null
    let currentPlan = 'free'
    let currentCredits = 10
    
    try {
      const { data: authUsers } = await supabaseAdmin!.auth.admin.listUsers({ page: 1, perPage: 100 })
      if (authUsers?.users) {
        const user = authUsers.users.find(u => u.email === email)
        if (user) {
          userId = user.id
          currentPlan = user.user_metadata?.subscription_plan || 'free'
          currentCredits = user.user_metadata?.credits_remaining || 10
          console.log(`👤 Usuário encontrado: ${email} (${currentPlan}, ${currentCredits} créditos)`)
        }
      }
    } catch (error) {
      console.log('⚠️ Erro ao buscar usuário via listUsers:', error)
    }

    // Determinar o melhor plano
    const bestPlan = getBetterPlan(currentPlan, newPlan)
    const finalCredits = bestPlan === 'premium' ? -1 : 
                        bestPlan === 'pro' ? 200 : 
                        bestPlan === 'plus' ? 50 : 10

    console.log(`🎯 Plano atual: ${currentPlan} → Novo: ${newPlan} → Melhor: ${bestPlan} (${finalCredits === -1 ? 'ilimitados' : finalCredits} créditos)`)

    const updateData = {
      user_metadata: {
        subscription_plan: bestPlan,
        subscription_status: 'active',
        credits_remaining: finalCredits,
        stripe_customer_id: session.customer,
        last_payment_amount: amount,
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        webhook_processed: true,
        force_refresh: new Date().getTime(),
        payment_history: JSON.stringify([
          { plan: newPlan, amount, date: new Date().toISOString() }
        ])
      }
    }

    if (userId) {
      // Atualizar usuário existente
      const { error: updateError } = await supabaseAdmin!.auth.admin.updateUserById(userId, updateData)
      
      if (updateError) {
        console.error('❌ Erro ao atualizar usuário:', updateError)
        return false
      }
      
      console.log(`✅ Usuário ${email} atualizado para ${bestPlan} com ${finalCredits === -1 ? 'créditos ilimitados' : finalCredits + ' créditos'}`)
      return true
    } else {
      // Criar novo usuário
      console.log(`👤 Criando novo usuário ${email}...`)
      const { data: newUser, error: createError } = await supabaseAdmin!.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: email.split('@')[0],
          ...updateData.user_metadata,
          created_via_stripe: true
        }
      })

      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError)
        return false
      }

      console.log(`✅ Usuário ${email} criado com ${bestPlan} e ${finalCredits === -1 ? 'créditos ilimitados' : finalCredits + ' créditos'}`)
      return true
    }

  } catch (error) {
    console.error('❌ Erro na atualização inteligente:', error)
    return false
  }
}