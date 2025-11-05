# Guia: Onde Fazer a Conversão Excel para Parquet

## 📋 Situação Atual

Atualmente, a conversão está sendo feita no **frontend (Vite/React)**, mas apenas como JSON compacto (não Parquet real). Isso funciona, mas tem limitações.

---

## 🎯 Opções Disponíveis

### Opção 1: Supabase Edge Functions (⭐ RECOMENDADO)

**Onde:** Supabase (servidor)
**Tecnologia:** Deno Runtime (TypeScript/JavaScript)

#### ✅ Vantagens:
- **Integrado ao Supabase**: Mesma infraestrutura, fácil acesso ao banco e storage
- **Sem servidor próprio**: Não precisa manter servidor Node.js
- **Escalável**: Automaticamente escala conforme demanda
- **Custo**: Gratuito até certo limite, depois pago por uso
- **TypeScript nativo**: Escreve código TypeScript diretamente
- **Fácil deploy**: Deploy direto do CLI do Supabase

#### ❌ Desvantagens:
- **Runtime limitado**: Deno (não Node.js), algumas bibliotecas podem não funcionar
- **Timeout**: Limite de tempo de execução (25 segundos no plano gratuito)
- **Requisitos**: Precisa instalar Supabase CLI

#### Como Funciona:
```
Frontend (Vite) → Upload Excel → Supabase Edge Function → 
→ Converte para Parquet → Upload Storage → Insere no Banco → 
→ Retorna resultado para Frontend
```

---

### Opção 2: Backend Node.js Separado

**Onde:** Servidor próprio (Vercel, Railway, Render, etc.)
**Tecnologia:** Node.js + Express/Fastify

#### ✅ Vantagens:
- **Controle total**: Você controla o ambiente
- **Bibliotecas**: Acesso a todas as bibliotecas npm
- **Sem limitações**: Sem timeout (exceto do provider)
- **Flexibilidade**: Pode fazer processamento mais complexo

#### ❌ Desvantagens:
- **Manutenção**: Precisa manter servidor rodando
- **Custo**: Pode ter custos (mesmo que baixos em Vercel/Railway)
- **Complexidade**: Mais complexo de configurar e fazer deploy
- **Infraestrutura**: Precisa gerenciar variáveis de ambiente, segurança, etc.

#### Como Funciona:
```
Frontend (Vite) → Upload Excel → API Node.js → 
→ Converte para Parquet → Upload Supabase Storage → Insere no Banco → 
→ Retorna resultado para Frontend
```

---

### Opção 3: Continuar no Frontend (Atual)

**Onde:** Navegador (Vite/React)
**Tecnologia:** JavaScript/TypeScript no navegador

#### ✅ Vantagens:
- **Simplicidade**: Não precisa backend
- **Sem custos adicionais**: Tudo roda no cliente
- **Rápido para pequenos arquivos**: Processa localmente

#### ❌ Desvantagens:
- **Limitações do navegador**: Algumas bibliotecas Parquet não funcionam bem no browser
- **Performance**: Processamento pesado no cliente pode travar o navegador
- **Memória**: Limitações de memória do navegador
- **Segurança**: Código exposto no cliente
- **Não é Parquet real**: Atualmente converte para JSON

---

## 🏆 Recomendação: Supabase Edge Functions

Para este projeto, recomendo **Supabase Edge Functions** porque:

1. ✅ Já está usando Supabase
2. ✅ Integração natural com Storage e Database
3. ✅ Sem necessidade de manter servidor separado
4. ✅ Fácil de implementar e fazer deploy
5. ✅ Custo-benefício excelente

---

## 🚀 Implementação com Supabase Edge Functions

### Passo 1: Instalar Supabase CLI

```bash
# Windows (PowerShell)
irm https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.zip -OutFile supabase.zip
Expand-Archive supabase.zip
Move-Item supabase\supabase.exe C:\Windows\System32\supabase.exe

# macOS (Homebrew)
brew install supabase/tap/supabase

# Linux
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/supabase
```

### Passo 2: Inicializar Supabase no Projeto

```bash
# No diretório do projeto
supabase login
supabase init
supabase link --project-ref seu-project-ref
```

### Passo 3: Criar Edge Function

```bash
supabase functions new convert-excel-to-parquet
```

### Passo 4: Implementar a Função

Crie o arquivo `supabase/functions/convert-excel-to-parquet/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
import { ParquetWriter } from "https://esm.sh/parquetjs@0.11.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Obter token do header
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter arquivo do body
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Arquivo não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Ler Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Arquivo Excel vazio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Converter para Parquet
    const schemaFields: Record<string, any> = {};
    const firstRow = jsonData[0] as any;
    
    Object.keys(firstRow).forEach((key) => {
      const value = firstRow[key];
      let type = 'UTF8'; // Padrão: string
      
      if (value !== null && value !== undefined) {
        if (typeof value === 'number') {
          type = Number.isInteger(value) ? 'INT64' : 'DOUBLE';
        } else if (value instanceof Date) {
          type = 'TIMESTAMP_MILLIS';
        } else if (typeof value === 'boolean') {
          type = 'BOOLEAN';
        }
      }
      
      schemaFields[key] = { type };
    });

    const schema = new ParquetWriter.Schema(schemaFields);
    
    // Criar buffer Parquet
    const chunks: Uint8Array[] = [];
    const writer = await ParquetWriter.openBuffer(schema);
    
    for (const row of jsonData) {
      await writer.appendRow(row);
    }
    
    await writer.close();
    const parquetBuffer = writer.schema.metadata; // Ajustar conforme biblioteca

    // 3. Upload para Storage
    const timestamp = Date.now();
    const filename = file.name.replace(/\.(xlsx|xls)$/i, '');
    const parquetFilename = `${filename}_${timestamp}.parquet`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(parquetFilename, parquetBuffer, {
        contentType: 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
    }

    // 4. Processar e inserir dados (se for frete)
    let rowsInserted = 0;
    const isFreteData = 
      (firstRow.cep || firstRow.ceo) &&
      (firstRow.uf || firstRow.estado) &&
      (firstRow.frete || firstRow.valor_frete) &&
      (firstRow.prazo || firstRow.prazo_entrega);

    if (isFreteData) {
      // Normalizar dados de frete
      const freteRecords = jsonData.map((row: any) => {
        const cep = (row.cep || row.ceo || '').toString().replace(/\D/g, '');
        const uf = (row.uf || row.estado || '').toString().toUpperCase().trim();
        
        const freteKeys = ['frete', 'valor_frete', 'valor', 'preco', 'custo'];
        let frete = 0;
        for (const key of freteKeys) {
          if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
            frete = parseFloat(row[key]) || 0;
            break;
          }
        }

        const prazoKeys = ['prazo', 'prazo_entrega', 'dias', 'prazo_dias'];
        let prazo = 0;
        for (const key of prazoKeys) {
          if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
            prazo = parseFloat(row[key]) || 0;
            break;
          }
        }

        const transportadoraKeys = ['transportadora', 'empresa', 'nome_transportadora'];
        let transportadora = 'Não informado';
        for (const key of transportadoraKeys) {
          if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
            transportadora = row[key].toString().trim();
            break;
          }
        }

        return {
          cep,
          uf,
          transportadora,
          frete,
          prazo,
        };
      }).filter((r: any) => r.cep && r.uf);

      // Inserir em lotes
      const batchSize = 1000;
      for (let i = 0; i < freteRecords.length; i += batchSize) {
        const batch = freteRecords.slice(i, i + batchSize);
        const { error: dbError } = await supabase
          .from('fretes')
          .insert(batch);

        if (dbError) {
          throw new Error(`Erro ao inserir dados: ${dbError.message}`);
        }

        rowsInserted += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        filename: parquetFilename,
        storagePath: uploadData.path,
        rowsInserted,
        originalSize: file.size,
        parquetSize: parquetBuffer.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Passo 5: Atualizar Frontend

Atualize `src/services/uploadService.ts`:

```typescript
processFile: async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<ProcessResult> => {
  onProgress?.(10);

  // Obter token de autenticação
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Não autenticado');
  }

  // Criar FormData
  const formData = new FormData();
  formData.append('file', file);

  // Chamar Edge Function
  const { data: { project_url } } = await supabase.rpc('get_project_url');
  const functionUrl = `${project_url}/functions/v1/convert-excel-to-parquet`;

  onProgress?.(30);

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao processar arquivo');
  }

  onProgress?.(80);

  const result = await response.json();

  onProgress?.(100);

  return {
    id: Date.now().toString(),
    filename: file.name,
    originalSize: result.originalSize,
    parquetSize: result.parquetSize,
    rows: result.rowsInserted,
    storagePath: result.storagePath,
  };
},
```

### Passo 6: Fazer Deploy

```bash
supabase functions deploy convert-excel-to-parquet
```

---

## 📊 Comparação das Opções

| Recurso | Frontend (Atual) | Edge Functions | Backend Node.js |
|---------|------------------|----------------|-----------------|
| Complexidade | ⭐ Baixa | ⭐⭐ Média | ⭐⭐⭐ Alta |
| Custo | ✅ Grátis | ✅✅ Baixo | ⚠️ Médio |
| Performance | ⚠️ Limitada | ✅ Boa | ✅✅ Excelente |
| Escalabilidade | ❌ Limitada | ✅ Automática | ✅ Boa |
| Manutenção | ✅ Baixa | ✅✅ Muito Baixa | ⚠️ Média |
| Parquet Real | ❌ Não | ✅ Sim | ✅✅ Sim |
| Integração Supabase | ✅ Fácil | ✅✅ Nativa | ⚠️ Via API |

---

## 🎯 Conclusão

**Para este projeto, recomendo: Supabase Edge Functions**

1. ✅ Já usa Supabase
2. ✅ Conversão real de Parquet
3. ✅ Integração nativa
4. ✅ Baixo custo
5. ✅ Fácil manutenção

**Alternativa:** Se precisar de mais controle ou processamento muito pesado, considere um backend Node.js separado.

---

## 📚 Recursos

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Runtime](https://deno.land/)
- [ParquetJS](https://github.com/ironSource/parquetjs)
- [XLSX Library](https://sheetjs.com/)



