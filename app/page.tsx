import { Header } from './components/header';
import { CoinsList } from './components/coins-list';
import { AppInit } from './components/app-init';

export default function Page() {
  return (
    <div className="max-w-lg mx-auto bg-gray-900 min-h-screen flex flex-col">
      <AppInit />
      <Header />
      <CoinsList />
    </div>
  );
}
