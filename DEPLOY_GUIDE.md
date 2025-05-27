# 🚀 Guia de Deploy - Mercado Mágico

## Opção 1: Deploy via Vercel Web (Recomendado)

### 1. Criar Repositório no GitHub
1. Acesse [github.com](https://github.com)
2. Clique em "New repository"
3. Nome: `mercado-magico-web`
4. Marque como "Public"
5. Clique em "Create repository"

### 2. Fazer Upload do Código
```bash
git remote remove origin
git remote add origin https://github.com/SEU_USUARIO/mercado-magico-web.git
git branch -M main
git push -u origin main
```

### 3. Deploy no Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Conecte com GitHub
4. Selecione o repositório `mercado-magico-web`
5. Configure as variáveis de ambiente:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publica_aqui
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta_aqui
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

### 4. Configurar Webhooks Stripe
1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com)
2. Vá em "Developers" > "Webhooks"
3. Clique em "Add endpoint"
4. URL: `https://SEU-DOMINIO.vercel.app/api/webhooks/stripe`
5. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## Opção 2: Deploy via CLI

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Fazer Login
```bash
vercel login
```

### 3. Deploy
```bash
vercel --prod
```

## ✅ Verificações Pós-Deploy

1. **Site funcionando**: Acesse a URL do Vercel
2. **Checkout Stripe**: Teste um plano
3. **Webhooks**: Verifique no dashboard Stripe
4. **Supabase**: Confirme sincronização de dados

## 🔧 Troubleshooting

### Erro de Build
- Verifique se todas as dependências estão no `package.json`
- Confirme se não há erros de TypeScript

### Erro de Stripe
- Verifique se as chaves estão corretas
- Confirme se está usando chaves de teste

### Erro de Supabase
- Verifique se as tabelas foram criadas
- Confirme se as políticas RLS estão ativas

## 📱 Próximos Passos

Após o deploy bem-sucedido:
1. Teste todos os fluxos de pagamento
2. Configure domínio personalizado (opcional)
3. Configure analytics (opcional)
4. Monitore logs de erro 