import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Listando todos os usuários...')

    // Buscar todos os usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError)
      return NextResponse.json({ 
        error: 'Erro ao buscar usuários',
        details: usersError.message 
      }, { status: 500 })
    }

    console.log(`✅ Encontrados ${users?.length || 0} usuários`)

    // Buscar especificamente por emails que contenham "admin"
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('*')
      .ilike('email', '%admin%')

    console.log(`🔍 Usuários admin encontrados: ${adminUsers?.length || 0}`)

    // Buscar por diferentes variações do email
    const emailVariations = [
      'admin2@admin2.com',
      'admin@admin.com', 
      'admin@admin2.com',
      'admin2@admin.com'
    ]

    const foundUsers = []
    for (const email of emailVariations) {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (user) {
        foundUsers.push({ email, user })
      }
    }

    return NextResponse.json({
      success: true,
      totalUsers: users?.length || 0,
      allUsers: users?.map(u => ({ 
        id: u.id, 
        email: u.email, 
        subscription_plan: u.subscription_plan,
        credits_remaining: u.credits_remaining,
        created_at: u.created_at 
      })) || [],
      adminUsers: adminUsers?.map(u => ({ 
        id: u.id, 
        email: u.email, 
        subscription_plan: u.subscription_plan,
        credits_remaining: u.credits_remaining 
      })) || [],
      emailVariationsFound: foundUsers,
      searchedEmails: emailVariations
    })

  } catch (error) {
    console.error('❌ Erro na API list-users:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 