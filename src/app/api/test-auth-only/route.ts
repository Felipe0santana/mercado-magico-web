import { NextRequest, NextResponse } from 'next/server'
import { supabase, users } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando nova abordagem usando apenas auth.users...')

    // Listar todos os usuários
    const { data: allUsers, error: listError } = await users.listAll()
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError)
      return NextResponse.json({ 
        error: 'Erro ao listar usuários',
        details: typeof listError === 'object' && listError && 'message' in listError 
          ? (listError as any).message 
          : 'Erro desconhecido'
      }, { status: 500 })
    }

    console.log(`✅ Encontrados ${allUsers.length} usuários`)

    // Buscar usuário específico por email
    const testEmail = 'admin6@admin.com'
    const userByEmail = await users.getByEmail(testEmail)
    
    console.log(`🔍 Usuário ${testEmail}:`, userByEmail ? 'Encontrado' : 'Não encontrado')

    return NextResponse.json({
      success: true,
      message: 'Teste da nova abordagem usando apenas auth.users',
      stats: {
        totalUsers: allUsers.length,
        usersFound: allUsers.length > 0,
        testUserFound: !!userByEmail
      },
      users: allUsers.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        credits_remaining: user.credits_remaining,
        created_at: user.created_at
      })),
      testUser: userByEmail ? {
        id: userByEmail.id,
        email: userByEmail.email,
        subscription_plan: userByEmail.user_metadata?.subscription_plan || 'free',
        credits_remaining: userByEmail.user_metadata?.credits_remaining || 10
      } : null
    })

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, plan, credits } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    console.log(`🔄 Atualizando plano para ${email}: ${plan} com ${credits} créditos`)

    // Atualizar plano usando a nova função
    const result = await users.updatePlanByEmail(email, plan || 'pro', credits || 100)

    if (!result) {
      return NextResponse.json({ 
        error: 'Erro ao atualizar plano',
        details: 'Usuário não encontrado ou erro na atualização'
      }, { status: 404 })
    }

    console.log(`✅ Plano atualizado com sucesso para ${email}`)

    return NextResponse.json({
      success: true,
      message: 'Plano atualizado com sucesso usando auth.users',
      user: {
        id: result.id,
        email: result.email,
        subscription_plan: result.user_metadata?.subscription_plan,
        credits_remaining: result.user_metadata?.credits_remaining,
        updated_at: result.user_metadata?.updated_at
      }
    })

  } catch (error) {
    console.error('❌ Erro ao atualizar plano:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 