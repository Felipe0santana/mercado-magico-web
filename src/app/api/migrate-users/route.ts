import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando migração de usuários public.users → auth.users...')

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Cliente admin não configurado' 
      }, { status: 500 })
    }

    // Buscar todos os usuários de public.users
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*')

    if (publicError) {
      console.error('❌ Erro ao buscar usuários public.users:', publicError)
      return NextResponse.json({ 
        error: 'Erro ao buscar usuários da tabela public.users',
        details: publicError.message 
      }, { status: 500 })
    }

    console.log(`📊 Encontrados ${publicUsers?.length || 0} usuários em public.users`)

    // Buscar usuários existentes em auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Erro ao buscar usuários auth.users:', authError)
      return NextResponse.json({ 
        error: 'Erro ao buscar usuários do auth.users',
        details: authError.message 
      }, { status: 500 })
    }

    const existingEmails = new Set(authUsers?.users?.map(u => u.email) || [])
    console.log(`📊 Encontrados ${existingEmails.size} usuários em auth.users`)

    const results = {
      total: publicUsers?.length || 0,
      migrated: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    }

    // Migrar cada usuário
    for (const user of publicUsers || []) {
      try {
        if (existingEmails.has(user.email)) {
          console.log(`⏭️ Usuário ${user.email} já existe em auth.users`)
          results.skipped++
          results.details.push({
            email: user.email,
            status: 'skipped',
            reason: 'Já existe em auth.users'
          })
          continue
        }

        // Criar usuário em auth.users
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          email_confirm: true,
          user_metadata: {
            full_name: user.name || user.email?.split('@')[0],
            subscription_plan: user.subscription_plan || 'free',
            subscription_status: user.subscription_status || 'active',
            credits_remaining: user.credits_remaining || 10,
            total_credits_purchased: user.total_credits_purchased || 0,
            migrated_from_public: true,
            migrated_at: new Date().toISOString(),
            original_created_at: user.created_at,
            updated_at: new Date().toISOString()
          }
        })

        if (createError) {
          console.error(`❌ Erro ao criar usuário ${user.email}:`, createError)
          results.errors++
          results.details.push({
            email: user.email,
            status: 'error',
            error: createError.message
          })
        } else {
          console.log(`✅ Usuário ${user.email} migrado com sucesso`)
          results.migrated++
          results.details.push({
            email: user.email,
            status: 'migrated',
            newId: newUser.user?.id
          })
        }

      } catch (error) {
        console.error(`❌ Erro inesperado ao migrar ${user.email}:`, error)
        results.errors++
        results.details.push({
          email: user.email,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    console.log('📊 Migração concluída:', results)

    return NextResponse.json({
      success: true,
      message: 'Migração de usuários concluída',
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro na migração:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 