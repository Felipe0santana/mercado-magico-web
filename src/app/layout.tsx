import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mercado Mágico - Lista de Compras Inteligente com IA',
  description: 'Transforme suas compras com inteligência artificial. Reconhecimento de produtos por foto, análise nutricional InfoCal e comparação de preços. Mais de 10.000 usuários confiam no Mercado Mágico.',
  keywords: 'lista de compras, inteligência artificial, reconhecimento de produtos, análise nutricional, economia, mercado, IA',
  authors: [{ name: 'Mercado Mágico' }],
  openGraph: {
    title: 'Mercado Mágico - Lista de Compras Inteligente com IA',
    description: 'Lista de compras inteligente que reconhece produtos por foto, analisa informações nutricionais e ajuda você a economizar tempo e dinheiro.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  )
} 