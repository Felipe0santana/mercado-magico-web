# 🔧 Solução para Problema de Atualização Automática de Planos

## 🚨 Problema Identificado

O processo de atualização automática do plano não está funcionando após a assinatura porque:

1. **Webhook do Stripe não está configurado corretamente**
2. **Falta de atualização em tempo real no perfil**
3. **Possível problema com cache de dados**

## ✅ Soluções Implementadas

### 1. Melhorias no Perfil do Usuário

#### Atualização em Tempo Real
- ✅ Adicionado listener para mudanças em tempo real via Supabase Realtime
- ✅ Botão de refresh manual no perfil
- ✅ Logs detalhados para debug

#### Funcionalidades Adicionadas
```typescript
// Listener para mudanças em tempo real
useEffect(() => {
  if (user?.id) {
    const subscription = supabase
      .channel('profile-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        console.log('🔄 Perfil atualizado em tempo real:', payload.new)
        setProfile(payload.new as UserProfile)
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }
}, [user?.id])
```

### 2. API de Verificação de Webhook

#### Nova API: `/api/check-webhook`
- ✅ Verifica configuração das variáveis de ambiente
- ✅ Testa conexão com Supabase
- ✅ Verifica status do usuário admin
- ✅ Permite forçar atualização manual

#### Como usar:
```bash
# Verificar configuração
curl https://site54874935.netlify.app/api/check-webhook

# Forçar atualização do usuário
curl -X POST https://site54874935.netlify.app/api/check-webhook \
  -H "Content-Type: application/json" \
  -d '{"action": "force_refresh_user"}'
```

### 3. Webhook Melhorado

#### Logs Detalhados
- ✅ Headers recebidos
- ✅ Dados do evento completos
- ✅ Status de cada operação
- ✅ Verificação de variáveis de ambiente

## 🔧 Passos para Resolver o Problema

### Passo 1: Verificar Configuração Atual
```bash
curl https://site54874935.netlify.app/api/check-webhook
```

### Passo 2: Configurar Webhook no Stripe Dashboard

1. **Acesse**: https://dashboard.stripe.com
2. **Vá para**: Developers > Webhooks
3. **URL do endpoint**: `https://site54874935.netlify.app/api/webhooks/stripe`
4. **Eventos necessários**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Passo 3: Verificar Variáveis de Ambiente no Netlify

Certifique-se de que estas variáveis estão configuradas:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://cklmyduznlathpeoczjv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Passo 4: Testar Webhook Manualmente

```bash
# Testar lógica do webhook
curl -X POST https://site54874935.netlify.app/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin2@admin2.com",
    "plan": "premium",
    "amount": 99.99
  }'
```

### Passo 5: Monitorar Logs

#### No Netlify:
1. Acesse o dashboard do Netlify
2. Vá para Functions
3. Verifique os logs das funções

#### No Stripe:
1. Acesse Developers > Webhooks
2. Clique no webhook configurado
3. Verifique "Recent deliveries"

## 🚀 Funcionalidades Adicionadas

### Botão de Refresh no Perfil
- Permite atualização manual dos dados
- Mostra status de carregamento
- Logs detalhados no console

### Atualização em Tempo Real
- Escuta mudanças na tabela `users`
- Atualiza automaticamente o perfil
- Não requer refresh da página

### API de Diagnóstico
- Verifica todas as configurações
- Testa conectividade
- Permite ações manuais

## 🔍 Como Debuggar

### 1. Verificar se o webhook está sendo chamado:
```bash
# Verificar logs no Netlify Functions
# Ou usar a API de verificação
curl https://site54874935.netlify.app/api/check-webhook
```

### 2. Testar atualização manual:
```bash
# Usar a página de perfil com o botão "Atualizar"
# Ou usar a API diretamente
curl -X POST https://site54874935.netlify.app/api/check-webhook \
  -H "Content-Type: application/json" \
  -d '{"action": "force_refresh_user"}'
```

### 3. Verificar dados no Supabase:
```sql
SELECT id, email, subscription_plan, credits_remaining, updated_at 
FROM users 
WHERE email = 'admin2@admin2.com';
```

## ⚡ Solução Imediata

Se o problema persistir, use estas soluções temporárias:

### 1. Atualização Manual via API:
```bash
curl -X POST https://site54874935.netlify.app/api/update-plan \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin2@admin2.com",
    "plan": "premium",
    "amount": 99.99
  }'
```

### 2. Botão de Refresh no Perfil:
- Acesse `/profile`
- Clique em "Atualizar" no header
- Os dados serão recarregados automaticamente

### 3. Forçar Atualização via API:
```bash
curl -X POST https://site54874935.netlify.app/api/check-webhook \
  -H "Content-Type: application/json" \
  -d '{"action": "force_refresh_user"}'
```

## 📊 Status Atual

- ✅ Webhook melhorado com logs detalhados
- ✅ API de verificação criada
- ✅ Atualização em tempo real implementada
- ✅ Botão de refresh manual adicionado
- 🔄 Aguardando configuração do webhook no Stripe Dashboard
- 🔄 Teste com pagamento real pendente

## 🎯 Próximos Passos

1. **Configurar webhook no Stripe Dashboard**
2. **Testar com pagamento real**
3. **Monitorar logs por 24h**
4. **Documentar funcionamento final**

---

**Nota**: O problema principal é que o webhook do Stripe não está sendo chamado automaticamente. Uma vez configurado corretamente no dashboard do Stripe, o processo deve funcionar automaticamente. 