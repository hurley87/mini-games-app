'use client';

import { useState } from 'react';
import { Info } from './info';
import { Game } from './game';

interface GameWrapperProps {
  id: string;
  name: string;
  description: string;
  timeoutSeconds?: number;
  coinAddress: string;
}

export function GameWrapper({
  id,
  name,
  description,
  timeoutSeconds = 10,
  coinAddress,
}: GameWrapperProps) {
  const [showGame, setShowGame] = useState(false);

  if (showGame) {
    return (
      <Game id={id} timeoutSeconds={timeoutSeconds} coinAddress={coinAddress} />
    );
  }

  return (
    <Info
      id={id}
      name={name}
      description={description}
      coinAddress={coinAddress}
      onPlay={() => setShowGame(true)}
    />
  );
}
