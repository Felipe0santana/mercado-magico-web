import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log(`🔐 Testando login para: ${email}`)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    })

    if (error) {
      console.error('❌ Erro de login:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      }, { status: 400 })
    }

    console.log('✅ Login bem-sucedido!')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Login realizado com sucesso',
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
    message: 'API de teste de login ativa',
    instructions: 'Use POST com { email, password }'
  })
} 