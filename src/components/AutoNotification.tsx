'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { CheckCircle, Crown, Star, Zap, X } from 'lucide-react'

interface NotificationData {
  id: string
  title: string
  message: string
  plan: string
  credits: number
  timestamp: number
}

export default function AutoNotification() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [lastPlan, setLastPlan] = useState<string>('')

  // Detectar mudanças no plano do usuário
  useEffect(() => {
    if (user && user.subscription_plan !== lastPlan && lastPlan !== '') {
      console.log(`🎉 [NOTIFICATION] Plano atualizado: ${lastPlan} → ${user.subscription_plan}`)
      
      const notification: NotificationData = {
        id: `plan_update_${Date.now()}`,
        title: 'Plano Atualizado Automaticamente!',
        message: `Seu plano foi atualizado para ${user.subscription_plan.toUpperCase()}`,
        plan: user.subscription_plan,
        credits: user.credits_remaining,
        timestamp: Date.now()
      }
      
      setNotifications(prev => [...prev, notification])
      
      // Auto-dismiss após 5 segundos
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id))
      }, 5000)
    }
    
    if (user) {
      setLastPlan(user.subscription_plan)
    }
  }, [user?.subscription_plan, lastPlan])

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'super':
      case 'premium':
        return <Crown className="w-6 h-6 text-yellow-400" />
      case 'pro':
        return <Star className="w-6 h-6 text-purple-400" />
      case 'plus':
        return <Zap className="w-6 h-6 text-blue-400" />
      default:
        return <CheckCircle className="w-6 h-6 text-green-400" />
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'super':
        return 'from-purple-600 to-pink-600'
      case 'premium':
        return 'from-yellow-500 to-orange-500'
      case 'pro':
        return 'from-purple-500 to-purple-700'
      case 'plus':
        return 'from-blue-500 to-blue-700'
      default:
        return 'from-green-500 to-green-700'
    }
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 min-w-[320px] max-w-[400px] animate-slide-in-right"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getPlanIcon(notification.plan)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold text-sm">
                  {notification.title}
                </h3>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-gray-300 text-sm mb-3">
                {notification.message}
              </p>
              
              <div className="flex items-center justify-between">
                <div className={`bg-gradient-to-r ${getPlanColor(notification.plan)} text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1`}>
                  <span className="capitalize">{notification.plan}</span>
                </div>
                
                <div className="text-green-400 text-xs font-medium">
                  {notification.credits === -1 ? '∞ créditos' : `${notification.credits} créditos`}
                </div>
              </div>
            </div>
          </div>
          
          {/* Barra de progresso para auto-dismiss */}
          <div className="mt-3 w-full bg-gray-700 rounded-full h-1">
            <div 
              className={`bg-gradient-to-r ${getPlanColor(notification.plan)} h-1 rounded-full animate-progress-bar`}
            ></div>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes progress-bar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        
        .animate-progress-bar {
          animation: progress-bar 5s linear;
        }
      `}</style>
    </div>
  )
} 