import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log(`🔐 Login direto: ${email}`)

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Serviço não disponível' 
      }, { status: 500 })
    }

    // Verificar credenciais usando SQL direto
    const { data, error } = await supabaseAdmin
      .rpc('verify_user_password', {
        user_email: email.trim(),
        user_password: password
      })

    if (error) {
      console.error('❌ Erro ao verificar credenciais:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Email ou senha incorretos' 
      }, { status: 401 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email ou senha incorretos' 
      }, { status: 401 })
    }

    const user = data[0]
    console.log('✅ Login realizado com sucesso!')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        credits_remaining: user.credits_remaining
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
    message: 'API de login direto',
    status: 'ativa',
    method: 'Verificação SQL direta'
  })
} 