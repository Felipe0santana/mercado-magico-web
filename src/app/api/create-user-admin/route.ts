import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    console.log(`🔐 Criando usuário admin para: ${email}`)

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cliente admin não configurado' 
      }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true, // Confirma email automaticamente
      user_metadata: {
        full_name: fullName,
        subscription_plan: 'free',
        subscription_status: 'active',
        credits_remaining: 10,
        total_credits_purchased: 0,
        created_at: new Date().toISOString()
      }
    })

    if (error) {
      console.error('❌ Erro de cadastro admin:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      }, { status: 400 })
    }

    console.log('✅ Usuário criado com sucesso via admin!')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Usuário criado com sucesso',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        metadata: data.user?.user_metadata
      }
    })
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro inesperado no servidor' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'API de criação de usuário admin ativa',
    instructions: 'Use POST com { email, password, fullName }'
  })
} 