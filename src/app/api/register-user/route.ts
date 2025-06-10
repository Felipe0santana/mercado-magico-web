import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 [REGISTER] Iniciando processo de registro...')
    
    const { email, password, fullName } = await request.json()
    console.log(`🔐 [REGISTER] Dados recebidos - Email: ${email}, FullName: ${fullName}`)

    if (!email || !password) {
      console.log('❌ [REGISTER] Email ou senha não fornecidos')
      return NextResponse.json({ 
        success: false, 
        error: 'Email e senha são obrigatórios' 
      }, { status: 400 })
    }

    if (password.length < 6) {
      console.log('❌ [REGISTER] Senha muito curta')
      return NextResponse.json({ 
        success: false, 
        error: 'A senha deve ter pelo menos 6 caracteres' 
      }, { status: 400 })
    }

    // ✨ REGISTRO USANDO SUPABASE AUTH (como no app mobile)
    console.log(`📝 [REGISTER] Tentando criar usuário com Supabase Auth: ${email}`)
    console.log(`🔧 [REGISTER] Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    console.log(`🔧 [REGISTER] Supabase Key configurada: ${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`)
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0]
          }
        }
      })

      console.log(`🔍 [REGISTER] Resultado do signUp - Data: ${!!data}, Error: ${!!error}`)
      
      if (error) {
        console.error('❌ [REGISTER] Erro detalhado no registro:', {
          message: error.message,
          status: error.status,
          name: error.name
        })
        
        // Tratar erros específicos
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          return NextResponse.json({ 
            success: false, 
            error: 'Este email já está em uso' 
          }, { status: 400 })
        }
        
        if (error.message.includes('Password should be at least')) {
          return NextResponse.json({ 
            success: false, 
            error: 'A senha deve ter pelo menos 6 caracteres' 
          }, { status: 400 })
        }
        
        if (error.message.includes('Invalid email')) {
          return NextResponse.json({ 
            success: false, 
            error: 'Email inválido' 
          }, { status: 400 })
        }
        
        return NextResponse.json({ 
          success: false, 
          error: 'Erro ao criar conta. Tente novamente.',
          details: error.message,
          debug: {
            error_name: error.name,
            error_status: error.status,
            supabase_configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL
          }
        }, { status: 400 })
      }

      if (!data.user) {
        console.error('❌ [REGISTER] Data.user é null/undefined')
        return NextResponse.json({ 
          success: false, 
          error: 'Erro inesperado ao criar usuário',
          debug: {
            data_exists: !!data,
            user_exists: !!data?.user
          }
        }, { status: 500 })
      }

      console.log('✅ [REGISTER] Usuário criado com sucesso! ID:', data.user.id)
      console.log('📋 [REGISTER] Dados do usuário:', {
        id: data.user.id,
        email: data.user.email,
        email_confirmed: !!data.user.email_confirmed_at
      })
      
      // O perfil será criado automaticamente pelo trigger
      // Aguardar um pouco para garantir que o trigger executou
      console.log('⏳ [REGISTER] Aguardando trigger de criação de perfil...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return NextResponse.json({ 
        success: true, 
        message: data.user.email_confirmed_at 
          ? 'Conta criada com sucesso! Você já pode fazer login.'
          : 'Conta criada! Verifique seu email para confirmar.',
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name,
          email_confirmed: !!data.user.email_confirmed_at,
          needs_confirmation: !data.user.email_confirmed_at
        }
      })
      
    } catch (authError) {
      console.error('❌ [REGISTER] Erro na chamada do Supabase Auth:', authError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro de conexão com o serviço de autenticação',
        details: authError instanceof Error ? authError.message : 'Erro desconhecido',
        debug: {
          error_type: typeof authError,
          supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ [REGISTER] Erro inesperado geral:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      debug: {
        error_type: typeof error,
        error_name: error instanceof Error ? error.name : 'unknown'
      }
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Verificar estatísticas dos perfis
    const { data: stats, error } = await supabase
      .from('profiles')
      .select('subscription_plan, subscription_status')

    const planCount = stats?.reduce((acc, item) => {
      acc[item.subscription_plan] = (acc[item.subscription_plan] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const statusCount = stats?.reduce((acc, item) => {
      acc[item.subscription_status] = (acc[item.subscription_status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({ 
      message: 'API de registro de usuário',
      status: 'ativa',
      method: 'Supabase Auth + Profiles (como app mobile)',
      note: 'Sistema simplificado e robusto seguindo padrão do app mobile',
      stats: {
        total_profiles: stats?.length || 0,
        by_plan: planCount,
        by_status: statusCount
      },
      debug: {
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        environment: process.env.NODE_ENV
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      message: 'API de registro de usuário',
      status: 'ativa',
      error: 'Erro ao buscar estatísticas',
      debug: {
        error_message: error instanceof Error ? error.message : 'unknown'
      }
    })
  }
} 