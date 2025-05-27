# Configuração do Stripe - Mercado Mágico

## 🚀 Configuração Inicial

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publica_aqui
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta_aqui
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Mercado Mágico
```

### 2. Como obter as chaves

1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com)
2. Vá em "Developers" > "API keys"
3. Copie a "Publishable key" e "Secret key"
4. Cole no arquivo `.env.local`

### 3. Produtos no Stripe Dashboard

Acesse o [Stripe Dashboard](https://dashboard.stripe.com) e crie os seguintes produtos:

#### Plano Plus - R$ 9,99/mês
- Nome: `Mercado Mágico - Plus`
- Preço: R$ 9,99 BRL (recorrente mensal)
- Metadata: `plan: plus`

#### Plano Pro - R$ 29,99/mês
- Nome: `Mercado Mágico - Pro`
- Preço: R$ 29,99 BRL (recorrente mensal)
- Metadata: `plan: pro`

#### Plano Premium - R$ 99,99/mês
- Nome: `Mercado Mágico - Premium`
- Preço: R$ 99,99 BRL (recorrente mensal)
- Metadata: `plan: premium`

### 4. Configuração de Webhooks

1. No Stripe Dashboard, vá para **Developers > Webhooks**
2. Clique em **Add endpoint**
3. URL do endpoint: `https://seu-dominio.vercel.app/api/webhooks/stripe`
4. Eventos para escutar:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 🔧 Funcionalidades Implementadas

### ✅ Checkout de Assinatura
- Criação dinâmica de produtos e preços
- Suporte a PIX e cartão de crédito
- Redirecionamento automático para sucesso/cancelamento
- Localização em português brasileiro

### ✅ Página de Sucesso
- Confirmação de pagamento
- Detalhes da assinatura
- Próximos passos para o usuário
- Links para download do app

### ✅ Tratamento de Erros
- Toast de erro em caso de falha
- Loading states nos botões
- Validação de dados

## 🎯 Fluxo de Pagamento

1. **Usuário clica em um plano** → `handlePlanSelect()`
2. **Criação da sessão** → `/api/create-checkout-session`
3. **Redirecionamento** → Stripe Checkout
4. **Pagamento** → Processado pelo Stripe
5. **Sucesso** → Redirecionamento para `/success`
6. **Webhook** → Confirmação do pagamento (futuro)

## 🔐 Segurança

- Chaves secretas apenas no servidor
- Validação de webhooks com assinatura
- Metadata para rastreamento de planos
- HTTPS obrigatório em produção

## 📱 Integração com o App

Após o pagamento bem-sucedido:
1. Usuário recebe email de confirmação
2. Acessa o app com o mesmo email
3. Sistema verifica assinatura ativa
4. Libera recursos premium

## 🚀 Deploy

Para produção:
1. Configure as variáveis de ambiente no Vercel/Netlify
2. Use chaves de produção do Stripe
3. Configure webhook para domínio de produção
4. Teste o fluxo completo

## 📞 Suporte

Em caso de problemas:
- Verifique os logs do Stripe Dashboard
- Confirme as variáveis de ambiente
- Teste com cartões de teste do Stripe
- Contato: sugestoes@mercadomagico.com.br

## Testando Pagamentos

Use os cartões de teste do Stripe:
- **Sucesso**: 4242 4242 4242 4242
- **Falha**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

## Planos Configurados

- **Plus**: R$ 9,99/mês - 50 créditos
- **Pro**: R$ 29,99/mês - 200 créditos  
- **Premium**: R$ 99,99/mês - Ilimitado 