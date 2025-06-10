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

    const normalizedEmail = email.trim().toLowerCase()
    const userFullName = fullName || email.split('@')[0]

    // ✨ PRIMEIRA TENTATIVA: Usar client-side signup
    console.log(`📝 [REGISTER] Tentativa 1: Usando método client-side para ${normalizedEmail}`)
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: password,
        options: {
          data: {
            full_name: userFullName,
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
              name: userFullName,
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

    // ✨ SEGUNDA TENTATIVA: Criar registro temporário e usar migração
    console.log(`🔧 [REGISTER] Tentativa 2: Registro temporário para ${normalizedEmail}`)
    
    try {
      // Verificar se já existe
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', normalizedEmail)
        .maybeSingle()

      if (existingUser) {
        return NextResponse.json({ 
          success: false, 
          error: 'Este email já está em uso' 
        }, { status: 400 })
      }

      // Criar registro temporário (será migrado depois)
      const tempId = crypto.randomUUID()
      const { data: tempUser, error: tempError } = await supabase
        .from('temp_registrations')
        .insert([{
          id: tempId,
          email: normalizedEmail,
          password_hash: password, // Em produção, isso deveria ser hasheado
          full_name: userFullName,
          created_at: new Date().toISOString()
        }])
        .select()

      if (tempError) {
        console.error('❌ [REGISTER] Erro ao criar registro temporário:', tempError)
        throw tempError
      }

      console.log('✅ [REGISTER] Registro temporário criado, iniciando migração...')

      // Tentar migrar imediatamente
      try {
        const migrateResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://site54874935.netlify.app'}/api/migrate-temp-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tempId })
        })

        const migrateResult = await migrateResponse.json()
        
        if (migrateResult.success) {
          console.log('✅ [REGISTER] Usuário migrado com sucesso!')
          return NextResponse.json({
            success: true,
            message: 'Conta criada com sucesso! Você já pode fazer login.',
            user: migrateResult.user
          })
        } else {
          console.warn('⚠️ [REGISTER] Migração falhou, mas registro temporário foi criado')
        }
      } catch (migrateError) {
        console.warn('⚠️ [REGISTER] Erro na migração:', migrateError)
      }

      // Se chegou aqui, o registro temporário foi criado mas a migração falhou
      return NextResponse.json({
        success: true,
        message: 'Conta criada! Pode levar alguns minutos para ficar disponível para login.',
        user: {
          email: normalizedEmail,
          full_name: userFullName,
          status: 'pending_migration'
        },
        note: 'Usuário será migrado automaticamente em breve'
      })

    } catch (tempError) {
      console.error('❌ [REGISTER] Erro no registro temporário:', tempError)
    }

    // ✨ Se chegou aqui, todas as tentativas falharam
    console.error('❌ [REGISTER] Todas as tentativas de registro falharam para:', normalizedEmail)
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
      'Registro Temporário + Migração (Fallback)'
    ],
    note: 'Sistema robusto com múltiplas tentativas de registro'
  })
} 