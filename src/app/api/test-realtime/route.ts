import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [TEST-REALTIME] Testando inserção de evento')
    
    const { email = 'admin6@admin.com', plan = 'pro', amount = 1999 } = await request.json()

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase admin não configurado' 
      }, { status: 500 })
    }

    // Inserir evento na tabela events para trigger Realtime
    const eventData = {
      event_type: 'stripe_payment_completed',
      user_email: email,
      stripe_session_id: `cs_test_${Date.now()}`,
      amount: amount,
      plan: plan,
      credits: plan === 'premium' ? -1 : plan === 'pro' ? 200 : plan === 'plus' ? 50 : 10,
      processed_at: new Date().toISOString(),
      metadata: {
        test: true,
        source: 'test_api',
        realtime_enabled: true
      }
    }

    console.log('📦 [TEST-REALTIME] Inserindo evento:', eventData)

    const { data: eventResult, error: eventError } = await supabaseAdmin
      .from('events')
      .insert(eventData)
      .select()

    if (eventError) {
      console.error('❌ [TEST-REALTIME] Erro ao inserir evento:', eventError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao inserir evento',
        details: eventError
      }, { status: 500 })
    }

    console.log('✅ [TEST-REALTIME] Evento inserido:', eventResult)

    // Inserir notificação para push instantâneo
    const { data: notificationResult, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_email: email,
        type: 'plan_updated',
        title: 'Plano Atualizado (Teste)!',
        message: `Seu plano foi atualizado para ${plan} via teste`,
        data: {
          new_plan: plan,
          credits: eventData.credits,
          amount: amount,
          source: 'test_api'
        },
        created_at: new Date().toISOString()
      })
      .select()

    if (notificationError) {
      console.error('⚠️ [TEST-REALTIME] Erro ao inserir notificação:', notificationError)
    } else {
      console.log('✅ [TEST-REALTIME] Notificação inserida:', notificationResult)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Evento Realtime inserido com sucesso',
      event: eventResult,
      notification: notificationResult,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const err = error as Error
    console.error('❌ [TEST-REALTIME] Erro geral:', err)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: err.message
    }, { status: 500 })
  }
} 