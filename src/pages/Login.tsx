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
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuth } from '../contexts/AuthContext';
import { notifications } from '@mantine/notifications';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (!value ? 'Email é obrigatório' : /^\S+@\S+$/.test(value) ? null : 'Email inválido'),
      password: (value) => (!value ? 'Senha é obrigatória' : value.length < 3 ? 'Senha deve ter pelo menos 3 caracteres' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const result = await login(values.email, values.password);
      if (result.success) {
        notifications.show({
          title: 'Sucesso',
          message: 'Login realizado com sucesso!',
          color: 'green',
        });
        navigate('/users');
      } else {
        notifications.show({
          title: 'Erro',
          message: result.errorMessage || 'Email ou senha inválidos',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao fazer login',
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
          Login
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={5} mb="xl">
          Faça login para acessar o sistema
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Email"
              placeholder="seu@email.com"
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Senha"
              placeholder="Sua senha"
              required
              {...form.getInputProps('password')}
            />
            <Button type="submit" fullWidth mt="md" loading={loading}>
              Entrar
            </Button>
            <Text size="sm" ta="center" mt="md">
              Não tem uma conta?{' '}
              <Link to="/signup" style={{ color: 'var(--mantine-color-blue-6)' }}>
                Criar conta
              </Link>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

