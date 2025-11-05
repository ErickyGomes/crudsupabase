# Guia: Configuração de Credenciais - .env vs Supabase CLI

## 🤔 Dúvida Comum

**Pergunta:** Se eu executar `npx supabase db push`, ele vai usar as credenciais do `.env`?

**Resposta:** **NÃO!** São duas coisas diferentes:

---

## 📋 Duas Configurações Diferentes

### 1. **Frontend (React)** - Usa `.env`
- **Arquivo:** `.env` na raiz do projeto
- **Variáveis:** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- **Uso:** Aplicação React se conecta ao Supabase
- **Onde:** `src/lib/supabase.ts`

### 2. **Supabase CLI** - Usa autenticação própria
- **Comando:** `npx supabase db push`
- **Autenticação:** Via `supabase login` e `supabase link`
- **Uso:** Enviar migrações SQL para o banco
- **Não usa:** Credenciais do `.env`

---

## 🔧 Como Configurar Corretamente

### Passo 1: Configurar Frontend (.env)

**1. Criar arquivo `.env` na raiz do projeto:**

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

**2. O código já está configurado em `src/lib/supabase.ts`:**

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

**3. Onde conseguir as credenciais:**
- Acesse seu projeto no Supabase
- Vá em **Settings** → **API**
- Copie **Project URL** e **anon public key**

---

### Passo 2: Configurar Supabase CLI

**Opção A: Usar projeto remoto (Recomendado)**

1. **Fazer login no Supabase:**
```bash
npx supabase login
```
- Isso abrirá o navegador para autenticar
- Você precisa estar logado no Supabase no navegador

2. **Linkar com seu projeto remoto:**
```bash
npx supabase link --project-ref seu-project-ref
```
- O `project-ref` você encontra em: Supabase Dashboard → Settings → General → Reference ID
- Ou pode ser algo como: `abcdefghijklmnop`

3. **Agora pode executar migrações:**
```bash
npx supabase db push
```
- Isso enviará as migrações de `supabase/migrations/` para o banco remoto

**Opção B: Usar SQL Editor (Mais Simples)**

Se não quiser configurar o CLI, você pode:

1. Abrir o **SQL Editor** no painel do Supabase
2. Copiar e colar o conteúdo do arquivo `supabase/migrations/001_process_storage_file.sql`
3. Executar diretamente

**Esta é a forma mais simples e não precisa de configuração!**

---

## 🎯 Qual Usar?

### Para Migrações SQL:
- ✅ **SQL Editor** (mais simples) - Basta copiar e colar
- ⚙️ **Supabase CLI** (mais profissional) - Para projetos maiores

### Para Frontend:
- ✅ **Sempre usar `.env`** - Para conectar a aplicação React ao Supabase

---

## 📝 Exemplo Completo

### Cenário 1: Executar Migração SQL

**Opção Simples (Recomendada):**
1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie o conteúdo de `supabase/migrations/001_process_storage_file.sql`
4. Cole e execute
5. ✅ Pronto!

**Opção CLI:**
1. Execute: `npx supabase login`
2. Execute: `npx supabase link --project-ref seu-ref`
3. Execute: `npx supabase db push`
4. ✅ Pronto!

### Cenário 2: Frontend Usar Supabase

**Já está configurado!**
1. Crie arquivo `.env` com suas credenciais
2. O código em `src/lib/supabase.ts` já lê do `.env`
3. Execute `yarn dev` ou `npm run dev`
4. ✅ Funciona automaticamente!

---

## 🔍 Verificando se Está Funcionando

### Verificar Frontend:
```typescript
// No console do navegador (F12)
console.log(import.meta.env.VITE_SUPABASE_URL); // Deve mostrar sua URL
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY); // Deve mostrar sua chave
```

### Verificar CLI:
```bash
npx supabase projects list
# Deve listar seus projetos se estiver logado
```

---

## ⚠️ Importante

### Segurança:

1. **NUNCA commite o `.env` no Git:**
   - Adicione `.env` no `.gitignore`
   - Crie um `.env.example` com valores de exemplo

2. **`.env.example` (commitar este):**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

3. **`.gitignore` (deve ter):**
```
.env
.env.local
.env.production
```

---

## 🐛 Solução de Problemas

### Erro: "Cannot find module" ao executar `npx supabase`

**Solução:** Instale o pacote:
```bash
npm install supabase --save-dev
```

### Erro: "Not logged in" ao executar `npx supabase db push`

**Solução:** Faça login primeiro:
```bash
npx supabase login
```

### Erro: "Project not linked" ao executar `npx supabase db push`

**Solução:** Linke o projeto:
```bash
npx supabase link --project-ref seu-project-ref
```

### Frontend não conecta ao Supabase

**Verifique:**
1. Arquivo `.env` existe na raiz do projeto?
2. Variáveis começam com `VITE_`?
3. Reiniciou o servidor após criar `.env`? (Vite precisa reiniciar)
4. Credenciais estão corretas?

---

## 📚 Resumo

| O que | Como Configurar | Quando Usar |
|-------|----------------|-------------|
| **Frontend** | Criar `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` | Aplicação React se conectar ao Supabase |
| **Migrações SQL** | Usar SQL Editor OU `supabase login` + `supabase link` | Executar migrações no banco |

**Recomendação:**
- ✅ Para migrações: Use **SQL Editor** (mais simples)
- ✅ Para frontend: Use **`.env`** (já configurado no código)

---

## ✅ Checklist Rápido

- [ ] Criei arquivo `.env` na raiz do projeto
- [ ] Adicionei `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env`
- [ ] Copiei credenciais do Supabase Dashboard (Settings → API)
- [ ] Adicionei `.env` no `.gitignore`
- [ ] Para migrações: Executei SQL no SQL Editor OU configurei CLI
- [ ] Testei se frontend conecta (verifique console do navegador)

---

**Pronto!** Agora você entende a diferença! 🎉



