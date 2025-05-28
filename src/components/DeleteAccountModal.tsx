'use client'

import { useState } from 'react'
import { X, AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleDelete = async () => {
    if (confirmText !== 'EXCLUIR') {
      setError('Digite "EXCLUIR" para confirmar')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Primeiro, deletar dados do perfil
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Deletar perfil do usuário
        const { error: profileError } = await supabase
          .from('users')
          .delete()
          .eq('id', user?.id)

        if (profileError) {
          console.error('Erro ao deletar perfil:', profileError)
        }

        // Deletar listas de compras
        const { error: listsError } = await supabase
          .from('shopping_lists')
          .delete()
          .eq('user_id', user.id)

        if (listsError) {
          console.error('Erro ao deletar listas:', listsError)
        }

        // Deletar histórico de compras
        const { error: historyError } = await supabase
          .from('purchase_history')
          .delete()
          .eq('user_id', user.id)

        if (historyError) {
          console.error('Erro ao deletar histórico:', historyError)
        }

        // Deletar transações de crédito
        const { error: creditsError } = await supabase
          .from('credit_transactions')
          .delete()
          .eq('user_id', user.id)

        if (creditsError) {
          console.error('Erro ao deletar créditos:', creditsError)
        }
      }

      // Por último, deletar a conta do usuário
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user?.id || ''
      )

      if (authError) {
        console.error('Erro ao deletar conta:', authError)
        setError('Erro ao excluir conta. Tente novamente ou entre em contato com o suporte.')
        return
      }

      // Fazer logout e redirecionar
      await supabase.auth.signOut()
      router.push('/')
      
    } catch (error) {
      console.error('Erro inesperado:', error)
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setConfirmText('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl border border-red-500/50 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-red-400 flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6" />
            <span>Excluir Conta</span>
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-400 mb-2">Atenção!</h3>
                <p className="text-sm text-red-300">
                  Esta ação é <strong>irreversível</strong>. Todos os seus dados serão permanentemente excluídos:
                </p>
                <ul className="text-sm text-red-300 mt-2 space-y-1">
                  <li>• Perfil e informações pessoais</li>
                  <li>• Listas de compras criadas</li>
                  <li>• Histórico de compras</li>
                  <li>• Créditos e transações</li>
                  <li>• Todas as configurações</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Para confirmar, digite <span className="text-red-400 font-bold">EXCLUIR</span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
              placeholder="Digite EXCLUIR"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Botões */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={handleDelete}
              disabled={loading || confirmText !== 'EXCLUIR'}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Excluindo...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Conta</span>
                </>
              )}
            </button>
            <button
              onClick={handleClose}
              className="flex-1 border border-gray-600 text-gray-300 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 