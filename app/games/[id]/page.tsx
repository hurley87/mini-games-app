import { Game } from '@/app/components/game';

export const dynamic = 'force-dynamic';

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = '7988';
  return (
    <div className="w-screen h-screen">
      <Game id={id} userId={userId} />
    </div>
  );
}