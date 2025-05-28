import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    console.log(`🔐 Testando cadastro para: ${email}`)

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          full_name: fullName,
          subscription_plan: 'free',
          subscription_status: 'active',
          credits_remaining: 10,
          total_credits_purchased: 0,
          created_at: new Date().toISOString()
        }
      }
    })

    if (error) {
      console.error('❌ Erro de cadastro:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      }, { status: 400 })
    }

    console.log('✅ Cadastro bem-sucedido!')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cadastro realizado com sucesso',
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
    message: 'API de teste de cadastro ativa',
    instructions: 'Use POST com { email, password, fullName }'
  })
} 