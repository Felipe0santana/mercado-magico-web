import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando variáveis de ambiente...')

    const keys = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET
    }

    console.log('🔑 Chaves disponíveis:', keys)

    // Verificar se a service role key tem o formato correto
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const serviceKeyInfo = serviceKey ? {
      hasKey: true,
      startsWithEyJ: serviceKey.startsWith('eyJ'),
      length: serviceKey.length,
      preview: serviceKey.substring(0, 20) + '...'
    } : {
      hasKey: false
    }

    return NextResponse.json({
      success: true,
      message: 'Diagnóstico de chaves',
      keys,
      serviceKeyInfo,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 