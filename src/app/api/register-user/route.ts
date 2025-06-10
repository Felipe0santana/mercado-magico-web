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

    // ✨ PRIMEIRA TENTATIVA: Usar client-side signup
    console.log(`📝 [REGISTER] Tentativa 1: Usando método client-side para ${email}`)
    
    try {
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

      if (!error && data.user) {
        console.log('✅ [REGISTER] Usuário criado com sucesso via client-side! ID:', data.user.id)
        
        // Tentar inserir na tabela public.users também
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
          } else {
            console.log('✅ [REGISTER] Usuário também inserido em public.users')
          }
        } catch (publicError) {
          console.warn('⚠️ [REGISTER] Aviso: Erro na inserção public.users:', publicError)
        }
        
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
      }

      // Se chegou aqui, houve erro na primeira tentativa
      console.warn('⚠️ [REGISTER] Primeira tentativa falhou:', error?.message)
      
      // Tratar erros específicos
      if (error?.message?.includes('already registered')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Este email já está em uso' 
        }, { status: 400 })
      }
      
    } catch (clientError) {
      console.warn('⚠️ [REGISTER] Erro na tentativa client-side:', clientError)
    }

    // ✨ SEGUNDA TENTATIVA: Usar função do banco de dados
    console.log(`🔧 [REGISTER] Tentativa 2: Usando função do banco para ${email}`)
    
    try {
      const { data: dbResult, error: dbError } = await supabase
        .rpc('create_user_registration', {
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
        return NextResponse.json(dbResult)
      } else {
        console.error('❌ [REGISTER] Função do banco retornou erro:', dbResult?.error)
        return NextResponse.json({ 
          success: false, 
          error: dbResult?.error || 'Erro ao criar conta via banco de dados'
        }, { status: 400 })
      }
      
    } catch (dbError) {
      console.error('❌ [REGISTER] Erro na função do banco:', dbError)
    }

    // ✨ Se chegou aqui, todas as tentativas falharam
    console.error('❌ [REGISTER] Todas as tentativas de registro falharam para:', email)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao criar conta. O serviço está temporariamente indisponível. Tente novamente em alguns minutos.',
      details: 'Falha em todos os métodos de registro'
    }, { status: 500 })

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
    methods: [
      'Supabase Auth Client-Side (Primário)',
      'Função do Banco de Dados (Fallback)'
    ],
    note: 'Sistema robusto com múltiplas tentativas de registro'
  })
} 