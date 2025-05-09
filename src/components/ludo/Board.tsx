"use client";

import React from 'react';
import type { Token, PlayerColor, ValidMove, BoardCell as BoardCellType, GameState } from '@/types/ludo';
import { 
  PLAYER_TAILWIND_COLORS, 
  PLAYER_TAILWIND_BG_LIGHT,
  BASE_TOKEN_POSITIONS, 
  TRACK_COORDINATES, 
  HOME_PATH_COORDINATES,
  BOARD_CELLS,
  PLAYER_START_OFFSETS, // Import PLAYER_START_OFFSETS
  TRACK_LENGTH, // Import TRACK_LENGTH for modulo operation
} from '@/lib/ludo-constants';
import { calculateGlobalTrackPosition } from '@/lib/ludo-logic';
import TokenPiece from './TokenPiece';
import { cn } from '@/lib/utils';
import { Home, Star, Zap } from 'lucide-react';

interface BoardProps {
  tokens: Token[];
  onTokenSelect: (token: Token) => void;
  selectedTokenId: string | null;
  highlightedMoves: ValidMove[];
  currentPlayer: PlayerColor;
  onMoveSelect: (move: ValidMove) => void;
  gameStatus: GameState['gameStatus'];
  humanPlayerColor: PlayerColor | null;
}

const BoardCell: React.FC<{ cell: BoardCellType; children?: React.ReactNode; onClick?: () => void; isHighlighted?: boolean }> = ({ cell, children, onClick, isHighlighted }) => {
  let bgColor = 'bg-background dark:bg-neutral-700'; 
  let borderColor = 'border-neutral-300 dark:border-neutral-600';
  let textColor = 'text-foreground';

  if (cell.type === 'base') {
    bgColor = cell.playerColor ? PLAYER_TAILWIND_BG_LIGHT[cell.playerColor] : 'bg-gray-200 dark:bg-gray-600';
    borderColor = cell.playerColor ? PLAYER_TAILWIND_COLORS[cell.playerColor].border : 'border-gray-400';
  } else if (cell.type === 'homepath') {
    bgColor = cell.playerColor ? PLAYER_TAILWIND_COLORS[cell.playerColor].bg : 'bg-gray-200 dark:bg-gray-600';
    textColor = cell.playerColor ? (PLAYER_TAILWIND_COLORS[cell.playerColor].text === 'text-yellow-900' ? 'text-black' : 'text-white') : 'text-white';
    borderColor = cell.playerColor ? PLAYER_TAILWIND_COLORS[cell.playerColor].border : 'border-gray-400';
  } else if (cell.type === 'track') {
    if (cell.isStart && cell.playerColor) { // Check if it's a player-specific start cell
      bgColor = PLAYER_TAILWIND_COLORS[cell.playerColor].bg;
      textColor = PLAYER_TAILWIND_COLORS[cell.playerColor].text === 'text-yellow-900' ? 'text-black' : 'text-white';
      borderColor = PLAYER_TAILWIND_COLORS[cell.playerColor].border;
    }
  } else if (cell.type === 'center') {
    bgColor = 'bg-purple-300 dark:bg-purple-900'; 
    borderColor = 'border-purple-500 dark:border-purple-700';
  }
  
  if (cell.type === 'homepath' && cell.playerColor && HOME_PATH_COORDINATES[cell.playerColor] && HOME_PATH_COORDINATES[cell.playerColor][HOME_PATH_COORDINATES[cell.playerColor].length-1][0] === cell.row && HOME_PATH_COORDINATES[cell.playerColor][HOME_PATH_COORDINATES[cell.playerColor].length-1][1] === cell.col) {
      bgColor = 'bg-purple-500 dark:bg-purple-700'; 
      textColor = 'text-white';
  }


  return (
    <div
      className={cn(
        'w-full h-full border flex items-center justify-center relative aspect-square',
        bgColor,
        borderColor,
        textColor,
        isHighlighted ? 'ring-4 ring-accent ring-inset shadow-lg scale-105 z-10' : '',
        onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      )}
      style={{ gridRow: cell.row + 1, gridColumn: cell.col + 1 }}
      onClick={onClick}
      aria-label={`Cell ${cell.row}-${cell.col} type ${cell.type} ${cell.playerColor || ''}`}
    >
      {cell.type === 'track' && cell.isStart && <Star className="w-1/2 h-1/2 opacity-50" />}
      {cell.type === 'track' && cell.isSafe && !cell.isStart && <Zap className="w-1/2 h-1/2 opacity-30" />}
      {cell.type === 'homepath' && cell.playerColor && HOME_PATH_COORDINATES[cell.playerColor] && HOME_PATH_COORDINATES[cell.playerColor][HOME_PATH_COORDINATES[cell.playerColor].length-1][0] === cell.row && HOME_PATH_COORDINATES[cell.playerColor][HOME_PATH_COORDINATES[cell.playerColor].length-1][1] === cell.col && (
        <Home className="w-3/4 h-3/4 opacity-70"/>
      )}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5">
         {children}
      </div>
    </div>
  );
};


const Board: React.FC<BoardProps> = ({ tokens, onTokenSelect, selectedTokenId, highlightedMoves, currentPlayer, onMoveSelect, gameStatus, humanPlayerColor }) => {
  
  const getCellForToken = (token: Token): { row: number; col: number } => {
    if (token.status === 'base') {
      if (!BASE_TOKEN_POSITIONS[token.player]) {
        return {row: -1, col: -1}; 
      }
      return { row: BASE_TOKEN_POSITIONS[token.player][token.position][0], col: BASE_TOKEN_POSITIONS[token.player][token.position][1] };
    }
    if (token.status === 'track') {
      const trackPos = calculateGlobalTrackPosition(token); // This uses token.pathProgress and token.player's start offset
      if (trackPos === -1 || trackPos >= TRACK_COORDINATES.length) return {row: -1, col: -1}; // Safety check
      return { row: TRACK_COORDINATES[trackPos][0], col: TRACK_COORDINATES[trackPos][1] };
    }
    if (token.status === 'home') {
      if (!HOME_PATH_COORDINATES[token.player]) {
        return {row: -1, col: -1}; 
      }
      // token.position for 'home' status is the 0-indexed step into the home column.
      const homePos = Math.min(token.position, HOME_PATH_COORDINATES[token.player].length - 1);
      return { row: HOME_PATH_COORDINATES[token.player][homePos][0], col: HOME_PATH_COORDINATES[token.player][homePos][1] };
    }
    return { row: -1, col: -1 }; 
  };

  const tokensByCell: Record<string, Token[]> = {};
  tokens.forEach(token => {
    const { row, col } = getCellForToken(token);
    if (row === -1 && col === -1) return; 
    const key = `${row}-${col}`;
    if (!tokensByCell[key]) {
      tokensByCell[key] = [];
    }
    tokensByCell[key].push(token);
  });


  return (
    <div className="ludo-board-grid shadow-2xl rounded-lg overflow-hidden">
      {BOARD_CELLS.map((cellDef, index) => {
        const cellKey = `${cellDef.row}-${cellDef.col}`;
        const tokensInCell = tokensByCell[cellKey] || [];
        
        const isHighlightedMoveTarget = highlightedMoves.find(move => {
          const movingToken = tokens.find(t => t.id === move.tokenId);
          if (!movingToken) return false;

          if (move.newStatus === 'track') {
            // move.newPosition for 'track' is the pathProgress from the player's start
            // We need to convert this to a global track position
            const playerStartOffset = PLAYER_START_OFFSETS[movingToken.player];
            const globalTargetTrackPos = (playerStartOffset + move.newPosition) % TRACK_LENGTH;
            if (globalTargetTrackPos >= TRACK_COORDINATES.length) return false; // Safety check
            return TRACK_COORDINATES[globalTargetTrackPos][0] === cellDef.row && TRACK_COORDINATES[globalTargetTrackPos][1] === cellDef.col;
          }
          
          if (move.newStatus === 'home') {
            // move.newPosition for 'home' is the 0-indexed step into the home column
            if (!HOME_PATH_COORDINATES[movingToken.player] || move.newPosition >= HOME_PATH_COORDINATES[movingToken.player].length) return false;
            return HOME_PATH_COORDINATES[movingToken.player][move.newPosition][0] === cellDef.row && HOME_PATH_COORDINATES[movingToken.player][move.newPosition][1] === cellDef.col;
          }
          // If moving to base (e.g. from a rule not yet implemented, or future enhancement)
          if (move.newStatus === 'base') {
              if (!BASE_TOKEN_POSITIONS[movingToken.player] || move.newPosition >= BASE_TOKEN_POSITIONS[movingToken.player].length) return false;
              return BASE_TOKEN_POSITIONS[movingToken.player][move.newPosition][0] === cellDef.row && BASE_TOKEN_POSITIONS[movingToken.player][move.newPosition][1] === cellDef.col;
          }
          return false;
        });

        const cellClickHandler = isHighlightedMoveTarget ? () => onMoveSelect(isHighlightedMoveTarget) : undefined;

        return (
          <BoardCell key={index} cell={cellDef} onClick={cellClickHandler} isHighlighted={!!isHighlightedMoveTarget}>
            {tokensInCell.map((token, tokenIndex) => (
              <TokenPiece
                key={token.id}
                token={token}
                onClick={() => onTokenSelect(token)}
                isSelected={token.id === selectedTokenId}
                isCurrentPlayerToken={token.player === currentPlayer && gameStatus === 'SELECT_TOKEN'}
                isHumanPlayerToken={token.player === humanPlayerColor}
                relativeIndex={tokenIndex} 
                totalInCell={tokensInCell.length}
              />
            ))}
          </BoardCell>
        );
      })}
    </div>
  );
};

export default Board;