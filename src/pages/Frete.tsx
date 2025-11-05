import { useState, useEffect } from 'react';
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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEye, IconTrash, IconUpload } from '@tabler/icons-react';
import { freteService } from '../services/freteService';
import type { FreteRecord, FreteSummary, FreteSummaryByTransportadora } from '../types/frete';

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
  const [activeTab, setActiveTab] = useState<string | null>('uf');
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
  }, []);

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

      {/* Cards de Resumo Geral */}
      <Grid mb="xl">
        <Grid.Col span={4}>
          <Card withBorder p="md" radius="md">
            <Text size="sm" c="dimmed" mb="xs">
              Total de CEPs
            </Text>
            <Text size="xl" fw={700}>
              {totalCEPs.toLocaleString()}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={4}>
          <Card withBorder p="md" radius="md">
            <Text size="sm" c="dimmed" mb="xs">
              Média Geral de Frete
            </Text>
            <Text size="xl" fw={700}>
              {formatCurrency(avgFrete)}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={4}>
          <Card withBorder p="md" radius="md">
            <Text size="sm" c="dimmed" mb="xs">
              Média Geral de Prazo
            </Text>
            <Text size="xl" fw={700}>
              {formatDecimal(avgPrazo, 1)} dias
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Tabs para alternar entre UF e Transportadora */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="uf">Por UF</Tabs.Tab>
          <Tabs.Tab value="transportadora">Por Transportadora</Tabs.Tab>
        </Tabs.List>

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

