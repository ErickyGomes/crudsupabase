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

