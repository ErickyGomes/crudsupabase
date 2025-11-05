import { supabase } from '../lib/supabase';
import type { FreteRecord, FreteSummary, FreteSummaryByTransportadora } from '../types/frete';

export const freteService = {
  // Buscar resumo por UF
  getSummary: async (): Promise<FreteSummary[]> => {
    const { data, error } = await supabase.rpc('get_frete_summary');

    if (error) {
      // Se a função não existir, calcular manualmente
      return await freteService.calculateSummaryManually();
    }

    // Mapear dados retornados pela função SQL para o formato esperado
    return (data || []).map((item: any) => ({
      uf: item.uf,
      qtdCeps: item.qtd_ceps || 0,
      mediaFrete: parseFloat(item.media_frete) || 0,
      mediaPrazo: parseFloat(item.media_prazo) || 0,
    }));
  },

  // Calcular resumo manualmente (fallback)
  calculateSummaryManually: async (): Promise<FreteSummary[]> => {
    const { data, error } = await supabase
      .from('fretes')
      .select('uf, frete, prazo');

    if (error) {
      throw new Error(error.message);
    }

    // Agrupar por UF e calcular médias
    const grouped: Record<string, { frete: number[]; prazo: number[] }> = {};

    (data || []).forEach((record) => {
      if (!grouped[record.uf]) {
        grouped[record.uf] = { frete: [], prazo: [] };
      }
      grouped[record.uf].frete.push(record.frete);
      grouped[record.uf].prazo.push(record.prazo);
    });

    return Object.keys(grouped).map((uf) => {
      const values = grouped[uf];
      const mediaFrete =
        values.frete.reduce((sum, val) => sum + val, 0) / values.frete.length;
      const mediaPrazo =
        values.prazo.reduce((sum, val) => sum + val, 0) / values.prazo.length;

      return {
        uf,
        qtdCeps: values.frete.length,
        mediaFrete,
        mediaPrazo,
      };
    });
  },

  // Buscar registros por UF
  getByUF: async (uf: string): Promise<FreteRecord[]> => {
    const { data, error } = await supabase
      .from('fretes')
      .select('*')
      .eq('uf', uf)
      .order('cep', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((record) => ({
      id: record.id,
      cep: record.cep,
      uf: record.uf,
      transportadora: record.transportadora || 'Não informado',
      frete: record.frete,
      prazo: record.prazo,
      created_at: record.created_at,
    }));
  },

  // Buscar resumo por transportadora
  getSummaryByTransportadora: async (): Promise<FreteSummaryByTransportadora[]> => {
    const { data, error } = await supabase.rpc('get_frete_summary_by_transportadora');

    if (error) {
      // Se a função não existir, calcular manualmente
      return await freteService.calculateSummaryByTransportadoraManually();
    }

    // Mapear dados retornados pela função SQL
    return (data || []).map((item: any) => ({
      transportadora: item.transportadora,
      qtdCeps: item.qtd_ceps || 0,
      mediaFrete: parseFloat(item.media_frete) || 0,
      mediaPrazo: parseFloat(item.media_prazo) || 0,
      ufs: item.ufs || [],
    }));
  },

  // Calcular resumo por transportadora manualmente (fallback)
  calculateSummaryByTransportadoraManually: async (): Promise<FreteSummaryByTransportadora[]> => {
    const { data, error } = await supabase
      .from('fretes')
      .select('transportadora, uf, frete, prazo');

    if (error) {
      throw new Error(error.message);
    }

    // Agrupar por transportadora
    const grouped: Record<string, { frete: number[]; prazo: number[]; ufs: Set<string> }> = {};

    (data || []).forEach((record) => {
      const transportadora = record.transportadora || 'Não informado';
      if (!grouped[transportadora]) {
        grouped[transportadora] = { frete: [], prazo: [], ufs: new Set() };
      }
      grouped[transportadora].frete.push(record.frete);
      grouped[transportadora].prazo.push(record.prazo);
      grouped[transportadora].ufs.add(record.uf);
    });

    return Object.keys(grouped).map((transportadora) => {
      const values = grouped[transportadora];
      const mediaFrete =
        values.frete.reduce((sum, val) => sum + val, 0) / values.frete.length;
      const mediaPrazo =
        values.prazo.reduce((sum, val) => sum + val, 0) / values.prazo.length;

      return {
        transportadora,
        qtdCeps: values.frete.length,
        mediaFrete,
        mediaPrazo,
        ufs: Array.from(values.ufs).sort(),
      };
    });
  },

  // Buscar registros por transportadora
  getByTransportadora: async (transportadora: string): Promise<FreteRecord[]> => {
    const { data, error } = await supabase
      .from('fretes')
      .select('*')
      .eq('transportadora', transportadora)
      .order('uf', { ascending: true })
      .order('cep', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((record) => ({
      id: record.id,
      cep: record.cep,
      uf: record.uf,
      transportadora: record.transportadora || 'Não informado',
      frete: record.frete,
      prazo: record.prazo,
      created_at: record.created_at,
    }));
  },

  // Buscar registros por transportadora e UF
  getByTransportadoraAndUF: async (transportadora: string, uf: string): Promise<FreteRecord[]> => {
    const { data, error } = await supabase
      .from('fretes')
      .select('*')
      .eq('transportadora', transportadora)
      .eq('uf', uf)
      .order('cep', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((record) => ({
      id: record.id,
      cep: record.cep,
      uf: record.uf,
      transportadora: record.transportadora || 'Não informado',
      frete: record.frete,
      prazo: record.prazo,
      created_at: record.created_at,
    }));
  },

  // Excluir por UF
  deleteByUF: async (uf: string): Promise<boolean> => {
    const { error } = await supabase.from('fretes').delete().eq('uf', uf);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  },

  // Excluir por transportadora
  deleteByTransportadora: async (transportadora: string): Promise<boolean> => {
    const { error } = await supabase.from('fretes').delete().eq('transportadora', transportadora);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  },

  // Inserir múltiplos registros (usado pelo upload)
  insertMany: async (records: FreteRecord[]): Promise<number> => {
    if (records.length === 0) return 0;

    const batchSize = 1000;
    let inserted = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      const { error } = await supabase.from('fretes').insert(batch);

      if (error) {
        throw new Error(`Erro ao inserir dados: ${error.message}`);
      }

      inserted += batch.length;
    }

    return inserted;
  },
};

