import { Link, useLocation } from 'react-router-dom';
import { NavLink, Stack, Text } from '@mantine/core';
import {
  IconUsers,
  IconTruck,
  IconLogout,
  IconShoppingCart,
} from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { icon: IconUsers, label: 'Usuários', path: '/users' },
    { icon: IconTruck, label: 'Fretes', path: '/frete' },
    { icon: IconShoppingCart, label: 'Pedidos', path: '/pedidos' },
  ];

  return (
    <nav
      style={{
        width: '250px',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        backgroundColor: 'var(--mantine-color-body)',
        borderRight: '1px solid var(--mantine-color-gray-3)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        overflowY: 'auto',
      }}
    >
      <Text size="xl" fw={700} mb="md">
        Sistema
      </Text>

      <Stack gap="xs">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              component={Link}
              to={item.path}
              label={item.label}
              leftSection={<Icon size={20} />}
              active={isActive}
              variant="light"
            />
          );
        })}
      </Stack>

      <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
        <NavLink
          onClick={logout}
          label="Sair"
          leftSection={<IconLogout size={20} />}
          variant="light"
          color="red"
          style={{
            borderRadius: '8px',
          }}
        />
      </div>
    </nav>
  );
}

