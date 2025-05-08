
"use client";

import React from 'react';
import type { Token as TokenType } from '@/types/ludo';
import { PLAYER_TAILWIND_COLORS } from '@/lib/ludo-constants';
import { cn } from '@/lib/utils';

interface TokenProps {
  token: TokenType;
  onClick: () => void;
  isSelected: boolean;
  isCurrentPlayerToken: boolean;
  isHumanPlayerToken: boolean; // Is this token controlled by the human?
  relativeIndex: number; 
  totalInCell: number; 
}

const TokenPiece: React.FC<TokenProps> = ({ token, onClick, isSelected, isCurrentPlayerToken, isHumanPlayerToken, relativeIndex, totalInCell }) => {
  const playerColors = PLAYER_TAILWIND_COLORS[token.player];

  let positionStyles = 'col-span-1 row-span-1 place-self-center'; 
  if (totalInCell === 2) {
    positionStyles = relativeIndex === 0 ? 'col-start-1 row-start-1 place-self-center' : 'col-start-2 row-start-2 place-self-center';
  } else if (totalInCell === 3) {
     if (relativeIndex === 0) positionStyles = 'col-start-1 row-start-1 place-self-center';
     else if (relativeIndex === 1) positionStyles = 'col-start-2 row-start-1 place-self-center';
     else positionStyles = 'col-start-1 row-start-2 col-span-2 place-self-center';
  } else if (totalInCell >= 4) {
    if (relativeIndex === 0) positionStyles = 'col-start-1 row-start-1 place-self-center';
    else if (relativeIndex === 1) positionStyles = 'col-start-2 row-start-1 place-self-center';
    else if (relativeIndex === 2) positionStyles = 'col-start-1 row-start-2 place-self-center';
    else positionStyles = 'col-start-2 row-start-2 place-self-center';
  }

  const canBeClicked = isCurrentPlayerToken && isHumanPlayerToken;

  return (
    <button
      onClick={canBeClicked ? onClick : undefined}
      className={cn(
        'w-3/4 h-3/4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ease-in-out transform focus:outline-none relative z-20',
        playerColors.bg,
        playerColors.border,
        isSelected && isHumanPlayerToken ? 'ring-4 ring-offset-1 ring-accent scale-110 shadow-lg' : 'shadow-md',
        isCurrentPlayerToken && isHumanPlayerToken && !isSelected ? 'animate-pulse ring-2 ring-purple-400 hover:scale-110' : '',
        !isCurrentPlayerToken || !isHumanPlayerToken ? 'opacity-80 cursor-default' : 'hover:scale-110',
        positionStyles
      )}
      style={{
        transitionProperty: 'transform, box-shadow, ring-width',
      }}
      aria-label={`Token ${token.id} of player ${token.player}${isHumanPlayerToken ? "" : " (AI)"}`}
      disabled={!canBeClicked} 
    >
      <span className={cn('text-xs font-bold', playerColors.text === 'text-yellow-900' ? 'text-black' : 'text-white')}>
        {/* Token Index or Icon can go here */}
      </span>
    </button>
  );
};

export default TokenPiece;

