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
    // ✨ Primeiro testar uma query SQL simples
    console.log('🔧 [TEST] Testando conexão com query SQL básica...')
    const { data: sqlTest, error: sqlError } = await supabaseAdmin
      .from('users')
      .select('id, email, subscription_plan')
      .limit(1)

    if (sqlError) {
      console.warn('⚠️ [TEST] Aviso na query SQL:', sqlError.message)
    } else {
      console.log('✅ [TEST] Query SQL funcionando!')
    }

    // ✨ Testar listagem de usuários com retry
    let users, error
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      attempts++
      console.log(`🔍 [TEST] Tentativa ${attempts}/${maxAttempts} - Listando usuários...`)
      
      try {
        const result = await supabaseAdmin.auth.admin.listUsers()
        users = result.data
        error = result.error
        
        if (!error) {
          break // Sucesso, sair do loop
        }
      } catch (err) {
        console.warn(`⚠️ [TEST] Erro na tentativa ${attempts}:`, err)
        error = err
        
        if (attempts < maxAttempts) {
          // Aguardar antes da próxima tentativa
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
        }
      }
    }
    
    if (error || !users) {
      console.error('❌ [TEST] Erro ao listar usuários após todas as tentativas:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Database error finding users',
        attempts: attempts,
        serviceKey: 'Configurada',
        sqlTestResult: sqlTest ? 'SQL OK' : 'SQL Error',
        details: (error as any)?.message || 'Erro desconhecido'
      }, { status: 500 })
    }

    console.log(`✅ [TEST] Service Role Key funcionando! ${users.users.length} usuários encontrados`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Service Role Key funcionando!',
      userCount: users.users.length,
      serviceKey: 'Funcionando',
      attempts: attempts,
      sqlTestResult: sqlTest ? 'SQL OK' : 'SQL Limited',
      users: users.users.slice(0, 5).map(u => ({ 
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
      serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada mas com erro' : 'Não configurada',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 