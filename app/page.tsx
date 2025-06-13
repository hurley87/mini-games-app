import { Header } from './components/header';
import { CoinsList } from './components/coins-list';
import { WelcomeDialog } from './components/welcome-dialog';

export default function Page() {
  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col bg-gradient-to-b from-black via-zinc-900 to-black text-white">
      <Header />
      <CoinsList />
      <WelcomeDialog />
    </div>
  );
}
