export interface FreteRecord {
  id?: string;
  cep: string;
  uf: string;
  transportadora: string;
  frete: number;
  prazo: number;
  created_at?: string;
}

export interface FreteSummary {
  uf: string;
  qtdCeps: number;
  mediaFrete: number;
  mediaPrazo: number;
}

export interface FreteSummaryByTransportadora {
  transportadora: string;
  qtdCeps: number;
  mediaFrete: number;
  mediaPrazo: number;
  ufs: string[]; // Lista de UFs atendidas pela transportadora
}

export interface FreteFilters {
  uf?: string[];
  transportadora?: string[];
  freteMin?: number;
  freteMax?: number;
  prazoMin?: number;
  prazoMax?: number;
  cep?: string;
}

export type FreteSortField = 'frete' | 'prazo' | 'uf' | 'transportadora' | 'cep';
export type FreteSortOrder = 'asc' | 'desc';

export interface FreteSort {
  field: FreteSortField;
  order: FreteSortOrder;
}

