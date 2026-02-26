
import './globals.css';

export const metadata = {
  title: 'Stock Analyzer',
  description: 'Live-ish stock chart + advanced analysis (score + reasons)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
