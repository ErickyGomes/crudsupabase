import { useState, useEffect, useCallback, useMemo } from 'react';
import '@mantine/dropzone/styles.css';
import {
  Container,
  Title,
  Button,
  Table,
  Stack,
  Group,
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
  Progress,
  Alert,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import type { FileWithPath } from 'react-dropzone';
import { notifications } from '@mantine/notifications';
import {
  IconUpload,
  IconFilter,
  IconChevronDown,
  IconChevronUp,
  IconSortAscending,
  IconSortDescending,
  IconCurrencyDollar,
  IconClock,
  IconCheck,
  IconX,
  IconFileDownload,
  IconAlertCircle,
  IconGavel,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { pedidoService } from '../services/pedidoService';
import { freteService } from '../services/freteService';
import { uploadService } from '../services/uploadService';
import type { PedidoRecord, PedidoFilters, PedidoSort, LeilaoResult } from '../types/pedido';
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

export default function Pedidos() {
  const [activeTab, setActiveTab] = useState<string | null>('leilao');
  const [pedidos, setPedidos] = useState<PedidoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [leilaoResults, setLeilaoResults] = useState<LeilaoResult[]>([]);
  const [leilaoLoading, setLeilaoLoading] = useState(false);

  // Estados para filtros
  const [filtersOpened, { toggle: toggleFilters }] = useDisclosure(false);
  const [filteredPedidos, setFilteredPedidos] = useState<PedidoRecord[]>([]);
  const [filteredLoading, setFilteredLoading] = useState(false);
  const [availableUFs, setAvailableUFs] = useState<string[]>([]);
  const [availableTransportadoras, setAvailableTransportadoras] = useState<string[]>([]);

  // Estados dos filtros
  const [filters, setFilters] = useState<PedidoFilters>({});
  const [sort, setSort] = useState<PedidoSort>({ field: 'cep', order: 'asc' });

  // Carregar pedidos
  const loadPedidos = async () => {
    setLoading(true);
    try {
      const data = await pedidoService.getAll();
      setPedidos(data);
      setFilteredPedidos(data);
    } catch (error: any) {
      notifications.show({
        title: 'Erro',
        message: error.message || 'Erro ao carregar pedidos',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPedidos();
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
      const data = await pedidoService.getWithFilters(filters);
      setFilteredPedidos(data);
    } catch (error: any) {
      notifications.show({
        title: 'Erro',
        message: error.message || 'Erro ao carregar dados filtrados',
        color: 'red',
      });
    } finally {
      setFilteredLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (activeTab === 'leilao') {
      loadFilteredData();
    }
  }, [filters, activeTab, loadFilteredData]);

  // Upload de arquivo Excel
  const handleFileUpload = async (files: FileWithPath[]) => {
    const file = files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      notifications.show({
        title: 'Erro',
        message: 'Apenas arquivos Excel (.xlsx ou .xls) são aceitos',
        color: 'red',
      });
      return;
    }

    setUploadLoading(true);
    setUploadProgress(0);

    try {
      setUploadProgress(10);
      const excelData = await uploadService.readExcelFile(file);

      setUploadProgress(50);
      // Converter dados do Excel para formato de pedidos
      const pedidosData: PedidoRecord[] = excelData.map((row: any, index: number) => {
        // Aceitar variações de nomes de colunas
        const cep = row.cep || row.ceo || row.cep_destino || row.cep_dest || '';
        const uf = row.uf || row.estado || row.uf_destino || row.uf_dest || '';
        const pedidoId = row.pedido_id || row.pedido || row.id_pedido || row.id || `PED-${index + 1}`;
        const cliente = row.cliente || row.nome_cliente || row.cliente_nome || '';

        if (!cep || !uf) {
          throw new Error(`Linha ${index + 2}: CEP e UF são obrigatórios`);
        }

        return {
          cep: cep.toString().trim(),
          uf: uf.toString().trim().toUpperCase(),
          pedido_id: pedidoId?.toString().trim(),
          cliente: cliente?.toString().trim() || undefined,
        };
      });

      setUploadProgress(80);
      await pedidoService.insertMany(pedidosData);

      setUploadProgress(100);
      notifications.show({
        title: 'Sucesso',
        message: `${pedidosData.length} pedido(s) importado(s) com sucesso!`,
        color: 'green',
      });

      await loadPedidos();
    } catch (error: any) {
      notifications.show({
        title: 'Erro',
        message: error.message || 'Erro ao processar arquivo',
        color: 'red',
      });
    } finally {
      setUploadLoading(false);
      setUploadProgress(0);
    }
  };

  // Simular leilão
  const handleSimularLeilao = async () => {
    if (filteredPedidos.length === 0) {
      notifications.show({
        title: 'Aviso',
        message: 'Não há pedidos para simular o leilão',
        color: 'yellow',
      });
      return;
    }

    setLeilaoLoading(true);
    try {
      const results = await pedidoService.simularLeilaoMultiplos(filteredPedidos);
      setLeilaoResults(results);
      notifications.show({
        title: 'Sucesso',
        message: `Leilão simulado para ${results.length} pedido(s)!`,
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Erro',
        message: error.message || 'Erro ao simular leilão',
        color: 'red',
      });
    } finally {
      setLeilaoLoading(false);
    }
  };

  // Estrutura de dados para tabela pivot do leilão
  const pivotLeilaoData = useMemo(() => {
    if (leilaoResults.length === 0) return { pedidos: [], transportadoras: [], data: {} };

    // Obter lista de transportadoras únicas
    const transportadorasSet = new Set<string>();
    leilaoResults.forEach((result) => {
      result.transportadoras.forEach((t) => {
        transportadorasSet.add(t.transportadora);
      });
    });
    const transportadoras = Array.from(transportadorasSet).sort();

    // Criar estrutura de dados
    const data: Record<string, Record<string, {
      atende: boolean;
      frete: number | null;
      prazo: number | null;
      isMaisBarato: boolean;
      isMaisRapido: boolean;
    }>> = {};

    leilaoResults.forEach((result) => {
      const pedidoKey = result.pedido.pedido_id || result.pedido.cep;
      data[pedidoKey] = {};

      transportadoras.forEach((trans) => {
        const transportadora = result.transportadoras.find((t) => t.transportadora === trans);
        data[pedidoKey][trans] = {
          atende: !!transportadora,
          frete: transportadora?.frete || null,
          prazo: transportadora?.prazo || null,
          isMaisBarato: transportadora?.isMaisBarato || false,
          isMaisRapido: transportadora?.isMaisRapido || false,
        };
      });
    });

    return {
      pedidos: leilaoResults.map((r) => r.pedido),
      transportadoras,
      data,
    };
  }, [leilaoResults]);

  // Exportar para Excel
  const handleExportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Planilha de Leilão
      if (leilaoResults.length > 0) {
        const wsData: any[][] = [];
        const header = ['Pedido ID', 'Cliente', 'CEP', 'UF', ...pivotLeilaoData.transportadoras.map(t => `${t} - Frete`), ...pivotLeilaoData.transportadoras.map(t => `${t} - Prazo`), ...pivotLeilaoData.transportadoras.map(t => `${t} - Vencedor`)];
        wsData.push(header);

        pivotLeilaoData.pedidos.forEach((pedido) => {
          const pedidoKey = pedido.pedido_id || pedido.cep;
          const pedidoInfo = pivotLeilaoData.data[pedidoKey];
          const row: any[] = [
            pedido.pedido_id || '',
            pedido.cliente || '',
            pedido.cep,
            pedido.uf,
          ];

          pivotLeilaoData.transportadoras.forEach((trans) => {
            const info = pedidoInfo[trans];
            row.push(info.atende ? formatCurrency(info.frete!) : 'Não atende');
            row.push(info.atende ? `${info.prazo} dia(s)` : 'Não atende');
            row.push(info.isMaisBarato ? 'Mais Barato' : info.isMaisRapido ? 'Mais Rápido' : info.atende ? 'Atende' : 'Não atende');
          });

          wsData.push(row);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [
          { wch: 15 }, // Pedido ID
          { wch: 25 }, // Cliente
          { wch: 12 }, // CEP
          { wch: 5 },  // UF
          ...pivotLeilaoData.transportadoras.flatMap(() => [
            { wch: 15 }, // Frete
            { wch: 12 }, // Prazo
            { wch: 15 }, // Vencedor
          ]),
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'Leilão');
      }

      // Planilha de Detalhes
      const detailData: any[][] = [];
      detailData.push(['Pedido ID', 'Cliente', 'CEP', 'UF', 'Transportadora', 'Frete', 'Prazo (dias)', 'Mais Barato', 'Mais Rápido']);

      leilaoResults.forEach((result) => {
        result.transportadoras.forEach((t) => {
          detailData.push([
            result.pedido.pedido_id || '',
            result.pedido.cliente || '',
            result.pedido.cep,
            result.pedido.uf,
            t.transportadora,
            t.frete,
            t.prazo,
            t.isMaisBarato ? 'Sim' : 'Não',
            t.isMaisRapido ? 'Sim' : 'Não',
          ]);
        });
      });

      const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
      wsDetail['!cols'] = [
        { wch: 15 }, // Pedido ID
        { wch: 25 }, // Cliente
        { wch: 12 }, // CEP
        { wch: 5 },  // UF
        { wch: 25 }, // Transportadora
        { wch: 15 }, // Frete
        { wch: 12 }, // Prazo
        { wch: 12 }, // Mais Barato
        { wch: 12 }, // Mais Rápido
      ];
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalhes');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `pedidos_leilao_${timestamp}.xlsx`;
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
        <Title>Leilão de Fretes - Pedidos</Title>
        <Group>
          <Button
            onClick={handleSimularLeilao}
            leftSection={<IconGavel size={16} />}
            variant="light"
            disabled={filteredPedidos.length === 0 || leilaoLoading}
            loading={leilaoLoading}
          >
            Simular Leilão
          </Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="upload">Upload de Pedidos</Tabs.Tab>
          <Tabs.Tab value="leilao">Leilão de Frete</Tabs.Tab>
        </Tabs.List>

        {/* Tab: Upload */}
        <Tabs.Panel value="upload" pt="md">
          <Paper withBorder p="md" radius="md">
            <Stack gap="md">
              <Text size="lg" fw={500}>
                Faça upload de um arquivo Excel com os pedidos dos clientes
              </Text>
              <Text size="sm" c="dimmed">
                O arquivo deve conter colunas: CEP, UF, Pedido ID (opcional), Cliente (opcional)
              </Text>

              <Dropzone
                onDrop={handleFileUpload}
                accept={[
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  'application/vnd.ms-excel',
                ]}
                maxFiles={1}
                disabled={uploadLoading}
                loading={uploadLoading}
              >
                <Group justify="center" gap="xl" style={{ minHeight: 220, pointerEvents: 'none' }}>
                  <IconUpload size={52} stroke={1.5} />
                  <div>
                    <Text size="xl" inline>
                      Arraste o arquivo aqui ou clique para selecionar
                    </Text>
                    <Text size="sm" c="dimmed" inline mt={7}>
                      Apenas arquivos .xlsx ou .xls são aceitos
                    </Text>
                  </div>
                </Group>
              </Dropzone>

              {uploadLoading && (
                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    Processando arquivo...
                  </Text>
                  <Progress value={uploadProgress} animated />
                  <Text size="xs" c="dimmed" ta="center">
                    {uploadProgress}%
                  </Text>
                </Stack>
              )}

              <Alert icon={<IconAlertCircle size={16} />} title="Formato do Arquivo" color="blue">
                <Text size="sm">
                  • Colunas aceitas: CEP (ou CEP Destino), UF (ou Estado), Pedido ID (ou ID Pedido), Cliente (ou Nome Cliente)
                  <br />
                  • A primeira linha deve conter os cabeçalhos
                  <br />
                  • CEP e UF são obrigatórios
                </Text>
              </Alert>

              <Paper withBorder p="md">
                <Text size="sm" c="dimmed" mb="md">
                  Total de pedidos: {pedidos.length}
                </Text>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Pedido ID</Table.Th>
                      <Table.Th>Cliente</Table.Th>
                      <Table.Th>CEP</Table.Th>
                      <Table.Th>UF</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {loading ? (
                      <Table.Tr>
                        <Table.Td colSpan={4} ta="center">
                          Carregando...
                        </Table.Td>
                      </Table.Tr>
                    ) : pedidos.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={4} ta="center">
                          Nenhum pedido encontrado. Faça upload de um arquivo Excel.
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      pedidos.map((pedido, index) => (
                        <Table.Tr key={pedido.id || index}>
                          <Table.Td>{pedido.pedido_id || '-'}</Table.Td>
                          <Table.Td>{pedido.cliente || '-'}</Table.Td>
                          <Table.Td>{pedido.cep}</Table.Td>
                          <Table.Td>
                            <Badge>{pedido.uf}</Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Stack>
          </Paper>
        </Tabs.Panel>

        {/* Tab: Leilão */}
        <Tabs.Panel value="leilao" pt="md">
          <Paper withBorder p="md" mb="md">
            <Group justify="space-between" mb="md">
              <Group>
                <IconFilter size={20} />
                <Title order={3}>Filtros</Title>
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
                    <TextInput
                      label="CEP"
                      placeholder="Digite o CEP (parcial ou completo)"
                      value={filters.cep || ''}
                      onChange={(e) => setFilters({ ...filters, cep: e.target.value || undefined })}
                    />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <TextInput
                      label="Cliente"
                      placeholder="Digite o nome do cliente"
                      value={filters.cliente || ''}
                      onChange={(e) => setFilters({ ...filters, cliente: e.target.value || undefined })}
                    />
                  </Grid.Col>
                </Grid>

                <Group justify="flex-end">
                  <Button
                    variant="light"
                    onClick={() => {
                      setFilters({});
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
          </Paper>

          {leilaoResults.length > 0 && (
            <Paper withBorder p="md" mb="md">
              <Group justify="space-between" mb="md">
                <Text size="sm" c="dimmed">
                  {leilaoResults.length} pedido(s) no leilão | {pivotLeilaoData.transportadoras.length} transportadora(s)
                </Text>
                <Button
                  onClick={handleExportToExcel}
                  leftSection={<IconFileDownload size={16} />}
                  variant="light"
                >
                  Exportar para Excel
                </Button>
              </Group>

              <div style={{ overflowX: 'auto' }}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ position: 'sticky', left: 0, backgroundColor: 'var(--mantine-color-body)', zIndex: 10 }}>
                        Pedido ID
                      </Table.Th>
                      <Table.Th style={{ position: 'sticky', left: 150, backgroundColor: 'var(--mantine-color-body)', zIndex: 10 }}>
                        Cliente
                      </Table.Th>
                      <Table.Th style={{ position: 'sticky', left: 300, backgroundColor: 'var(--mantine-color-body)', zIndex: 10 }}>
                        CEP
                      </Table.Th>
                      <Table.Th style={{ position: 'sticky', left: 420, backgroundColor: 'var(--mantine-color-body)', zIndex: 10 }}>
                        UF
                      </Table.Th>
                      {pivotLeilaoData.transportadoras.map((trans) => (
                        <Table.Th key={trans} style={{ minWidth: 150 }}>
                          <Text size="sm" fw={500} ta="center">
                            {trans}
                          </Text>
                        </Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pivotLeilaoData.pedidos.map((pedido) => {
                      const pedidoKey = pedido.pedido_id || pedido.cep;
                      const pedidoInfo = pivotLeilaoData.data[pedidoKey];

                      return (
                        <Table.Tr key={pedido.id || pedidoKey}>
                          <Table.Td style={{ position: 'sticky', left: 0, backgroundColor: 'var(--mantine-color-body)', zIndex: 5 }}>
                            <Text fw={500}>{pedido.pedido_id || '-'}</Text>
                          </Table.Td>
                          <Table.Td style={{ position: 'sticky', left: 150, backgroundColor: 'var(--mantine-color-body)', zIndex: 5 }}>
                            {pedido.cliente || '-'}
                          </Table.Td>
                          <Table.Td style={{ position: 'sticky', left: 300, backgroundColor: 'var(--mantine-color-body)', zIndex: 5 }}>
                            {pedido.cep}
                          </Table.Td>
                          <Table.Td style={{ position: 'sticky', left: 420, backgroundColor: 'var(--mantine-color-body)', zIndex: 5 }}>
                            <Badge>{pedido.uf}</Badge>
                          </Table.Td>
                          {pivotLeilaoData.transportadoras.map((trans) => {
                            const info = pedidoInfo[trans];
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
                    })}
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
          )}

          {leilaoResults.length === 0 && (
            <Paper withBorder p="md">
              <Text ta="center" c="dimmed" py="xl">
                {filteredPedidos.length > 0
                  ? 'Clique em "Simular Leilão" para ver os resultados'
                  : 'Nenhum pedido encontrado. Faça upload de pedidos primeiro.'}
              </Text>
            </Paper>
          )}
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}

