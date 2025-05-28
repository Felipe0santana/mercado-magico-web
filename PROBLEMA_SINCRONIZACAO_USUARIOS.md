# 🚨 Problema: Sincronização de Usuários entre App Mobile e Web

## 🎯 **Situação Atual**

### ✅ **O que está funcionando:**
- App mobile tem usuários cadastrados
- Supabase Auth (`auth.users`) tem os usuários
- Webhook do Stripe está configurado
- Variáveis de ambiente estão corretas

### ❌ **O que não está funcionando:**
- Usuários não existem na tabela `public.users`
- Webhook não encontra usuário para atualizar
- Perfil web não carrega dados do usuário
- Plano não atualiza automaticamente

## 🔍 **Diagnóstico do Problema**

### **Duas Tabelas Diferentes:**

1. **`auth.users`** (Sistema de Autenticação)
   - ✅ Contém: `admin6@admin.com`, `admin5@admin5.com`, etc.
   - ✅ Usado pelo app mobile
   - ✅ Gerenciado automaticamente pelo Supabase

2. **`public.users`** (Perfis Personalizados)
   - ❌ Vazia (0 usuários)
   - ❌ Usado pelo app web
   - ❌ Precisa ser sincronizada manualmente

## 🔧 **Soluções Implementadas**

### **1. API de Sincronização** 
```
POST /api/sync-users
```
- Copia usuários de `auth.users` para `public.users`
- Mantém IDs consistentes
- Adiciona campos personalizados (plano, créditos)

### **2. API de Verificação**
```
GET /api/check-auth-users
```
- Compara as duas tabelas
- Mostra diferenças
- Identifica usuários não sincronizados

### **3. Webhook Melhorado**
```
POST /api/webhooks/stripe
```
- Busca usuário por email
- Cria usuário se não existir
- Atualiza plano automaticamente

## ⚡ **Solução Imediata**

### **Opção 1: Executar Sincronização (RECOMENDADO)**
```bash
curl -X POST https://site54874935.netlify.app/api/sync-users \
  -H "Content-Type: application/json" \
  -d '{}'
```

### **Opção 2: Criar Usuário Manualmente**
```bash
curl -X POST https://site54874935.netlify.app/api/force-update-plan \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin6@admin.com",
    "plan": "pro", 
    "credits": 100
  }'
```

### **Opção 3: Usar Botão de Atualizar**
1. Acesse: https://site54874935.netlify.app/profile
2. Faça login com: `admin6@admin.com`
3. Clique no botão "Atualizar"

## 🎯 **Próximos Passos**

### **1. Aguardar Deploy** (5-10 minutos)
- APIs estão sendo deployadas
- Netlify está processando

### **2. Executar Sincronização**
- Rodar API `/api/sync-users`
- Verificar resultado

### **3. Testar Webhook**
- Fazer nova assinatura no Stripe
- Verificar se atualiza automaticamente

### **4. Configurar Trigger Automático**
- Criar trigger no Supabase
- Sincronizar automaticamente novos usuários

## 📞 **Status das APIs**

### **✅ Funcionando:**
- `/api/check-webhook` - Verifica configuração
- `/api/test-webhook` - Testa webhook manualmente

### **⏳ Em Deploy:**
- `/api/sync-users` - Sincroniza usuários
- `/api/check-auth-users` - Verifica tabelas
- `/api/force-update-plan` - Atualiza plano manualmente

## 🔮 **Prevenção Futura**

### **Trigger Automático no Supabase:**
```sql
-- Criar função para sincronizar automaticamente
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, email, full_name, subscription_plan, 
    subscription_status, credits_remaining, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'free', 'active', 10, NEW.created_at, NOW()
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_profile();
```

## 🎉 **Resultado Esperado**

Após a sincronização:
- ✅ Usuários aparecerão na tabela `public.users`
- ✅ Webhook encontrará usuários para atualizar
- ✅ Perfil web carregará corretamente
- ✅ Planos atualizarão automaticamente
- ✅ App mobile e web compartilharão dados 