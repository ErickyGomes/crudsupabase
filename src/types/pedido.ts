export interface PedidoRecord {
  id?: string;
  cep: string;
  uf: string;
  pedido_id?: string;
  cliente?: string;
  created_at?: string;
}

export interface PedidoComFrete extends PedidoRecord {
  transportadora: string;
  frete: number;
  prazo: number;
  isMaisBarato: boolean;
  isMaisRapido: boolean;
  atende: boolean;
}

export interface PedidoFilters {
  uf?: string[];
  transportadora?: string[];
  freteMin?: number;
  freteMax?: number;
  prazoMin?: number;
  prazoMax?: number;
  cep?: string;
  cliente?: string;
}

export type PedidoSortField = 'frete' | 'prazo' | 'uf' | 'transportadora' | 'cep' | 'cliente';
export type PedidoSortOrder = 'asc' | 'desc';

export interface PedidoSort {
  field: PedidoSortField;
  order: PedidoSortOrder;
}

export interface LeilaoResult {
  pedido: PedidoRecord;
  transportadoras: {
    transportadora: string;
    frete: number;
    prazo: number;
    isMaisBarato: boolean;
    isMaisRapido: boolean;
    atende: boolean;
  }[];
  vencedorMaisBarato?: string;
  vencedorMaisRapido?: string;
}

