import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando configuração do webhook...')

    // Verificar variáveis de ambiente
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const config = {
      stripe: {
        secretKey: !!stripeSecretKey,
        webhookSecret: !!webhookSecret,
      },
      supabase: {
        url: !!supabaseUrl,
        key: !!supabaseKey,
      }
    }

    console.log('⚙️ Configuração:', config)

    // Testar conexão com Supabase
    const { data: testConnection, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (connectionError) {
      console.error('❌ Erro de conexão com Supabase:', connectionError)
      return NextResponse.json({
        status: 'error',
        message: 'Erro de conexão com Supabase',
        config,
        error: connectionError
      }, { status: 500 })
    }

    console.log('✅ Conexão com Supabase OK')

    // Verificar se o usuário admin2@admin2.com existe
    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('id, email, subscription_plan, credits_remaining, updated_at')
      .eq('email', 'admin2@admin2.com')
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar usuário admin:', userError)
      return NextResponse.json({
        status: 'error',
        message: 'Usuário admin não encontrado',
        config,
        error: userError
      }, { status: 404 })
    }

    console.log('👤 Usuário admin encontrado:', adminUser)

    return NextResponse.json({
      status: 'success',
      message: 'Webhook e configurações OK',
      config,
      adminUser,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro na verificação:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Erro interno',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'force_refresh_user') {
      console.log('🔄 Forçando atualização do usuário admin...')

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('email', 'admin2@admin2.com')
        .select()

      if (updateError) {
        console.error('❌ Erro ao atualizar usuário:', updateError)
        return NextResponse.json({
          status: 'error',
          message: 'Erro ao atualizar usuário',
          error: updateError
        }, { status: 500 })
      }

      console.log('✅ Usuário atualizado:', updatedUser)

      return NextResponse.json({
        status: 'success',
        message: 'Usuário atualizado com sucesso',
        user: updatedUser[0]
      })
    }

    return NextResponse.json({
      status: 'error',
      message: 'Ação não reconhecida'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ Erro na ação:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Erro interno',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 