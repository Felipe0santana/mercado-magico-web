import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

// WEBHOOK REALTIME INSTANTÂNEO - Deploy Test
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
  console.log('🚀 [REALTIME] Webhook do Stripe recebido')
  
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

    console.log('✅ [REALTIME] Webhook processado com sucesso')
    return NextResponse.json({ 
      received: true, 
      secret_used: secretUsed,
      realtime_enabled: true,
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

// Função simplificada para lidar com checkout completado
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('🛒 [REALTIME] Processando checkout.session.completed')
    
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

    // 1. PRIMEIRO: Inserir evento na tabela events para trigger Realtime
    await insertRealtimeEvent(email, session, plan, credits, amount)

    // 2. SEGUNDO: Atualizar usuário (processo existente)
    await updateUserWithBestPlan(email, plan, credits, session, amount)

  } catch (error) {
    console.error('❌ [REALTIME] Erro ao processar checkout completed:', error)
  }
}

// NOVA FUNÇÃO: Inserir evento para Realtime
async function insertRealtimeEvent(email: string, session: Stripe.Checkout.Session, plan: string, credits: number, amount: number) {
  try {
    console.log('⚡ [REALTIME] Inserindo evento para push instantâneo...')
    
    if (!supabaseAdmin) {
      console.error('❌ [REALTIME] Cliente admin não configurado')
      return
    }

    // Inserir na tabela events (trigger automático do Realtime)
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
        mode: session.mode,
        webhook_source: 'netlify',
        realtime_enabled: true
      }
    }

    const { error: eventError } = await supabaseAdmin
      .from('events')
      .insert(eventData)

    if (eventError) {
      console.error('❌ [REALTIME] Erro ao inserir evento:', eventError)
    } else {
      console.log('✅ [REALTIME] Evento inserido na tabela events - Realtime ativado!')
    }

    // Inserir notificação para push instantâneo
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_email: email,
        type: 'plan_updated',
        title: 'Plano Atualizado!',
        message: `Seu plano foi atualizado para ${plan}`,
        data: {
          new_plan: plan,
          credits: credits,
          amount: amount,
          source: 'netlify_webhook'
        },
        created_at: new Date().toISOString()
      })

    if (notificationError) {
      console.error('⚠️ [REALTIME] Erro ao inserir notificação:', notificationError)
    } else {
      console.log('✅ [REALTIME] Notificação inserida para push instantâneo!')
    }

  } catch (error) {
    console.error('❌ [REALTIME] Erro ao inserir evento Realtime:', error)
  }
}

// Função inteligente para atualizar usuário sempre com o melhor plano
async function updateUserWithBestPlan(email: string, newPlan: string, newCredits: number, session: Stripe.Checkout.Session, amount: number) {
  try {
    console.log(`🔄 [HYBRID] Processando pagamento para ${email}: ${newPlan} (R$ ${amount/100})`);
    
    if (!supabaseAdmin) {
      console.error('❌ Cliente admin não configurado');
      return false;
    }

    let userId: string | null = null;
    let currentPlan = 'free';
    let userFound = false;

    // ABORDAGEM HÍBRIDA: Tentar múltiplas estratégias
    
    // 1. Tentar listUsers() primeiro
    try {
      console.log('🔍 [HYBRID] Tentando listUsers()...');
      const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (!listError && authUsers?.users) {
        const user = authUsers.users.find((u: any) => u.email === email);
        if (user) {
          userId = user.id;
          currentPlan = user.user_metadata?.subscription_plan || 'free';
          userFound = true;
          console.log(`✅ [HYBRID] Usuário encontrado via listUsers: ${email} (${currentPlan})`);
        }
      } else {
        console.log('⚠️ [HYBRID] listUsers falhou:', listError?.message);
      }
    } catch (error) {
      console.log('⚠️ [HYBRID] Erro no listUsers:', error);
    }

    // 2. Se não encontrou, tentar busca SQL direta
    if (!userFound) {
      try {
        console.log('🔍 [HYBRID] Tentando busca SQL direta...');
        const { data: users, error: searchError } = await supabaseAdmin
          .from('auth.users')
          .select('id, email, raw_user_meta_data')
          .eq('email', email)
          .single();

        if (!searchError && users) {
          userId = users.id;
          currentPlan = users.raw_user_meta_data?.subscription_plan || 'free';
          userFound = true;
          console.log(`✅ [HYBRID] Usuário encontrado via SQL: ${email} (${currentPlan})`);
        } else {
          console.log('⚠️ [HYBRID] Busca SQL falhou:', searchError?.message);
        }
      } catch (error) {
        console.log('⚠️ [HYBRID] Erro na busca SQL:', error);
      }
    }

    // 3. Se não encontrou, tentar getUserById com IDs conhecidos
    if (!userFound) {
      console.log('🔍 [HYBRID] Tentando busca por IDs conhecidos...');
      const knownUserIds = [
        'f6592d4d-6bbb-461a-af1e-917cd1c31f7', // admin6
        'outros-ids-conhecidos'
      ];

      for (const testId of knownUserIds) {
        try {
          const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(testId);
          if (!error && user?.user?.email === email) {
            userId = testId;
            currentPlan = user.user.user_metadata?.subscription_plan || 'free';
            userFound = true;
            console.log(`✅ [HYBRID] Usuário encontrado via ID conhecido: ${email}`);
            break;
          }
        } catch (error) {
          // Continuar tentando
        }
      }
    }

    // Determinar o melhor plano
    const bestPlan = getBetterPlan(currentPlan, newPlan);
    const finalCredits = bestPlan === 'premium' ? -1 : 
                        bestPlan === 'pro' ? 200 : 
                        bestPlan === 'plus' ? 50 : 10;

    console.log(`🎯 [HYBRID] Plano: ${currentPlan} → ${newPlan} → ${bestPlan} (${finalCredits === -1 ? 'ilimitados' : finalCredits} créditos)`);

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
        hybrid_processed: true,
        force_refresh: new Date().getTime(),
        processing_method: userFound ? 'update' : 'create'
      }
    };

    if (userFound && userId) {
      // Atualizar usuário existente
      try {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);
        
        if (updateError) {
          console.error('❌ [HYBRID] Erro ao atualizar usuário:', updateError);
          return false;
        }
        
        console.log(`✅ [HYBRID] Usuário ${email} atualizado para ${bestPlan} com ${finalCredits === -1 ? 'créditos ilimitados' : finalCredits + ' créditos'}`);
        return true;
      } catch (error) {
        console.error('❌ [HYBRID] Erro na atualização:', error);
        return false;
      }
    } else {
      // Criar novo usuário
      try {
        console.log(`👤 [HYBRID] Criando novo usuário ${email}...`);
        
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            full_name: email.split('@')[0],
            ...updateData.user_metadata,
            created_via_stripe: true,
            created_via_hybrid: true
          }
        });

        if (createError) {
          console.error('❌ [HYBRID] Erro ao criar usuário:', createError);
          return false;
        }

        console.log(`✅ [HYBRID] Usuário ${email} criado com ${bestPlan} e ${finalCredits === -1 ? 'créditos ilimitados' : finalCredits + ' créditos'}`);
        return true;
      } catch (error) {
        console.error('❌ [HYBRID] Erro na criação:', error);
        return false;
      }
    }

  } catch (error) {
    console.error('❌ [HYBRID] Erro geral:', error);
    return false;
  }
}