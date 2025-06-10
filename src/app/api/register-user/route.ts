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

    // ✨ REGISTRO TEMPORÁRIO (método principal enquanto API admin está instável)
    console.log(`🔧 [REGISTER] Criando registro temporário para ${normalizedEmail}`)
    
    try {
      // Verificar se já existe
      const { data: existingUser, error: checkError } = await supabase
        .from('temp_registrations')
        .select('email')
        .eq('email', normalizedEmail)
        .maybeSingle()

      if (existingUser) {
        return NextResponse.json({ 
          success: false, 
          error: 'Este email já está em uso' 
        }, { status: 400 })
      }

      // Verificar também se já existe em auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      if (authUsers?.users?.some(user => user.email === normalizedEmail)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Este email já está em uso' 
        }, { status: 400 })
      }

      // Criar registro temporário
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
        return NextResponse.json({ 
          success: false, 
          error: 'Erro ao criar conta. Tente novamente.' 
        }, { status: 500 })
      }

      console.log('✅ [REGISTER] Registro temporário criado com sucesso!')

      // Tentar migrar imediatamente em background
      setTimeout(async () => {
        try {
          console.log('🔄 [REGISTER] Tentando migração automática...')
          const migrateResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://site54874935.netlify.app'}/api/migrate-temp-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tempId })
          })
          
          const migrateResult = await migrateResponse.json()
          console.log('🔄 [REGISTER] Resultado da migração automática:', migrateResult.success ? 'Sucesso' : 'Falha')
        } catch (migrateError) {
          console.warn('⚠️ [REGISTER] Erro na migração automática:', migrateError)
        }
      }, 2000) // Aguardar 2 segundos antes de tentar migrar

      return NextResponse.json({
        success: true,
        message: 'Conta criada com sucesso! Aguarde alguns segundos e tente fazer login.',
        user: {
          email: normalizedEmail,
          full_name: userFullName,
          status: 'processing',
          temp_id: tempId
        },
        note: 'Sua conta está sendo processada. Tente fazer login em alguns segundos.'
      })

    } catch (tempError) {
      console.error('❌ [REGISTER] Erro no registro temporário:', tempError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao criar conta. Tente novamente em alguns minutos.',
        details: tempError instanceof Error ? tempError.message : 'Erro desconhecido'
      }, { status: 500 })
    }

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
  try {
    // Verificar status dos registros temporários
    const { data: stats, error } = await supabase
      .from('temp_registrations')
      .select('status')

    const statusCount = stats?.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({ 
      message: 'API de registro de usuário',
      status: 'ativa',
      method: 'Registro Temporário + Migração Automática',
      note: 'Sistema simplificado devido a instabilidade da API admin do Supabase',
      temp_registrations_stats: statusCount
    })
  } catch (error) {
    return NextResponse.json({ 
      message: 'API de registro de usuário',
      status: 'ativa',
      error: 'Erro ao buscar estatísticas'
    })
  }
} 