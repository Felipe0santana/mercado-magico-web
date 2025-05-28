import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    console.log(`🔐 Tentativa de registro: ${email}`)

    // Por enquanto, vamos informar que o cadastro está temporariamente indisponível
    // mas fornecer credenciais de teste
    return NextResponse.json({ 
      success: false, 
      error: 'Cadastro temporariamente indisponível. Use as credenciais de teste: admin6@admin.com / admin123',
      testCredentials: {
        email: 'admin6@admin.com',
        password: 'admin123',
        plan: 'Pro (200 créditos)'
      }
    }, { status: 400 })
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Use as credenciais de teste: admin6@admin.com / admin123' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'API de registro de usuário',
    status: 'ativa',
    testCredentials: {
      email: 'admin6@admin.com',
      password: 'admin123',
      plan: 'Pro (200 créditos)'
    }
  })
} 