'use client'

import { useState, useEffect } from 'react'
import { Check, Camera, Brain, BarChart3, ShoppingCart, Smartphone, Zap, Star, Users, Shield, Clock, TrendingUp, Heart, Award, Loader2, LogOut, User as UserIcon } from 'lucide-react'
import { useCheckout } from '@/hooks/useCheckout'
import { useAuth } from '@/hooks/useAuth'
import AuthModal from '@/components/AuthModal'
import AutoNotification from '@/components/AutoNotification'

export default function Home() {
  const { redirectToCheckout, loading, error } = useCheckout()
  const { user, loading: authLoading, signOut } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login')
  const [isHydrated, setIsHydrated] = useState(false)
  const [authResolved, setAuthResolved] = useState(false)

  // Aguardar hidratação para evitar flash de conteúdo
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Controlar quando a autenticação foi resolvida
  useEffect(() => {
    if (isHydrated && !authLoading) {
      setAuthResolved(true)
    }
  }, [isHydrated, authLoading])

  // Debug do estado de autenticação
  console.log('🏠 [PAGE] Estado atual:', {
    user: user ? { email: user.email, plan: user.subscription_plan } : null,
    authLoading,
    authModalOpen,
    isHydrated,
    authResolved
  })

  const plans = [
    {
      name: 'Gratuito',
      price: 'R$ 0',
      period: '/mês',
      credits: '10 créditos',
      description: 'Perfeito para começar',
      features: [
        '10 créditos por mês',
        'Todos os recursos liberados',
        'Lista de compras inteligente',
        'Reconhecimento básico por IA',
        'Análise nutricional InfoCal',
        'Comparação de preços',
        'Suporte por email'
      ],
      buttonText: 'Começar Grátis',
      buttonStyle: 'bg-green-600 text-white hover:bg-green-700',
      popular: false,
      icon: ShoppingCart,
      ads: true,
      isFree: true,
      priceValue: 0
    },
    {
      name: 'Plus',
      price: 'R$ 9,99',
      period: '/mês',
      credits: '50 créditos',
      description: 'Para uso regular',
      features: [
        '50 créditos por mês',
        'Todos os recursos liberados',
        'Reconhecimento avançado por foto',
        'Listas manuscritas por IA',
        'Análise nutricional completa',
        'Histórico de compras',
        'Notificações inteligentes',
        'Suporte prioritário'
      ],
      buttonText: 'Escolher Plus',
      buttonStyle: 'bg-blue-600 text-white hover:bg-blue-700',
      popular: false,
      icon: Star,
      ads: true,
      isFree: false,
      priceValue: 9.99
    },
    {
      name: 'Pro',
      price: 'R$ 29,99',
      period: '/mês',
      credits: '200 créditos',
      description: 'Para usuários intensivos',
      features: [
        '200 créditos por mês',
        'Todos os recursos liberados',
        'IA avançada para produtos',
        'Análise nutricional premium',
        'Relatórios detalhados',
        'Comparação entre mercados',
        'Alertas personalizados',
        'Suporte 24/7'
      ],
      buttonText: 'Escolher Pro',
      buttonStyle: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700',
      popular: true,
      icon: TrendingUp,
      ads: true,
      isFree: false,
      priceValue: 29.99
    },
    {
      name: 'Premium',
      price: 'R$ 99,99',
      period: '/mês',
      credits: 'Ilimitados',
      description: 'Experiência completa',
      features: [
        'Créditos ilimitados',
        'Todos os recursos liberados',
        'Sem propagandas',
        'IA premium para reconhecimento',
        'Análise nutricional avançada',
        'Relatórios personalizados',
        'Acesso antecipado a novidades',
        'Suporte VIP dedicado'
      ],
      buttonText: 'Escolher Premium',
      buttonStyle: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700',
      popular: false,
      icon: Award,
      ads: false,
      isFree: false,
      priceValue: 99.99
    }
  ]

  const features = [
    {
      icon: Camera,
      title: 'Reconhecimento por IA',
      description: 'Fotografe produtos e nossa IA identifica automaticamente nome, categoria e preço',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Brain,
      title: 'Listas Manuscritas',
      description: 'Fotografe listas escritas à mão e transforme em lista digital inteligente',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Heart,
      title: 'InfoCal - Análise Nutricional',
      description: 'Analise calorias e macronutrientes por foto, com sugestões saudáveis personalizadas',
      color: 'from-red-500 to-orange-500'
    },
    {
      icon: BarChart3,
      title: 'Comparação de Preços',
      description: 'Compare preços entre estabelecimentos e encontre as melhores ofertas',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Clock,
      title: 'Notificações Inteligentes',
      description: 'Receba lembretes de compras, ofertas e alertas de reabastecimento',
      color: 'from-yellow-500 to-amber-500'
    },
    {
      icon: Shield,
      title: 'Controle de Validade',
      description: 'Monitore datas de validade e receba alertas para evitar desperdícios',
      color: 'from-indigo-500 to-purple-500'
    }
  ]

  const testimonials = [
    {
      name: 'Maria Silva',
      role: 'Mãe de família',
      content: 'Revolucionou minhas compras! A IA reconhece tudo que fotografo e ainda me ajuda a economizar.',
      rating: 5
    },
    {
      name: 'João Santos',
      role: 'Empresário',
      content: 'O InfoCal me ajuda a manter uma alimentação saudável. Análise nutricional por foto é incrível!',
      rating: 5
    },
    {
      name: 'Ana Costa',
      role: 'Nutricionista',
      content: 'Recomendo para todos os meus pacientes. A análise nutricional é muito precisa.',
      rating: 5
    }
  ]

  const handlePlanSelect = async (plan: any) => {
    if (plan.isFree) {
      // Redirecionar para download do app ou página de cadastro
      window.open('https://play.google.com/store', '_blank')
      return
    }

    // Verificar se o usuário está logado
    if (!user) {
      setAuthModalTab('login')
      setAuthModalOpen(true)
      return
    }

    // Prosseguir com o checkout
    await redirectToCheckout({
      planName: plan.name,
      userEmail: user.email,
    })
  }

  const handleAuthSuccess = () => {
    setAuthModalOpen(false)
    // Aqui você pode adicionar lógica adicional após o login bem-sucedido
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const openAuthModal = (tab: 'login' | 'register') => {
    setAuthModalTab(tab)
    setAuthModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <p className="font-medium">Erro no pagamento</p>
          <p className="text-sm opacity-90">{error}</p>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
        onSuccess={handleAuthSuccess}
      />

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold text-white">Mercado Mágico</span>
                <p className="text-xs text-gray-400">Lista inteligente com IA</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#recursos" className="text-gray-300 hover:text-white transition-colors">Recursos</a>
              <a href="#planos" className="text-gray-300 hover:text-white transition-colors">Planos</a>
              <a href="#depoimentos" className="text-gray-300 hover:text-white transition-colors">Depoimentos</a>
              <a href="#faq" className="text-gray-300 hover:text-white transition-colors">FAQ</a>
            </nav>
            <div className="flex items-center space-x-4">
              {!authResolved ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                </div>
              ) : user ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => window.location.href = '/profile'}
                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors bg-gray-800 px-3 py-2 rounded-lg hover:bg-gray-700"
                  >
                    <UserIcon className="w-5 h-5" />
                    <span className="text-sm">{user.email}</span>
                  </button>
                  <button
                    onClick={signOut}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      console.log('🔘 [PAGE] Botão Login clicado!')
                      setAuthModalTab('login')
                      setAuthModalOpen(true)
                    }}
                    className="text-gray-300 hover:text-white transition-colors bg-gray-800 px-3 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔘 [PAGE] Botão Registrar clicado!')
                      setAuthModalTab('register')
                      setAuthModalOpen(true)
                    }}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Registrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-gray-800 to-green-900">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium border border-green-500/30">
              🚀 Mais de 10.000 usuários confiam no Mercado Mágico
            </span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Transforme suas
            <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent"> compras</span>
            <br />com Inteligência Artificial
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Lista de compras inteligente que reconhece produtos por foto, analisa informações nutricionais 
            e ajuda você a economizar tempo e dinheiro com tecnologia de ponta.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition-all transform hover:scale-105 font-semibold text-lg flex items-center space-x-2">
              <Smartphone className="w-5 h-5" />
              <span>Download Grátis</span>
            </button>
            <button className="border border-gray-600 text-gray-300 px-8 py-4 rounded-xl hover:bg-gray-800 transition-colors font-semibold text-lg">
              Ver Demonstração
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">10K+</div>
              <div className="text-gray-400">Usuários Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">95%</div>
              <div className="text-gray-400">Precisão da IA</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">50%</div>
              <div className="text-gray-400">Economia de Tempo</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">4.9★</div>
              <div className="text-gray-400">Avaliação</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Recursos Revolucionários
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Tecnologia de ponta para transformar sua experiência de compras
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div
                  key={index}
                  className="bg-gray-900 rounded-2xl p-8 border border-gray-700 hover:border-green-500/50 transition-all duration-300 group"
                >
                  <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Escolha seu Plano Ideal
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Comece grátis e evolua conforme suas necessidades. Todos os planos incluem acesso completo aos recursos.
            </p>
            
            <div className="inline-flex items-center bg-gray-800 rounded-lg p-1">
              <button className="px-4 py-2 rounded-md bg-green-600 text-white font-medium">Mensal</button>
              <button className="px-4 py-2 rounded-md text-gray-400 font-medium">Anual</button>
              <span className="ml-2 bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm">-20%</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon
              return (
                <div
                  key={index}
                  className={`relative bg-gray-800 rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-105 ${
                    plan.popular 
                      ? 'border-green-500 shadow-xl shadow-green-500/20' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Mais Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-400">{plan.period}</span>
                    </div>
                    <div className="text-green-400 font-medium mb-2">{plan.credits}</div>
                    <p className="text-gray-400 text-sm">{plan.description}</p>
                    {!plan.ads && (
                      <div className="mt-2">
                        <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">Sem Anúncios</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => handlePlanSelect(plan)}
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${plan.buttonStyle} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processando...</span>
                      </>
                    ) : (
                      <span>{plan.buttonText}</span>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-400 mb-4">💳 Sistema de Créditos: 1 crédito = 1 uso de funcionalidade IA</p>
            <p className="text-sm text-gray-500">Créditos renovam mensalmente • Sem acumulação • Premium = Ilimitado</p>
            {!user && (
              <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg">
                <p className="text-yellow-400 font-medium">🔒 Para assinar um plano, você precisa estar logado</p>
                <button
                  onClick={() => openAuthModal('register')}
                  className="mt-2 text-green-400 hover:text-green-300 font-medium"
                >
                  Criar conta gratuita →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              O que nossos usuários dizem
            </h2>
            <p className="text-xl text-gray-400">
              Milhares de pessoas já transformaram suas compras
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-400">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Perguntas Frequentes
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Como funciona o sistema de créditos?
                </h3>
                <p className="text-gray-400">
                  Cada uso de funcionalidade IA (reconhecimento de produtos, análise nutricional, etc.) 
                  consome 1 crédito. Os créditos renovam mensalmente e não acumulam entre períodos.
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3">
                  A IA realmente reconhece qualquer produto?
                </h3>
                <p className="text-gray-400">
                  Nossa IA tem 95% de precisão e reconhece milhares de produtos. Ela identifica 
                  automaticamente nome, categoria e até preços das etiquetas fotografadas.
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3">
                  O que é o InfoCal?
                </h3>
                <p className="text-gray-400">
                  É nossa funcionalidade exclusiva de análise nutricional por foto. Fotografe 
                  alimentos e receba informações sobre calorias, macronutrientes e sugestões saudáveis.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Posso usar listas manuscritas?
                </h3>
                <p className="text-gray-400">
                  Sim! Somos o único app que lê listas escritas à mão. Fotografe sua lista 
                  manuscrita e nossa IA transforma em lista digital automaticamente.
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Posso cancelar a qualquer momento?
                </h3>
                <p className="text-gray-400">
                  Sim! Não há fidelidade. Cancele quando quiser e mantenha acesso aos 
                  recursos até o final do período pago. Seus dados ficam salvos.
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Meus dados estão seguros?
                </h3>
                <p className="text-gray-400">
                  Totalmente! Usamos criptografia de ponta, somos LGPD compliance e seus 
                  dados ficam protegidos em servidores seguros. Sua privacidade é prioridade.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-emerald-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para revolucionar suas compras?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Junte-se a mais de 10.000 usuários que já economizam tempo e dinheiro com o Mercado Mágico
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-white text-green-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 font-semibold text-lg flex items-center space-x-2">
              <Smartphone className="w-5 h-5" />
              <span>Download Grátis</span>
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl hover:bg-white hover:text-green-600 transition-all font-semibold text-lg">
              Ver Planos
            </button>
          </div>
          
          <p className="text-green-100 mt-6 text-sm">
            ✨ Comece grátis • Sem cartão de crédito • 10 créditos inclusos
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-white">Mercado Mágico</span>
                  <p className="text-xs text-gray-400">Lista inteligente com IA</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Transforme suas compras com inteligência artificial. 
                Reconhecimento de produtos, análise nutricional e muito mais.
              </p>
              <p className="text-sm text-gray-500">
                📧 sugestoes@mercadomagico.com.br
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Planos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrações</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Comunidade</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2024 Mercado Mágico. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacidade</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Termos</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">LGPD</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Componente de Notificação Automática */}
      <AutoNotification />
    </div>
  )
} 