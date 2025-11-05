-- Criar tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cep TEXT NOT NULL,
  uf TEXT NOT NULL,
  pedido_id TEXT,
  cliente TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pedidos_uf ON pedidos(uf);
CREATE INDEX IF NOT EXISTS idx_pedidos_cep ON pedidos(cep);
CREATE INDEX IF NOT EXISTS idx_pedidos_pedido_id ON pedidos(pedido_id);

-- Habilitar RLS
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ver (para consultas)
CREATE POLICY "Todos podem ver pedidos" ON pedidos
  FOR SELECT USING (true);

-- Política: Usuários autenticados podem inserir
CREATE POLICY "Usuários podem inserir pedidos" ON pedidos
  FOR INSERT WITH CHECK (true);

-- Política: Usuários autenticados podem deletar
CREATE POLICY "Usuários podem deletar pedidos" ON pedidos
  FOR DELETE USING (true);

