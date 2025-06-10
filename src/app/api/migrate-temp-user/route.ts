import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { tempId } = await request.json()

    console.log(`🔄 [MIGRATE] Migrando usuário temporário: ${tempId}`)

    if (!tempId) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID temporário é obrigatório' 
      }, { status: 400 })
    }

    // Buscar registro temporário
    const { data: tempUser, error: tempError } = await supabase
      .from('temp_registrations')
      .select('*')
      .eq('id', tempId)
      .eq('status', 'pending')
      .maybeSingle()

    if (tempError) {
      console.error('❌ [MIGRATE] Erro ao buscar registro temporário:', tempError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao buscar registro temporário' 
      }, { status: 500 })
    }

    if (!tempUser) {
      console.warn('⚠️ [MIGRATE] Registro temporário não encontrado ou já migrado')
      return NextResponse.json({ 
        success: false, 
        error: 'Registro temporário não encontrado ou já processado' 
      }, { status: 404 })
    }

    console.log(`📋 [MIGRATE] Encontrado registro temporário para: ${tempUser.email}`)

    // Tentar criar usuário usando client-side signup
    try {
      const { data, error } = await supabase.auth.signUp({
        email: tempUser.email,
        password: tempUser.password_hash, // Em produção, isso seria diferente
        options: {
          data: {
            full_name: tempUser.full_name,
            subscription_plan: 'free',
            subscription_status: 'active',
            credits_remaining: 10,
            total_credits_purchased: 0,
            created_via: 'temp_migration',
            original_created_at: tempUser.created_at
          }
        }
      })

      if (!error && data.user) {
        console.log('✅ [MIGRATE] Usuário migrado com sucesso! ID:', data.user.id)
        
        // Atualizar registro temporário
        await supabase
          .from('temp_registrations')
          .update({
            status: 'migrated',
            migrated_at: new Date().toISOString(),
            migrated_user_id: data.user.id
          })
          .eq('id', tempId)

        // Tentar inserir na tabela public.users também
        try {
          const { error: insertError } = await supabase
            .from('users')
            .insert([{
              id: data.user.id,
              email: data.user.email,
              name: tempUser.full_name,
              subscription_plan: 'free',
              subscription_status: 'active',
              credits_remaining: 10,
              created_at: tempUser.created_at,
              updated_at: new Date().toISOString()
            }])
          
          if (insertError) {
            console.warn('⚠️ [MIGRATE] Aviso: Erro ao inserir em public.users:', insertError)
          } else {
            console.log('✅ [MIGRATE] Usuário também inserido em public.users')
          }
        } catch (publicError) {
          console.warn('⚠️ [MIGRATE] Aviso: Erro na inserção public.users:', publicError)
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Usuário migrado com sucesso!',
          user: {
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name,
            email_confirmed: !!data.user.email_confirmed_at,
            needs_confirmation: !data.user.email_confirmed_at
          }
        })
      } else {
        console.error('❌ [MIGRATE] Erro na migração:', error?.message)
        
        // Marcar como falha
        await supabase
          .from('temp_registrations')
          .update({
            status: 'failed'
          })
          .eq('id', tempId)

        return NextResponse.json({ 
          success: false, 
          error: 'Erro na migração: ' + (error?.message || 'Erro desconhecido')
        }, { status: 400 })
      }
    } catch (migrateError) {
      console.error('❌ [MIGRATE] Erro inesperado na migração:', migrateError)
      
      // Marcar como falha
      await supabase
        .from('temp_registrations')
        .update({
          status: 'failed'
        })
        .eq('id', tempId)

      return NextResponse.json({ 
        success: false, 
        error: 'Erro inesperado na migração'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ [MIGRATE] Erro geral:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Listar registros temporários pendentes
    const { data: pendingUsers, error } = await supabase
      .from('temp_registrations')
      .select('id, email, full_name, created_at, status')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({ 
      message: 'API de migração de usuários temporários',
      status: 'ativa',
      pending_migrations: pendingUsers?.length || 0,
      recent_pending: pendingUsers || []
    })
  } catch (error) {
    return NextResponse.json({ 
      message: 'API de migração de usuários temporários',
      status: 'ativa',
      error: 'Erro ao buscar registros pendentes'
    })
  }
} 