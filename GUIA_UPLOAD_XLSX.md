# Guia: Upload de Arquivos Excel com Conversão para Parquet

## 🎯 Objetivo
Criar um sistema que permite fazer upload de arquivos Excel (.xlsx), converter para Parquet, fazer upload para Supabase Storage e inserir os dados no banco de dados.

---

## 📋 Pré-requisitos

### 1. Configurar Bucket no Supabase Storage

1. No painel do Supabase, vá em **"Storage"** no menu lateral
2. Clique em **"Create bucket"**
3. Preencha:
   - **Name**: `uploads`
   - **Public bucket**: ❌ Desmarque (privado)
4. Clique em **"Create bucket"**

### 2. Criar Tabela para Dados Importados

No **SQL Editor** do Supabase, execute:

```sql
-- Tabela para armazenar dados importados
-- Esta tabela será criada dinamicamente ou você pode criar uma específica
CREATE TABLE IF NOT EXISTS imported_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  -- Os campos abaixo serão dinâmicos baseados no seu Excel
  -- Você pode criar uma tabela específica ou usar JSONB
  data JSONB,
  metadata JSONB
);

-- Ou criar uma tabela específica para seus dados
-- Exemplo genérico (ajuste conforme seus dados):
CREATE TABLE IF NOT EXISTS excel_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  rows_count INTEGER NOT NULL,
  original_size BIGINT NOT NULL,
  parquet_size BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE excel_imports ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ver seus próprios imports
CREATE POLICY "Usuários podem ver seus imports" ON excel_imports
  FOR SELECT USING (auth.uid() = created_by);

-- Política: Usuários autenticados podem criar imports
CREATE POLICY "Usuários podem criar imports" ON excel_imports
  FOR INSERT WITH CHECK (auth.uid() = created_by);
```

### 3. Configurar Políticas do Storage

No Supabase, vá em **Storage** > **Policies** e crie:

```sql
-- Política para upload
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Política para leitura (se necessário)
CREATE POLICY "Usuários autenticados podem ler arquivos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'uploads');
```

---

## 🔧 Configuração do Código

### Arquivos Criados

1. **`src/pages/Upload.tsx`** - Página de upload
2. **`src/services/uploadService.ts`** - Serviço para processar arquivos

### Dependências Instaladas

- `xlsx` - Para ler arquivos Excel
- `parquetjs` - Para converter para Parquet (pode precisar de ajustes)
- `@mantine/dropzone` - Componente de upload do Mantine

---

## ⚠️ Nota Importante sobre Parquet

A conversão para Parquet no navegador pode ser complexa. Duas opções:

### Opção 1: Usar Backend (Recomendado)
Fazer a conversão no backend (Node.js) usando bibliotecas como `parquetjs` ou `@parquetjs/core`.

### Opção 2: Converter no Frontend (Atual)
O código atual converte para JSON primeiro como fallback. Para produção, recomendo:

1. Enviar o Excel para um endpoint backend
2. Backend converte para Parquet
3. Backend faz upload para Supabase Storage
4. Backend insere no banco

---

## 📝 Como Usar

1. Acesse a página `/upload` (ou clique em "Upload de Arquivos" na página de usuários)
2. Arraste um arquivo Excel ou clique para selecionar
3. O sistema irá:
   - Ler o arquivo Excel
   - Converter para Parquet (ou JSON temporariamente)
   - Fazer upload para Supabase Storage
   - Inserir dados no banco

---

## 🐛 Solução de Problemas

### Erro: "Bucket 'uploads' not found"
- Crie o bucket no Supabase Storage (veja Passo 1)

### Erro: "Permission denied"
- Verifique as políticas RLS do Storage (veja Passo 3)

### Erro: "Table 'imported_data' does not exist"
- Execute o SQL para criar a tabela (veja Passo 2)

### Conversão Parquet não funciona
- O código atual usa JSON como fallback
- Para produção, use um backend para conversão

---

## 🔄 Próximos Passos

1. **Criar backend** para conversão Parquet real
2. **Validar dados** antes de inserir
3. **Adicionar preview** dos dados antes de importar
4. **Suporte a múltiplas planilhas**
5. **Mapeamento de colunas** personalizado

---

## 📚 Recursos

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [XLSX Library](https://sheetjs.com/)
- [ParquetJS](https://github.com/ironSource/parquetjs)




