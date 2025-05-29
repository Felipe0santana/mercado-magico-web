import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Configurações
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const STRIPE_CLI_WEBHOOK_SECRET = Deno.env.get('STRIPE_CLI_WEBHOOK_SECRET') || 'whsec_9d104f15c71f8060969218e5e78948f82d374d9c7385048a47632d0b4382ea80';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Cliente Supabase com privilégios admin
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Mapear valores do Stripe para planos
function mapStripeAmountToPlan(amount: number) {
  console.log(`💰 Mapeando valor: R$ ${amount/100}`);
  if (amount >= 2999) return { plan: 'premium', credits: -1 };
  if (amount >= 1999) return { plan: 'pro', credits: 200 };
  if (amount >= 999) return { plan: 'plus', credits: 50 };
  return { plan: 'free', credits: 10 };
}

// Função para determinar o melhor plano
function getBetterPlan(currentPlan: string, newPlan: string) {
  const planHierarchy = { 'free': 0, 'plus': 1, 'pro': 2, 'premium': 3 };
  const currentLevel = planHierarchy[currentPlan as keyof typeof planHierarchy] || 0;
  const newLevel = planHierarchy[newPlan as keyof typeof planHierarchy] || 0;
  return newLevel >= currentLevel ? newPlan : currentPlan;
}

// Processar checkout completado
async function handleCheckoutCompleted(session: any) {
  try {
    console.log('🛒 [EDGE FUNCTION] Processando checkout.session.completed');
    
    const email = session.customer_details?.email;
    const amount = session.amount_total || 0;

    if (!email) {
      console.error('❌ Email do cliente não encontrado');
      return false;
    }

    const { plan, credits } = mapStripeAmountToPlan(amount);
    console.log(`📊 [EDGE FUNCTION] Processando: ${email} → ${plan} (${credits === -1 ? 'ilimitados' : credits} créditos) - R$ ${amount/100}`);

    // Buscar usuário existente
    const { data: existingUsers, error: searchError } = await supabase.auth.admin.listUsers();
    
    if (searchError) {
      console.error('❌ [EDGE FUNCTION] Erro ao buscar usuários:', searchError);
      return false;
    }

    const existingUser = existingUsers.users?.find(u => u.email === email);
    
    if (existingUser) {
      // Usuário existe - atualizar
      const currentPlan = existingUser.user_metadata?.subscription_plan || 'free';
      const bestPlan = getBetterPlan(currentPlan, plan);
      const finalCredits = bestPlan === 'premium' ? -1 : 
                          bestPlan === 'pro' ? 200 : 
                          bestPlan === 'plus' ? 50 : 10;

      console.log(`👤 [EDGE FUNCTION] Atualizando usuário: ${currentPlan} → ${bestPlan}`);

      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          ...existingUser.user_metadata,
          subscription_plan: bestPlan,
          subscription_status: 'active',
          credits_remaining: finalCredits,
          stripe_customer_id: session.customer,
          last_payment_amount: amount,
          last_payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          webhook_processed: true,
          edge_function_processed: true,
          force_refresh: new Date().getTime()
        }
      });

      if (updateError) {
        console.error('❌ [EDGE FUNCTION] Erro ao atualizar usuário:', updateError);
        return false;
      }

      console.log(`✅ [EDGE FUNCTION] Usuário ${email} atualizado para ${bestPlan} com ${finalCredits === -1 ? 'créditos ilimitados' : finalCredits + ' créditos'}`);
      return true;

    } else {
      // Usuário não existe - criar
      console.log(`👤 [EDGE FUNCTION] Criando novo usuário ${email}...`);
      
      const finalCredits = plan === 'premium' ? -1 : 
                          plan === 'pro' ? 200 : 
                          plan === 'plus' ? 50 : 10;

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: email.split('@')[0],
          subscription_plan: plan,
          subscription_status: 'active',
          credits_remaining: finalCredits,
          stripe_customer_id: session.customer,
          last_payment_amount: amount,
          last_payment_date: new Date().toISOString(),
          created_via_stripe: true,
          created_via_edge_function: true,
          updated_at: new Date().toISOString(),
          webhook_processed: true,
          edge_function_processed: true
        }
      });

      if (createError) {
        console.error('❌ [EDGE FUNCTION] Erro ao criar usuário:', createError);
        return false;
      }

      console.log(`✅ [EDGE FUNCTION] Usuário ${email} criado com ${plan} e ${finalCredits === -1 ? 'créditos ilimitados' : finalCredits + ' créditos'}`);
      return true;
    }

  } catch (error) {
    console.error('❌ [EDGE FUNCTION] Erro ao processar checkout:', error);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  try {
    console.log('🚀 [EDGE FUNCTION] Webhook do Stripe recebido');
    
    // Permitir CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, stripe-signature'
        }
      });
    }
    
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    console.log(`📨 [EDGE FUNCTION] Recebido webhook com ${body.length} bytes`);

    // Parse do evento
    let event;
    try {
      event = JSON.parse(body);
    } catch (error) {
      console.error('❌ [EDGE FUNCTION] Erro ao fazer parse do JSON:', error);
      return new Response('Invalid JSON', { status: 400 });
    }

    console.log(`📨 [EDGE FUNCTION] Evento recebido: ${event.type}`);

    // Processar apenas checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const success = await handleCheckoutCompleted(event.data.object);
      
      if (success) {
        console.log('✅ [EDGE FUNCTION] Webhook processado com sucesso');
        return new Response(JSON.stringify({ 
          received: true, 
          processed: true,
          processor: 'edge-function',
          event_type: event.type,
          timestamp: new Date().toISOString()
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          status: 200
        });
      } else {
        console.error('❌ [EDGE FUNCTION] Falha ao processar webhook');
        return new Response(JSON.stringify({ 
          received: true, 
          processed: false,
          error: 'Processing failed',
          processor: 'edge-function'
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          status: 500
        });
      }
    } else {
      console.log(`⚠️ [EDGE FUNCTION] Evento ${event.type} ignorado`);
      return new Response(JSON.stringify({ 
        received: true, 
        processed: false,
        reason: 'Event type not handled',
        event_type: event.type
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 200
      });
    }

  } catch (error) {
    console.error('❌ [EDGE FUNCTION] Erro geral:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message,
      processor: 'edge-function'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      status: 500
    });
  }
}); 