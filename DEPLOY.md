# 🚀 Deploy na Vercel - LeadFlow

## Passo a Passo

### 1. Criar Conta na Vercel
- Acesse [vercel.com](https://vercel.com)
- Faça login com GitHub/GitLab/Bitbucket

### 2. Conectar Repositório
- Clique em "Add New Project"
- Importe seu repositório do GitHub
- A Vercel detectará automaticamente que é um projeto Vite

### 3. Configurar Variáveis de Ambiente
**IMPORTANTE:** Adicione estas variáveis na seção "Environment Variables":

```
VITE_SUPABASE_URL=https://shifwuxxsaussklbgadr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoaWZ3dXh4c2F1c3NrbGJnYWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5Njc5NzcsImV4cCI6MjA3NjU0Mzk3N30.OQMmQBQuvAINBWIkGF5nMa1oMMyszIFVOj8fnTHwBpg
VITE_SUPABASE_PROJECT_ID=shifwuxxsaussklbgadr
```

### 4. Configurações de Build
A Vercel detectará automaticamente:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 5. Deploy
- Clique em "Deploy"
- Aguarde o build (geralmente 1-2 minutos)
- Seu app estará disponível em `https://seu-projeto.vercel.app`

### 6. Configurar URLs no Supabase
Após o deploy, você precisa adicionar a URL da Vercel no Supabase:

1. Abra o backend do Lovable Cloud
2. Vá em Authentication > URL Configuration
3. Adicione estas URLs:
   - **Site URL:** `https://seu-projeto.vercel.app`
   - **Redirect URLs:** 
     - `https://seu-projeto.vercel.app/**`
     - `https://seu-projeto.vercel.app/auth`
     - `https://seu-projeto.vercel.app/dashboard`

### 7. Domínio Customizado (Opcional)
Para usar seu próprio domínio:
1. Vá em Project Settings > Domains na Vercel
2. Adicione seu domínio
3. Configure os registros DNS conforme instruções
4. Atualize as URLs no Supabase

## ✅ Checklist Final

- [ ] Variáveis de ambiente configuradas
- [ ] Build executado com sucesso
- [ ] URLs configuradas no Supabase
- [ ] Autenticação funcionando
- [ ] Links de redirecionamento funcionando
- [ ] Facebook Pixel configurado (se usar)

## 🔍 Testando

1. Acesse seu domínio Vercel
2. Crie uma conta
3. Crie um link de redirecionamento
4. Adicione atendentes
5. Teste o link público: `https://seu-projeto.vercel.app/r/seu-slug`

## 🆘 Problemas Comuns

### Build Falha
- Verifique se todas as dependências estão no package.json
- Confira erros de TypeScript no log

### Autenticação Não Funciona
- Confirme que as URLs estão corretas no Supabase
- Verifique as variáveis de ambiente

### Rotas 404
- O arquivo `vercel.json` já está configurado para SPAs
- Todas as rotas devem funcionar corretamente

### Facebook Pixel Não Dispara
- Verifique o Pixel ID no link
- Use Facebook Pixel Helper (extensão Chrome) para debug

## 📊 Monitoramento

A Vercel oferece:
- Analytics integrado
- Logs em tempo real
- Métricas de performance
- Notificações de deploy

## 🔄 Deploy Contínuo

Cada push no GitHub automaticamente:
1. Inicia novo build na Vercel
2. Executa testes (se configurados)
3. Faz deploy automático
4. Mantém versões anteriores disponíveis

---

**Suporte:** Para dúvidas, consulte a documentação da [Vercel](https://vercel.com/docs)