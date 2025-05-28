import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando usuários na tabela auth.users...')

    // Buscar usuários na tabela auth.users (sistema de autenticação)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Erro ao buscar usuários auth:', authError)
      return NextResponse.json({ 
        error: 'Erro ao buscar usuários auth',
        details: authError.message 
      }, { status: 500 })
    }

    console.log(`✅ Encontrados ${authUsers?.users?.length || 0} usuários na auth.users`)

    // Buscar usuários na tabela public.users (perfis)
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (publicError) {
      console.error('❌ Erro ao buscar usuários public:', publicError)
    }

    console.log(`✅ Encontrados ${publicUsers?.length || 0} usuários na public.users`)

    // Procurar especificamente pelos emails admin
    const adminEmails = authUsers?.users?.filter(user => 
      user.email?.includes('admin')
    ) || []

    return NextResponse.json({
      success: true,
      authUsers: {
        total: authUsers?.users?.length || 0,
        adminUsers: adminEmails.map(user => ({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          email_confirmed_at: user.email_confirmed_at,
          last_sign_in_at: user.last_sign_in_at
        }))
      },
      publicUsers: {
        total: publicUsers?.length || 0,
        users: publicUsers?.map(user => ({
          id: user.id,
          email: user.email,
          subscription_plan: user.subscription_plan,
          credits_remaining: user.credits_remaining,
          created_at: user.created_at
        })) || []
      },
      comparison: {
        authHasUsers: (authUsers?.users?.length || 0) > 0,
        publicHasUsers: (publicUsers?.length || 0) > 0,
        needsSync: (authUsers?.users?.length || 0) > (publicUsers?.length || 0)
      }
    })

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 