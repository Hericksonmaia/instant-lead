

# Plano: Corrigir vinculacao de mensagens WhatsApp com leads

## Problema Identificado

O lead tem telefone `5585998372658` mas o WhatsApp envia `558598372658` (sem o nono digito). Apos normalizacao, o webhook busca `8598372658` mas o lead tem `85998372658`. O `ilike` nao encontra correspondencia porque os numeros sao diferentes.

Isso e um problema conhecido com numeros brasileiros -- o WhatsApp as vezes armazena numeros de celular sem o nono digito (9).

## Solucao

Melhorar a logica de busca de leads no webhook para considerar variantes de numeros brasileiros (com e sem o nono digito).

### Mudancas Tecnicas

**1. Atualizar `supabase/functions/evolution-webhook/index.ts`**

Adicionar funcao que gera variantes do numero brasileiro:
- Numero original normalizado: `8598372658`
- Com nono digito inserido: `85998372658` (adicionar `9` apos o DDD de 2 digitos)
- Com prefixo 55: `558598372658`, `5585998372658`

Atualizar a busca de leads para testar todas essas variantes.

```text
Variantes geradas para 8598372658:
  - 8598372658
  - 85998372658    (com 9o digito)
  - 558598372658
  - 5585998372658  (com 9o digito + 55)
```

**2. Logica da funcao `generatePhoneVariants`**

Para numeros com 10 digitos (DDD + 8 digitos, sem o 9):
- Inserir `9` na posicao 2 (apos o DDD) para gerar a variante de 11 digitos

Para numeros com 11 digitos (DDD + 9 digitos, com o 9):
- Remover o digito na posicao 2 para gerar a variante de 10 digitos

Sempre testar tambem com e sem o prefixo `55`.

**3. Nenhuma mudanca no banco de dados**

A correcao e apenas na logica da edge function. Nao requer migracao.

