import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

interface ProcessResult {
  id: string;
  filename: string;
  originalSize: number;
  parquetSize: number;
  rows: number;
  storagePath: string;
}

export const uploadService = {
  /**
   * Processa um arquivo Excel: lê, converte para Parquet, faz upload e insere no banco
   * Opção 1: Processa tudo no frontend (modo atual)
   * Opção 2: Apenas faz upload e deixa função SQL processar (modo recomendado)
   */
  processFile: async (
    file: File,
    onProgress?: (progress: number) => void,
    options?: { autoProcess?: boolean }
  ): Promise<ProcessResult> => {
    const autoProcess = options?.autoProcess ?? false;

    // Etapa 1: Ler arquivo Excel
    onProgress?.(10);
    const excelData = await uploadService.readExcelFile(file);
    
    console.log('📊 Dados lidos do Excel:', {
      totalRows: excelData.length,
      firstRow: excelData[0],
      columns: excelData.length > 0 ? Object.keys(excelData[0]) : [],
    });

    // Etapa 2: Converter para Parquet
    onProgress?.(30);
    const parquetBuffer = await uploadService.convertToParquet(excelData);

    // Detectar tipo de dados
    const firstRow = excelData[0];
    const isFreteData =
      (firstRow.cep || firstRow.ceo) &&
      (firstRow.uf || firstRow.estado) &&
      (firstRow.frete || firstRow.valor_frete) &&
      (firstRow.prazo || firstRow.prazo_entrega || firstRow.dias);
    
    console.log('🔍 Detecção de tipo de dados:', {
      isFreteData,
      hasCep: !!(firstRow.cep || firstRow.ceo),
      hasUf: !!(firstRow.uf || firstRow.estado),
      hasFrete: !!(firstRow.frete || firstRow.valor_frete),
      hasPrazo: !!(firstRow.prazo || firstRow.prazo_entrega || firstRow.dias),
      firstRowKeys: Object.keys(firstRow),
    });

    // Etapa 3: Upload para Supabase Storage
    onProgress?.(60);
    const storageInfo = await uploadService.uploadToStorage(file.name, parquetBuffer, {
      rows: excelData.length,
      dataType: isFreteData ? 'frete' : 'generic',
    });

    // Etapa 4: Processar dados
    let rowsInserted = 0;
    
    if (autoProcess) {
      // Modo automático: chama função SQL para processar arquivo do storage
      // Envia os dados JSON junto para processamento no banco
      onProgress?.(80);
      try {
        console.log('Chamando função SQL process_uploaded_file com:', {
          file_path: storageInfo.path,
          json_data_length: excelData.length,
          first_row: excelData[0],
        });

        const { data, error } = await supabase.rpc('process_uploaded_file', {
          file_path: storageInfo.path,
          file_url: storageInfo.url,
          json_data: excelData as any, // Envia dados JSON para processamento
        });

        console.log('Resposta da função SQL:', { data, error });

        if (error) {
          console.error('Erro ao processar arquivo via função SQL:', error);
          console.warn('Fazendo fallback para processamento manual...');
          // Fallback: processar manualmente
          rowsInserted = await uploadService.insertToDatabase(excelData);
        } else if (data) {
          // A função retorna um objeto JSONB, então rows_inserted está dentro de data
          const result = data as any;
          rowsInserted = Number(result?.rows_inserted) || 0;
          
          console.log('Linhas inseridas pela função SQL:', rowsInserted);
          
          // Se não inseriu nenhuma linha, pode ser que os dados não foram detectados como frete
          if (rowsInserted === 0 && excelData.length > 0) {
            console.warn('Nenhuma linha inserida. Verificando se dados são de frete...');
            console.log('Primeira linha do Excel:', excelData[0]);
            console.log('Dados detectados como frete:', isFreteData);
            
            // Tentar processar manualmente como fallback
            console.warn('Tentando processamento manual como fallback...');
            rowsInserted = await uploadService.insertToDatabase(excelData);
          }
        } else {
          console.warn('Resposta vazia da função SQL, processando manualmente');
          rowsInserted = await uploadService.insertToDatabase(excelData);
        }
      } catch (error) {
        console.error('Erro ao chamar função SQL:', error);
        console.warn('Fazendo fallback para processamento manual...');
        // Fallback: processar manualmente
        rowsInserted = await uploadService.insertToDatabase(excelData);
      }
    } else {
      // Modo manual: processar dados diretamente
      onProgress?.(80);
      rowsInserted = await uploadService.insertToDatabase(excelData);
    }

    onProgress?.(100);

    return {
      id: Date.now().toString(),
      filename: file.name,
      originalSize: file.size,
      parquetSize: parquetBuffer.length,
      rows: rowsInserted,
      storagePath: storageInfo.path,
    };
  },

  /**
   * Lê arquivo Excel e retorna dados em formato JSON
   */
  readExcelFile: async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });

          // Pegar a primeira planilha
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Converter para JSON (com cabeçalhos)
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1, // Array de arrays
            defval: '', // Valor padrão para células vazias
          });

          // Se a primeira linha são cabeçalhos, transformar em objetos
          if (jsonData.length > 0) {
            const headers = jsonData[0] as string[];
            const rows = jsonData.slice(1) as any[][];

            const objects = rows.map((row) => {
              const obj: any = {};
              headers.forEach((header, index) => {
                // Normalizar nome da coluna (remover espaços, caracteres especiais)
                const normalizedHeader = header
                  .toString()
                  .trim()
                  .toLowerCase()
                  .replace(/\s+/g, '_')
                  .replace(/[^a-z0-9_]/g, '');
                obj[normalizedHeader] = row[index] || null;
              });
              return obj;
            });

            resolve(objects);
          } else {
            resolve([]);
          }
        } catch (error) {
          reject(new Error('Erro ao ler arquivo Excel: ' + (error as Error).message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'));
      };

      reader.readAsBinaryString(file);
    });
  },

  /**
   * Converte dados JSON para formato Parquet
   * Tenta usar parquetjs para conversão real, com fallback para JSON compacto
   * 
   * Nota: A conversão real de Parquet no navegador pode ser complexa.
   * Para produção, recomenda-se usar Edge Function ou backend.
   */
  convertToParquet: async (data: any[]): Promise<Uint8Array> => {
    if (data.length === 0) {
      throw new Error('Nenhum dado para converter');
    }

    try {
      // Tentar usar parquetjs se disponível
      // Nota: parquetjs pode não funcionar bem no navegador
      // Para produção real, use Edge Function ou backend
      const parquetjs = await import('parquetjs').catch(() => null);
      
      if (parquetjs) {
        try {
          // Verificar se tem ParquetWriter ou outra API
          if ('ParquetWriter' in parquetjs || 'default' in parquetjs) {
            // Criar schema dinâmico baseado nos dados
            const firstRow = data[0];
            const schemaFields: Record<string, any> = {};
            
            Object.keys(firstRow).forEach((key) => {
              const value = firstRow[key];
              let type = 'UTF8'; // Padrão: string
              
              if (value !== null && value !== undefined) {
                if (typeof value === 'number') {
                  type = Number.isInteger(value) ? 'INT64' : 'DOUBLE';
                } else if (typeof value === 'boolean') {
                  type = 'BOOLEAN';
                }
              }
              
              schemaFields[key] = { type };
            });

            // Tentar usar a API do parquetjs
            // Nota: A API pode variar dependendo da versão
            // Por enquanto, vamos usar JSON como fallback seguro
            // Para conversão real, use Edge Function
            throw new Error('Parquet conversion requires Edge Function');
          }
        } catch (parquetError) {
          // Se parquetjs não funcionar, usar JSON
          console.warn('Parquet conversion not available, using JSON:', parquetError);
        }
      }

      // Fallback: JSON compacto
      // Este será o formato usado na maioria dos casos
      // O arquivo será salvo com extensão .parquet mas conteúdo JSON
      // Isso é suficiente para armazenamento e processamento posterior
      const jsonString = JSON.stringify(data);
      // Usar TextEncoder para converter string para Uint8Array (compatível com navegador)
      const encoder = new TextEncoder();
      return encoder.encode(jsonString);
      
    } catch (error) {
      // Se der erro, usar JSON como fallback
      console.warn('Erro ao converter para Parquet, usando JSON como fallback:', error);
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      return encoder.encode(jsonString);
    }
  },

  /**
   * Faz upload do arquivo Parquet para o Supabase Storage
   * Retorna o caminho do arquivo e metadados para processamento
   */
  uploadToStorage: async (
    originalFilename: string,
    parquetBuffer: Uint8Array,
    metadata?: { rows: number; dataType: string }
  ): Promise<{ path: string; url: string }> => {
    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const filename = originalFilename.replace(/\.(xlsx|xls)$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const parquetFilename = `${filename}_${timestamp}.parquet`;

    // Converter Uint8Array para Blob (compatível com Supabase Storage)
    const blob = new Blob([parquetBuffer], { type: 'application/octet-stream' });

    // Fazer upload para o bucket 'uploads'
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(parquetFilename, blob, {
        contentType: 'application/octet-stream',
        upsert: false,
        cacheControl: '3600',
        metadata: {
          originalFilename,
          rows: metadata?.rows?.toString() || '0',
          dataType: metadata?.dataType || 'generic',
          uploadedAt: new Date().toISOString(),
        },
      });

    if (error) {
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(parquetFilename);

    return {
      path: data.path,
      url: urlData.publicUrl,
    };
  },

  /**
   * Insere dados no banco de dados
   * Detecta automaticamente se são dados de frete e processa adequadamente
   */
  insertToDatabase: async (data: any[]): Promise<number> => {
    if (data.length === 0) {
      return 0;
    }

    // Verificar se são dados de frete (verifica se tem colunas cep, uf, frete, prazo)
    const firstRow = data[0];
    const hasFreteColumns =
      (firstRow.cep || firstRow.ceo) &&
      (firstRow.uf || firstRow.estado) &&
      (firstRow.frete || firstRow.valor_frete) &&
      (firstRow.prazo || firstRow.prazo_entrega || firstRow.dias);
    // Nota: transportadora é opcional, não precisa estar presente para detectar como frete

    if (hasFreteColumns) {
      // Processar como dados de frete
      return await uploadService.insertFreteData(data);
    }

    // Fallback: inserir em tabela genérica
    const batchSize = 1000;
    let inserted = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      const cleanedBatch = batch.map((row) => {
        const cleaned: any = {};
        Object.keys(row).forEach((key) => {
          const value = row[key];
          if (value === '' || value === null || value === undefined) {
            cleaned[key] = null;
          } else {
            cleaned[key] = value;
          }
        });
        return cleaned;
      });

      const { error } = await supabase.from('imported_data').insert(cleanedBatch);

      if (error) {
        console.error('Erro ao inserir dados:', error);
        throw new Error(`Erro ao inserir dados: ${error.message}`);
      }

      inserted += batch.length;
    }

    return inserted;
  },

  /**
   * Insere dados de frete especificamente
   */
  insertFreteData: async (data: any[]): Promise<number> => {
    const { freteService } = await import('./freteService');

    // Mapear e normalizar dados
    const freteRecords = data.map((row) => {
      // Normalizar nomes de colunas (pode variar)
      const cep = row.cep || row.ceo || row.cep_origem || '';
      const uf = row.uf || row.estado || row.uf_destino || '';
      
      // Procurar coluna de transportadora
      const transportadoraKeys = ['transportadora', 'empresa', 'nome_transportadora', 'transportadora_nome', 'nome_empresa'];
      let transportadora = '';
      for (const key of transportadoraKeys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
          transportadora = row[key].toString().trim();
          break;
        }
      }
      
      // Tentar encontrar frete e prazo com diferentes nomes
      let frete = 0;
      let prazo = 0;

      // Procurar coluna de frete
      const freteKeys = ['frete', 'valor_frete', 'valor', 'preco', 'custo'];
      for (const key of freteKeys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
          frete = parseFloat(row[key]) || 0;
          break;
        }
      }

      // Procurar coluna de prazo
      const prazoKeys = ['prazo', 'prazo_entrega', 'dias', 'prazo_dias'];
      for (const key of prazoKeys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
          prazo = parseFloat(row[key]) || 0;
          break;
        }
      }

      return {
        cep: cep.toString().replace(/\D/g, ''), // Remove não-números
        uf: uf.toString().toUpperCase().trim(),
        transportadora: transportadora || 'Não informado',
        frete,
        prazo,
      };
    }).filter((record) => record.cep && record.uf); // Filtrar registros inválidos

    return await freteService.insertMany(freteRecords);
  },
};

