import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    console.log(`🧪 Testando webhook para: ${email}`)

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Serviço não disponível' 
      }, { status: 500 })
    }

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email é obrigatório' 
      }, { status: 400 })
    }

    // Simular dados do webhook do Stripe para plano Plus
    const mockWebhookData = {
      type: 'checkout.session.completed',
      data: {
        object: {
          customer_details: {
            email: email
          },
          amount_total: 999, // R$ 9,99 em centavos
          payment_status: 'paid',
          mode: 'payment'
        }
      }
    }

    console.log('📦 Dados simulados do webhook:', mockWebhookData)

    // Buscar usuário por email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao buscar usuário' 
      }, { status: 500 })
    }

    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      console.log('❌ Usuário não encontrado:', email)
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      }, { status: 404 })
    }

    console.log('👤 Usuário encontrado:', user.id, user.email)

    // Mapear valor para plano (999 centavos = R$ 9,99 = plano Plus)
    const planMapping = {
      999: { plan: 'plus', credits: 50 },
      4999: { plan: 'premium', credits: -1 }, // ilimitado
      0: { plan: 'free', credits: 10 }
    }

    const planInfo = planMapping[999] || planMapping[0]
    
    console.log('📋 Plano mapeado:', planInfo)

    // Atualizar metadados do usuário
    const updatedMetadata = {
      ...user.user_metadata,
      subscription_plan: planInfo.plan,
      subscription_status: 'active',
      credits_remaining: planInfo.credits,
      last_payment_date: new Date().toISOString(),
      last_payment_amount: 999
    }

    console.log('🔄 Atualizando metadados:', updatedMetadata)

    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { user_metadata: updatedMetadata }
    )

    if (updateError) {
      console.error('❌ Erro ao atualizar usuário:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao atualizar usuário' 
      }, { status: 500 })
    }

    console.log('✅ Usuário atualizado com sucesso!')

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook simulado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        plan: planInfo.plan,
        credits: planInfo.credits,
        status: 'active'
      },
      webhook_data: mockWebhookData
    })

  } catch (error) {
    console.error('❌ Erro no teste de webhook:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 