'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRealtime } from '@/hooks/useRealtime'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  User, 
  Settings, 
  CreditCard, 
  History, 
  LogOut, 
  Edit3, 
  Save, 
  X, 
  Shield, 
  Mail, 
  Calendar,
  Star,
  Zap,
  Crown,
  Award,
  Loader2,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  DollarSign,
  Activity,
  BarChart3
} from 'lucide-react'
import ChangePasswordModal from '@/components/ChangePasswordModal'
import DeleteAccountModal from '@/components/DeleteAccountModal'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  name?: string
  avatar_url?: string
  subscription_status?: string
  subscription_plan?: string
  credits_remaining?: number
  total_credits_purchased?: number
  created_at: string
  updated_at: string
}

interface UserStats {
  totalShoppingLists: number
  totalShoppingItems: number
  totalPurchases: number
  totalCreditTransactions: number
  averageListSize: number
  lastActivity: string
  mostUsedFeature: string
  totalSpent: number
  creditsUsedThisMonth: number
  listsCreatedThisMonth: number
}

export default function ProfilePage() {
  const { user, loading, isRefreshing, signOut, refreshUser } = useAuth()
  const { getUnreadNotifications, markNotificationAsRead } = useRealtime()
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      // Carregar notificações não lidas
      getUnreadNotifications().then(setNotifications)
    }
  }, [user, getUnreadNotifications])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    await markNotificationAsRead(notificationId)
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium': return 'text-yellow-400'
      case 'pro': return 'text-purple-400'
      case 'plus': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'premium': return 'Premium'
      case 'pro': return 'Pro'
      case 'plus': return 'Plus'
      default: return 'Gratuito'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Meu Perfil</h1>
                <p className="text-gray-300">Gerencie sua conta e assinatura</p>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sair
              </button>
            </div>
          </div>

          {/* Status do Realtime */}
          <div className="bg-green-500/20 backdrop-blur-md rounded-xl p-4 mb-6 border border-green-500/30">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 font-medium">
                🔔 Updates instantâneos ativados via Realtime
              </span>
            </div>
            <p className="text-green-200 text-sm mt-1">
              Seu perfil será atualizado automaticamente após pagamentos
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Informações da Conta */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Informações da Conta</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 text-sm">Email</label>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
                
                <div>
                  <label className="text-gray-300 text-sm">ID do Usuário</label>
                  <p className="text-white font-mono text-xs break-all">{user.id}</p>
                </div>

                <div>
                  <label className="text-gray-300 text-sm">Última Atualização</label>
                  <p className="text-white text-sm">
                    {user.updated_at ? new Date(user.updated_at).toLocaleString('pt-BR') : 'Não disponível'}
                  </p>
                </div>
              </div>
            </div>

            {/* Plano e Créditos */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Plano Atual</h2>
                {isRefreshing && (
                  <div className="text-blue-400 text-sm flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    Atualizando...
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 text-sm">Plano</label>
                  <p className={`text-2xl font-bold ${getPlanColor(user.subscription_plan)}`}>
                    {getPlanName(user.subscription_plan)}
                  </p>
                </div>
                
                <div>
                  <label className="text-gray-300 text-sm">Status</label>
                  <p className="text-white capitalize">{user.subscription_status}</p>
                </div>
                
                <div>
                  <label className="text-gray-300 text-sm">Créditos Restantes</label>
                  <p className="text-white text-xl font-semibold">
                    {user.credits_remaining === -1 ? '∞ Ilimitados' : user.credits_remaining}
                  </p>
                </div>
              </div>

              {/* Botão de refresh manual (backup) */}
              <button
                onClick={refreshUser}
                disabled={isRefreshing}
                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isRefreshing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Atualizando...
                  </>
                ) : (
                  <>
                    🔄 Atualizar Manualmente
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Notificações */}
          {notifications.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mt-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Notificações ({notifications.length})
              </h2>
              
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-medium">{notification.title}</h3>
                        <p className="text-gray-300 text-sm mt-1">{notification.message}</p>
                        <p className="text-gray-400 text-xs mt-2">
                          {new Date(notification.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Marcar como lida
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informações de Debug */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mt-6">
            <h2 className="text-lg font-semibold text-white mb-4">Debug Info</h2>
            <pre className="text-gray-300 text-xs overflow-auto">
              {JSON.stringify({
                plan: user.subscription_plan,
                status: user.subscription_status,
                credits: user.credits_remaining,
                updated_at: user.updated_at,
                force_refresh: user.force_refresh
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
} 