import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  console.log('🔧 [TEST] Testando Service Role Key...')
  
  if (!supabaseAdmin) {
    console.error('❌ [TEST] Cliente admin do Supabase não disponível')
    return NextResponse.json({ 
      success: false, 
      error: 'Supabase admin não configurado',
      serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'Não configurada'
    }, { status: 500 })
  }

  try {
    // Testar listagem de usuários
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ [TEST] Erro ao listar usuários:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'Não configurada'
      }, { status: 500 })
    }

    console.log(`✅ [TEST] Service Role Key funcionando! ${users.users.length} usuários encontrados`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Service Role Key funcionando!',
      userCount: users.users.length,
      serviceKey: 'Funcionando',
      users: users.users.map(u => ({ 
        id: u.id, 
        email: u.email, 
        plan: u.user_metadata?.subscription_plan || 'free' 
      }))
    })

  } catch (error) {
    console.error('❌ [TEST] Erro inesperado:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno',
      serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada mas com erro' : 'Não configurada'
    }, { status: 500 })
  }
} 