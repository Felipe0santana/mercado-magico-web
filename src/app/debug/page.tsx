'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const checkConfig = async () => {
      try {
        // Verificar variáveis de ambiente
        const envVars = {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurada' : 'Não configurada',
        }

        // Testar conexão
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        // Testar listagem de usuários (se permitido)
        const { data: userData, error: userError } = await supabase.auth.getUser()

        setDebugInfo({
          envVars,
          session: { data: sessionData, error: sessionError },
          user: { data: userData, error: userError },
          supabaseClient: !!supabase,
        })
      } catch (error) {
        console.error('Erro no debug:', error)
        setDebugInfo({ error: (error as Error).message })
      }
    }

    checkConfig()
  }, [])

  const testLogin = async () => {
    try {
      // Teste com um dos emails que vemos no dashboard
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@admin.com',
        password: 'admin123' // senha de teste
      })
      
      console.log('Teste de login:', { data, error })
      alert(`Resultado: ${error ? error.message : 'Sucesso!'}`)
    } catch (err) {
      console.error('Erro no teste:', err)
      alert(`Erro: ${(err as Error).message}`)
    }
  }

  const testLogin2 = async () => {
    try {
      // Teste com outro email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin2@admin2.com',
        password: 'admin123'
      })
      
      console.log('Teste de login 2:', { data, error })
      alert(`Resultado 2: ${error ? error.message : 'Sucesso!'}`)
    } catch (err) {
      console.error('Erro no teste 2:', err)
      alert(`Erro 2: ${(err as Error).message}`)
    }
  }

  const testConnection = async () => {
    try {
      console.log('Testando conexão básica...')
      const { data, error } = await supabase.auth.getSession()
      console.log('Conexão:', { data, error })
      
      // Testar acesso à tabela users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1)

      console.log('Users:', { users, usersError })
      alert(`Conexão: ${error ? 'Erro' : 'OK'} | Users: ${usersError ? 'Erro' : 'OK'}`)
    } catch (err) {
      console.error('Erro na conexão:', err)
      alert(`Erro na conexão: ${(err as Error).message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Debug - Configurações Supabase</h1>
        
        <div className="space-y-6">
          {/* Variáveis de Ambiente */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">📋 Variáveis de Ambiente</h2>
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.envVars, null, 2)}
            </pre>
          </div>

          {/* Sessão Atual */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">👤 Sessão Atual</h2>
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.session, null, 2)}
            </pre>
          </div>

          {/* Usuário Atual */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🔐 Usuário Atual</h2>
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.user, null, 2)}
            </pre>
          </div>

          {/* Cliente Supabase */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">⚙️ Cliente Supabase</h2>
            <p>Status: {debugInfo.supabaseClient ? '✅ Inicializado' : '❌ Erro'}</p>
          </div>

          {/* Teste de Login */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🧪 Teste de Login</h2>
            <div className="space-y-3">
              <button
                onClick={testLogin}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors mr-3"
              >
                Testar Login (admin@admin.com)
              </button>
              
              <button
                onClick={testLogin2}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mr-3"
              >
                Testar Login (admin2@admin2.com)
              </button>
              
              <button
                onClick={testConnection}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Testar Conexão
              </button>
            </div>
          </div>

          {/* Informações Gerais */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Debug Completo</h2>
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-8">
          <a
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Voltar para Home
          </a>
        </div>
      </div>
    </div>
  )
} 