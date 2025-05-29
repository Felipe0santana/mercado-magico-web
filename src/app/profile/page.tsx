'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  User, 
  ArrowLeft,
  LogOut,
  ShoppingCart,
  Package,
  Receipt,
  Zap,
  Edit,
  Shield,
  Trash2,
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  DollarSign,
  Save,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Crown,
  Star
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  plan: string
  credits: number
  created_at: string
  last_activity: string
}

interface UserStats {
  lists_created: number
  items_added: number
  purchases_made: number
  total_spent: number
  ai_usage: number
  monthly_lists: number
  monthly_ai_usage: number
  avg_items_per_list: number
  favorite_feature: string
}

export default function ProfilePage() {
  const { user, loading, signOut, refreshUser } = useAuth()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '' })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ 
    currentPassword: '', 
    newPassword: '', 
    confirmPassword: '' 
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [loadingAction, setLoadingAction] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Forçar refresh dos dados do usuário quando a página carregar
  useEffect(() => {
    const forceRefresh = async () => {
      if (refreshUser) {
        setIsRefreshing(true)
        await refreshUser()
        setIsRefreshing(false)
      }
    }
    
    forceRefresh()
  }, [refreshUser])

  // Detectar quando o usuário volta da página de pagamento
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && refreshUser) {
        console.log('🔄 [PROFILE] Página ficou visível, atualizando dados...')
        refreshUser()
      }
    }

    const handleFocus = () => {
      if (refreshUser) {
        console.log('🔄 [PROFILE] Página recebeu foco, atualizando dados...')
        refreshUser()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refreshUser])

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      // Carregar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erro ao carregar perfil:', profileError)
      } else if (profile) {
        setUserProfile(profile)
        setEditForm({ full_name: profile.full_name || '' })
      } else {
        // Criar perfil se não existir
        const newProfile = {
          id: user?.id,
          email: user?.email,
          full_name: null,
          plan: 'Pro',
          credits: 200,
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        }
        
        const { data: createdProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([newProfile])
          .select()
          .single()

        if (!createError && createdProfile) {
          setUserProfile(createdProfile)
          setEditForm({ full_name: createdProfile.full_name || '' })
        }
      }

      // Carregar estatísticas do usuário
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Erro ao carregar estatísticas:', statsError)
      } else if (stats) {
        setUserStats(stats)
      } else {
        // Criar estatísticas se não existirem
        const newStats = {
          user_id: user?.id,
          lists_created: 0,
          items_added: 0,
          purchases_made: 0,
          total_spent: 0,
          ai_usage: 1,
          monthly_lists: 0,
          monthly_ai_usage: 0,
          avg_items_per_list: 0,
          favorite_feature: 'Reconhecimento IA'
        }
        
        const { data: createdStats, error: createStatsError } = await supabase
          .from('user_stats')
          .insert([newStats])
          .select()
          .single()

        if (!createStatsError && createdStats) {
          setUserStats(createdStats)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const handleGoBack = () => {
    router.push('/')
  }

  const handleEditProfile = async () => {
    if (!userProfile) return
    
    setLoadingAction('edit')
    setError('')
    setSuccess('')
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          full_name: editForm.full_name,
          last_activity: new Date().toISOString()
        })
        .eq('id', userProfile.id)

      if (error) throw error

      setUserProfile(prev => prev ? { ...prev, full_name: editForm.full_name } : null)
      setIsEditing(false)
      setSuccess('Perfil atualizado com sucesso!')
    } catch (error: any) {
      setError('Erro ao atualizar perfil: ' + error.message)
    } finally {
      setLoadingAction('')
    }
  }

  const handleChangePassword = async () => {
    setLoadingAction('password')
    setError('')
    setSuccess('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('As senhas não coincidem')
      setLoadingAction('')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres')
      setLoadingAction('')
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) throw error

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setIsChangingPassword(false)
      setSuccess('Senha alterada com sucesso!')
    } catch (error: any) {
      setError('Erro ao alterar senha: ' + error.message)
    } finally {
      setLoadingAction('')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETAR') {
      setError('Digite "DELETAR" para confirmar')
      return
    }

    setLoadingAction('delete')
    setError('')

    try {
      // Deletar dados do usuário
      await supabase.from('user_profiles').delete().eq('id', user?.id)
      await supabase.from('user_stats').delete().eq('user_id', user?.id)
      
      // Deletar conta do usuário (isso requer privilégios administrativos)
      // Por segurança, vamos apenas fazer logout
      await signOut()
      router.push('/')
    } catch (error: any) {
      setError('Erro ao deletar conta: ' + error.message)
    } finally {
      setLoadingAction('')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading || isRefreshing) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white text-xl">
            {isRefreshing ? 'Atualizando dados...' : 'Carregando perfil...'}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar</span>
              </button>
              <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagens de Sucesso/Erro */}
      {success && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-green-600 text-white p-4 rounded-lg">
            {success}
          </div>
        </div>
      )}
      
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-600 text-white p-4 rounded-lg">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda - Perfil */}
          <div className="space-y-6">
            {/* Avatar e Info Básica */}
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {userProfile?.full_name || 'Usuário'}
              </h2>
              <p className="text-gray-400 mb-4">{userProfile?.email}</p>
              <p className="text-gray-500 text-sm mb-4">
                Membro desde {userProfile?.created_at ? formatDate(userProfile.created_at) : 'N/A'}
              </p>
              
              {/* Badge do Plano */}
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className={`text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${
                  user?.subscription_plan === 'super' ? 'bg-gradient-to-r from-purple-600 to-pink-600' :
                  user?.subscription_plan === 'premium' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  user?.subscription_plan === 'pro' ? 'bg-purple-600' :
                  user?.subscription_plan === 'plus' ? 'bg-blue-600' :
                  'bg-gray-600'
                }`}>
                  {user?.subscription_plan === 'super' ? <Crown className="w-4 h-4" /> :
                   user?.subscription_plan === 'premium' ? <Crown className="w-4 h-4" /> :
                   user?.subscription_plan === 'pro' ? <Star className="w-4 h-4" /> :
                   user?.subscription_plan === 'plus' ? <Zap className="w-4 h-4" /> :
                   <User className="w-4 h-4" />}
                  <span className="capitalize">
                    {user?.subscription_plan === 'super' ? 'Super' :
                     user?.subscription_plan === 'premium' ? 'Premium' :
                     user?.subscription_plan === 'pro' ? 'Pro' :
                     user?.subscription_plan === 'plus' ? 'Plus' :
                     'Free'}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-green-400 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Ativo</span>
                </div>
              </div>

              {/* Créditos */}
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Créditos Disponíveis</span>
                  <Package className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-green-400">
                  {user?.credits_remaining === -1 ? '∞' : (user?.credits_remaining || 0)}
                </div>
                <div className="text-gray-500 text-sm mt-1">
                  {user?.credits_remaining === -1 ? (
                    <div>Créditos ilimitados</div>
                  ) : (
                    <>
                      <div>Total usado: {userStats?.ai_usage || 0}</div>
                      <div>Este mês: {userStats?.monthly_ai_usage || 0} usados</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Resumo de Atividade */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold">Resumo de Atividade</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Listas criadas</span>
                  <span className="text-white font-medium">{userStats?.lists_created || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Itens adicionados</span>
                  <span className="text-white font-medium">{userStats?.items_added || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Compras realizadas</span>
                  <span className="text-white font-medium">{userStats?.purchases_made || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Funcionalidade favorita</span>
                  <span className="text-green-400 font-medium">{userStats?.favorite_feature || 'Reconhecimento IA'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Central e Direita */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart className="w-8 h-8 text-blue-400" />
                  <span className="text-2xl font-bold text-white">{userStats?.lists_created || 0}</span>
                </div>
                <div className="text-blue-400 text-sm font-medium">Listas Criadas</div>
                <div className="text-green-400 text-xs">+{userStats?.monthly_lists || 0} este mês</div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-8 h-8 text-purple-400" />
                  <span className="text-2xl font-bold text-white">{userStats?.items_added || 0}</span>
                </div>
                <div className="text-purple-400 text-sm font-medium">Itens Adicionados</div>
                <div className="text-blue-400 text-xs">~{userStats?.avg_items_per_list || 0} por lista</div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <Receipt className="w-8 h-8 text-green-400" />
                  <span className="text-2xl font-bold text-white">{userStats?.purchases_made || 0}</span>
                </div>
                <div className="text-green-400 text-sm font-medium">Compras Realizadas</div>
                <div className="text-gray-400 text-xs">{formatCurrency(userStats?.total_spent || 0)} total</div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-8 h-8 text-yellow-400" />
                  <span className="text-2xl font-bold text-white">{userStats?.ai_usage || 1}</span>
                </div>
                <div className="text-yellow-400 text-sm font-medium">IA Utilizada</div>
                <div className="text-orange-400 text-xs">{userStats?.monthly_ai_usage || 0} este mês</div>
              </div>
            </div>

            {/* Informações Pessoais */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold">Informações Pessoais</h3>
                </div>
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-1 text-green-400 hover:text-green-300 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={handleEditProfile}
                      disabled={loadingAction === 'edit'}
                      className="flex items-center space-x-1 text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{loadingAction === 'edit' ? 'Salvando...' : 'Salvar'}</span>
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditing(false)
                        setEditForm({ full_name: userProfile?.full_name || '' })
                      }}
                      className="flex items-center space-x-1 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Nome Completo</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      className="w-full bg-gray-700 rounded-lg p-3 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                      placeholder="Digite seu nome completo"
                    />
                  ) : (
                    <div className="bg-gray-700 rounded-lg p-3 flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-white">{userProfile?.full_name || 'Não informado'}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Email</label>
                  <div className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-white">{userProfile?.email}</span>
                    <span className="text-gray-500 text-xs">(não editável)</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Membro desde</label>
                  <div className="bg-gray-700 rounded-lg p-3 flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-white">
                      {userProfile?.created_at ? formatDate(userProfile.created_at) : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Última Atividade</label>
                  <div className="bg-gray-700 rounded-lg p-3 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-white">
                      {userProfile?.last_activity ? formatDate(userProfile.last_activity) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Segurança */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Shield className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-semibold">Segurança</h3>
              </div>
              
              <div className="space-y-4">
                {/* Alterar Senha */}
                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-white font-medium">Alterar Senha</div>
                      <div className="text-gray-400 text-sm">Atualize sua senha para manter sua conta segura</div>
                    </div>
                    <button 
                      onClick={() => setIsChangingPassword(!isChangingPassword)}
                      className="text-green-400 hover:text-green-300 transition-colors font-medium"
                    >
                      {isChangingPassword ? 'Cancelar' : 'Alterar'}
                    </button>
                  </div>
                  
                  {isChangingPassword && (
                    <div className="space-y-4">
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full bg-gray-600 rounded-lg p-3 text-white border border-gray-500 focus:border-blue-500 focus:outline-none pr-10"
                          placeholder="Nova senha"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full bg-gray-600 rounded-lg p-3 text-white border border-gray-500 focus:border-blue-500 focus:outline-none pr-10"
                          placeholder="Confirmar nova senha"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      <button
                        onClick={handleChangePassword}
                        disabled={loadingAction === 'password'}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {loadingAction === 'password' ? 'Alterando...' : 'Confirmar Alteração'}
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Excluir Conta */}
                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-white font-medium">Excluir Conta</div>
                      <div className="text-gray-400 text-sm">Remover permanentemente sua conta e dados</div>
                    </div>
                    <button 
                      onClick={() => setIsDeleting(!isDeleting)}
                      className="text-red-400 hover:text-red-300 transition-colors font-medium"
                    >
                      {isDeleting ? 'Cancelar' : 'Excluir'}
                    </button>
                  </div>
                  
                  {isDeleting && (
                    <div className="space-y-4">
                      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-red-400 mb-2">
                          <AlertTriangle className="w-5 h-5" />
                          <span className="font-medium">Atenção!</span>
                        </div>
                        <p className="text-red-300 text-sm">
                          Esta ação é irreversível. Todos os seus dados serão permanentemente removidos.
                        </p>
                      </div>
                      
                      <input
                        type="text"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        className="w-full bg-gray-600 rounded-lg p-3 text-white border border-gray-500 focus:border-red-500 focus:outline-none"
                        placeholder='Digite "DELETAR" para confirmar'
                      />
                      
                      <button
                        onClick={handleDeleteAccount}
                        disabled={loadingAction === 'delete' || deleteConfirm !== 'DELETAR'}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {loadingAction === 'delete' ? 'Excluindo...' : 'Confirmar Exclusão'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Análise de Uso */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold">Análise de Uso</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">Eficiência das Listas</div>
                  <div className="text-gray-400 text-sm mb-1">Média de itens por lista</div>
                  <div className="text-3xl font-bold text-green-400">{userStats?.avg_items_per_list || 0}</div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">Funcionalidade Favorita</div>
                  <div className="text-2xl font-bold text-green-400 mb-1">{userStats?.favorite_feature || 'Reconhecimento IA'}</div>
                  <div className="text-gray-400 text-sm">Mais utilizada</div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">Atividade Mensal</div>
                  <div className="text-gray-400 text-sm mb-1">Listas criadas</div>
                  <div className="text-3xl font-bold text-blue-400">{userStats?.monthly_lists || 0}</div>
                  <div className="text-gray-400 text-sm">IA utilizada</div>
                  <div className="text-orange-400 font-bold">{userStats?.monthly_ai_usage || 0}x</div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">Economia Total</div>
                  <div className="text-3xl font-bold text-green-400 mb-1">{formatCurrency(userStats?.total_spent || 0)}</div>
                  <div className="text-gray-400 text-sm">Gasto registrado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 