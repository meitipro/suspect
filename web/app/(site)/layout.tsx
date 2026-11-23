import { Footer } from '@/components/Footer';
import { WalletProvider } from '@/components/Wallet';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <main className="flex-1">{children}</main>
      <Footer />
    </WalletProvider>
  );
}
