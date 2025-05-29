'use client'

import { useState } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'login' | 'register'
  onSuccess?: () => void
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login', onSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Dados do formulário
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const { signIn, signUp, resetPassword } = useAuth()

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setFullName('')
    setConfirmPassword('')
    setError(null)
    setSuccess(null)
    setShowPassword(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab)
    setError(null)
    setSuccess(null)
  }

  const validateForm = () => {
    if (!email || !password) {
      setError('Email e senha são obrigatórios')
      return false
    }

    if (activeTab === 'register') {
      if (!fullName) {
        setError('Nome completo é obrigatório')
        return false
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem')
        return false
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError(null)
    console.log('🔐 [AUTH_MODAL] Iniciando processo de autenticação...')

    try {
      if (activeTab === 'login') {
        console.log('🔐 [AUTH_MODAL] Tentando fazer login com:', { email, password: '***' })
        const result = await signIn(email, password)
        console.log('✅ [AUTH_MODAL] Login realizado com sucesso:', result)
        
        setSuccess('Login realizado com sucesso!')
        setTimeout(() => {
          handleClose()
          onSuccess?.()
        }, 1000)
      } else {
        console.log('📝 [AUTH_MODAL] Tentando criar conta com:', { email, fullName })
        const result = await signUp(email, password, fullName)
        console.log('✅ [AUTH_MODAL] Conta criada com sucesso:', result)
        
        setSuccess('Conta criada! Verifique seu email para confirmar.')
        setTimeout(() => {
          setActiveTab('login')
          setSuccess(null)
        }, 3000)
      }
    } catch (err) {
      console.error('❌ [AUTH_MODAL] Erro na autenticação:', err)
      const errorMessage = (err as Error)?.message || 'Erro inesperado'
      setError(errorMessage)
    } finally {
      console.log('🏁 [AUTH_MODAL] Finalizando processo de autenticação')
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    setError(null)
    setSuccess('Link de recuperação enviado para seu email!')
    setTimeout(() => setSuccess(null), 3000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            {activeTab === 'login' ? 'Entrar' : 'Criar Conta'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => handleTabChange('login')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'login'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => handleTabChange('register')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'register'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome (apenas no registro) */}
          {activeTab === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                placeholder="Sua senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirmar Senha (apenas no registro) */}
          {activeTab === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  placeholder="Confirme sua senha"
                  required
                />
              </div>
            </div>
          )}

          {/* Mensagens de erro/sucesso */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-3">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Botão de submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <span>{activeTab === 'login' ? 'Entrar' : 'Criar Conta'}</span>
            )}
          </button>

          {/* Link para recuperar senha */}
          {activeTab === 'login' && (
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-green-400 hover:text-green-300 text-sm transition-colors"
              >
                Esqueceu sua senha?
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
} 