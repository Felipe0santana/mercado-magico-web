# Integração Supabase - Mercado Mágico

## 🚀 Configuração

### Projeto Supabase
- **URL**: https://cklmyduznlathpeoczjv.supabase.co
- **ID do Projeto**: cklmyduznlathpeoczjv
- **Mesmo projeto usado pelo app mobile**

### Variáveis de Ambiente Necessárias

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://cklmyduznlathpeoczjv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbG15ZHV6bmxhdGhwZW9jempWIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyODAzNywiZXhwIjoyMDUwODU2Mzd9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbG15ZHV6bmxhdGhwZW9jempWIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyODAzNywiZXhwIjoyMDUwODU2Mzd9
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### `users` (Perfis de Usuário)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'plus', 'pro', 'premium')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'canceled')),
  credits_remaining INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `subscriptions` (Assinaturas)
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('plus', 'pro', 'premium')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'canceled')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `credit_usage` (Uso de Créditos)
```sql
CREATE TABLE credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('photo_recognition', 'nutrition_analysis', 'handwritten_list', 'price_comparison')),
  credits_used INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Funcionalidades Implementadas

### ✅ Autenticação
- Login/Registro de usuários
- Gerenciamento de sessões
- Perfis de usuário sincronizados

### ✅ Assinaturas
- Criação automática via webhook Stripe
- Sincronização de status de pagamento
- Renovação mensal de créditos
- Cancelamento e reativação

### ✅ Sistema de Créditos
- Controle de uso por funcionalidade
- Renovação mensal automática
- Histórico de consumo
- Planos com créditos ilimitados

### ✅ Webhooks Stripe
- `checkout.session.completed` - Ativa assinatura
- `customer.subscription.created` - Cria registro de assinatura
- `customer.subscription.updated` - Atualiza status
- `customer.subscription.deleted` - Cancela assinatura
- `invoice.payment_succeeded` - Renova créditos
- `invoice.payment_failed` - Suspende conta

## 🎯 Fluxo de Integração

### 1. Usuário Escolhe Plano
```typescript
// Frontend - Página de planos
const { redirectToCheckout } = useCheckout()
await redirectToCheckout({
  planName: 'pro',
  planPrice: 29.99,
  userEmail: user?.email
})
```

### 2. Pagamento no Stripe
- Usuário preenche dados de pagamento
- Stripe processa transação
- Webhook é enviado para nossa API

### 3. Sincronização Automática
```typescript
// Webhook processa evento
await handleCheckoutCompleted(session)
// Usuário é criado/atualizado no Supabase
// Assinatura é ativada
// Créditos são creditados
```

### 4. Acesso ao App
- Usuário faz login no app mobile
- Sistema verifica assinatura ativa
- Libera recursos premium baseado no plano

## 🔐 Segurança

### Row Level Security (RLS)
```sql
-- Usuários só podem ver seus próprios dados
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Assinaturas privadas por usuário
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Uso de créditos privado
ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own credit usage" ON credit_usage
  FOR SELECT USING (auth.uid() = user_id);
```

### Validações
- Webhooks assinados pelo Stripe
- Tokens JWT validados
- Permissões baseadas em roles
- Dados criptografados em trânsito

## 📱 Sincronização com App Mobile

### Mesmo Banco de Dados
- Site e app compartilham mesmo projeto Supabase
- Dados sincronizados em tempo real
- Usuários podem alternar entre plataformas

### Autenticação Unificada
- Login funciona em ambas plataformas
- Sessões compartilhadas
- Logout sincronizado

### Créditos Compartilhados
- Uso de créditos reflete em tempo real
- Renovação mensal automática
- Histórico unificado

## 🚀 Deploy e Produção

### Configuração de Produção
1. Configurar variáveis de ambiente no Vercel/Netlify
2. Atualizar URLs de webhook no Stripe
3. Configurar domínio personalizado
4. Ativar SSL/HTTPS

### Monitoramento
- Logs de webhook no Stripe Dashboard
- Métricas de uso no Supabase
- Alertas de erro configurados
- Backup automático de dados

## 📞 Suporte

Em caso de problemas:
- Verificar logs do Supabase Dashboard
- Conferir eventos no Stripe Dashboard
- Validar variáveis de ambiente
- Contato: sugestoes@mercadomagico.com.br 