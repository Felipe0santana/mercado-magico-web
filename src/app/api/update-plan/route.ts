import { NextRequest, NextResponse } from 'next/server'
import { users, purchaseHistory, getCreditsByPlan } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, plan, amount } = await request.json()

    console.log('=== 🔧 ATUALIZAÇÃO MANUAL DE PLANO ===')
    console.log('Email:', email)
    console.log('Plano:', plan)
    console.log('Valor:', amount)

    // Validar entrada
    if (!email || !plan) {
      return NextResponse.json({ error: 'Email e plano são obrigatórios' }, { status: 400 })
    }

    // Buscar usuário por email
    console.log('🔍 Buscando usuário...')
    const user = await users.getByEmail(email)
    
    if (!user) {
      console.log('❌ Usuário não encontrado')
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    console.log('✅ Usuário encontrado:', user.id)

    // Definir créditos baseado no plano
    const creditsToAdd = getCreditsByPlan(plan)
    console.log('💳 Créditos para o plano', plan + ':', creditsToAdd)

    // Atualizar plano do usuário
    console.log('🔄 Atualizando plano...')
    const updatedUser = await users.updatePlanByEmail(email, plan, creditsToAdd)
    
    if (!updatedUser) {
      console.log('❌ Erro ao atualizar plano')
      return NextResponse.json({ error: 'Erro ao atualizar plano' }, { status: 500 })
    }

    console.log('✅ Plano atualizado com sucesso')

    // Criar registro de compra se valor foi fornecido
    if (amount && amount > 0) {
      console.log('💰 Criando registro de compra...')
      const purchaseData = {
        user_id: user.id,
        total_amount: amount,
        store_name: `Mercado Mágico - Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
        purchase_date: new Date().toISOString()
      }

      const { data: purchase, error: purchaseError } = await purchaseHistory.create(purchaseData)
      
      if (purchaseError) {
        console.log('⚠️ Erro ao criar registro de compra:', purchaseError)
      } else {
        console.log('✅ Registro de compra criado:', purchase?.[0]?.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Plano atualizado para ${plan} com ${creditsToAdd === -1 ? 'créditos ilimitados' : creditsToAdd + ' créditos'}`,
      user: updatedUser[0]
    })

  } catch (error) {
    console.error('❌ Erro na API:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 