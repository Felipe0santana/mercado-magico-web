'use client'

import Link from 'next/link'
import { ShoppingCart, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-4">
        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-8">
          <ShoppingCart className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-6xl font-bold text-green-400 mb-4">404</h1>
        
        <h2 className="text-2xl font-bold text-white mb-4">
          Página não encontrada
        </h2>
        
        <p className="text-gray-400 mb-8">
          Ops! A página que você está procurando não existe ou foi movida.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Voltar ao Início</span>
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="border border-gray-600 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Precisa de ajuda? Entre em contato:
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