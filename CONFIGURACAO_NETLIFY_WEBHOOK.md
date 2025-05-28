# 🔧 Configuração de Variáveis de Ambiente no Netlify

## 📋 Variáveis Necessárias

Após configurar o webhook no Stripe, você precisa adicionar estas variáveis no Netlify:

### 1. Acessar Configurações do Netlify

1. **Acesse**: https://app.netlify.com
2. **Selecione** seu site: `site54874935`
3. Vá para **"Site settings"**
4. Clique em **"Environment variables"** no menu lateral

### 2. Adicionar/Verificar Variáveis

#### ✅ Variáveis do Stripe:
```env
STRIPE_SECRET_KEY=sk_test_... (ou sk_live_... para produção)
STRIPE_WEBHOOK_SECRET=whsec_... (obtido do dashboard do Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (ou pk_live_... para produção)
```

#### ✅ Variáveis do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://cklmyduznlathpeoczjv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Como Adicionar uma Variável

1. Clique em **"Add variable"**
2. **Key**: Nome da variável (ex: `STRIPE_WEBHOOK_SECRET`)
3. **Value**: Valor da variável (ex: `whsec_1234567890abcdef...`)
4. **Scopes**: Selecione "All scopes" ou "Functions"
5. Clique em **"Create variable"**

### 4. Redeploy Necessário

Após adicionar/alterar variáveis:
1. Vá para **"Deploys"**
2. Clique em **"Trigger deploy"**
3. Selecione **"Deploy site"**

## 🧪 Testar Configuração

Após o deploy, teste se tudo está funcionando:

```bash
# Verificar configuração
curl https://site54874935.netlify.app/api/check-webhook
```

Deve retornar:
```json
{
  "status": "success",
  "config": {
    "stripe": {
      "secretKey": true,
      "webhookSecret": true
    },
    "supabase": {
      "url": true,
      "key": true
    }
  }
}
```

## 🔍 Onde Encontrar Cada Chave

### Stripe Dashboard:
1. **Secret Key**: Developers > API keys > Secret key
2. **Publishable Key**: Developers > API keys > Publishable key  
3. **Webhook Secret**: Developers > Webhooks > [seu webhook] > Signing secret

### Supabase Dashboard:
1. **URL**: Settings > API > Project URL
2. **Anon Key**: Settings > API > Project API keys > anon public

## ⚠️ Importante

- **Nunca** compartilhe suas chaves secretas
- Use chaves de **test** para desenvolvimento
- Use chaves de **live** apenas para produção
- O webhook secret é **único** para cada endpoint criado 