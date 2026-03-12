

## Plan: Pixel/Token por Link + Múltiplas Instâncias WhatsApp

### Problema Atual
- **Pixel/Token**: Armazenados no workspace (`facebook_pixel_id`, `facebook_access_token`), compartilhados por todos os links. Cada link deveria poder ter seu próprio Pixel e Token.
- **WhatsApp**: Apenas uma instância Evolution API por workspace (`evolution_api_url`, `evolution_api_key`, `evolution_instance_name`). Usuário quer configurar múltiplas instâncias.

---

### 1. Pixel e Token por Link

**Migração SQL**: Adicionar colunas `facebook_pixel_id` e `facebook_access_token` na tabela `redirect_links`.

```sql
ALTER TABLE redirect_links
  ADD COLUMN facebook_pixel_id text,
  ADD COLUMN facebook_access_token text;
```

**Lógica de fallback**: Se o link tiver pixel/token próprio, usa ele. Senão, usa o do workspace (mantém retrocompatibilidade).

**Arquivos afetados**:
- `EditLinkDialog.tsx` — Os campos de Pixel ID e Token passam a ler/salvar em `redirect_links` ao invés de `workspaces`. Remover a lógica de `workspaceSettings`.
- `RedirectPage.tsx` — Passar o pixelId do link para o hook `useMetaPixel` (precisa buscar via RPC ou query).
- `supabase/functions/meta-conversions-api/index.ts` — Alterar para primeiro checar `redirect_links.facebook_pixel_id` / `facebook_access_token`, e só usar o do workspace como fallback.
- `supabase/functions/meta-purchase/index.ts` — Mesma lógica de fallback.
- `get_redirect_data` (RPC) — Incluir `facebook_pixel_id` no retorno para o frontend poder carregar o pixel correto.

---

### 2. Múltiplas Instâncias WhatsApp (Evolution API)

**Nova tabela**: `evolution_instances` para armazenar múltiplas instâncias por workspace.

```sql
CREATE TABLE evolution_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  instance_name text NOT NULL,
  api_url text NOT NULL,
  api_key text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE evolution_instances ENABLE ROW LEVEL SECURITY;
-- RLS: owner do workspace pode CRUD
```

**Arquivos afetados**:
- `EvolutionAPISettings.tsx` — Refatorar para listar/criar/editar/excluir múltiplas instâncias (CRUD em cards ou lista).
- `supabase/functions/evolution-webhook/index.ts` — Adaptar para buscar instância na nova tabela em vez de buscar campos no workspace.
- `Settings.tsx` — Sem mudança estrutural, o componente `EvolutionAPISettings` já é renderizado na tab WhatsApp.
- Remover as colunas legadas do workspace (`evolution_api_url`, `evolution_api_key`, `evolution_instance_name`) após migração dos dados, ou mantê-las como fallback temporário.

---

### Resumo de Mudanças

| Área | O que muda |
|------|-----------|
| **DB Migration** | 2 colunas em `redirect_links` + nova tabela `evolution_instances` + RLS |
| **RPC** | `get_redirect_data` retorna `facebook_pixel_id` |
| **Edge Functions** | `meta-conversions-api` e `meta-purchase` usam pixel/token do link com fallback ao workspace |
| **EditLinkDialog** | Campos pixel/token salvam no link, não no workspace |
| **RedirectPage** | Usa pixelId do link |
| **EvolutionAPISettings** | CRUD de múltiplas instâncias |
| **evolution-webhook** | Busca instância na nova tabela |

