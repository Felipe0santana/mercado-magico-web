'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Download, ArrowRight, Smartphone } from 'lucide-react'
import Link from 'next/link'

interface SessionData {
  customer_email: string
  amount_total: number
  currency: string
  metadata?: {
    plan?: string
    credits?: string
  }
  subscription?: {
    items: {
      data: Array<{
        price: {
          id: string
          unit_amount: number
          currency: string
        }
      }>
    }
  }
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<SessionData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionId) {
      fetchSessionData(sessionId)
    }
  }, [sessionId])

  const fetchSessionData = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/checkout-session?session_id=${sessionId}`)
      const data = await response.json()
      
      if (response.ok) {
        setSession(data)
      } else {
        setError(data.error || 'Erro ao carregar dados da sessão')
      }
    } catch (err) {
      console.error('Erro ao buscar dados da sessão:', err)
      setError('Erro ao carregar dados da sessão')
    } finally {
      setLoading(false)
    }
  }

  const getPlanInfo = (planName?: string) => {
    switch (planName?.toLowerCase()) {
      case 'plus':
        return {
          name: 'Mercado Mágico Plus',
          price: 'R$ 9,99',
          credits: '50 créditos'
        }
      case 'pro':
        return {
          name: 'Mercado Mágico Pro',
          price: 'R$ 29,99',
          credits: '200 créditos'
        }
      case 'premium':
        return {
          name: 'Mercado Mágico Premium',
          price: 'R$ 99,99',
          credits: 'Créditos ilimitados'
        }
      default:
        return {
          name: 'Mercado Mágico',
          price: 'R$ 0,00',
          credits: '10 créditos'
        }
    }
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Processando pagamento...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl">!</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Erro ao Carregar Dados</h1>
          <p className="text-gray-400 mb-8">{error}</p>
          <Link href="/" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
            Voltar ao Site
          </Link>
        </div>
      </div>
    )
  }

  const planInfo = getPlanInfo(session?.metadata?.plan)
  const actualPrice = session ? formatPrice(session.amount_total, session.currency) : planInfo.price

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            Pagamento Realizado com Sucesso! 🎉
          </h1>
          
          <p className="text-xl text-gray-300 mb-8">
            Bem-vindo ao Mercado Mágico! Sua assinatura foi ativada e você já pode aproveitar todos os recursos.
          </p>
        </div>

        {/* Detalhes do Pagamento */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Detalhes da Assinatura</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 mb-2">Plano Escolhido</p>
              <p className="text-white font-semibold text-lg">{planInfo.name}</p>
            </div>
            
            <div>
              <p className="text-gray-400 mb-2">Valor Mensal</p>
              <p className="text-white font-semibold text-lg">{actualPrice}</p>
            </div>
            
            <div>
              <p className="text-gray-400 mb-2">Créditos Mensais</p>
              <p className="text-white font-semibold text-lg">{planInfo.credits}</p>
            </div>
            
            <div>
              <p className="text-gray-400 mb-2">Próxima Cobrança</p>
              <p className="text-white font-semibold text-lg">
                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        {/* Próximos Passos */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Próximos Passos</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Acesse seu Perfil</h3>
                <p className="text-gray-400">Verifique se seu plano foi ativado corretamente na área de perfil</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Baixe o App</h3>
                <p className="text-gray-400">Faça o download do Mercado Mágico na App Store ou Google Play</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Comece a Usar</h3>
                <p className="text-gray-400">Aproveite todos os recursos premium e seus créditos mensais</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/profile" className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition-all transform hover:scale-105 font-semibold text-lg flex items-center justify-center space-x-2">
            <span>Ver Meu Perfil</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <Link href="/" className="border-2 border-gray-600 text-gray-300 px-8 py-4 rounded-xl hover:bg-gray-800 transition-all font-semibold text-lg flex items-center justify-center space-x-2">
            <span>Voltar ao Site</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Suporte */}
        <div className="text-center mt-12 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
          <h3 className="text-white font-semibold mb-2">Precisa de Ajuda?</h3>
          <p className="text-gray-400 mb-4">
            Nossa equipe está pronta para ajudar você a aproveitar ao máximo o Mercado Mágico
          </p>
          <a 
            href="mailto:sugestoes@mercadomagico.com.br" 
            className="text-green-400 hover:text-green-300 transition-colors font-medium"
          >
            sugestoes@mercadomagico.com.br
          </a>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Carregando...</p>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  )
} 