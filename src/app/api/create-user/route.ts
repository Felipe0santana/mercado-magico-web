import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔧 Criando usuário admin2@admin2.com...')
    
    const userData = {
      id: 'da2f7907-f408-4ca9-bb74-dc580963be4c',
      email: 'admin2@admin2.com',
      subscription_plan: 'plus',
      subscription_status: 'active',
      credits_remaining: 50,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
    
    if (error) {
      console.error('❌ Erro ao criar usuário:', error)
      return NextResponse.json({ 
        error: 'Erro ao criar usuário', 
        details: error 
      }, { status: 500 })
    }

    console.log('✅ Usuário criado com sucesso:', data)

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: data[0]
    })

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 