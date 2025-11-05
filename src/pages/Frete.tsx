import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Button,
  Table,
  Modal,
  Stack,
  Group,
  ActionIcon,
  Badge,
  Paper,
  Text,
  Card,
  Grid,
  Tabs,
  TextInput,
  NumberInput,
  Select,
  MultiSelect,
  Collapse,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEye, IconTrash, IconUpload, IconFilter, IconChevronDown, IconChevronUp, IconSortAscending, IconSortDescending, IconCurrencyDollar, IconClock, IconCheck, IconX, IconFileDownload } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { freteService } from '../services/freteService';
import type { FreteRecord, FreteSummary, FreteSummaryByTransportadora, FreteFilters, FreteSort } from '../types/frete';
import * as XLSX from 'xlsx';

// Funções auxiliares para formatação
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDecimal = (value: number, decimals: number = 1) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export default function Frete() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>('filtros');
  const [summary, setSummary] = useState<FreteSummary[]>([]);
  const [summaryTransportadora, setSummaryTransportadora] = useState<FreteSummaryByTransportadora[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModalOpened, setDetailModalOpened] = useState(false);
  const [selectedUF, setSelectedUF] = useState<string | null>(null);
  const [selectedTransportadora, setSelectedTransportadora] = useState<string | null>(null);
  const [detailRecords, setDetailRecords] = useState<FreteRecord[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [ufToDelete, setUfToDelete] = useState<string | null>(null);
  const [transportadoraToDelete, setTransportadoraToDelete] = useState<string | null>(null);
  
  // Estados para filtros e ordenação
  const [filtersOpened, { toggle: toggleFilters }] = useDisclosure(false);
  const [filteredRecords, setFilteredRecords] = useState<FreteRecord[]>([]);
  const [filteredLoading, setFilteredLoading] = useState(false);
  const [availableUFs, setAvailableUFs] = useState<string[]>([]);
  const [availableTransportadoras, setAvailableTransportadoras] = useState<string[]>([]);
  
  // Estados dos filtros
  const [filters, setFilters] = useState<FreteFilters>({});
  const [sort, setSort] = useState<FreteSort>({ field: 'frete', order: 'asc' });

  const loadSummary = async () => {
    setLoading(true);
    try {
      const [dataUF, dataTransportadora] = await Promise.all([
        freteService.getSummary(),
        freteService.getSummaryByTransportadora(),
      ]);
      setSummary(dataUF);
      setSummaryTransportadora(dataTransportadora);
    } catch (error: any) {
      notifications.show({
        title: 'Erro',
        message: error.message || 'Erro ao carregar dados',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const [ufs, transportadoras] = await Promise.all([
        freteService.getUniqueUFs(),
        freteService.getUniqueTransportadoras(),
      ]);
      setAvailableUFs(ufs);
      setAvailableTransportadoras(transportadoras);
    } catch (error: any) {
      console.error('Erro ao carregar opções de filtro:', error);
    }
  };

  const loadFilteredData = useCallback(async () => {
    setFilteredLoading(true);
    try {
      const data = await freteService.getWithFilters(filters, sort);
      setFilteredRecords(data);
    } catch (error: any) {
      notifications.show({
        title: 'Erro',
        message: error.message || 'Erro ao carregar dados filtrados',
        color: 'red',
      });
    } finally {
      setFilteredLoading(false);
    }
  }, [filters, sort]);

  useEffect(() => {
    if (activeTab === 'filtros') {
      loadFilteredData();
    }
  }, [filters, sort, activeTab, loadFilteredData]);

  const handleViewDetails = async (uf: string, transportadora?: string) => {
    setSelectedUF(uf);
    setSelectedTransportadora(transportadora || null);
    setDetailModalOpened(true);
    setDetailLoading(true);

    try {
      let records: FreteRecord[];
      if (transportadora) {
        records = await freteService.getByTransportadoraAndUF(transportadora, uf);
      } else {
        records = await freteService.getByUF(uf);
      }
      setDetailRecords(records);
    } catch (error: any) {
      notifications.show({
        title: 'Erro',
        message: error.message || 'Erro ao carregar detalhes',
        color: 'red',
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewDetailsTransportadora = async (transportadora: string) => {
    setSelectedUF(null);
    setSelectedTransportadora(transportadora);
    setDetailModalOpened(true);
    setDetailLoading(true);

    try {
      const records = await freteService.getByTransportadora(transportadora);
      setDetailRecords(records);
    } catch (error: any) {
      notifications.show({
        title: 'Erro',
        message: error.message || 'Erro ao carregar detalhes',
        color: 'red',
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteUF = (uf: string) => {
    setUfToDelete(uf);
    setTransportadoraToDelete(null);
    setDeleteModalOpened(true);
  };

  const handleDeleteTransportadora = (transportadora: string) => {
    setTransportadoraToDelete(transportadora);
    setUfToDelete(null);
    setDeleteModalOpened(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (ufToDelete) {
        await freteService.deleteByUF(ufToDelete);
        notifications.show({
          title: 'Sucesso',
          message: `Dados da UF ${ufToDelete} excluídos com sucesso!`,
          color: 'green',
        });
      } else if (transportadoraToDelete) {
        await freteService.deleteByTransportadora(transportadoraToDelete);
        notifications.show({
          title: 'Sucesso',
          message: `Dados da transportadora "${transportadoraToDelete}" excluídos com sucesso!`,
          color: 'green',
        });
      }
      setDeleteModalOpened(false);
      setUfToDelete(null);
      setTransportadoraToDelete(null);
      loadSummary();
    } catch (error: any) {
      notifications.show({
        title: 'Erro',
        message: error.message || 'Erro ao excluir dados',
        color: 'red',
      });
    }
  };

  // Calcular totais gerais
  const totalCEPs = summary.reduce((sum, item) => sum + item.qtdCeps, 0);
  const avgFrete = summary.length > 0
    ? summary.reduce((sum, item) => sum + item.mediaFrete, 0) / summary.length
    : 0;
  const avgPrazo = summary.length > 0
    ? summary.reduce((sum, item) => sum + item.mediaPrazo, 0) / summary.length
    : 0;

  // Calcular estatísticas dos dados filtrados (recalcula quando filteredRecords muda)
  const filteredStats = useMemo(() => {
    if (filteredRecords.length === 0) return null;

    const totalFilteredCEPs = filteredRecords.length;
    const avgFilteredFrete = filteredRecords.reduce((sum, r) => sum + r.frete, 0) / totalFilteredCEPs;
    const avgFilteredPrazo = filteredRecords.reduce((sum, r) => sum + r.prazo, 0) / totalFilteredCEPs;

    // Agrupar por transportadora para encontrar a mais rápida e mais barata
    const transportadoraStats: Record<string, { frete: number[]; prazo: number[] }> = {};
    filteredRecords.forEach((record) => {
      const trans = record.transportadora || 'Não informado';
      if (!transportadoraStats[trans]) {
        transportadoraStats[trans] = { frete: [], prazo: [] };
      }
      transportadoraStats[trans].frete.push(record.frete);
      transportadoraStats[trans].prazo.push(record.prazo);
    });

    // Calcular médias por transportadora
    const transportadoraMedias = Object.entries(transportadoraStats).map(([nome, stats]) => ({
      nome,
      mediaFrete: stats.frete.reduce((sum, val) => sum + val, 0) / stats.frete.length,
      mediaPrazo: stats.prazo.reduce((sum, val) => sum + val, 0) / stats.prazo.length,
      qtd: stats.frete.length,
    }));

    // Encontrar transportadora mais barata (menor média de frete)
    const maisBarata = transportadoraMedias.length > 0
      ? transportadoraMedias.reduce((min, curr) => 
          curr.mediaFrete < min.mediaFrete ? curr : min
        )
      : null;

    // Encontrar transportadora mais rápida (menor média de prazo)
    const maisRapida = transportadoraMedias.length > 0
      ? transportadoraMedias.reduce((min, curr) => 
          curr.mediaPrazo < min.mediaPrazo ? curr : min
        )
      : null;

    return {
      totalCEPs: totalFilteredCEPs,
      avgFrete: avgFilteredFrete,
      avgPrazo: avgFilteredPrazo,
      maisBarata,
      maisRapida,
    };
  }, [filteredRecords]);

  // Usar dados filtrados se estiver na aba de filtros e houver dados, senão usar dados gerais
  const displayStats = activeTab === 'filtros' && filteredStats
    ? filteredStats
    : {
        totalCEPs,
        avgFrete,
        avgPrazo,
        maisBarata: null,
        maisRapida: null,
      };

  // Calcular abrangência por transportadora (quantos CEPs únicos cada uma atende)
  const abrangenciaPorTransportadora = useMemo(() => {
    const abrangencia: Record<string, Set<string>> = {};
    filteredRecords.forEach((record) => {
      const trans = record.transportadora || 'Não informado';
      if (!abrangencia[trans]) {
        abrangencia[trans] = new Set();
      }
      abrangencia[trans].add(record.cep);
    });
    return abrangencia;
  }, [filteredRecords]);

  // Estrutura de dados para tabela pivot (CEPs nas linhas, Transportadoras nas colunas)
  const pivotTableData = useMemo(() => {
    if (filteredRecords.length === 0) return { ceps: [], transportadoras: [], data: {} };

    // Agrupar por CEP
    const cepsMap: Record<string, { uf: string; records: FreteRecord[] }> = {};
    filteredRecords.forEach((record) => {
      const cepKey = record.cep;
      if (!cepsMap[cepKey]) {
        cepsMap[cepKey] = { uf: record.uf, records: [] };
      }
      cepsMap[cepKey].records.push(record);
    });

    // Obter lista de CEPs únicos
    const ceps = Object.keys(cepsMap).sort();

    // Obter lista de transportadoras únicas
    const transportadorasSet = new Set<string>();
    filteredRecords.forEach((record) => {
      transportadorasSet.add(record.transportadora || 'Não informado');
    });
    const transportadoras = Array.from(transportadorasSet).sort();

    // Para cada CEP, identificar qual transportadora tem menor frete e menor prazo
    const data: Record<string, Record<string, {
      atende: boolean;
      frete: number | null;
      prazo: number | null;
      isMaisBarato: boolean;
      isMaisRapido: boolean;
    }>> = {};

    ceps.forEach((cep) => {
      const cepData = cepsMap[cep];
      const records = cepData.records;

      // Encontrar menor frete e menor prazo para este CEP
      const menorFrete = Math.min(...records.map(r => r.frete));
      const menorPrazo = Math.min(...records.map(r => r.prazo));

      // Criar mapa de transportadoras para este CEP
      data[cep] = {};
      transportadoras.forEach((trans) => {
        const record = records.find(r => (r.transportadora || 'Não informado') === trans);
        data[cep][trans] = {
          atende: !!record,
          frete: record ? record.frete : null,
          prazo: record ? record.prazo : null,
          isMaisBarato: record ? record.frete === menorFrete : false,
          isMaisRapido: record ? record.prazo === menorPrazo : false,
        };
      });
    });

    return { ceps, transportadoras, data };
  }, [filteredRecords]);

  // Função para exportar dados para XLSX
  const handleExportToExcel = () => {
    try {
      // Criar workbook
      const wb = XLSX.utils.book_new();

      // Criar dados para a planilha pivot
      const wsData: any[][] = [];
      
      // Cabeçalho: CEP, UF, e depois cada transportadora
      const header = ['CEP', 'UF', ...pivotTableData.transportadoras.map(t => `${t} - Frete`), ...pivotTableData.transportadoras.map(t => `${t} - Prazo`), ...pivotTableData.transportadoras.map(t => `${t} - Atende`)];
      wsData.push(header);

      // Dados: cada linha é um CEP
      pivotTableData.ceps.forEach((cep) => {
        const cepInfo = pivotTableData.data[cep];
        const cepData = filteredRecords.find(r => r.cep === cep);
        const row: any[] = [cep, cepData?.uf || ''];

        // Para cada transportadora, adicionar frete, prazo e status
        pivotTableData.transportadoras.forEach((trans) => {
          const info = cepInfo[trans];
          row.push(info.atende ? formatCurrency(info.frete!) : 'Não atende');
          row.push(info.atende ? `${info.prazo} dia(s)` : 'Não atende');
          row.push(info.atende ? 'Sim' : 'Não');
        });

        wsData.push(row);
      });

      // Criar worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 12 }, // CEP
        { wch: 5 },  // UF
        ...pivotTableData.transportadoras.flatMap(() => [
          { wch: 15 }, // Frete
          { wch: 12 }, // Prazo
          { wch: 10 }, // Atende
        ]),
      ];
      ws['!cols'] = colWidths;

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Fretes');

      // Criar planilha adicional com dados detalhados
      const detailData: any[][] = [];
      detailData.push(['CEP', 'UF', 'Transportadora', 'Frete', 'Prazo (dias)', 'Mais Barato', 'Mais Rápido']);
      
      filteredRecords.forEach((record) => {
        const cepInfo = pivotTableData.data[record.cep];
        const info = cepInfo[record.transportadora || 'Não informado'];
        detailData.push([
          record.cep,
          record.uf,
          record.transportadora || 'Não informado',
          record.frete,
          record.prazo,
          info.isMaisBarato ? 'Sim' : 'Não',
          info.isMaisRapido ? 'Sim' : 'Não',
        ]);
      });

      const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
      wsDetail['!cols'] = [
        { wch: 12 }, // CEP
        { wch: 5 },  // UF
        { wch: 25 }, // Transportadora
        { wch: 15 }, // Frete
        { wch: 12 }, // Prazo
        { wch: 12 }, // Mais Barato
        { wch: 12 }, // Mais Rápido
      ];
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalhes');

      // Gerar nome do arquivo com data/hora
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `fretes_export_${timestamp}.xlsx`;

      // Fazer download
      XLSX.writeFile(wb, filename);

      notifications.show({
        title: 'Sucesso',
        message: `Arquivo ${filename} exportado com sucesso!`,
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Erro',
        message: error.message || 'Erro ao exportar arquivo Excel',
        color: 'red',
      });
    }
  };

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title>Gerenciamento de Fretes</Title>
        <Button
          onClick={() => navigate('/upload')}
          leftSection={<IconUpload size={16} />}
          variant="light"
        >
          Upload de Arquivo
        </Button>
      </Group>

      {/* Cards de Resumo - Ajustam conforme filtros */}
      <Grid mb="xl">
        <Grid.Col span={4}>
          <Card withBorder p="md" radius="md">
            <Text size="sm" c="dimmed" mb="xs">
              {activeTab === 'filtros' ? 'CEPs Filtrados' : 'Total de CEPs'}
            </Text>
            <Text size="xl" fw={700}>
              {displayStats.totalCEPs.toLocaleString()}
            </Text>
            {activeTab === 'filtros' && filteredRecords.length > 0 && (
              <Text size="xs" c="dimmed" mt={4}>
                de {totalCEPs.toLocaleString()} total
              </Text>
            )}
          </Card>
        </Grid.Col>
        <Grid.Col span={4}>
          <Card withBorder p="md" radius="md">
            <Text size="sm" c="dimmed" mb="xs">
              {activeTab === 'filtros' ? 'Média de Frete (Filtrado)' : 'Média Geral de Frete'}
            </Text>
            <Text size="xl" fw={700}>
              {formatCurrency(displayStats.avgFrete)}
            </Text>
            {activeTab === 'filtros' && filteredRecords.length > 0 && avgFrete > 0 && (
              <Text size="xs" c={displayStats.avgFrete < avgFrete ? 'green' : displayStats.avgFrete > avgFrete ? 'red' : 'dimmed'} mt={4}>
                {displayStats.avgFrete < avgFrete ? '↓' : displayStats.avgFrete > avgFrete ? '↑' : '='} {formatCurrency(Math.abs(displayStats.avgFrete - avgFrete))} vs geral
              </Text>
            )}
          </Card>
        </Grid.Col>
        <Grid.Col span={4}>
          <Card withBorder p="md" radius="md">
            <Text size="sm" c="dimmed" mb="xs">
              {activeTab === 'filtros' ? 'Média de Prazo (Filtrado)' : 'Média Geral de Prazo'}
            </Text>
            <Text size="xl" fw={700}>
              {formatDecimal(displayStats.avgPrazo, 1)} dias
            </Text>
            {activeTab === 'filtros' && filteredRecords.length > 0 && avgPrazo > 0 && (
              <Text size="xs" c={displayStats.avgPrazo < avgPrazo ? 'green' : displayStats.avgPrazo > avgPrazo ? 'red' : 'dimmed'} mt={4}>
                {displayStats.avgPrazo < avgPrazo ? '↓' : displayStats.avgPrazo > avgPrazo ? '↑' : '='} {formatDecimal(Math.abs(displayStats.avgPrazo - avgPrazo), 1)} dias vs geral
              </Text>
            )}
          </Card>
        </Grid.Col>
        {activeTab === 'filtros' && displayStats.maisBarata && (
          <Grid.Col span={6}>
            <Card withBorder p="md" radius="md" style={{ borderColor: 'var(--mantine-color-green-6)', borderWidth: 2 }}>
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text size="sm" c="dimmed" mb="xs">
                    Transportadora Mais Barata
                  </Text>
                  <Text size="lg" fw={700} mb={4}>
                    {displayStats.maisBarata.nome}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Média de Frete: {formatCurrency(displayStats.maisBarata.mediaFrete)}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    {displayStats.maisBarata.qtd} CEP(s) atendido(s)
                  </Text>
                </div>
                <Badge size="lg" color="green" variant="light">
                  Melhor Preço
                </Badge>
              </Group>
            </Card>
          </Grid.Col>
        )}
        {activeTab === 'filtros' && displayStats.maisRapida && (
          <Grid.Col span={6}>
            <Card withBorder p="md" radius="md" style={{ borderColor: 'var(--mantine-color-blue-6)', borderWidth: 2 }}>
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text size="sm" c="dimmed" mb="xs">
                    Transportadora Mais Rápida
                  </Text>
                  <Text size="lg" fw={700} mb={4}>
                    {displayStats.maisRapida.nome}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Média de Prazo: {formatDecimal(displayStats.maisRapida.mediaPrazo, 1)} dias
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    {displayStats.maisRapida.qtd} CEP(s) atendido(s)
                  </Text>
                </div>
                <Badge size="lg" color="blue" variant="light">
                  Mais Rápida
                </Badge>
              </Group>
            </Card>
          </Grid.Col>
        )}
      </Grid>

      {/* Tabs para alternar entre Filtros, UF e Transportadora */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="filtros">Filtros e Ordenação</Tabs.Tab>
          <Tabs.Tab value="uf">Por UF</Tabs.Tab>
          <Tabs.Tab value="transportadora">Por Transportadora</Tabs.Tab>
        </Tabs.List>

        {/* Tab: Filtros e Ordenação */}
        <Tabs.Panel value="filtros" pt="md">
          <Paper withBorder p="md" mb="md">
            <Group justify="space-between" mb="md">
              <Group>
                <IconFilter size={20} />
                <Title order={3}>Filtros e Ordenação</Title>
              </Group>
              <Button
                variant="subtle"
                leftSection={filtersOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                onClick={toggleFilters}
              >
                {filtersOpened ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </Button>
            </Group>

            <Collapse in={filtersOpened}>
              <Stack gap="md">
                <Divider />
                
                <Grid>
                  <Grid.Col span={6}>
                    <MultiSelect
                      label="UF"
                      placeholder="Selecione uma ou mais UFs"
                      data={availableUFs}
                      value={filters.uf || []}
                      onChange={(value) => setFilters({ ...filters, uf: value.length > 0 ? value : undefined })}
                      clearable
                      searchable
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <MultiSelect
                      label="Transportadora"
                      placeholder="Selecione uma ou mais transportadoras"
                      data={availableTransportadoras}
                      value={filters.transportadora || []}
                      onChange={(value) => setFilters({ ...filters, transportadora: value.length > 0 ? value : undefined })}
                      clearable
                      searchable
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <NumberInput
                      label="Frete Mínimo (R$)"
                      placeholder="0.00"
                      min={0}
                      step={0.01}
                      value={filters.freteMin || undefined}
                      onChange={(value) => setFilters({ ...filters, freteMin: typeof value === 'number' ? value : undefined })}
                      leftSection="R$"
                      decimalSeparator=","
                      thousandsSeparator="."
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <NumberInput
                      label="Frete Máximo (R$)"
                      placeholder="0.00"
                      min={0}
                      step={0.01}
                      value={filters.freteMax || undefined}
                      onChange={(value) => setFilters({ ...filters, freteMax: typeof value === 'number' ? value : undefined })}
                      leftSection="R$"
                      decimalSeparator=","
                      thousandsSeparator="."
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <TextInput
                      label="CEP"
                      placeholder="Digite o CEP (parcial ou completo)"
                      value={filters.cep || ''}
                      onChange={(e) => setFilters({ ...filters, cep: e.target.value || undefined })}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput
                      label="Prazo Mínimo (dias)"
                      placeholder="0"
                      min={0}
                      step={1}
                      value={filters.prazoMin || undefined}
                      onChange={(value) => setFilters({ ...filters, prazoMin: typeof value === 'number' ? value : undefined })}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput
                      label="Prazo Máximo (dias)"
                      placeholder="0"
                      min={0}
                      step={1}
                      value={filters.prazoMax || undefined}
                      onChange={(value) => setFilters({ ...filters, prazoMax: typeof value === 'number' ? value : undefined })}
                    />
                  </Grid.Col>
                </Grid>

                <Divider label="Ordenação" labelPosition="center" />

                <Grid>
                  <Grid.Col span={8}>
                    <Select
                      label="Ordenar por"
                      data={[
                        { value: 'frete', label: 'Frete (Valor)' },
                        { value: 'prazo', label: 'Prazo (Dias)' },
                        { value: 'uf', label: 'UF' },
                        { value: 'transportadora', label: 'Transportadora' },
                        { value: 'cep', label: 'CEP' },
                      ]}
                      value={sort.field}
                      onChange={(value) => setSort({ ...sort, field: value as FreteSort['field'] })}
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Select
                      label="Ordem"
                      data={[
                        { value: 'asc', label: 'Crescente' },
                        { value: 'desc', label: 'Decrescente' },
                      ]}
                      value={sort.order}
                      onChange={(value) => setSort({ ...sort, order: value as FreteSort['order'] })}
                    />
                  </Grid.Col>
                </Grid>

                <Group justify="flex-end">
                  <Button
                    variant="light"
                    onClick={() => {
                      setFilters({});
                      setSort({ field: 'frete', order: 'asc' });
                    }}
                  >
                    Limpar Filtros
                  </Button>
                  <Button onClick={loadFilteredData}>
                    Aplicar Filtros
                  </Button>
                </Group>
              </Stack>
            </Collapse>

            {/* Mostrar opções rápidas de ordenação */}
            <Group mt="md" gap="xs">
              <Text size="sm" c="dimmed">Ordenação rápida:</Text>
              <Button
                size="xs"
                variant={sort.field === 'frete' && sort.order === 'asc' ? 'filled' : 'light'}
                leftSection={<IconSortAscending size={14} />}
                onClick={() => setSort({ field: 'frete', order: 'asc' })}
              >
                Mais Barato
              </Button>
              <Button
                size="xs"
                variant={sort.field === 'frete' && sort.order === 'desc' ? 'filled' : 'light'}
                leftSection={<IconSortDescending size={14} />}
                onClick={() => setSort({ field: 'frete', order: 'desc' })}
              >
                Mais Caro
              </Button>
              <Button
                size="xs"
                variant={sort.field === 'prazo' && sort.order === 'asc' ? 'filled' : 'light'}
                leftSection={<IconSortAscending size={14} />}
                onClick={() => setSort({ field: 'prazo', order: 'asc' })}
              >
                Mais Rápido
              </Button>
              <Button
                size="xs"
                variant={sort.field === 'prazo' && sort.order === 'desc' ? 'filled' : 'light'}
                leftSection={<IconSortDescending size={14} />}
                onClick={() => setSort({ field: 'prazo', order: 'desc' })}
              >
                Mais Lento
              </Button>
            </Group>
          </Paper>

          <Paper withBorder p="md">
            <Group justify="space-between" mb="md">
              <Text size="sm" c="dimmed">
                {pivotTableData.ceps.length} CEP(s) encontrado(s) | {pivotTableData.transportadoras.length} transportadora(s)
              </Text>
              <Button
                onClick={handleExportToExcel}
                leftSection={<IconFileDownload size={16} />}
                variant="light"
                disabled={filteredRecords.length === 0}
              >
                Exportar para Excel
              </Button>
            </Group>
            <div style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ position: 'sticky', left: 0, backgroundColor: 'var(--mantine-color-body)', zIndex: 10 }}>
                      CEP
                    </Table.Th>
                    <Table.Th style={{ position: 'sticky', left: 120, backgroundColor: 'var(--mantine-color-body)', zIndex: 10 }}>
                      UF
                    </Table.Th>
                    {pivotTableData.transportadoras.map((trans) => (
                      <Table.Th key={trans} style={{ minWidth: 150 }}>
                        <Text size="sm" fw={500} ta="center">
                          {trans}
                        </Text>
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredLoading ? (
                    <Table.Tr>
                      <Table.Td colSpan={pivotTableData.transportadoras.length + 2} ta="center">
                        Carregando...
                      </Table.Td>
                    </Table.Tr>
                  ) : pivotTableData.ceps.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={pivotTableData.transportadoras.length + 2} ta="center">
                        Nenhum registro encontrado com os filtros aplicados.
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    pivotTableData.ceps.map((cep) => {
                      const cepInfo = pivotTableData.data[cep];
                      const cepData = filteredRecords.find(r => r.cep === cep);
                      
                      return (
                        <Table.Tr key={cep}>
                          <Table.Td style={{ position: 'sticky', left: 0, backgroundColor: 'var(--mantine-color-body)', zIndex: 5 }}>
                            <Text fw={500}>{cep}</Text>
                          </Table.Td>
                          <Table.Td style={{ position: 'sticky', left: 120, backgroundColor: 'var(--mantine-color-body)', zIndex: 5 }}>
                            <Badge>{cepData?.uf || ''}</Badge>
                          </Table.Td>
                          {pivotTableData.transportadoras.map((trans) => {
                            const info = cepInfo[trans];
                            if (!info.atende) {
                              return (
                                <Table.Td key={trans} ta="center">
                                  <IconX size={20} color="var(--mantine-color-gray-5)" />
                                </Table.Td>
                              );
                            }

                            return (
                              <Table.Td key={trans} ta="center" style={{ minWidth: 150 }}>
                                <Stack gap={6} align="center" p={4}>
                                  <Group gap={4} justify="center" wrap="nowrap">
                                    {info.isMaisBarato ? (
                                      <Badge color="green" size="sm" variant="light" leftSection={<IconCurrencyDollar size={12} />}>
                                        {formatCurrency(info.frete!)}
                                      </Badge>
                                    ) : (
                                      <Text size="sm" c="dimmed" fw={500}>
                                        {formatCurrency(info.frete!)}
                                      </Text>
                                    )}
                                  </Group>
                                  <Group gap={4} justify="center" wrap="nowrap">
                                    {info.isMaisRapido ? (
                                      <Badge color="blue" size="sm" variant="light" leftSection={<IconClock size={12} />}>
                                        {info.prazo} dia{info.prazo !== 1 ? 's' : ''}
                                      </Badge>
                                    ) : (
                                      <Text size="sm" c="dimmed" fw={500}>
                                        {info.prazo} dia{info.prazo !== 1 ? 's' : ''}
                                      </Text>
                                    )}
                                  </Group>
                                  <IconCheck size={18} color="var(--mantine-color-green-6)" />
                                </Stack>
                              </Table.Td>
                            );
                          })}
                        </Table.Tr>
                      );
                    })
                  )}
                </Table.Tbody>
              </Table>
            </div>
            <Group mt="md" gap="xs" justify="center">
              <Badge color="green" variant="light" leftSection={<IconCurrencyDollar size={14} />}>
                Mais Barato
              </Badge>
              <Badge color="blue" variant="light" leftSection={<IconClock size={14} />}>
                Mais Rápido
              </Badge>
              <Badge color="gray" variant="light" leftSection={<IconCheck size={14} />}>
                Atende
              </Badge>
              <Badge color="gray" variant="light" leftSection={<IconX size={14} />}>
                Não Atende
              </Badge>
            </Group>
          </Paper>
        </Tabs.Panel>

        {/* Tab: Por UF */}
        <Tabs.Panel value="uf" pt="md">
          <Paper withBorder p="md">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>UF</Table.Th>
                  <Table.Th>Quantidade de CEPs</Table.Th>
                  <Table.Th>Média de Frete</Table.Th>
                  <Table.Th>Média de Prazo</Table.Th>
                  <Table.Th>Ações</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {loading ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} ta="center">
                      Carregando...
                    </Table.Td>
                  </Table.Tr>
                ) : summary.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} ta="center">
                      Nenhum dado encontrado. Faça upload de um arquivo Excel.
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  summary.map((item) => (
                    <Table.Tr key={item.uf}>
                      <Table.Td>
                        <Badge size="lg" variant="light">
                          {item.uf}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{item.qtdCeps.toLocaleString()}</Table.Td>
                      <Table.Td>{formatCurrency(item.mediaFrete)}</Table.Td>
                      <Table.Td>{formatDecimal(item.mediaPrazo, 1)} dias</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => handleViewDetails(item.uf)}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleDeleteUF(item.uf)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        {/* Tab: Por Transportadora */}
        <Tabs.Panel value="transportadora" pt="md">
          <Paper withBorder p="md">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Transportadora</Table.Th>
                  <Table.Th>UFs Atendidas</Table.Th>
                  <Table.Th>Quantidade de CEPs</Table.Th>
                  <Table.Th>Média de Frete</Table.Th>
                  <Table.Th>Média de Prazo</Table.Th>
                  <Table.Th>Ações</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {loading ? (
                  <Table.Tr>
                    <Table.Td colSpan={6} ta="center">
                      Carregando...
                    </Table.Td>
                  </Table.Tr>
                ) : summaryTransportadora.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6} ta="center">
                      Nenhum dado encontrado. Faça upload de um arquivo Excel.
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  summaryTransportadora.map((item) => (
                    <Table.Tr key={item.transportadora}>
                      <Table.Td>
                        <Text fw={500}>{item.transportadora}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          {item.ufs.map((uf) => (
                            <Badge key={uf} size="sm" variant="light">
                              {uf}
                            </Badge>
                          ))}
                        </Group>
                      </Table.Td>
                      <Table.Td>{item.qtdCeps.toLocaleString()}</Table.Td>
                      <Table.Td>{formatCurrency(item.mediaFrete)}</Table.Td>
                      <Table.Td>{formatDecimal(item.mediaPrazo, 1)} dias</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => handleViewDetailsTransportadora(item.transportadora)}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleDeleteTransportadora(item.transportadora)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>
      </Tabs>

      {/* Modal de Detalhes */}
      <Modal
        opened={detailModalOpened}
        onClose={() => setDetailModalOpened(false)}
        title={
          selectedTransportadora
            ? `Detalhes - ${selectedTransportadora}${selectedUF ? ` (${selectedUF})` : ''}`
            : `Detalhes - ${selectedUF || 'Transportadora'}`
        }
        size="xl"
      >
        {detailLoading ? (
          <Text ta="center" py="xl">
            Carregando...
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>CEP</Table.Th>
                <Table.Th>UF</Table.Th>
                <Table.Th>Transportadora</Table.Th>
                <Table.Th>Frete</Table.Th>
                <Table.Th>Prazo (dias)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {detailRecords.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5} ta="center">
                    Nenhum registro encontrado
                  </Table.Td>
                </Table.Tr>
              ) : (
                detailRecords.map((record, index) => (
                  <Table.Tr key={record.id || index}>
                    <Table.Td>{record.cep}</Table.Td>
                    <Table.Td>
                      <Badge>{record.uf}</Badge>
                    </Table.Td>
                    <Table.Td>{record.transportadora || 'Não informado'}</Table.Td>
                    <Table.Td>{formatCurrency(record.frete)}</Table.Td>
                    <Table.Td>{record.prazo}</Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        )}
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="Confirmar Exclusão"
        size="sm"
      >
          <Stack gap="md">
            <Text>
              Tem certeza que deseja excluir todos os dados de frete{' '}
              {ufToDelete ? (
                <>da UF <strong>{ufToDelete}</strong></>
              ) : transportadoraToDelete ? (
                <>da transportadora <strong>{transportadoraToDelete}</strong></>
              ) : null}
              ? Esta ação não pode ser desfeita.
            </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setDeleteModalOpened(false)}>
              Cancelar
            </Button>
            <Button color="red" onClick={handleConfirmDelete}>
              Excluir
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

