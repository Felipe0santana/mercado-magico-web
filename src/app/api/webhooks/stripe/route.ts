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
  if (amount >= 2999) return { plan: 'premium', credits: -1 }
  if (amount >= 1999) return { plan: 'pro', credits: 200 }
  if (amount >= 999) return { plan: 'plus', credits: 50 }
  return { plan: 'free', credits: 10 }
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

    // NOVA ABORDAGEM: Usar SQL direto para buscar e atualizar
    try {
      // 1. Buscar usuário usando SQL direto
      const { data: users, error: searchError } = await supabaseAdmin
        .rpc('get_user_by_email_simple', { email_param: email })

      if (searchError || !users || users.length === 0) {
        console.log(`👤 Usuário ${email} não encontrado ou erro na busca. Tentando abordagem alternativa...`)
        
        // 2. Se não encontrar, usar updateUserById com todos os IDs possíveis
        // Isso é uma abordagem de força bruta, mas funciona
        await updateUserByEmailForce(email, plan, credits, session, amount)
      } else {
        // 3. Usuário encontrado, atualizar diretamente
        const userId = users[0].id
        console.log(`👤 Usuário ${email} encontrado (ID: ${userId}), atualizando...`)
        await updateUserById(userId, plan, credits, session, amount)
      }

    } catch (error) {
      console.error('❌ Erro ao processar usuário:', error)
      
      // Como último recurso, tentar força bruta
      console.log('🔄 Tentando força bruta como último recurso...')
      await updateUserByEmailForce(email, plan, credits, session, amount)
    }

  } catch (error) {
    console.error('❌ Erro ao processar checkout completed:', error)
  }
}

// Função para atualizar usuário por ID
async function updateUserById(userId: string, plan: string, credits: number, session: Stripe.Checkout.Session, amount: number) {
  try {
    const updateData = {
      user_metadata: {
        subscription_plan: plan,
        subscription_status: 'active',
        credits_remaining: credits,
        stripe_customer_id: session.customer,
        last_payment_amount: amount,
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        webhook_processed: true,
        force_refresh: new Date().getTime()
      }
    }

    const { error: updateError } = await supabaseAdmin!.auth.admin.updateUserById(userId, updateData)

    if (updateError) {
      console.error('❌ Erro ao atualizar usuário:', updateError)
      return false
    }

    console.log(`✅ Usuário ${userId} atualizado para ${plan} com ${credits === -1 ? 'créditos ilimitados' : credits + ' créditos'}`)
    return true

  } catch (error) {
    console.error('❌ Erro ao atualizar usuário por ID:', error)
    return false
  }
}

// Função de força bruta para atualizar usuário por email
async function updateUserByEmailForce(email: string, plan: string, credits: number, session: Stripe.Checkout.Session, amount: number) {
  try {
    console.log(`🔄 Iniciando força bruta para ${email}...`)
    
    // Tentar múltiplas abordagens
    const approaches = [
      // Abordagem 1: Tentar listUsers em lotes pequenos
      async () => {
        try {
          const { data: authUsers } = await supabaseAdmin!.auth.admin.listUsers({ page: 1, perPage: 100 })
          if (authUsers?.users) {
            const user = authUsers.users.find(u => u.email === email)
            if (user) {
              console.log(`🎯 Usuário encontrado via listUsers: ${user.id}`)
              return await updateUserById(user.id, plan, credits, session, amount)
            }
          }
          return false
        } catch (error) {
          console.log('⚠️ Abordagem listUsers falhou:', error)
          return false
        }
      },

      // Abordagem 2: Criar usuário se não existir
      async () => {
        try {
          console.log(`👤 Tentando criar usuário ${email}...`)
          const { data: newUser, error: createError } = await supabaseAdmin!.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
              full_name: email.split('@')[0],
              subscription_plan: plan,
              subscription_status: 'active',
              credits_remaining: credits,
              stripe_customer_id: session.customer,
              last_payment_amount: amount,
              last_payment_date: new Date().toISOString(),
              created_via_stripe: true,
              updated_at: new Date().toISOString(),
              webhook_processed: true
            }
          })

          if (createError) {
            console.log('⚠️ Criação falhou (usuário pode já existir):', createError.message)
            return false
          }

          console.log(`✅ Usuário ${email} criado com sucesso via webhook`)
          return true
        } catch (error) {
          console.log('⚠️ Abordagem criação falhou:', error)
          return false
        }
      }
    ]

    // Tentar cada abordagem
    for (let i = 0; i < approaches.length; i++) {
      console.log(`🔄 Tentando abordagem ${i + 1}...`)
      const success = await approaches[i]()
      if (success) {
        console.log(`✅ Sucesso na abordagem ${i + 1}!`)
        return
      }
    }

    console.error(`❌ Todas as abordagens falharam para ${email}`)

  } catch (error) {
    console.error('❌ Erro na força bruta:', error)
  }
} 