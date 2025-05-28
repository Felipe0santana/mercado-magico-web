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

    if (checkError) {
      console.log('Erro ao verificar usuário existente (normal):', checkError)
    }

    // Criar usuário via SQL direto
    const userId = crypto.randomUUID()
    const { error: insertError } = await supabaseAdmin.rpc('create_user_direct', {
      user_id: userId,
      user_email: email.trim(),
      user_password: password,
      user_full_name: fullName || email.split('@')[0],
      user_metadata: {
        full_name: fullName || email.split('@')[0],
        subscription_plan: 'free',
        subscription_status: 'active',
        credits_remaining: 10,
        total_credits_purchased: 0,
        created_at: new Date().toISOString()
      }
    })

    if (insertError) {
      console.error('❌ Erro ao criar usuário:', insertError)
      
      // Fallback: tentar inserção SQL direta
      const { error: sqlError } = await supabaseAdmin.rpc('sql', {
        query: `
          INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, aud, role
          ) VALUES (
            '${userId}',
            '00000000-0000-0000-0000-000000000000',
            '${email.trim()}',
            crypt('${password}', gen_salt('bf')),
            now(), now(), now(),
            '{"full_name": "${fullName || email.split('@')[0]}", "subscription_plan": "free", "subscription_status": "active", "credits_remaining": 10}',
            'authenticated', 'authenticated'
          )
        `
      })

      if (sqlError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Erro ao criar conta. Tente novamente.' 
        }, { status: 400 })
      }
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