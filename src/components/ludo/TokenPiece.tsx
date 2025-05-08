
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
  relativeIndex: number; // 0, 1, 2, 3 for positioning within a cell
  totalInCell: number; // Total tokens in the same cell
}

const TokenPiece: React.FC<TokenProps> = ({ token, onClick, isSelected, isCurrentPlayerToken, relativeIndex, totalInCell }) => {
  const playerColors = PLAYER_TAILWIND_COLORS[token.player];

  // Basic positioning for multiple tokens in one cell.
  // This can be made more sophisticated.
  let positionStyles = 'col-span-1 row-span-1 place-self-center'; // Default for single token
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


  return (
    <button
      onClick={onClick}
      className={cn(
        'w-3/4 h-3/4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none relative z-20',
        playerColors.bg,
        playerColors.border,
        isSelected ? 'ring-4 ring-offset-1 ring-accent scale-110 shadow-lg' : 'shadow-md',
        isCurrentPlayerToken && !isSelected ? 'animate-pulse ring-2 ring-purple-400' : '',
        !isCurrentPlayerToken && token.status !== 'base' ? 'opacity-80' : '',
        positionStyles
      )}
      style={{
        transitionProperty: 'transform, box-shadow, ring-width',
      }}
      aria-label={`Token ${token.id} of player ${token.player}`}
      disabled={!isCurrentPlayerToken && token.status !== 'base'} // Disable clicking if not current player's token or it's in base without a 6 etc.
    >
      <span className={cn('text-xs font-bold', playerColors.text === 'text-yellow-900' ? 'text-black' : 'text-white')}>
        {/* Display token index or a small icon */}
      </span>
    </button>
  );
};

export default TokenPiece;
