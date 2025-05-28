# ✅ Webhook Já Configurado - Próximos Passos

## 🎉 Status Atual
- ✅ **Webhook criado no Stripe**
- ✅ **URL correta**: `https://site54874935.netlify.app/api/webhooks/stripe`
- ✅ **ID do webhook**: `we_1RTkcgG8Yafp5KeiHEwGle7w`

## 🔧 O que Falta Fazer

### 1. **Copiar o Webhook Secret**

Na página do Stripe que você está vendo:

```
📍 Procure por: "Signing secret" ou "Segredo da assinatura"
🔍 Clique em: "Reveal" ou "Click to reveal"
📋 Copie: whsec_xxxxxxxxxxxxxxxxx
```

### 2. **Verificar Eventos Selecionados**

Certifique-se de que estes eventos estão marcados:

```
✅ checkout.session.completed
✅ customer.subscription.created  
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ invoice.payment_succeeded
✅ invoice.payment_failed
```

### 3. **Adicionar no Netlify**

1. **Acesse**: https://app.netlify.com
2. **Site**: `site54874935`
3. **Menu**: `Site settings` → `Environment variables`
4. **Adicione**:
   ```
   Key: STRIPE_WEBHOOK_SECRET
   Value: whsec_xxxxxxxxxxxxxxxxx
   ```

### 4. **Redeploy**

Após adicionar a variável:
```
Deploys → Trigger deploy → Deploy site
```

## 🧪 Como Testar

### Teste 1: No Stripe Dashboard
```
1. Na página do webhook
2. Clique em "Send test webhook"
3. Selecione "checkout.session.completed"
4. Clique em "Send test webhook"
5. Verifique se retorna status 200
```

### Teste 2: Via API (após deploy)
```bash
curl https://site54874935.netlify.app/api/check-webhook
```

### Teste 3: Pagamento Real
```
1. Faça um checkout de teste
2. Use cartão: 4242 4242 4242 4242
3. Complete o pagamento
4. Verifique se o plano atualizou automaticamente
```

## 🔍 Monitoramento

### No Stripe:
- **Webhook logs**: `Developers` → `Webhooks` → `[seu webhook]` → `Recent deliveries`
- **Eventos**: `Developers` → `Events`

### No Netlify:
- **Function logs**: `Functions` → `api/webhooks/stripe`

## 🚨 Se Não Funcionar

### Checklist:
- [ ] Webhook secret adicionado no Netlify
- [ ] Site foi redeployado após adicionar a variável
- [ ] Eventos corretos estão selecionados
- [ ] URL do webhook está correta

### Debug:
```bash
# Verificar se a API existe
curl -I https://site54874935.netlify.app/api/webhooks/stripe

# Verificar configuração
curl https://site54874935.netlify.app/api/check-webhook
```

## 🎯 Resultado Esperado

Após configurar tudo:
1. **Pagamentos automáticos** → **Plano atualizado automaticamente**
2. **Sem necessidade** de refresh manual
3. **Logs detalhados** para monitoramento

---

**🔥 Você está quase lá! O webhook já está criado, só falta configurar o secret no Netlify!** 