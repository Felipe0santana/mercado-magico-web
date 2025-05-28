import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Testando conexão com banco de dados...')
    
    // Testar conexão básica
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Erro na conexão:', testError)
      return NextResponse.json({ 
        error: 'Erro na conexão com banco', 
        details: testError 
      }, { status: 500 })
    }

    console.log('✅ Conexão estabelecida')

    // Buscar todos os usuários
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, subscription_plan, subscription_status, credits_remaining')
      .limit(10)
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError)
      return NextResponse.json({ 
        error: 'Erro ao buscar usuários', 
        details: usersError 
      }, { status: 500 })
    }

    console.log('👥 Usuários encontrados:', allUsers?.length || 0)
    
    // Buscar especificamente o admin2@admin2.com
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin2@admin2.com')
    
    console.log('🔍 Busca por admin2@admin2.com:', adminUser)
    
    return NextResponse.json({
      success: true,
      totalUsers: allUsers?.length || 0,
      users: allUsers,
      adminUser: adminUser,
      adminError: adminError
    })

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 