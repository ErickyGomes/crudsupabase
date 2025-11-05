# Guia: Processamento Automático de Arquivos Excel → Parquet → Storage → Banco

## 🎯 Objetivo

Criar um sistema completo onde:
1. **Frontend** recebe planilha Excel
2. **Frontend** converte para Parquet
3. **Frontend** faz upload para Supabase Storage
4. **Função SQL** processa automaticamente e insere dados no banco

## 📋 Arquitetura do Sistema

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │
       │ 1. Upload Excel
       │ 2. Converte para Parquet
       │ 3. Upload para Storage
       │ 4. Chama função SQL
       ↓
┌─────────────────────────────────────┐
│      Supabase Storage (Bucket)      │
│         Arquivo .parquet            │
└─────────────────────────────────────┘
       │
       │ Trigger ou função manual
       ↓
┌─────────────────────────────────────┐
│    Função SQL (process_uploaded)    │
│  - Lê metadados do arquivo          │
│  - Processa dados JSON              │
│  - Detecta tipo (frete/genérico)    │
│  - Insere no banco de dados         │
└─────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│      Banco de Dados (PostgreSQL)   │
│  - Tabela fretes                   │
│  - Tabela file_uploads (log)        │
└─────────────────────────────────────┘
```

## 🚀 Passo 1: Configurar Banco de Dados

### 1.1 Executar Migração SQL

**Opção 1: SQL Editor (Recomendado - Mais Simples)**

No **SQL Editor** do Supabase:
1. Abra o arquivo `supabase/migrations/001_process_storage_file.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Execute (botão "Run" ou F5)
5. ✅ Pronto!

**⚠️ Importante:** Não precisa de credenciais do `.env` para isso! O SQL Editor já está conectado ao seu projeto.

**Opção 2: Via CLI (Para projetos maiores)**

Se preferir usar o CLI do Supabase:

```bash
# 1. Fazer login (se ainda não fez)
npx supabase login

# 2. Linkar com projeto remoto (se ainda não fez)
npx supabase link --project-ref seu-project-ref

# 3. Enviar migrações
npx supabase db push
```

**Nota:** O CLI usa autenticação própria (`supabase login`), **NÃO** usa as credenciais do `.env`.

> 📖 **Dúvidas sobre credenciais?** Veja `GUIA_CONFIGURACAO_CREDENCIAIS.md`

### 1.2 Verificar Tabelas Criadas

Após executar a migração, você terá:

1. **`file_uploads`** - Tabela para rastrear uploads processados
2. **`fretes`** - Tabela para dados de frete (já deve existir)

### 1.3 Verificar Funções Criadas

Verifique se as funções foram criadas:

```sql
-- Listar funções
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'process%';
```

Você deve ver:
- `process_storage_file` - Processa arquivo do storage
- `process_json_data` - Processa dados JSON diretamente
- `process_uploaded_file` - Função principal (chamada pelo frontend)
- `normalize_frete_data` - Função auxiliar para normalizar dados

## 🔧 Passo 2: Configurar Storage

### 2.1 Criar Bucket (se ainda não existe)

1. No Supabase, vá em **Storage**
2. Clique em **"Create bucket"**
3. Nome: `uploads`
4. Público: ❌ (privado)

### 2.2 Configurar Políticas do Storage

No **SQL Editor**, execute:

```sql
-- Política para upload
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Política para leitura
CREATE POLICY "Usuários autenticados podem ler arquivos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'uploads');

-- Política para deletar (opcional)
CREATE POLICY "Usuários autenticados podem deletar arquivos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploads');
```

## 📝 Passo 3: Atualizar Código Frontend

### 3.1 O código já está atualizado!

O `uploadService.ts` já foi atualizado com:
- ✅ Conversão melhorada para Parquet
- ✅ Upload para Storage com metadados
- ✅ Chamada à função SQL para processamento

### 3.2 Usar Modo Automático

Na página de Upload, o sistema já está configurado. Para usar o modo automático (processamento via função SQL):

```typescript
// Em src/pages/Upload.tsx, você pode passar a opção:
const result = await uploadService.processFile(file, (progressValue) => {
  setProgress(progressValue);
}, { autoProcess: true }); // Ativar processamento automático
```

## 🔄 Como Funciona o Processamento

### Fluxo Completo:

1. **Usuário faz upload** de arquivo Excel
2. **Frontend lê Excel** usando biblioteca XLSX
3. **Frontend converte para Parquet** (ou JSON como fallback)
4. **Frontend faz upload** para Storage com metadados:
   - `originalFilename`: Nome original
   - `rows`: Quantidade de linhas
   - `dataType`: Tipo de dados (frete/generic)
   - `uploadedAt`: Data/hora
5. **Frontend chama função SQL** `process_uploaded_file` com:
   - `file_path`: Caminho do arquivo no storage
   - `file_url`: URL pública do arquivo
   - `json_data`: Dados JSON para processamento imediato
6. **Função SQL processa**:
   - Detecta tipo de dados automaticamente
   - Normaliza dados (para frete: CEP, UF, Transportadora, etc.)
   - Insere no banco de dados
   - Registra no log (`file_uploads`)
7. **Retorna resultado** para frontend com quantidade de linhas inseridas

## 📊 Tabela de Logs: `file_uploads`

A tabela `file_uploads` rastreia todos os uploads:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único |
| `file_path` | TEXT | Caminho do arquivo no storage |
| `file_url` | TEXT | URL pública do arquivo |
| `original_filename` | TEXT | Nome original do arquivo |
| `rows_count` | INTEGER | Quantidade de linhas no arquivo |
| `rows_inserted` | INTEGER | Quantidade de linhas inseridas |
| `data_type` | TEXT | Tipo de dados (frete/generic) |
| `status` | TEXT | Status (pending/processing/completed/error) |
| `error_message` | TEXT | Mensagem de erro (se houver) |
| `created_at` | TIMESTAMP | Data de criação |
| `processed_at` | TIMESTAMP | Data de processamento |
| `created_by` | UUID | ID do usuário que fez upload |

## 🔍 Detecção Automática de Tipo de Dados

A função SQL detecta automaticamente se os dados são de frete verificando a presença de colunas:

**Colunas de Frete:**
- CEP: `cep`, `ceo`, `cep_origem`
- UF: `uf`, `estado`, `uf_destino`
- Frete: `frete`, `valor_frete`, `valor`, `preco`, `custo`
- Prazo: `prazo`, `prazo_entrega`, `dias`, `prazo_dias`
- Transportadora: `transportadora`, `empresa`, `nome_transportadora`, etc.

Se todas essas colunas estiverem presentes, os dados são processados como **frete**.

## 🧪 Testando o Sistema

### 1. Testar Upload

1. Acesse a página `/upload`
2. Selecione um arquivo Excel com dados de frete
3. Aguarde o processamento
4. Verifique:
   - ✅ Arquivo aparece no Storage
   - ✅ Dados aparecem na tabela `fretes`
   - ✅ Registro aparece na tabela `file_uploads`

### 2. Verificar Logs

```sql
-- Ver todos os uploads
SELECT * FROM file_uploads ORDER BY created_at DESC;

-- Ver uploads com erro
SELECT * FROM file_uploads WHERE status = 'error';

-- Ver estatísticas
SELECT 
  status,
  COUNT(*) as total,
  SUM(rows_inserted) as total_rows
FROM file_uploads
GROUP BY status;
```

### 3. Verificar Dados Inseridos

```sql
-- Ver dados de frete inseridos
SELECT * FROM fretes ORDER BY created_at DESC LIMIT 10;

-- Ver resumo por UF
SELECT uf, COUNT(*) as total FROM fretes GROUP BY uf;
```

## 🐛 Solução de Problemas

### Erro: "function process_uploaded_file does not exist"

**Solução:** Execute a migração SQL (`supabase/migrations/001_process_storage_file.sql`)

### Erro: "permission denied for function process_uploaded_file"

**Solução:** Verifique se as permissões foram concedidas:

```sql
GRANT EXECUTE ON FUNCTION process_uploaded_file(TEXT, TEXT, JSONB) TO authenticated;
```

### Dados não são inseridos

**Verifique:**
1. Se a tabela `fretes` existe
2. Se as políticas RLS permitem inserção
3. Se os dados têm o formato correto (verifique logs em `file_uploads`)

### Conversão Parquet não funciona

**Solução:** O sistema usa JSON como fallback. Para conversão real de Parquet, considere usar:
- Edge Function do Supabase (veja `GUIA_BACKEND_CONVERSAO.md`)
- Backend Node.js separado

## 🔄 Modos de Processamento

### Modo 1: Processamento Automático (Recomendado)

```typescript
// Frontend chama função SQL que processa tudo
await uploadService.processFile(file, onProgress, { autoProcess: true });
```

**Vantagens:**
- ✅ Processamento no servidor (mais seguro)
- ✅ Validação no banco de dados
- ✅ Logs automáticos
- ✅ Melhor performance para grandes volumes

### Modo 2: Processamento Manual

```typescript
// Frontend processa e insere diretamente
await uploadService.processFile(file, onProgress, { autoProcess: false });
```

**Vantagens:**
- ✅ Funciona mesmo sem função SQL
- ✅ Mais controle no frontend
- ✅ Útil para desenvolvimento

## 📚 Estrutura de Arquivos

```
supabase/
└── migrations/
    └── 001_process_storage_file.sql  ← Migração SQL

src/
└── services/
    └── uploadService.ts              ← Serviço atualizado
```

## ✅ Checklist de Configuração

- [ ] Executei a migração SQL no Supabase
- [ ] Verifiquei que as funções foram criadas
- [ ] Criei o bucket `uploads` no Storage
- [ ] Configurei políticas do Storage
- [ ] Testei upload de arquivo Excel
- [ ] Verifiquei que dados foram inseridos na tabela `fretes`
- [ ] Verifiquei logs na tabela `file_uploads`

## 🚀 Próximos Passos

1. **Edge Function Opcional**: Criar Edge Function para processar arquivos Parquet reais do storage
2. **Validação Avançada**: Adicionar mais validações nos dados
3. **Notificações**: Enviar notificações quando processamento completar
4. **Retry Logic**: Implementar retry para processamentos que falharam
5. **Dashboard**: Criar dashboard para visualizar estatísticas de uploads

## 📖 Referências

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)
- [GUIA_FRETE.md](./GUIA_FRETE.md) - Configuração do sistema de fretes
- [GUIA_UPLOAD_XLSX.md](./GUIA_UPLOAD_XLSX.md) - Guia de upload básico
- [GUIA_BACKEND_CONVERSAO.md](./GUIA_BACKEND_CONVERSAO.md) - Opções de backend

---

**Pronto!** Agora você tem um sistema completo de processamento automático! 🎉

O sistema funciona assim:
1. Frontend faz upload → Storage
2. Função SQL processa automaticamente → Banco de Dados
3. Logs são mantidos para rastreamento

Tudo automatizado e seguro! ✅

