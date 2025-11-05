import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Button,
  Table,
  Modal,
  TextInput,
  Select,
  Stack,
  Group,
  ActionIcon,
  Badge,
  Paper,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash, IconPlus, IconUpload } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import type { UpdateUserData, UserProfile, SignupData } from '../types/user';

export default function Users() {
  const { logout, signup } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  

  const form = useForm<SignupData>({
    initialValues: {
      name: '',
      email: '',
      password: '',
      role: 'user',
    },
    validate: {
      name: (value) => (!value ? 'Nome é obrigatório' : null),
      email: (value) => (!value ? 'Email é obrigatório' : /^\S+@\S+$/.test(value) ? null : 'Email inválido'),
      password: (value) => (!editingUser && !value ? 'Senha é obrigatória' : value && value.length < 3 ? 'Senha deve ter pelo menos 3 caracteres' : null),
      role: (value) => (!value ? 'Perfil é obrigatório' : null),
    },
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao carregar usuários',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenModal = (user?: UserProfile) => {
    if (user) {
      setEditingUser(user);
      form.setValues({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      form.reset();
    }
    setModalOpened(true);
  };

  const handleCloseModal = () => {
    setModalOpened(false);
    setEditingUser(null);
    form.reset();
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      if (editingUser) {
        // Atualizar (mesmo código)
        const updateData: UpdateUserData = {
          name: values.name,
          role: values.role,
        };
        if (values.password) {
          updateData.password = values.password;
        }
        await userService.update(editingUser.id, updateData);
        notifications.show({
          title: 'Sucesso',
          message: 'Usuário atualizado com sucesso!',
          color: 'green',
        });
      } else {
        // Criar novo usuário usando signup
        const success = await signup(
          values.email,
          values.password,
          values.name,
          values.role
        );
        
        if (success) {
          notifications.show({
            title: 'Sucesso',
            message: 'Usuário criado com sucesso!',
            color: 'green',
          });
        } else {
          notifications.show({
            title: 'Erro',
            message: 'Erro ao criar usuário',
            color: 'red',
          });
          return; // Não fechar modal se erro
        }
      }
      handleCloseModal();
      loadUsers();
    } catch (error: any) {
      notifications.show({
        title: 'Erro',
        message: error.message || (editingUser ? 'Erro ao atualizar usuário' : 'Erro ao criar usuário'),
        color: 'red',
      });
    }
  };

  const handleDeleteClick = (user: UserProfile) => {
    setUserToDelete(user);
    setDeleteModalOpened(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await userService.delete(userToDelete.id);
      notifications.show({
        title: 'Sucesso',
        message: 'Usuário excluído com sucesso!',
        color: 'green',
      });
      setDeleteModalOpened(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao excluir usuário',
        color: 'red',
      });
    }
  };

  const rows = users.map((user) => (
    <Table.Tr key={user.id}>
      <Table.Td>{user.name}</Table.Td>
      <Table.Td>{user.email}</Table.Td>
      <Table.Td>
        <Badge color={user.role === 'admin' ? 'red' : 'blue'}>{user.role}</Badge>
      </Table.Td>
      <Table.Td>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon variant="light" color="blue" onClick={() => handleOpenModal(user)}>
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon variant="light" color="red" onClick={() => handleDeleteClick(user)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title>Gerenciamento de Usuários</Title>
        <Group>
          <Button leftSection={<IconPlus size={16} />} onClick={() => handleOpenModal()}>
            Novo Usuário
          </Button>
        </Group>
      </Group>

      <Paper withBorder p="md">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nome</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Perfil</Table.Th>
              <Table.Th>Data de Criação</Table.Th>
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
            ) : rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5} ta="center">
                  Nenhum usuário encontrado
                </Table.Td>
              </Table.Tr>
            ) : (
              rows
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Modal de Criar/Editar */}
      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        size="md"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Nome"
              placeholder="Nome completo"
              required
              {...form.getInputProps('name')}
            />
            <TextInput
              label="Email"
              placeholder="email@example.com"
              required
              {...form.getInputProps('email')}
            />
            <TextInput
              type="password"
              label="Senha"
              placeholder={editingUser ? 'Deixe em branco para manter a senha atual' : 'Senha'}
              required={!editingUser}
              {...form.getInputProps('password')}
            />
            <Select
              label="Perfil"
              placeholder="Selecione o perfil"
              required
              data={[
                { value: 'user', label: 'Usuário' },
                { value: 'admin', label: 'Administrador' },
              ]}
              {...form.getInputProps('role')}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingUser ? 'Atualizar' : 'Criar'}
              </Button>
            </Group>
          </Stack>
        </form>
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
            Tem certeza que deseja excluir o usuário <strong>{userToDelete?.name}</strong>?
            Esta ação não pode ser desfeita.
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

