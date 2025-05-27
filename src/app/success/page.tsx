'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Download, ArrowRight, Smartphone } from 'lucide-react'
import Link from 'next/link'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    if (sessionId) {
      // Aqui você pode fazer uma chamada para verificar a sessão
      // Por enquanto, vamos simular o sucesso
      setTimeout(() => {
        setSession({
          customer_email: 'usuario@exemplo.com',
          amount_total: 2999,
          currency: 'brl'
        })
        setLoading(false)
      }, 1000)
    }
  }, [sessionId])

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
              <p className="text-white font-semibold text-lg">Mercado Mágico Pro</p>
            </div>
            
            <div>
              <p className="text-gray-400 mb-2">Valor Mensal</p>
              <p className="text-white font-semibold text-lg">R$ 29,99</p>
            </div>
            
            <div>
              <p className="text-gray-400 mb-2">Créditos Mensais</p>
              <p className="text-white font-semibold text-lg">200 créditos</p>
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
                <h3 className="text-white font-semibold mb-1">Baixe o App</h3>
                <p className="text-gray-400">Faça o download do Mercado Mágico na App Store ou Google Play</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Faça Login</h3>
                <p className="text-gray-400">Use o mesmo email da compra para acessar sua conta premium</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Comece a Usar</h3>
                <p className="text-gray-400">Aproveite todos os recursos premium e seus 200 créditos mensais</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition-all transform hover:scale-105 font-semibold text-lg flex items-center justify-center space-x-2">
            <Smartphone className="w-5 h-5" />
            <span>Baixar App</span>
          </button>
          
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