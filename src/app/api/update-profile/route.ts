import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, full_name } = await request.json()

    console.log(`🔐 Atualizando perfil do usuário: ${userId}`)

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Serviço não disponível' 
      }, { status: 500 })
    }

    if (!userId || !full_name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Dados obrigatórios não fornecidos' 
      }, { status: 400 })
    }

    // Buscar dados atuais do usuário
    const { data: currentUser, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (fetchError || !currentUser.user) {
      console.error('❌ Erro ao buscar usuário:', fetchError)
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      }, { status: 404 })
    }

    // Mesclar com dados existentes
    const currentMetadata = currentUser.user.user_metadata || {}
    const newMetadata = {
      ...currentMetadata,
      full_name: full_name,
      updated_at: new Date().toISOString()
    }

    // Atualizar user_metadata
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: newMetadata
    })

    if (error) {
      console.error('❌ Erro ao atualizar perfil:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao atualizar perfil',
        details: error
      }, { status: 400 })
    }

    console.log('✅ Perfil atualizado com sucesso!')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Perfil atualizado com sucesso',
      user: data.user
    })
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'API de atualização de perfil',
    status: 'ativa'
  })
} 