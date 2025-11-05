# Correções Aplicadas: Problema de Upload não Inserindo Dados

## 🐛 Problema Identificado

- ✅ Arquivo foi enviado para Storage
- ❌ Nenhuma linha foi inserida na tabela `fretes`
- ❌ Mostra 0 linhas no histórico
- ❌ Não aparece na página de Frete

## ✅ Correções Aplicadas

### 1. **Logs Melhorados** (`src/services/uploadService.ts`)

Adicionados logs detalhados para diagnosticar:
- Dados lidos do Excel
- Detecção de tipo de dados (frete/genérico)
- Resposta da função SQL
- Quantidade de linhas inseridas

### 2. **Tratamento de Erro Melhorado**

- Fallback automático se função SQL falhar
- Logs detalhados de erros
- Processamento manual como backup

### 3. **Função SQL Melhorada** (`003_fix_process_json_data.sql`)

- Detecção de tipo de dados melhorada (prazo opcional)
- Verificação de duplicatas antes de inserir
- Contador de linhas inseridas corrigido
- Melhor tratamento de erros

### 4. **Correção de Buffer** 

- Substituído `Buffer` por `Uint8Array` (nativo do navegador)
- Conversão para `Blob` antes do upload
- Configuração do Vite atualizada

## 🔧 Como Testar

### Passo 1: Executar Migração SQL (se ainda não fez)

```bash
npx supabase db push
```

Ou copie e cole o conteúdo de `supabase/migrations/003_fix_process_json_data.sql` no SQL Editor do Supabase.

### Passo 2: Fazer Upload de Novo

1. Abra o console do navegador (F12)
2. Vá na aba "Console"
3. Faça upload do arquivo Excel
4. Observe os logs no console:
   - `📊 Dados lidos do Excel` - Verifica se dados foram lidos
   - `🔍 Detecção de tipo de dados` - Verifica se detectou como frete
   - `Chamando função SQL process_uploaded_file` - Verifica chamada
   - `Resposta da função SQL` - Verifica resposta
   - `Linhas inseridas pela função SQL` - Verifica quantidade

### Passo 3: Verificar Resultados

**No Console:**
- Se aparecer `isFreteData: false`, os dados não foram detectados como frete
- Se aparecer `rows_inserted: 0`, verifique os logs de erro

**No Supabase:**
- Verifique a tabela `file_uploads` para ver o status
- Verifique a tabela `fretes` para ver se dados foram inseridos

## 🔍 Diagnóstico

### Se `isFreteData: false`

**Problema:** Dados não foram detectados como frete

**Solução:** Verifique se o Excel tem as colunas:
- CEP (ou CEP Origem, CEP_Origem)
- UF (ou Estado, UF Destino)
- Frete (ou Valor Frete, Valor, Preço, Custo)
- Prazo (opcional, mas recomendado)

**Verifique no console:**
```
🔍 Detecção de tipo de dados:
  hasCep: true/false
  hasUf: true/false
  hasFrete: true/false
  hasPrazo: true/false
  firstRowKeys: [...] // Nomes das colunas detectadas
```

### Se `rows_inserted: 0` mas `isFreteData: true`

**Problema:** Dados foram detectados mas não inseridos

**Possíveis causas:**
1. Erro na função SQL (verifique logs)
2. Dados normalizados estão vazios (CEP ou UF inválidos)
3. Constraint violada (duplicatas)

**Solução:** Verifique logs de erro no console

### Se aparecer erro na função SQL

**Problema:** Função SQL não está funcionando

**Solução:** 
1. Verifique se a migração foi executada
2. Verifique se a função existe:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name = 'process_uploaded_file';
   ```
3. Verifique políticas RLS da tabela `fretes`

## 📋 Checklist de Verificação

- [ ] Migração SQL `003_fix_process_json_data.sql` foi executada
- [ ] Console do navegador está aberto (F12)
- [ ] Arquivo Excel tem colunas: CEP, UF, Frete, Prazo
- [ ] Logs aparecem no console durante upload
- [ ] Verificar se `isFreteData: true` no console
- [ ] Verificar se `rows_inserted > 0` no console
- [ ] Verificar tabela `fretes` no Supabase
- [ ] Verificar tabela `file_uploads` no Supabase

## 🚀 Próximos Passos

1. **Teste novamente** com o arquivo Excel
2. **Observe os logs** no console do navegador
3. **Compartilhe os logs** se o problema persistir:
   - Copie todos os logs do console
   - Informe o resultado de `isFreteData`
   - Informe o resultado de `rows_inserted`

## 💡 Dica

Se os dados não forem detectados como frete, verifique os nomes das colunas no Excel. O sistema normaliza os nomes (remove espaços, caracteres especiais, converte para minúsculas).

**Exemplo:**
- Excel: `CEP Origem` → Detectado como: `cep_origem`
- Excel: `UF Destino` → Detectado como: `uf_destino`
- Excel: `Valor Frete` → Detectado como: `valor_frete`

---

**Após testar, compartilhe os logs do console para diagnóstico mais preciso!** 🔍



