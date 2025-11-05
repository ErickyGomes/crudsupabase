-- =====================================================
-- Correção: Melhorar função process_json_data
-- para garantir que dados sejam inseridos corretamente
-- =====================================================

CREATE OR REPLACE FUNCTION process_json_data(
  json_data JSONB,
  data_type TEXT DEFAULT 'auto'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  data_array JSONB[];
  data_row JSONB;
  rows_inserted_count INTEGER := 0;
  rows_processed_count INTEGER := 0;
  normalized_record RECORD;
  is_frete_data BOOLEAN := FALSE;
  first_row JSONB;
  existing_count INTEGER := 0;
BEGIN
  -- Converter JSONB para array se necessário
  IF jsonb_typeof(json_data) = 'array' THEN
    data_array := ARRAY(SELECT jsonb_array_elements(json_data));
  ELSE
    data_array := ARRAY[json_data];
  END IF;

  IF array_length(data_array, 1) IS NULL OR array_length(data_array, 1) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nenhum dado para processar',
      'rows_inserted', 0
    );
  END IF;

  first_row := data_array[1];

  -- Detectar tipo de dados (melhorar detecção)
  IF data_type = 'auto' THEN
    -- Verificar se tem pelo menos CEP, UF e Frete
    is_frete_data := (
      (first_row ? 'cep' OR first_row ? 'ceo' OR first_row ? 'cep_origem')
      AND (first_row ? 'uf' OR first_row ? 'estado' OR first_row ? 'uf_destino')
      AND (first_row ? 'frete' OR first_row ? 'valor_frete' OR first_row ? 'valor' OR first_row ? 'preco' OR first_row ? 'custo')
    );
    -- Prazo pode ser opcional para detecção
  ELSE
    is_frete_data := data_type = 'frete';
  END IF;

  -- Processar dados de frete
  IF is_frete_data THEN
    FOR data_row IN SELECT * FROM jsonb_array_elements(json_data)
    LOOP
      rows_processed_count := rows_processed_count + 1;
      
      -- Normalizar e inserir dados de frete
      FOR normalized_record IN 
        SELECT * FROM normalize_frete_data(data_row)
      LOOP
        BEGIN
          -- Verificar se já existe (CEP + UF + Transportadora como chave única lógica)
          existing_count := 0;
          SELECT COUNT(*) INTO existing_count
          FROM fretes
          WHERE cep = normalized_record.cep
            AND uf = normalized_record.uf
            AND transportadora = normalized_record.transportadora;
          
          -- Se não existe, inserir
          IF existing_count = 0 THEN
            INSERT INTO fretes (
              cep,
              uf,
              transportadora,
              frete,
              prazo
            ) VALUES (
              normalized_record.cep,
              normalized_record.uf,
              normalized_record.transportadora,
              normalized_record.frete,
              normalized_record.prazo
            );
            
            rows_inserted_count := rows_inserted_count + 1;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          -- Log erro mas continue processando
          RAISE WARNING 'Erro ao inserir registro: %', SQLERRM;
        END;
      END LOOP;
    END LOOP;
  ELSE
    -- Processar dados genéricos
    -- Por enquanto, apenas contar (não inserir em tabela genérica)
    rows_inserted_count := 0;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'rows_inserted', rows_inserted_count,
    'rows_processed', rows_processed_count,
    'data_type', CASE WHEN is_frete_data THEN 'frete' ELSE 'generic' END,
    'is_frete_data', is_frete_data
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'rows_inserted', 0
  );
END;
$$;

-- Dar permissões
GRANT EXECUTE ON FUNCTION process_json_data(JSONB, TEXT) TO authenticated;

COMMENT ON FUNCTION process_json_data IS 'Processa dados JSON e insere no banco de dados (versão melhorada)';

