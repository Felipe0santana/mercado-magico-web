import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    console.log(`🔐 Registrando usuário: ${email}`)

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Serviço não disponível' 
      }, { status: 500 })
    }

    // Verificar se usuário já existe
    const { data: existingUsers, error: checkError } = await supabaseAdmin
      .from('auth.users')
      .select('email')
      .eq('email', email.trim())

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Este email já está em uso' 
      }, { status: 400 })
    }

    // Criar usuário usando função SQL personalizada
    const { data, error } = await supabaseAdmin
      .rpc('create_auth_user', {
        user_email: email.trim(),
        user_password: password,
        user_full_name: fullName || email.split('@')[0]
      })

    if (error) {
      console.error('❌ Erro ao criar usuário:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao criar conta. Tente novamente.',
        details: error
      }, { status: 400 })
    }

    console.log('✅ Usuário criado com sucesso! ID:', data)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Conta criada com sucesso! Você já pode fazer login.',
      user: {
        id: data,
        email: email.trim(),
        full_name: fullName
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
    message: 'API de registro de usuário',
    status: 'ativa',
    method: 'Função SQL personalizada'
  })
} 