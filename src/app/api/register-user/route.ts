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

    // ✨ PRIMEIRA TENTATIVA: SUPABASE AUTH (como no app mobile)
    console.log(`📝 [REGISTER] Tentativa 1: Supabase Auth para ${email}`)
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
      
      if (!error && data.user) {
        console.log('✅ [REGISTER] Usuário criado com sucesso via Supabase Auth! ID:', data.user.id)
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
          },
          method: 'supabase_auth'
        })
      }

      // Se chegou aqui, houve erro na primeira tentativa
      console.warn('⚠️ [REGISTER] Supabase Auth falhou:', error?.message)
      
      // Tratar erros específicos que devem retornar imediatamente
      if (error?.message?.includes('already registered') || error?.message?.includes('already been registered')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Este email já está em uso' 
        }, { status: 400 })
      }
      
    } catch (authError) {
      console.warn('⚠️ [REGISTER] Erro na chamada do Supabase Auth:', authError)
    }

    // ✨ SEGUNDA TENTATIVA: FUNÇÃO DO BANCO DE DADOS
    console.log(`🔧 [REGISTER] Tentativa 2: Função do banco para ${email}`)
    
    try {
      const { data: dbResult, error: dbError } = await supabase
        .rpc('create_user_with_profile', {
          user_email: email.trim(),
          user_password: password,
          user_full_name: fullName || email.split('@')[0]
        })

      if (dbError) {
        console.error('❌ [REGISTER] Erro na função do banco:', dbError)
        throw dbError
      }

      console.log('🔧 [REGISTER] Resultado da função do banco:', dbResult)

      if (dbResult?.success) {
        console.log('✅ [REGISTER] Usuário criado com sucesso via função do banco!')
        return NextResponse.json({
          ...dbResult,
          method: 'database_function'
        })
      } else {
        console.error('❌ [REGISTER] Função do banco retornou erro:', dbResult?.error)
        
        // Se for erro de email já em uso, retornar erro específico
        if (dbResult?.code === 'user_already_exists') {
          return NextResponse.json({ 
            success: false, 
            error: 'Este email já está em uso' 
          }, { status: 400 })
        }
        
        throw new Error(dbResult?.error || 'Erro na função do banco')
      }
      
    } catch (dbError) {
      console.error('❌ [REGISTER] Erro na função do banco:', dbError)
    }

    // ✨ Se chegou aqui, todas as tentativas falharam
    console.error('❌ [REGISTER] Todas as tentativas falharam para:', email)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao criar conta. O serviço está temporariamente indisponível. Tente novamente em alguns minutos.',
      details: 'Falha em todos os métodos de registro',
      debug: {
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    }, { status: 500 })

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
      methods: [
        'Supabase Auth + Profiles (Primário)',
        'Função do Banco de Dados (Fallback)'
      ],
      note: 'Sistema robusto com múltiplas tentativas seguindo padrão do app mobile',
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