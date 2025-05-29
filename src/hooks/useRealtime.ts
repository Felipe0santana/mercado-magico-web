'use client'

import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

interface RealtimeEvent {
  id: number
  event_type: string
  user_email: string
  stripe_session_id?: string
  amount?: number
  plan?: string
  credits?: number
  processed_at: string
  metadata?: any
  created_at: string
}

interface RealtimeNotification {
  id: number
  user_email: string
  type: string
  title: string
  message: string
  data?: any
  read: boolean
  created_at: string
}

export function useRealtime() {
  const { user, refreshUser } = useAuth()

  const handleEventUpdate = useCallback(async (payload: any) => {
    console.log('🔔 [REALTIME] Evento recebido:', payload)
    
    const event = payload.new as RealtimeEvent
    
    // Verificar se o evento é para o usuário atual
    if (user?.email && event.user_email === user.email) {
      console.log(`✅ [REALTIME] Evento para ${user.email}: ${event.event_type}`)
      
      if (event.event_type === 'stripe_payment_completed') {
        console.log(`💳 [REALTIME] Pagamento processado: ${event.plan} (R$ ${event.amount ? event.amount/100 : 0})`)
        
        // Aguardar um pouco para garantir que o banco foi atualizado
        setTimeout(async () => {
          await refreshUser()
          console.log('🔄 [REALTIME] Usuário atualizado automaticamente')
        }, 1000)
      }
    }
  }, [user?.email, refreshUser])

  const handleNotificationUpdate = useCallback((payload: any) => {
    console.log('🔔 [REALTIME] Notificação recebida:', payload)
    
    const notification = payload.new as RealtimeNotification
    
    // Verificar se a notificação é para o usuário atual
    if (user?.email && notification.user_email === user.email) {
      console.log(`📢 [REALTIME] Notificação para ${user.email}: ${notification.title}`)
      
      // Mostrar notificação no browser se possível
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        })
      }
      
      // Atualizar usuário se for notificação de plano
      if (notification.type === 'plan_updated') {
        setTimeout(async () => {
          await refreshUser()
          console.log('🔄 [REALTIME] Usuário atualizado por notificação')
        }, 500)
      }
    }
  }, [user?.email, refreshUser])

  useEffect(() => {
    if (!user?.email) {
      console.log('⚠️ [REALTIME] Usuário não logado, não iniciando listeners')
      return
    }

    console.log(`🚀 [REALTIME] Iniciando listeners para ${user.email}`)

    // Solicitar permissão para notificações
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log(`🔔 [REALTIME] Permissão de notificação: ${permission}`)
      })
    }

    // Listener para eventos
    const eventsChannel = supabase
      .channel('events-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events'
        },
        handleEventUpdate
      )
      .subscribe((status) => {
        console.log(`📡 [REALTIME] Events channel status: ${status}`)
      })

    // Listener para notificações
    const notificationsChannel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        handleNotificationUpdate
      )
      .subscribe((status) => {
        console.log(`📡 [REALTIME] Notifications channel status: ${status}`)
      })

    // Cleanup
    return () => {
      console.log('🛑 [REALTIME] Removendo listeners')
      eventsChannel.unsubscribe()
      notificationsChannel.unsubscribe()
    }
  }, [user?.email, handleEventUpdate, handleNotificationUpdate])

  return {
    // Função para marcar notificação como lida
    markNotificationAsRead: async (notificationId: number) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_email', user?.email)

      if (error) {
        console.error('❌ [REALTIME] Erro ao marcar notificação como lida:', error)
      }
    },

    // Função para buscar notificações não lidas
    getUnreadNotifications: async () => {
      if (!user?.email) return []

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', user.email)
        .eq('read', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ [REALTIME] Erro ao buscar notificações:', error)
        return []
      }

      return data || []
    }
  }
} 