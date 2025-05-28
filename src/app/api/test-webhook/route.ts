import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, plan, amount } = await request.json()

    console.log('=== TESTE DE WEBHOOK ===')
    console.log('Email:', email)
    console.log('Plano:', plan)
    console.log('Valor:', amount)

    // Definir créditos baseado no plano
    let creditsToAdd = 10 // padrão free
    switch (plan.toLowerCase()) {
      case 'plus':
        creditsToAdd = 50
        break
      case 'pro':
        creditsToAdd = 200
        break
      case 'premium':
        creditsToAdd = -1 // ilimitado
        break
    }

    console.log(`💳 Créditos a serem adicionados: ${creditsToAdd}`)

    // Buscar usuário existente no Supabase
    const { data: existingUser, error: userSearchError } = await supabase
      .from('users')
      .select('id, email, subscription_plan, credits_remaining')
      .eq('email', email)
      .single()

    if (userSearchError && userSearchError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar usuário:', userSearchError)
      return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 })
    }

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      console.log(`✅ Usuário existente encontrado: ${userId}`)
      console.log(`📊 Plano atual: ${existingUser.subscription_plan}, Créditos atuais: ${existingUser.credits_remaining}`)
      
      // Atualizar plano do usuário existente
      const { error: updateError } = await supabase
        .from('users')
        .update({
          subscription_plan: plan,
          subscription_status: 'active',
          credits_remaining: creditsToAdd,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('❌ Erro ao atualizar usuário existente:', updateError)
        return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
      }

      console.log(`✅ Plano do usuário ${email} atualizado para ${plan} com ${creditsToAdd} créditos`)
    } else {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Criar registro de compra
    const { error: transactionError } = await supabase
      .from('purchase_history')
      .insert({
        user_id: userId,
        total_amount: amount,
        store_name: `Mercado Mágico - Plano ${plan} (TESTE)`,
        purchase_date: new Date().toISOString()
      })

    if (transactionError) {
      console.error('❌ Erro ao criar registro de compra:', transactionError)
    } else {
      console.log(`✅ Registro de compra criado para ${email}`)
    }

    console.log(`🎉 Teste de webhook processado com sucesso para ${email}`)
    console.log('=== FIM DO TESTE ===')

    return NextResponse.json({ 
      success: true, 
      message: `Plano ${plan} ativado com ${creditsToAdd} créditos`,
      userId,
      creditsAdded: creditsToAdd
    })
  } catch (error) {
    console.error('❌ Erro no teste de webhook:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
} 