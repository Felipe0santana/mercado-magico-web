# Mercado Mágico - Site de Planos

Site de planos para o app Mercado Mágico com integração Stripe e Supabase.

## 🚀 Deploy no Vercel

### 1. Preparar o Repositório

```bash
git add .
git commit -m "Preparar para deploy"
git push origin main
```

### 2. Configurar Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publica_aqui
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta_aqui
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

### 3. Configurar Webhooks Stripe

Após o deploy, configure o webhook no Stripe Dashboard:
- URL: `https://seu-dominio.vercel.app/api/webhooks/stripe`
- Eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`

## 🛠️ Desenvolvimento Local

```bash
npm install
npm run dev
```

## 📊 Funcionalidades

- ✅ Landing page responsiva
- ✅ 4 planos de assinatura
- ✅ Integração Stripe Checkout
- ✅ Banco de dados Supabase
- ✅ Webhooks automáticos
- ✅ Sistema de créditos
- ✅ Autenticação unificada

## 🔗 Links Importantes

- [Documentação Stripe](./STRIPE_SETUP.md)
- [Integração Supabase](./SUPABASE_INTEGRATION.md)
- [Configuração de Estilos](./STYLES.md)
