import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Select,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuth } from '../contexts/AuthContext';
import { notifications } from '@mantine/notifications';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user',
    },
    validate: {
      name: (value) => (!value ? 'Nome é obrigatório' : null),
      email: (value) => (!value ? 'Email é obrigatório' : /^\S+@\S+$/.test(value) ? null : 'Email inválido'),
      password: (value) => (!value ? 'Senha é obrigatória' : value.length < 6 ? 'Senha deve ter pelo menos 6 caracteres' : null),
      confirmPassword: (value, values) => 
        value !== values.password ? 'Senhas não coincidem' : null,
      role: (value) => (!value ? 'Perfil é obrigatório' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const success = await signup(
        values.email,
        values.password,
        values.name,
        values.role
      );
      
      if (success) {
        notifications.show({
          title: 'Sucesso',
          message: 'Conta criada com sucesso! Faça login para continuar.',
          color: 'green',
        });
        navigate('/login');
      } else {
        notifications.show({
          title: 'Erro',
          message: 'Erro ao criar conta',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao criar conta',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Title ta="center" mb="md">
          Criar Conta
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={5} mb="xl">
          Preencha os dados para criar sua conta
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Nome"
              placeholder="Seu nome completo"
              required
              {...form.getInputProps('name')}
            />
            <TextInput
              label="Email"
              placeholder="seu@email.com"
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Senha"
              placeholder="Mínimo 6 caracteres"
              required
              {...form.getInputProps('password')}
            />
            <PasswordInput
              label="Confirmar Senha"
              placeholder="Digite a senha novamente"
              required
              {...form.getInputProps('confirmPassword')}
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
            <Button type="submit" fullWidth mt="md" loading={loading}>
              Criar Conta
            </Button>
            <Text size="sm" ta="center" mt="md">
              Já tem uma conta?{' '}
              <Link to="/login" style={{ color: 'var(--mantine-color-blue-6)' }}>
                Fazer login
              </Link>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}