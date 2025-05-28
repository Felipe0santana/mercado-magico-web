# 🔑 **Configurar Service Role Key - URGENTE**

## 🚨 **Problema Atual**
A nova arquitetura usando apenas `auth.users` precisa da **Service Role Key** do Supabase para funcionar. Sem ela, as APIs retornam erro "User not allowed".

## 📍 **Onde Encontrar a Service Role Key**

### **1. Acesse o Dashboard do Supabase**
- Vá para: https://supabase.com/dashboard/projects
- Selecione seu projeto: `mercado inteligente`

### **2. Navegue para API Settings**
- No menu lateral, clique em **"Settings"**
- Depois clique em **"API"**

### **3. Copie a Service Role Key**
- Procure por **"service_role"** 
- Copie a chave que começa com `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- ⚠️ **NUNCA** exponha esta chave publicamente!

## 🔧 **Como Configurar no Netlify**

### **1. Acesse as Configurações do Netlify**
- Vá para: https://app.netlify.com/sites/site54874935/settings/deploys
- Clique em **"Environment variables"**

### **2. Adicione a Variável**
- Clique em **"Add variable"**
- **Key**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: Cole a service role key copiada
- **Scopes**: Marque todas as opções:
  - ✅ Production
  - ✅ Deploy Previews  
  - ✅ Branch deploys

### **3. Salve e Redeploy**
- Clique em **"Create variable"**
- Vá para **"Deploys"** e clique em **"Trigger deploy"**

## ✅ **Verificar se Funcionou**

Após o deploy (5-10 minutos), teste:

```bash
curl https://site54874935.netlify.app/api/test-auth-only
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Teste da nova abordagem usando apenas auth.users",
  "stats": {
    "totalUsers": 6,
    "usersFound": true,
    "testUserFound": true
  },
  "users": [...]
}
```

## 🎯 **Benefícios da Nova Arquitetura**

✅ **Simplicidade** - Uma única tabela (`auth.users`)  
✅ **Consistência** - Mobile e Web usam os mesmos dados  
✅ **Automático** - Webhook funciona imediatamente  
✅ **Segurança** - Dados centralizados no Auth  
✅ **Performance** - Menos consultas ao banco  

## 🚀 **Próximos Passos**

1. ✅ Configurar Service Role Key (ESTE PASSO)
2. 🧪 Testar nova API
3. 💳 Testar compra real no Stripe
4. 🎉 Celebrar o sucesso!

---

**⚠️ IMPORTANTE:** A Service Role Key é como uma "chave mestra" do seu banco. Mantenha-a segura e nunca a compartilhe publicamente! 