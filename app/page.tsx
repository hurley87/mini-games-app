import { Header } from './components/header';
import { CoinsList } from './components/coins-list';

export default function Page() {
  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col bg-gradient-to-b from-black via-zinc-900 to-black text-white">
      <Header />
      <CoinsList />
    </div>
  );
}
