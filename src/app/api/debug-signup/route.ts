import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    console.log(`🔍 DEBUG: Tentando criar usuário ${email}`)

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cliente admin não configurado',
        debug: 'SUPABASE_SERVICE_ROLE_KEY não encontrada'
      }, { status: 500 })
    }

    console.log('🔍 DEBUG: Cliente admin configurado')

    // Tentar criar usuário
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || email.split('@')[0],
        subscription_plan: 'free',
        subscription_status: 'active',
        credits_remaining: 10
      }
    })

    console.log('🔍 DEBUG: Resultado da criação:', { data: !!data, error: error?.message })

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        errorCode: error.status,
        errorDetails: error,
        debug: 'Erro detalhado do Supabase'
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Usuário criado com sucesso!',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        confirmed: data.user?.email_confirmed_at
      }
    })
  } catch (error: any) {
    console.error('🔍 DEBUG: Erro inesperado:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro desconhecido',
      stack: error.stack,
      debug: 'Erro capturado no catch'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'API de debug para cadastro',
    supabaseAdmin: !!supabaseAdmin,
    serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  })
} 