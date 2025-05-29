// @ts-ignore
// deno-lint-ignore-file
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 [INSTANT] Webhook recebido')

    // Verificar secret na URL para segurança
    const url = new URL(req.url)
    const urlSecret = url.searchParams.get('secret')
    const expectedSecret = Deno.env.get('WEBHOOK_URL_SECRET') || 'mercado-magico-secret-2024'
    
    if (urlSecret !== expectedSecret) {
      console.error('❌ [INSTANT] Secret da URL inválido')
      return new Response('Unauthorized', { status: 401 })
    }

    // Configurar Supabase com Service Role Key (permissão total)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Configurar Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY não configurada')
    }

    // Importar Stripe dinamicamente
    const { default: Stripe } = await import('https://esm.sh/stripe@14.21.0')
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    // Verificar assinatura do Stripe
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!signature || !webhookSecret) {
      console.error('❌ [INSTANT] Signature ou webhook secret ausente')
      return new Response('Bad Request', { status: 400 })
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log(`✅ [INSTANT] Evento verificado: ${event.type}`)
    } catch (err: any) {
      console.error('❌ [INSTANT] Falha na verificação:', err.message)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    // Processar apenas checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      await processCheckoutCompleted(session, supabase)
    } else {
      console.log(`⚠️ [INSTANT] Evento ${event.type} ignorado`)
    }

    return new Response(
      JSON.stringify({ 
        received: true, 
        processed: true,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('❌ [INSTANT] Erro geral:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// Mapear valores do Stripe para planos
function mapStripeAmountToPlan(amount: number) {
  console.log(`💰 [INSTANT] Mapeando valor: R$ ${amount/100}`)
  if (amount >= 2999) return { plan: 'premium', credits: -1 }
  if (amount >= 1999) return { plan: 'pro', credits: 200 }
  if (amount >= 999) return { plan: 'plus', credits: 50 }
  return { plan: 'free', credits: 10 }
}

// Função para determinar o melhor plano
function getBetterPlan(currentPlan: string, newPlan: string) {
  const planHierarchy = { 'free': 0, 'plus': 1, 'pro': 2, 'premium': 3 }
  const currentLevel = planHierarchy[currentPlan as keyof typeof planHierarchy] || 0
  const newLevel = planHierarchy[newPlan as keyof typeof planHierarchy] || 0
  
  return newLevel >= currentLevel ? newPlan : currentPlan
}

async function processCheckoutCompleted(session: any, supabase: any) {
  try {
    console.log('🛒 [INSTANT] Processando checkout.session.completed')
    
    const email = session.customer_details?.email
    const amount = session.amount_total || 0

    if (!email) {
      console.error('❌ [INSTANT] Email do cliente não encontrado')
      return
    }

    const { plan, credits } = mapStripeAmountToPlan(amount)
    console.log(`📊 [INSTANT] Processando: ${email} → ${plan} (${credits === -1 ? 'ilimitados' : credits} créditos) - R$ ${amount/100}`)

    // 1. Gravar evento na tabela events para trigger do Realtime
    const eventData = {
      event_type: 'stripe_payment_completed',
      user_email: email,
      stripe_session_id: session.id,
      amount: amount,
      plan: plan,
      credits: credits,
      processed_at: new Date().toISOString(),
      metadata: {
        customer_id: session.customer,
        payment_status: session.payment_status,
        mode: session.mode
      }
    }

    const { error: eventError } = await supabase
      .from('events')
      .insert(eventData)

    if (eventError) {
      console.error('❌ [INSTANT] Erro ao inserir evento:', eventError)
    } else {
      console.log('✅ [INSTANT] Evento inserido na tabela events')
    }

    // 2. Atualizar usuário com retry exponencial
    await updateUserWithRetry(email, plan, credits, session, amount, supabase)

  } catch (error) {
    console.error('❌ [INSTANT] Erro ao processar checkout:', error)
  }
}

async function updateUserWithRetry(email: string, newPlan: string, newCredits: number, session: any, amount: number, supabase: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [INSTANT] Tentativa ${attempt}/${maxRetries} para ${email}`)
      
      // Buscar usuário usando Service Role Key (sem restrições)
      const { data: users, error: searchError } = await supabase.auth.admin.listUsers()
      
      if (searchError) {
        throw new Error(`Erro ao listar usuários: ${searchError.message}`)
      }

      const user = users.users.find((u: any) => u.email === email)
      let userId: string | null = null
      let currentPlan = 'free'

      if (user) {
        userId = user.id
        currentPlan = user.user_metadata?.subscription_plan || 'free'
        console.log(`✅ [INSTANT] Usuário encontrado: ${email} (${currentPlan})`)
      }

      // Determinar o melhor plano
      const bestPlan = getBetterPlan(currentPlan, newPlan)
      const finalCredits = bestPlan === 'premium' ? -1 : 
                          bestPlan === 'pro' ? 200 : 
                          bestPlan === 'plus' ? 50 : 10

      console.log(`🎯 [INSTANT] Plano: ${currentPlan} → ${newPlan} → ${bestPlan}`)

      const updateData = {
        user_metadata: {
          subscription_plan: bestPlan,
          subscription_status: 'active',
          credits_remaining: finalCredits,
          stripe_customer_id: session.customer,
          last_payment_amount: amount,
          last_payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          instant_processed: true,
          force_refresh: new Date().getTime()
        }
      }

      if (userId) {
        // Atualizar usuário existente
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, updateData)
        
        if (updateError) {
          throw new Error(`Erro ao atualizar usuário: ${updateError.message}`)
        }
        
        console.log(`✅ [INSTANT] Usuário ${email} atualizado para ${bestPlan}`)
      } else {
        // Criar novo usuário
        const { error: createError } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            full_name: email.split('@')[0],
            ...updateData.user_metadata,
            created_via_stripe: true,
            created_via_instant: true
          }
        })

        if (createError) {
          throw new Error(`Erro ao criar usuário: ${createError.message}`)
        }

        console.log(`✅ [INSTANT] Usuário ${email} criado com ${bestPlan}`)
      }

      // 3. Inserir notificação para Realtime push
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_email: email,
          type: 'plan_updated',
          title: 'Plano Atualizado!',
          message: `Seu plano foi atualizado para ${bestPlan}`,
          data: {
            old_plan: currentPlan,
            new_plan: bestPlan,
            credits: finalCredits,
            amount: amount
          },
          created_at: new Date().toISOString()
        })

      if (notificationError) {
        console.error('⚠️ [INSTANT] Erro ao inserir notificação:', notificationError)
      } else {
        console.log('✅ [INSTANT] Notificação inserida para Realtime')
      }

      return true // Sucesso

    } catch (error) {
      console.error(`❌ [INSTANT] Tentativa ${attempt} falhou:`, error.message)
      
      if (attempt === maxRetries) {
        // Gravar erro para retry posterior
        await supabase
          .from('error_logs')
          .insert({
            error_type: 'stripe_webhook_failed',
            user_email: email,
            error_message: error.message,
            retry_count: maxRetries,
            created_at: new Date().toISOString(),
            metadata: { session_id: session.id, amount, plan: newPlan }
          })
        
        console.error(`❌ [INSTANT] Falha permanente após ${maxRetries} tentativas`)
        return false
      }

      // Backoff exponencial: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000
      console.log(`⏳ [INSTANT] Aguardando ${delay}ms antes da próxima tentativa...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
} 