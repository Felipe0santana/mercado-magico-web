# Configuração do Webhook do Stripe

## Problema Identificado
O webhook do Stripe não está sendo chamado automaticamente após os pagamentos, causando a necessidade de atualização manual dos planos e créditos.

## Solução Implementada

### 1. Webhook Melhorado
- ✅ Logs detalhados para debug
- ✅ Atualização automática de créditos baseado no plano
- ✅ Criação de registros de compra
- ✅ Tratamento de erros melhorado

### 2. Configuração Necessária no Stripe Dashboard

#### Passo 1: Acessar o Dashboard do Stripe
1. Acesse https://dashboard.stripe.com
2. Vá para **Developers** > **Webhooks**

#### Passo 2: Criar/Configurar Webhook
1. Clique em **Add endpoint** (ou edite o existente)
2. **URL do endpoint**: `https://site54874935.netlify.app/api/webhooks/stripe`
3. **Eventos para escutar**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

#### Passo 3: Configurar Variáveis de Ambiente
Certifique-se de que estas variáveis estão configuradas:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Teste do Webhook

#### API de Teste Criada
Para testar se a lógica está funcionando, use:

```bash
curl -X POST https://site54874935.netlify.app/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin2@admin2.com",
    "plan": "premium",
    "amount": 99.99
  }'
```

### 4. Monitoramento

#### Logs do Webhook
O webhook agora inclui logs detalhados:
- 🔄 Processamento iniciado
- ✅ Sucesso nas operações
- ❌ Erros identificados
- 💳 Créditos adicionados
- 📊 Estado atual do usuário

#### Verificação no Stripe Dashboard
1. Vá para **Developers** > **Webhooks**
2. Clique no webhook configurado
3. Verifique a aba **Recent deliveries**
4. Analise se há falhas ou erros

### 5. Planos e Créditos

| Plano | Créditos | Valor |
|-------|----------|-------|
| Free | 10 | R$ 0 |
| Plus | 50 | R$ 9,99 |
| Pro | 200 | R$ 29,99 |
| Premium | Ilimitados (-1) | R$ 99,99 |

### 6. Troubleshooting

#### Se o webhook não funcionar:
1. Verifique se a URL está correta no Stripe
2. Confirme se o `STRIPE_WEBHOOK_SECRET` está correto
3. Verifique os logs no Netlify Functions
4. Use a API de teste para verificar a lógica

#### Logs para verificar:
- Console do navegador (desenvolvimento)
- Netlify Functions logs (produção)
- Stripe Dashboard > Webhooks > Recent deliveries

### 7. Próximos Passos
1. ✅ Webhook corrigido e melhorado
2. ✅ API de teste criada
3. 🔄 Configurar webhook no Stripe Dashboard
4. 🔄 Testar com pagamento real
5. 🔄 Monitorar logs e funcionamento

## Status Atual
- ✅ Plano Premium atualizado manualmente
- ✅ Créditos ilimitados configurados
- ✅ Webhook melhorado com logs detalhados
- 🔄 Aguardando configuração no Stripe Dashboard 