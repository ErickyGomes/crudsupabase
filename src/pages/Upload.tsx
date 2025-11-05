import { useState } from 'react';
import '@mantine/dropzone/styles.css';
import {
  Container,
  Paper,
  Title,
  Button,
  Stack,
  Text,
  Progress,
  Group,
  Alert,
  Table,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import type { FileWithPath } from 'react-dropzone';
import { IconUpload, IconX, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { uploadService } from '../services/uploadService';

interface UploadHistory {
  id: string;
  filename: string;
  originalSize: number;
  parquetSize: number;
  rows: number;
  uploadedAt: string;
  status: 'success' | 'error';
}

export default function Upload() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);

  const handleFileUpload = async (files: FileWithPath[]) => {
    const file = files[0];
    if (!file) return;

    // Validar extensão
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      notifications.show({
        title: 'Erro',
        message: 'Apenas arquivos Excel (.xlsx ou .xls) são aceitos',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      // Etapa 1: Ler arquivo Excel
      setProgress(10);
      notifications.show({
        title: 'Processando',
        message: 'Lendo arquivo Excel...',
        color: 'blue',
      });

      // Etapa 2: Converter para Parquet
      setProgress(30);
      notifications.show({
        title: 'Processando',
        message: 'Convertendo para Parquet...',
        color: 'blue',
      });

      // Etapa 3: Upload para Supabase Storage
      setProgress(60);
      notifications.show({
        title: 'Processando',
        message: 'Fazendo upload para o Supabase...',
        color: 'blue',
      });

      // Etapa 4: Inserir dados no banco
      setProgress(80);
      notifications.show({
        title: 'Processando',
        message: 'Inserindo dados no banco de dados...',
        color: 'blue',
      });

      // Usar modo automático: processamento via função SQL
      const result = await uploadService.processFile(
        file,
        (progressValue) => {
          setProgress(progressValue);
        },
        { autoProcess: true } // Ativar processamento automático via função SQL
      );

      setProgress(100);

      notifications.show({
        title: 'Sucesso',
        message: `Arquivo processado com sucesso! ${result.rows} linhas inseridas.`,
        color: 'green',
      });

      // Adicionar ao histórico
      setUploadHistory((prev) => [
        {
          id: result.id,
          filename: result.filename,
          originalSize: result.originalSize,
          parquetSize: result.parquetSize,
          rows: result.rows,
          uploadedAt: new Date().toISOString(),
          status: 'success',
        },
        ...prev,
      ]);
    } catch (error: any) {
      notifications.show({
        title: 'Erro',
        message: error.message || 'Erro ao processar arquivo',
        color: 'red',
      });

      setUploadHistory((prev) => [
        {
          id: Date.now().toString(),
          filename: file.name,
          originalSize: file.size,
          parquetSize: 0,
          rows: 0,
          uploadedAt: new Date().toISOString(),
          status: 'error',
        },
        ...prev,
      ]);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Container size="xl" py="xl">
      <Title mb="xl">Upload de Arquivos Excel</Title>

      <Stack gap="xl">
        <Paper withBorder p="md" radius="md">
          <Stack gap="md">
            <Text size="lg" fw={500}>
              Selecione um arquivo Excel (.xlsx ou .xls)
            </Text>
            <Text size="sm" c="dimmed">
              O arquivo será convertido para Parquet e enviado para o Supabase Storage.
              Os dados serão inseridos automaticamente no banco de dados.
            </Text>

            <Dropzone
              onDrop={handleFileUpload}
              accept={[
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
              ]}
              maxFiles={1}
              disabled={loading}
              loading={loading}
            >
              <Group justify="center" gap="xl" style={{ minHeight: 220, pointerEvents: 'none' }}>
                <Dropzone.Accept>
                  <IconCheck size={52} stroke={1.5} />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconX size={52} stroke={1.5} />
                </Dropzone.Reject>
                <Dropzone.Idle>
                  <IconUpload size={52} stroke={1.5} />
                </Dropzone.Idle>

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

            {loading && (
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Processando arquivo...
                </Text>
                <Progress value={progress} animated />
                <Text size="xs" c="dimmed" ta="center">
                  {progress}%
                </Text>
              </Stack>
            )}
          </Stack>
        </Paper>

        {uploadHistory.length > 0 && (
          <Paper withBorder p="md" radius="md">
            <Title order={3} mb="md">
              Histórico de Uploads
            </Title>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Arquivo</Table.Th>
                  <Table.Th>Tamanho Original</Table.Th>
                  <Table.Th>Tamanho Parquet</Table.Th>
                  <Table.Th>Linhas</Table.Th>
                  <Table.Th>Data</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {uploadHistory.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>{item.filename}</Table.Td>
                    <Table.Td>{formatFileSize(item.originalSize)}</Table.Td>
                    <Table.Td>
                      {item.parquetSize > 0 ? formatFileSize(item.parquetSize) : '-'}
                    </Table.Td>
                    <Table.Td>{item.rows.toLocaleString()}</Table.Td>
                    <Table.Td>{new Date(item.uploadedAt).toLocaleString('pt-BR')}</Table.Td>
                    <Table.Td>
                      {item.status === 'success' ? (
                        <Text c="green" size="sm">
                          Sucesso
                        </Text>
                      ) : (
                        <Text c="red" size="sm">
                          Erro
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}

        <Alert icon={<IconAlertCircle size={16} />} title="Informações Importantes" color="blue">
          <Text size="sm">
            • O arquivo Excel será convertido para formato Parquet (mais eficiente)
            <br />
            • O arquivo Parquet será armazenado no Supabase Storage
            <br />
            • Os dados serão inseridos automaticamente no banco de dados
            <br />• A primeira linha do Excel deve conter os cabeçalhos das colunas
          </Text>
        </Alert>
      </Stack>
    </Container>
  );
}

