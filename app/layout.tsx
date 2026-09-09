import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SecureAdapt — Entrenamiento contra Ingeniería Social',
  description:
    'Plataforma adaptativa de entrenamiento para detectar ataques de ingeniería social: phishing, pretexting, baiting y vishing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-surface-50 text-surface-900">
        {children}
      </body>
    </html>
  );
}
