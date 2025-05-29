import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    console.log(`🔍 Verificando usuário: ${email}`)

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
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at,
        user_metadata: user.user_metadata,
        subscription_plan: user.user_metadata?.subscription_plan || 'free',
        credits_remaining: user.user_metadata?.credits_remaining || 10,
        subscription_status: user.user_metadata?.subscription_status || 'active',
        last_payment_date: user.user_metadata?.last_payment_date,
        last_payment_amount: user.user_metadata?.last_payment_amount
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
    message: 'API de verificação de usuário',
    status: 'ativa'
  })
} 