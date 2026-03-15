

## Analise Completa da Aplicação - Bugs e Problemas Encontrados

Analisei todo o codebase e encontrei os seguintes problemas:

---

### Bugs Criticos

**1. `SaleDialog.tsx` - `useState` usado no lugar de `useEffect` (linha 55)**
O carregamento de tags usa `useState(() => {...})` como inicializador, mas deveria ser `useEffect`. O callback nunca re-executa quando `open` muda, então as tags podem não carregar corretamente.

**2. `LinkList.tsx` - Duplicação de link incompleta (linha 112-131)**
A função `duplicateLink` não copia os novos campos `facebook_pixel_id` e `facebook_access_token` do link original. Links duplicados perdem configurações de pixel.

**3. `meta-purchase` Edge Function - Método `getClaims` inexistente**
A função usa `userClient.auth.getClaims(token)` que não existe no supabase-js v2. Deveria usar `userClient.auth.getUser()`.

---

### Codigo Legado / Duplicações

**4. `src/lib/api/whatsapp.ts` - Funções legadas mortas**
`updateEvolutionAPISettings()` e `getEvolutionAPISettings()` ainda operam na tabela `workspaces` (colunas legadas), mas a aplicação agora usa a tabela `evolution_instances`. Ninguém chama essas funções. Devem ser removidas.

**5. `Settings.tsx` - Configuração duplicada de Pixel/Token**
A aba "Workspace" ainda permite configurar `facebook_pixel_id` e `facebook_access_token` no nível do workspace, criando confusão com a mesma configuração agora disponível por link no `EditLinkDialog`. Deveria ser esclarecido como "fallback padrão" ou removido.

---

### Problemas de Lógica

**6. `LinkList.tsx` - Badge de modo incompleta (linha 219-221)**
O badge mostra apenas "Formulário" ou "Direto", mas o modo "menu" também existe e aparece como "Direto".

**7. `evolution-webhook` - Meta CAPI usa apenas credenciais do workspace (linha 319)**
O webhook envia eventos para o Meta usando `workspaceData.facebook_access_token`, ignorando as credenciais por link. Deveria buscar o pixel/token do link associado ao lead.

**8. Limite de 1000 registros no Dashboard e Leads**
Tanto `Dashboard.tsx` quanto `Leads.tsx` fazem `select` de todos os leads sem paginação. Com mais de 1000 leads, dados serão silenciosamente truncados.

---

### Plano de Correções

| # | Arquivo | Correção |
|---|---------|----------|
| 1 | `SaleDialog.tsx` | Trocar `useState(() => {...})` por `useEffect` |
| 2 | `LinkList.tsx` | Adicionar `facebook_pixel_id`, `facebook_access_token` no `duplicateLink` |
| 3 | `meta-purchase/index.ts` | Trocar `getClaims` por `getUser` |
| 4 | `src/lib/api/whatsapp.ts` | Remover `updateEvolutionAPISettings` e `getEvolutionAPISettings` |
| 5 | `Settings.tsx` | Adicionar nota explicativa de "fallback" nos campos de pixel/token |
| 6 | `LinkList.tsx` | Adicionar badge "Menu" para mode === "menu" |
| 7 | `evolution-webhook/index.ts` | Buscar credenciais do link do lead, com fallback ao workspace |
| 8 | `Dashboard.tsx`, `Leads.tsx` | Adicionar `.limit()` ou nota de que pode truncar |

