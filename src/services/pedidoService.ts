import { supabase } from '../lib/supabase';
import type { PedidoRecord, PedidoFilters, PedidoSort, LeilaoResult } from '../types/pedido';
import { freteService } from './freteService';

// Função auxiliar para simular leilão (evita referência circular)
const simularLeilaoPedido = async (pedido: PedidoRecord): Promise<LeilaoResult> => {
  // Buscar todos os fretes disponíveis para o CEP do pedido
  const fretes = await freteService.getWithFilters(
    { cep: pedido.cep },
    { field: 'frete', order: 'asc' }
  );

  // Agrupar por transportadora e pegar o melhor (menor frete) para cada uma
  const transportadorasMap: Record<string, { frete: number; prazo: number }> = {};
  
  fretes.forEach((frete) => {
    const trans = frete.transportadora || 'Não informado';
    if (!transportadorasMap[trans] || frete.frete < transportadorasMap[trans].frete) {
      transportadorasMap[trans] = {
        frete: frete.frete,
        prazo: frete.prazo,
      };
    }
  });

  // Converter para array e identificar vencedores
  const transportadoras = Object.entries(transportadorasMap).map(([nome, dados]) => ({
    transportadora: nome,
    frete: dados.frete,
    prazo: dados.prazo,
    isMaisBarato: false,
    isMaisRapido: false,
    atende: true,
  }));

  // Encontrar menor frete e menor prazo
  const menorFrete = Math.min(...transportadoras.map(t => t.frete));
  const menorPrazo = Math.min(...transportadoras.map(t => t.prazo));

  // Marcar vencedores
  transportadoras.forEach((t) => {
    t.isMaisBarato = t.frete === menorFrete;
    t.isMaisRapido = t.prazo === menorPrazo;
  });

  const vencedorMaisBarato = transportadoras.find(t => t.isMaisBarato)?.transportadora;
  const vencedorMaisRapido = transportadoras.find(t => t.isMaisRapido)?.transportadora;

  return {
    pedido,
    transportadoras,
    vencedorMaisBarato,
    vencedorMaisRapido,
  };
};

export const pedidoService = {
  // Buscar todos os pedidos
  getAll: async (): Promise<PedidoRecord[]> => {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((record) => ({
      id: record.id,
      cep: record.cep,
      uf: record.uf,
      pedido_id: record.pedido_id,
      cliente: record.cliente,
      created_at: record.created_at,
    }));
  },

  // Buscar pedidos com filtros
  getWithFilters: async (filters?: PedidoFilters): Promise<PedidoRecord[]> => {
    let query = supabase.from('pedidos').select('*');

    if (filters) {
      if (filters.uf && filters.uf.length > 0) {
        query = query.in('uf', filters.uf);
      }
      if (filters.cep) {
        query = query.ilike('cep', `%${filters.cep}%`);
      }
      if (filters.cliente) {
        query = query.ilike('cliente', `%${filters.cliente}%`);
      }
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((record) => ({
      id: record.id,
      cep: record.cep,
      uf: record.uf,
      pedido_id: record.pedido_id,
      cliente: record.cliente,
      created_at: record.created_at,
    }));
  },

  // Simular leilão de frete para um pedido
  simularLeilao: simularLeilaoPedido,

  // Simular leilão para múltiplos pedidos
  simularLeilaoMultiplos: async (pedidos: PedidoRecord[]): Promise<LeilaoResult[]> => {
    const resultados: LeilaoResult[] = [];
    for (const pedido of pedidos) {
      const resultado = await simularLeilaoPedido(pedido);
      resultados.push(resultado);
    }
    return resultados;
  },

  // Inserir múltiplos pedidos
  insertMany: async (pedidos: PedidoRecord[]): Promise<number> => {
    if (pedidos.length === 0) return 0;

    const batchSize = 1000;
    let inserted = 0;

    for (let i = 0; i < pedidos.length; i += batchSize) {
      const batch = pedidos.slice(i, i + batchSize);

      const { error } = await supabase.from('pedidos').insert(batch);

      if (error) {
        throw new Error(`Erro ao inserir dados: ${error.message}`);
      }

      inserted += batch.length;
    }

    return inserted;
  },

  // Excluir todos os pedidos
  deleteAll: async (): Promise<boolean> => {
    const { error } = await supabase.from('pedidos').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      throw new Error(error.message);
    }

    return true;
  },

  // Excluir por UF
  deleteByUF: async (uf: string): Promise<boolean> => {
    const { error } = await supabase.from('pedidos').delete().eq('uf', uf);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  },
};

