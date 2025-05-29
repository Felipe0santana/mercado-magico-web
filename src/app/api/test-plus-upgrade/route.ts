import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    console.log(`🔄 Atualizando usuário ${email} para plano Plus...`)

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

    // Buscar usuário por email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao buscar usuários' 
      }, { status: 500 })
    }

    const user = users?.users?.find(u => u.email === email.trim())

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      }, { status: 404 })
    }

    console.log('✅ Usuário encontrado:', user.id)

    // Atualizar para plano Plus
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        subscription_plan: 'plus',
        subscription_status: 'active',
        credits_remaining: 50,
        total_credits_purchased: (user.user_metadata?.total_credits_purchased || 0) + 50,
        last_payment_amount: 999, // R$ 9,99 em centavos
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    if (updateError) {
      console.error('❌ Erro ao atualizar usuário:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao atualizar usuário' 
      }, { status: 500 })
    }

    console.log(`✅ Usuário ${email} atualizado para plano Plus com 50 créditos`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Usuário atualizado para plano Plus com sucesso!',
      user: {
        email,
        subscription_plan: 'plus',
        credits_remaining: 50,
        last_payment_date: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'API de teste para upgrade para Plus',
    status: 'ativa'
  })
} 