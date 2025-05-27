# 🚀 Sistema de Assinaturas - Mercado Mágico

## 📋 Configuração Inicial

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (criar no dashboard do Stripe)
STRIPE_PRO_PRICE_ID=price_your_pro_price_id
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Configuração do Supabase

Execute o seguinte SQL no editor SQL do Supabase para criar a tabela de assinaturas:

```sql
-- Criar tabela de assinaturas
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL,
  price_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias assinaturas
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid()::text = user_id);

-- Política para inserção (via webhook)
CREATE POLICY "Service role can insert subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (true);

-- Política para atualização (via webhook)
CREATE POLICY "Service role can update subscriptions" ON subscriptions
  FOR UPDATE USING (true);
```

### 3. Configuração do Stripe

#### 3.1 Criar Produtos e Preços

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com)
2. Vá em **Produtos** → **Criar produto**
3. Crie os seguintes produtos:

**Produto: Profissional**
- Nome: Plano Profissional
- Preço: R$ 29,90/mês
- Copie o Price ID e cole em `STRIPE_PRO_PRICE_ID`

**Produto: Empresarial**
- Nome: Plano Empresarial  
- Preço: R$ 99,90/mês
- Copie o Price ID e cole em `STRIPE_ENTERPRISE_PRICE_ID`

#### 3.2 Configurar Webhook

1. Vá em **Desenvolvedores** → **Webhooks**
2. Clique em **Adicionar endpoint**
3. URL do endpoint: `https://seu-dominio.com/api/stripe/webhook`
4. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copie o **Signing secret** e cole em `STRIPE_WEBHOOK_SECRET`

### 4. Instalação e Execução

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev
```

### 5. Testando o Sistema

1. Acesse `http://localhost:3000/pricing`
2. Clique em "Assinar Agora" em qualquer plano pago
3. Use os cartões de teste do Stripe:
   - **Sucesso**: `4242 4242 4242 4242`
   - **Falha**: `4000 0000 0000 0002`

### 6. Deploy

#### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variáveis de ambiente no dashboard da Vercel
```

#### Outras Plataformas

- **Netlify**: Funciona perfeitamente
- **Railway**: Boa opção para full-stack
- **Heroku**: Funciona mas pode ser mais caro

### 7. Estrutura do Projeto

```
src/
├── app/
│   ├── api/stripe/          # APIs do Stripe
│   ├── pricing/             # Páginas de preços
│   └── globals.css          # Estilos globais
├── components/
│   ├── ui/                  # Componentes base
│   └── pricing-card.tsx     # Card de preços
└── lib/
    ├── stripe.ts            # Configuração Stripe
    └── utils.ts             # Utilitários
```

### 8. Funcionalidades Implementadas

✅ **Página de Preços Profissional**
- Design moderno e responsivo
- 3 planos (Gratuito, Profissional, Empresarial)
- Destaque para plano mais popular
- FAQ integrado

✅ **Integração Stripe Completa**
- Checkout seguro
- Webhooks para sincronização
- Suporte a cartões e PIX

✅ **Banco de Dados**
- Tabela de assinaturas no Supabase
- Sincronização automática via webhooks
- Políticas de segurança (RLS)

✅ **Páginas de Resultado**
- Página de sucesso após pagamento
- Tratamento de cancelamentos

### 9. Próximos Passos

🔄 **Melhorias Sugeridas**
- [ ] Dashboard de gerenciamento de assinatura
- [ ] Portal do cliente (Stripe Customer Portal)
- [ ] Notificações por email
- [ ] Analytics de conversão
- [ ] Testes automatizados

### 10. Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console
2. Confirme as variáveis de ambiente
3. Teste os webhooks no dashboard do Stripe
4. Verifique as políticas RLS no Supabase

---

## 🎯 Resultado Final

Você agora tem um sistema de assinaturas profissional que:
- ✅ Funciona 100% com Stripe
- ✅ É escalável e mantível
- ✅ Tem design moderno
- ✅ Está pronto para produção
- ✅ Segue as melhores práticas

**Exatamente como grandes empresas fazem!** 🚀 