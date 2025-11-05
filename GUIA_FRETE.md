# Guia: Configuração do Sistema de Fretes

## 🎯 Objetivo
Configurar o sistema completo para gerenciar dados de frete com upload de Excel, conversão para Parquet, armazenamento e visualização.

---

## 📋 Passo 1: Criar Tabela de Fretes no Supabase

No **SQL Editor** do Supabase, execute:

```sql
-- Criar tabela de fretes
CREATE TABLE IF NOT EXISTS fretes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cep TEXT NOT NULL,
  uf TEXT NOT NULL,
  transportadora TEXT NOT NULL,
  frete DECIMAL(10, 2) NOT NULL,
  prazo INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Se a tabela já existe sem a coluna transportadora, execute este comando:
-- ALTER TABLE fretes ADD COLUMN IF NOT EXISTS transportadora TEXT NOT NULL DEFAULT 'Não informado';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_fretes_uf ON fretes(uf);
CREATE INDEX IF NOT EXISTS idx_fretes_cep ON fretes(cep);

-- Habilitar RLS
ALTER TABLE fretes ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ver (para consultas)
CREATE POLICY "Todos podem ver fretes" ON fretes
  FOR SELECT USING (true);

-- Política: Usuários autenticados podem inserir
CREATE POLICY "Usuários podem inserir fretes" ON fretes
  FOR INSERT WITH CHECK (true);

-- Política: Usuários autenticados podem deletar
CREATE POLICY "Usuários podem deletar fretes" ON fretes
  FOR DELETE USING (true);
```

---

## 📋 Passo 2: Criar Função SQL para Resumo

No **SQL Editor** do Supabase, execute:

```sql
-- Função para calcular resumo de fretes por UF
CREATE OR REPLACE FUNCTION get_frete_summary()
RETURNS TABLE (
  uf TEXT,
  qtd_ceps BIGINT,
  media_frete NUMERIC,
  media_prazo NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.uf,
    COUNT(*)::BIGINT as qtd_ceps,
    AVG(f.frete)::NUMERIC(10, 2) as media_frete,
    AVG(f.prazo)::NUMERIC(10, 1) as media_prazo
  FROM fretes f
  GROUP BY f.uf
  ORDER BY f.uf;
END;
$$;

-- Dar permissão para a função
GRANT EXECUTE ON FUNCTION get_frete_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_frete_summary() TO anon;
```

---

## 📋 Passo 2.1: Criar Função SQL para Resumo por Transportadora (Opcional)

No **SQL Editor** do Supabase, execute:

```sql
-- Função para calcular resumo de fretes por transportadora
CREATE OR REPLACE FUNCTION get_frete_summary_by_transportadora()
RETURNS TABLE (
  transportadora TEXT,
  qtd_ceps BIGINT,
  media_frete NUMERIC,
  media_prazo NUMERIC,
  ufs TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.transportadora,
    COUNT(*)::BIGINT as qtd_ceps,
    AVG(f.frete)::NUMERIC(10, 2) as media_frete,
    AVG(f.prazo)::NUMERIC(10, 1) as media_prazo,
    ARRAY_AGG(DISTINCT f.uf ORDER BY f.uf) as ufs
  FROM fretes f
  GROUP BY f.transportadora
  ORDER BY f.transportadora;
END;
$$;

-- Dar permissão para a função
GRANT EXECUTE ON FUNCTION get_frete_summary_by_transportadora() TO authenticated;
GRANT EXECUTE ON FUNCTION get_frete_summary_by_transportadora() TO anon;
```

**Nota:** Se você não criar esta função, o sistema calculará os resumos manualmente (funciona, mas pode ser mais lento com muitos dados).

---

## 📋 Passo 3: Formato do Arquivo Excel

O arquivo Excel deve ter as seguintes colunas (nomes flexíveis):

### Colunas Obrigatórias:
- **CEP** (ou CEP Origem, CEP_Origem): CEP do local
- **UF** (ou Estado, UF Destino): Estado (sigla de 2 letras)
- **Transportadora** (ou Empresa, Nome Transportadora): Nome da transportadora (texto)
- **Frete** (ou Valor Frete, Valor, Preço, Custo): Valor do frete (número)
- **Prazo** (ou Prazo Entrega, Dias, Prazo Dias): Prazo em dias (número)

### Exemplo de Estrutura:

| CEP       | UF | Transportadora | Frete | Prazo |
|-----------|----|----------------|-------|-------|
| 01310100  | SP | Transportadora ABC | 15.50 | 5 |
| 20040020 | RJ | Transportadora XYZ | 22.00 | 7 |
| 30130100 | MG | Transportadora ABC | 18.75 | 4 |

**Nota:** O sistema tenta identificar automaticamente as colunas mesmo com nomes diferentes.

---

## 🔧 Passo 4: Configurar Storage (se ainda não fez)

Se ainda não criou o bucket `uploads`:

1. Vá em **Storage** no Supabase
2. Clique em **"Create bucket"**
3. Nome: `uploads`
4. Público: ❌ (privado)

### Políticas do Storage:

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
```

---

## 🚀 Como Usar

1. **Acesse a página de Fretes** (menu lateral)
2. **Clique em "Upload de Arquivo"**
3. **Selecione seu arquivo Excel** com dados de frete
4. **Aguarde o processamento**:
   - Leitura do Excel
   - Conversão para Parquet
   - Upload para Storage
   - Inserção no banco
5. **Visualize os dados**:
   - Resumo por UF na tabela principal
   - Cards com totais gerais
   - Clique em "Ver detalhes" para ver todos os CEPs de uma UF

---

## 📊 Funcionalidades

### Visualização Resumida
- **Cards de Resumo**: Total de CEPs, Média Geral de Frete, Média Geral de Prazo
- **Tabs de Visualização**:
  - **Por UF**: Mostra quantidade de CEPs, média de frete e prazo por estado
  - **Por Transportadora**: Mostra quantidade de CEPs, média de frete e prazo por transportadora, incluindo UFs atendidas

### Detalhes
- Ao clicar no ícone de olho, abre modal com todos os registros
- Na aba "Por UF": mostra todos os CEPs da UF selecionada
- Na aba "Por Transportadora": mostra todos os CEPs da transportadora selecionada
- Mostra CEP, UF, Transportadora, Frete e Prazo de cada registro

### Exclusão
- Excluir todos os dados de uma UF específica
- Confirmação antes de excluir

---

## 🐛 Solução de Problemas

### Erro: "Table 'fretes' does not exist"
- Execute o SQL do Passo 1 para criar a tabela

### Erro: "function get_frete_summary() does not exist"
- Execute o SQL do Passo 2 para criar a função

### Dados não aparecem após upload
- Verifique se o Excel tem as colunas corretas
- Verifique o console do navegador para erros
- Confirme que os dados foram inseridos na tabela `fretes`

### Colunas não são reconhecidas
- O sistema tenta identificar automaticamente, mas se não funcionar:
- Renomeie as colunas no Excel para: `cep`, `uf`, `transportadora`, `frete`, `prazo`

### Transportadora não aparece
- Verifique se o Excel tem a coluna de transportadora
- Nomes aceitos: `transportadora`, `empresa`, `nome_transportadora`, `transportadora_nome`, `nome_empresa`
- Se não tiver, o sistema usará "Não informado" como padrão

---

## ✅ Checklist

- [✅] Criou tabela `fretes` no Supabase
- [✅] Criou função `get_frete_summary()` no Supabase
- [✅] Configurou bucket `uploads` no Storage
- [✅] Configurou políticas do Storage
- [✅] Testou upload de arquivo Excel
- [✅] Verificou que dados aparecem na tabela
- [✅] Testou visualização de detalhes
- [✅] Testou exclusão de dados

---

## 📚 Estrutura do Sistema

```
Sidebar (Menu Lateral)
├── Usuários
├── Fretes (NOVO)
└── Upload

Página Fretes
├── Cards de Resumo Geral
├── Tabela Resumo por UF
│   ├── Ver Detalhes (modal)
│   └── Excluir UF
└── Modal de Detalhes (todos os CEPs da UF)
```

---

**Pronto!** Agora você tem um sistema completo de gerenciamento de fretes! 🎉

