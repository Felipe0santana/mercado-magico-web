import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Forçando atualização do plano...')

    const { email, plan, credits } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    console.log(`📧 Atualizando usuário: ${email}`)
    console.log(`📦 Novo plano: ${plan}`)
    console.log(`💰 Novos créditos: ${credits}`)

    // Buscar usuário pelo email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      console.error('❌ Usuário não encontrado:', userError)
      return NextResponse.json({ 
        error: 'Usuário não encontrado',
        details: userError?.message 
      }, { status: 404 })
    }

    console.log('✅ Usuário encontrado:', user.id)

    // Atualizar plano e créditos
    const updateData: any = {}
    
    if (plan) {
      updateData.subscription_plan = plan
    }
    
    if (credits !== undefined) {
      updateData.credits_remaining = credits
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erro ao atualizar usuário:', updateError)
      return NextResponse.json({ 
        error: 'Erro ao atualizar usuário',
        details: updateError.message 
      }, { status: 500 })
    }

    console.log('✅ Usuário atualizado com sucesso!')

    return NextResponse.json({
      success: true,
      message: 'Plano atualizado com sucesso!',
      user: updatedUser
    })

  } catch (error) {
    console.error('❌ Erro na API force-update-plan:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 