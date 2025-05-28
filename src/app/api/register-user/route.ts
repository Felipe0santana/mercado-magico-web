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

    // Criar usuário via API admin
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true, // Confirma email automaticamente
      user_metadata: {
        full_name: fullName || email.split('@')[0],
        subscription_plan: 'free',
        subscription_status: 'active',
        credits_remaining: 10,
        total_credits_purchased: 0,
        created_at: new Date().toISOString()
      }
    })

    if (error) {
      console.error('❌ Erro ao criar usuário:', error)
      
      // Se for erro de email duplicado
      if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Este email já está em uso' 
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao criar conta. Tente novamente.' 
      }, { status: 400 })
    }

    console.log('✅ Usuário criado com sucesso!')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Conta criada com sucesso! Você já pode fazer login.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
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
    status: 'ativa'
  })
} 