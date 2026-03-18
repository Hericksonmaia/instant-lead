

## Melhorias no Menu: Logo + Ícones Nativos

### Estado Atual
- O `MenuPage` mostra uma letra (inicial do nome) como avatar, sem suporte a logo.
- A tabela `menu_items` já possui coluna `icon` (text), mas ela nunca é usada na UI.
- Não existe campo `logo_url` na tabela `redirect_links`.

---

### 1. Logo no Perfil

**Migração SQL**: Adicionar `logo_url` na tabela `redirect_links`.
```sql
ALTER TABLE redirect_links ADD COLUMN logo_url text;
```

**Storage**: Criar um bucket `logos` para upload de imagens.

**EditLinkDialog.tsx** (aba Menu ou Tema): Adicionar campo de upload de logo com preview. Salva a URL no `redirect_links.logo_url`.

**MenuPage.tsx**: Se `logo_url` existir, renderiza `<img>` no lugar da letra inicial. Senão, mantém o fallback da letra.

---

### 2. Ícones Nativos nos Itens do Menu

Mapa de ícones predefinidos com SVGs inline (para não depender de Lucide no menu público):

| Chave | Ícone |
|-------|-------|
| `whatsapp` | WhatsApp (SVG) |
| `facebook` | Facebook (SVG) |
| `instagram` | Instagram (SVG) |
| `tiktok` | TikTok (SVG) |
| `youtube` | YouTube (SVG) |
| `location` | Pin/Localização (SVG) |
| `email` | Envelope (SVG) |
| `website` | Globe (SVG) |
| `none` | Sem ícone (ExternalLink) |

**EditLinkDialog.tsx** (aba Menu): Ao adicionar/editar um item, mostrar um `<Select>` com os ícones disponíveis (nome + mini preview). O valor selecionado é salvo na coluna `icon` da tabela `menu_items`.

**MenuPage.tsx**: Se o item tiver `icon`, renderiza o SVG correspondente à esquerda do botão. O `ExternalLink` à direita é removido ou mantido apenas quando `icon` é `none`.

---

### Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| **DB Migration** | `logo_url` em `redirect_links` + bucket `logos` |
| **MenuPage.tsx** | Renderizar logo + ícones SVG nos botões |
| **EditLinkDialog.tsx** | Upload de logo + seletor de ícone nos itens do menu |
| **RedirectPage.tsx** | Passar `logo_url` para o `MenuPage` |
| **get_redirect_data RPC** | Incluir `logo_url` no retorno |
| **get_menu_items RPC** | Já retorna `icon`, sem mudança |

