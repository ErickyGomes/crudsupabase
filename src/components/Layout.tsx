import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main
        style={{
          marginLeft: '250px',
          width: 'calc(100% - 250px)',
          padding: '20px',
        }}
      >
        {children}
      </main>
    </div>
  );
}



