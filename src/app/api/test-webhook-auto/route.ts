import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, plan = 'premium' } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Cliente admin não configurado' }, { status: 500 })
    }

    console.log(`🧪 Testando atualização automática para ${email} → ${plan}`)

    // Buscar usuário por email
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError)
      return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
    }

    const user = authUsers?.users?.find(u => u.email === email)

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Simular atualização de plano como se fosse do webhook
    const credits = plan === 'premium' ? -1 : plan === 'plus' ? 50 : 200
    
    const updateData = {
      user_metadata: {
        ...user.user_metadata,
        subscription_plan: plan,
        subscription_status: 'active',
        credits_remaining: credits,
        last_payment_amount: plan === 'premium' ? 2999 : plan === 'plus' ? 999 : 1999,
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        test_update: new Date().getTime() // Para forçar mudança
      }
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, updateData)

    if (updateError) {
      console.error('❌ Erro ao atualizar usuário:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
    }

    console.log(`✅ Usuário ${email} atualizado para ${plan} com ${credits === -1 ? 'créditos ilimitados' : credits + ' créditos'}`)

    // Forçar uma segunda atualização para garantir propagação
    setTimeout(async () => {
      try {
        if (!supabaseAdmin) return
        
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...updateData.user_metadata,
            force_refresh: new Date().getTime()
          }
        })
        console.log(`🔄 Refresh forçado para ${email}`)
      } catch (refreshError) {
        console.error('⚠️ Erro no refresh forçado:', refreshError)
      }
    }, 1000)

    return NextResponse.json({ 
      success: true, 
      message: `Plano atualizado para ${plan}`,
      user: { 
        email, 
        plan, 
        credits: credits === -1 ? 'ilimitados' : credits,
        updated_at: updateData.user_metadata.updated_at
      }
    })

  } catch (error) {
    console.error('❌ Erro no teste de webhook:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 