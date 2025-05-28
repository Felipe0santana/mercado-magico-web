# ✅ Checklist: Configuração do Webhook Secret

## 🔑 Webhook Secret Obtido
- ✅ **Secret**: `whsec_NH0oIiRI2VMIOy69WapT48P6U5BlQ6vm`

## 📋 Passos para Configurar no Netlify

### **Passo 1: Acessar Netlify** 
- [ ] Acesse: https://app.netlify.com
- [ ] Faça login na sua conta
- [ ] Selecione o site: `site54874935`

### **Passo 2: Adicionar Variável de Ambiente**
- [ ] Clique em **"Site settings"** (menu lateral)
- [ ] Clique em **"Environment variables"**
- [ ] Clique em **"Add variable"**
- [ ] **Key**: `STRIPE_WEBHOOK_SECRET`
- [ ] **Value**: `whsec_NH0oIiRI2VMIOy69WapT48P6U5BlQ6vm`
- [ ] **Scopes**: "All scopes"
- [ ] Clique em **"Create variable"**

### **Passo 3: Redeploy**
- [ ] Vá para aba **"Deploys"**
- [ ] Clique em **"Trigger deploy"**
- [ ] Selecione **"Deploy site"**
- [ ] Aguarde o deploy terminar (2-5 minutos)

## 🧪 Como Testar Após Deploy

### **Teste 1: Verificar Configuração**
```bash
# Teste se a API está funcionando
curl https://site54874935.netlify.app/api/check-webhook
```

**Resposta esperada:**
```json
{
  "status": "success",
  "config": {
    "stripe": {
      "secretKey": true,
      "webhookSecret": true
    }
  }
}
```

### **Teste 2: No Stripe Dashboard**
- [ ] Volte para a página do webhook no Stripe
- [ ] Clique em **"Send test webhook"**
- [ ] Selecione **"checkout.session.completed"**
- [ ] Clique em **"Send test webhook"**
- [ ] Verifique se retorna **status 200**

### **Teste 3: Pagamento Real**
- [ ] Faça um checkout de teste no seu site
- [ ] Use cartão: `4242 4242 4242 4242`
- [ ] Complete o pagamento
- [ ] Verifique se o plano atualizou automaticamente no perfil

## 🔍 Monitoramento

### **Logs do Netlify:**
1. Acesse: https://app.netlify.com
2. Site: `site54874935`
3. Vá em: **"Functions"**
4. Clique em: **"api/webhooks/stripe"**
5. Verifique os logs em tempo real

### **Logs do Stripe:**
1. Dashboard do Stripe
2. **"Developers"** → **"Webhooks"**
3. Clique no seu webhook
4. Seção **"Recent deliveries"**

## 🚨 Se Algo Der Errado

### **Problemas Comuns:**
- **404 na API**: Deploy ainda não terminou
- **500 Error**: Webhook secret incorreto
- **Timeout**: Servidor sobrecarregado

### **Soluções:**
1. **Aguarde** o deploy terminar completamente
2. **Verifique** se o webhook secret foi copiado corretamente
3. **Refaça** o deploy se necessário

## 🎯 Status Final Esperado

Após tudo configurado:
- ✅ **Webhook funcionando** automaticamente
- ✅ **Pagamentos** atualizam o plano instantaneamente
- ✅ **Logs** mostram as transações
- ✅ **Sem necessidade** de refresh manual

---

**🚀 Agora é só seguir o checklist e testar! O webhook secret já está correto.** 