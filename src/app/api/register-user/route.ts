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

    // Criar usuário via SQL direto (método que funciona)
    const userId = crypto.randomUUID()
    const userMetadata = {
      full_name: fullName || email.split('@')[0],
      subscription_plan: 'free',
      subscription_status: 'active',
      credits_remaining: 10,
      total_credits_purchased: 0,
      created_at: new Date().toISOString()
    }

    const { error: insertError } = await supabaseAdmin
      .from('auth.users')
      .insert({
        id: userId,
        instance_id: '00000000-0000-0000-0000-000000000000',
        email: email.trim(),
        encrypted_password: `crypt('${password}', gen_salt('bf'))`,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        raw_user_meta_data: userMetadata,
        aud: 'authenticated',
        role: 'authenticated'
      })

    if (insertError) {
      console.error('❌ Erro ao criar usuário:', insertError)
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
        id: userId,
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
    status: 'ativa'
  })
} 