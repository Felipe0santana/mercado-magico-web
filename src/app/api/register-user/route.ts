import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    console.log(`🔐 [REGISTER] Registrando usuário: ${email}`)

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email e senha são obrigatórios' 
      }, { status: 400 })
    }

    // ✨ NOVA ABORDAGEM: Usar client-side signup em vez de admin API
    console.log(`📝 [REGISTER] Usando método client-side para ${email}`)
    
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
          subscription_plan: 'free',
          subscription_status: 'active',
          credits_remaining: 10,
          total_credits_purchased: 0,
          created_via: 'api_register',
          created_at: new Date().toISOString()
        }
      }
    })

    if (error) {
      console.error('❌ [REGISTER] Erro ao criar usuário:', error)
      
      // Tratar erros específicos
      if (error.message.includes('already registered')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Este email já está em uso' 
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao criar conta. Tente novamente.',
        details: error.message
      }, { status: 400 })
    }

    console.log('✅ [REGISTER] Usuário criado com sucesso! ID:', data.user?.id)
    
    // ✨ ADICIONAL: Tentar inserir na tabela public.users também
    if (data.user) {
      try {
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            name: fullName || email.split('@')[0],
            subscription_plan: 'free',
            subscription_status: 'active',
            credits_remaining: 10,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
        
        if (insertError) {
          console.warn('⚠️ [REGISTER] Aviso: Erro ao inserir em public.users:', insertError)
          // Não falhar por causa disso, pois o usuário já foi criado no auth
        } else {
          console.log('✅ [REGISTER] Usuário também inserido em public.users')
        }
      } catch (publicError) {
        console.warn('⚠️ [REGISTER] Aviso: Erro na inserção public.users:', publicError)
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: data.user?.email_confirmed_at 
        ? 'Conta criada com sucesso! Você já pode fazer login.'
        : 'Conta criada! Verifique seu email para confirmar.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        full_name: data.user?.user_metadata?.full_name,
        email_confirmed: !!data.user?.email_confirmed_at,
        needs_confirmation: !data.user?.email_confirmed_at
      }
    })
  } catch (error) {
    console.error('❌ [REGISTER] Erro inesperado:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'API de registro de usuário',
    status: 'ativa',
    method: 'Supabase Auth Client-Side (Fallback)',
    note: 'Usando método client-side devido a problemas temporários na API admin'
  })
} 