import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Sincronizando usuários auth.users -> public.users...')

    // Buscar todos os usuários da tabela auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Erro ao buscar usuários auth:', authError)
      return NextResponse.json({ 
        error: 'Erro ao buscar usuários auth',
        details: authError.message 
      }, { status: 500 })
    }

    console.log(`📋 Encontrados ${authUsers?.users?.length || 0} usuários na auth.users`)

    const syncResults = []
    let syncedCount = 0
    let errorCount = 0

    // Para cada usuário na auth.users, verificar se existe na public.users
    for (const authUser of authUsers?.users || []) {
      try {
        console.log(`🔍 Verificando usuário: ${authUser.email}`)

        // Verificar se já existe na tabela public.users
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id, email')
          .eq('id', authUser.id)
          .maybeSingle()

        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`❌ Erro ao verificar usuário ${authUser.email}:`, checkError)
          errorCount++
          continue
        }

        if (existingUser) {
          console.log(`✅ Usuário ${authUser.email} já existe na public.users`)
          syncResults.push({
            email: authUser.email,
            status: 'already_exists',
            id: authUser.id
          })
          continue
        }

        // Criar usuário na tabela public.users
        const userData = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '',
          subscription_plan: 'free',
          subscription_status: 'active',
          credits_remaining: 10, // Créditos iniciais
          created_at: authUser.created_at,
          updated_at: new Date().toISOString()
        }

        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([userData])
          .select()

        if (insertError) {
          console.error(`❌ Erro ao criar usuário ${authUser.email}:`, insertError)
          errorCount++
          syncResults.push({
            email: authUser.email,
            status: 'error',
            error: insertError.message
          })
          continue
        }

        console.log(`✅ Usuário ${authUser.email} sincronizado com sucesso`)
        syncedCount++
        syncResults.push({
          email: authUser.email,
          status: 'synced',
          id: authUser.id,
          user: newUser[0]
        })

      } catch (userError) {
        console.error(`❌ Erro geral ao processar usuário ${authUser.email}:`, userError)
        errorCount++
        syncResults.push({
          email: authUser.email,
          status: 'error',
          error: userError instanceof Error ? userError.message : 'Erro desconhecido'
        })
      }
    }

    console.log(`🎉 Sincronização concluída: ${syncedCount} sincronizados, ${errorCount} erros`)

    return NextResponse.json({
      success: true,
      message: 'Sincronização concluída',
      stats: {
        totalAuthUsers: authUsers?.users?.length || 0,
        syncedUsers: syncedCount,
        errors: errorCount,
        alreadyExists: syncResults.filter(r => r.status === 'already_exists').length
      },
      results: syncResults
    })

  } catch (error) {
    console.error('❌ Erro geral na sincronização:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 