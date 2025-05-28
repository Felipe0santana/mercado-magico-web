# 🧪 Script de Teste do Webhook

## 1. Verificar Configuração
```bash
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
    },
    "supabase": {
      "url": true,
      "key": true
    }
  }
}
```

## 2. Testar Webhook Manualmente
```bash
curl -X POST https://site54874935.netlify.app/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin2@admin2.com",
    "plan": "premium",
    "amount": 99.99
  }'
```

## 3. Forçar Atualização do Usuário
```bash
curl -X POST https://site54874935.netlify.app/api/check-webhook \
  -H "Content-Type: application/json" \
  -d '{"action": "force_refresh_user"}'
```

## 4. Verificar no Stripe Dashboard

### Testar Webhook:
1. Acesse: `Developers` → `Webhooks`
2. Clique no seu webhook
3. Vá para `Test webhook`
4. Selecione `checkout.session.completed`
5. Clique em `Send test webhook`

### Verificar Logs:
1. Na página do webhook
2. Seção `Recent deliveries`
3. Verifique se há entregas com status `200`

## 5. Teste com Pagamento Real

### Criar Checkout de Teste:
1. Use cartão de teste: `4242 4242 4242 4242`
2. Data: qualquer data futura
3. CVC: qualquer 3 dígitos
4. Complete o pagamento
5. Verifique se o plano foi atualizado automaticamente

## 6. Monitorar Logs

### No Netlify:
1. `Functions` → `api/webhooks/stripe`
2. Verifique os logs em tempo real

### No Stripe:
1. `Developers` → `Events`
2. Verifique se os eventos estão sendo criados

## 🚨 Troubleshooting

### Se o webhook não funcionar:

1. **Verificar URL**: Certifique-se de que a URL está correta
2. **Verificar Secret**: O webhook secret deve estar correto
3. **Verificar Deploy**: As mudanças devem estar deployadas
4. **Verificar Logs**: Verifique erros nos logs do Netlify

### Comandos de Debug:
```bash
# Verificar se a API existe
curl -I https://site54874935.netlify.app/api/webhooks/stripe

# Verificar configuração
curl https://site54874935.netlify.app/api/check-webhook

# Testar manualmente
curl -X POST https://site54874935.netlify.app/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"email": "admin2@admin2.com", "plan": "premium"}'
``` 