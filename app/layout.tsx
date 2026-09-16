import type { Metadata } from 'next';
import './dashboard.css';

export const metadata: Metadata = {
  title: 'Cadast-IA',
  description: 'Dashboard IA Cadastrale',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='fr'>
      <body>
        {children}
      </body>
    </html>
  );
}
