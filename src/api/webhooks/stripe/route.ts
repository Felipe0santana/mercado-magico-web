import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

// WEBHOOK REALTIME INSTANTÂNEO - Sistema Completamente Automático
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

// MODO DEBUG - aceitar requests sem assinatura
const DEBUG_MODE = true

// Mapear valores do Stripe para planos
function mapStripeAmountToPlan(amount: number) {
  console.log(`💰 [REALTIME] Mapeando valor: R$ ${amount/100}`)
  
  // Valores em centavos
  if (amount >= 4999) return { plan: 'super', credits: -1 }      // R$ 49,99+ = Super
  if (amount >= 2999) return { plan: 'premium', credits: -1 }    // R$ 29,99+ = Premium  
  if (amount >= 1999) return { plan: 'pro', credits: 200 }       // R$ 19,99+ = Pro
  if (amount >= 999) return { plan: 'plus', credits: 50 }        // R$ 9,99+ = Plus
  
  return { plan: 'free', credits: 10 }
}

// Função para determinar o melhor plano entre dois
function getBetterPlan(currentPlan: string, newPlan: string) {
  const planHierarchy = { 'free': 0, 'plus': 1, 'pro': 2, 'premium': 3, 'super': 4 }
  const currentLevel = planHierarchy[currentPlan as keyof typeof planHierarchy] || 0
  const newLevel = planHierarchy[newPlan as keyof typeof planHierarchy] || 0
  
  return newLevel >= currentLevel ? newPlan : currentPlan
}

export async function POST(request: NextRequest) {
  console.log('🚀 [REALTIME] Webhook do Stripe recebido - Sistema Automático')
  
  if (!stripe) {
    console.error('❌ [REALTIME] Stripe não está configurado')
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('❌ [REALTIME] Webhook signature não encontrada')
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
        console.log(`✅ [REALTIME] Assinatura verificada com sucesso usando secret ${name}`)
        break
      } catch (err) {
        const error = err as Error
        console.log(`⚠️ [REALTIME] Falha na verificação com secret ${name}:`, error.message)
        verificationError = error
      }
    }

    if (!event!) {
      console.error('❌ [REALTIME] Falha na verificação com todos os secrets disponíveis')
      return NextResponse.json({ 
        error: 'Webhook signature verification failed',
        details: verificationError?.message || 'Unknown error'
      }, { status: 400 })
    }

    console.log(`📨 [REALTIME] Evento recebido: ${event.type} (verificado com ${secretUsed})`)

    // Processar apenas checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
    } else {
      console.log(`⚠️ [REALTIME] Evento ${event.type} ignorado (não implementado)`)
    }

    console.log('✅ [REALTIME] Webhook processado com sucesso - Sistema Automático')
    return NextResponse.json({ 
      received: true, 
      secret_used: secretUsed,
      realtime_enabled: true,
      automatic_system: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const err = error as Error
    console.error('❌ [REALTIME] Erro no webhook:', err)
    return NextResponse.json({ 
      error: 'Webhook handler failed',
      details: err.message 
    }, { status: 500 })
  }
}

// Função para lidar com checkout completado - Sistema Automático
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('🛒 [REALTIME] Processando checkout.session.completed - Sistema Automático')
    
    const email = session.customer_details?.email
    const amount = session.amount_total || 0

    if (!email) {
      console.error('❌ [REALTIME] Email do cliente não encontrado')
      return
    }

    const { plan, credits } = mapStripeAmountToPlan(amount)
    console.log(`📊 [REALTIME] Processando: ${email} → ${plan} (${credits === -1 ? 'ilimitados' : credits} créditos) - R$ ${amount/100}`)

    if (!supabaseAdmin) {
      console.error('❌ [REALTIME] Cliente admin não configurado')
      return
    }

    // Sistema de múltiplas tentativas automáticas
    const maxAttempts = 5
    let success = false

    for (let attempt = 1; attempt <= maxAttempts && !success; attempt++) {
      console.log(`🔄 [REALTIME] Tentativa ${attempt}/${maxAttempts} de atualização automática...`)
      
      try {
        // 1. Inserir evento para Realtime
        await insertRealtimeEvent(email, session, plan, credits, amount, attempt)

        // 2. Atualizar usuário com múltiplos triggers
        success = await updateUserWithMultipleTriggers(email, plan, credits, session, amount, attempt)

        if (success) {
          console.log(`✅ [REALTIME] Atualização automática bem-sucedida na tentativa ${attempt}`)
        } else {
          console.log(`⚠️ [REALTIME] Tentativa ${attempt} falhou, tentando novamente em 2 segundos...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (error) {
        console.error(`❌ [REALTIME] Erro na tentativa ${attempt}:`, error)
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }

    if (!success) {
      console.error('❌ [REALTIME] Falha em todas as tentativas de atualização automática')
    }

  } catch (error) {
    console.error('❌ [REALTIME] Erro ao processar checkout completed:', error)
  }
}

// Inserir evento para Realtime com múltiplos triggers
async function insertRealtimeEvent(email: string, session: Stripe.Checkout.Session, plan: string, credits: number, amount: number, attempt: number) {
  try {
    console.log(`⚡ [REALTIME] Inserindo evento para push instantâneo (tentativa ${attempt})...`)
    
    if (!supabaseAdmin) {
      console.error('❌ [REALTIME] Cliente admin não configurado')
      return
    }

    const timestamp = new Date().toISOString()
    const uniqueId = `${Date.now()}_${attempt}_${Math.random().toString(36).substr(2, 9)}`

    // Inserir na tabela events (trigger automático do Realtime)
    const eventData = {
      event_type: 'stripe_payment_completed',
      user_email: email,
      stripe_session_id: session.id,
      amount: amount,
      plan: plan,
      credits: credits,
      processed_at: timestamp,
      metadata: {
        customer_id: session.customer,
        payment_status: session.payment_status,
        mode: session.mode,
        webhook_source: 'netlify',
        realtime_enabled: true,
        automatic_system: true,
        attempt_number: attempt,
        unique_trigger_id: uniqueId,
        force_refresh_timestamp: Date.now()
      }
    }

    const { error: eventError } = await supabaseAdmin
      .from('events')
      .insert(eventData)

    if (eventError) {
      console.error('❌ [REALTIME] Erro ao inserir evento:', eventError)
    } else {
      console.log(`✅ [REALTIME] Evento inserido na tabela events - Trigger ${uniqueId}`)
    }

    // Inserir notificação para push instantâneo
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_email: email,
        type: 'plan_updated',
        title: 'Plano Atualizado Automaticamente!',
        message: `Seu plano foi atualizado para ${plan} - Sistema Automático`,
        data: {
          new_plan: plan,
          credits: credits,
          amount: amount,
          source: 'netlify_webhook',
          automatic_system: true,
          attempt_number: attempt,
          unique_trigger_id: uniqueId
        },
        created_at: timestamp
      })

    if (notificationError) {
      console.error('⚠️ [REALTIME] Erro ao inserir notificação:', notificationError)
    } else {
      console.log(`✅ [REALTIME] Notificação inserida para push instantâneo - Trigger ${uniqueId}`)
    }

  } catch (error) {
    console.error('❌ [REALTIME] Erro ao inserir evento Realtime:', error)
  }
}

// Atualizar usuário com múltiplos triggers automáticos
async function updateUserWithMultipleTriggers(email: string, newPlan: string, newCredits: number, session: Stripe.Checkout.Session, amount: number, attempt: number) {
  try {
    console.log(`🔄 [REALTIME] Processando pagamento automático para ${email}: ${newPlan} (R$ ${amount/100}) - Tentativa ${attempt}`)
    
    if (!supabaseAdmin) {
      console.error('❌ Cliente admin não configurado')
      return false
    }

    let userId: string | null = null
    let currentPlan = 'free'
    let userFound = false

    // Buscar usuário
    try {
      console.log('🔍 [REALTIME] Buscando usuário...')
      const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (!listError && authUsers?.users) {
        const user = authUsers.users.find((u: any) => u.email === email)
        if (user) {
          userId = user.id
          currentPlan = user.user_metadata?.subscription_plan || 'free'
          userFound = true
          console.log(`✅ [REALTIME] Usuário encontrado: ${email} (${currentPlan})`)
        }
      }
    } catch (error) {
      console.log('⚠️ [REALTIME] Erro ao buscar usuário:', error)
    }

    // Determinar o melhor plano
    const bestPlan = getBetterPlan(currentPlan, newPlan)
    const finalCredits = bestPlan === 'super' ? -1 :
                        bestPlan === 'premium' ? -1 : 
                        bestPlan === 'pro' ? 200 : 
                        bestPlan === 'plus' ? 50 : 10

    console.log(`🎯 [REALTIME] Plano: ${currentPlan} → ${newPlan} → ${bestPlan} (${finalCredits === -1 ? 'ilimitados' : finalCredits} créditos)`)

    // Múltiplos triggers para forçar atualização automática
    const timestamp = Date.now()
    const uniqueRefreshId = `${timestamp}_${attempt}_${Math.random().toString(36).substr(2, 9)}`

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
        automatic_system: true,
        force_refresh: timestamp,
        force_refresh_id: uniqueRefreshId,
        auto_update_trigger: timestamp,
        realtime_trigger: `auto_${timestamp}`,
        processing_method: userFound ? 'update' : 'create',
        attempt_number: attempt,
        last_webhook_timestamp: timestamp
      }
    }

    if (userFound && userId) {
      // Atualizar usuário existente com múltiplos triggers
      try {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData)
        
        if (updateError) {
          console.error('❌ [REALTIME] Erro ao atualizar usuário:', updateError)
          return false
        }
        
        console.log(`✅ [REALTIME] Usuário ${email} atualizado automaticamente para ${bestPlan} com ${finalCredits === -1 ? 'créditos ilimitados' : finalCredits + ' créditos'}`)
        
        // Trigger adicional após 1 segundo
        setTimeout(async () => {
          try {
            if (!supabaseAdmin) {
              console.log('⚠️ [REALTIME] Cliente admin não disponível para trigger adicional')
              return
            }
            
            const additionalTrigger = {
              user_metadata: {
                ...updateData.user_metadata,
                additional_trigger: Date.now(),
                secondary_refresh: `secondary_${Date.now()}`
              }
            }
            
            await supabaseAdmin.auth.admin.updateUserById(userId!, additionalTrigger)
            console.log(`🔄 [REALTIME] Trigger adicional enviado para ${email}`)
          } catch (error) {
            console.log('⚠️ [REALTIME] Erro no trigger adicional:', error)
          }
        }, 1000)
        
        return true
      } catch (error) {
        console.error('❌ [REALTIME] Erro na atualização:', error)
        return false
      }
    } else {
      // Criar novo usuário
      try {
        console.log(`👤 [REALTIME] Criando novo usuário ${email}...`)
        
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            full_name: email.split('@')[0],
            ...updateData.user_metadata,
            created_via_stripe: true,
            created_via_automatic: true
          }
        })

        if (createError) {
          console.error('❌ [REALTIME] Erro ao criar usuário:', createError)
          return false
        }

        console.log(`✅ [REALTIME] Usuário ${email} criado automaticamente com ${bestPlan} e ${finalCredits === -1 ? 'créditos ilimitados' : finalCredits + ' créditos'}`)
        return true
      } catch (error) {
        console.error('❌ [REALTIME] Erro na criação:', error)
        return false
      }
    }

  } catch (error) {
    console.error('❌ [REALTIME] Erro geral:', error)
    return false
  }
} 