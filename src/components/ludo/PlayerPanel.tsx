
"use client";

import React from 'react';
import type { PlayerColor, GameState } from '@/types/ludo';
import { PLAYER_NAMES, PLAYER_TAILWIND_COLORS } from '@/lib/ludo-constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { UserCircle, Info, Dices, Bot, Smile } from 'lucide-react';

interface PlayerPanelProps {
  currentPlayer: PlayerColor;
  diceValues: [number, number] | null; 
  pendingDiceValues: number[]; 
  message: string;
  gameStatus: GameState['gameStatus'];
  isHumanPlayer: boolean;
  humanPlayerColor: PlayerColor | null;
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({ currentPlayer, diceValues, pendingDiceValues, message, gameStatus, isHumanPlayer, humanPlayerColor }) => {
  const playerStyle = PLAYER_TAILWIND_COLORS[currentPlayer];

  return (
    <Card className={cn("w-full max-w-sm shadow-lg border-2", playerStyle.border)}>
      <CardHeader className={cn("p-4 rounded-t-lg", playerStyle.bg)}>
        <CardTitle className={cn("text-xl font-bold flex items-center justify-between", playerStyle.text === 'text-yellow-900' ? 'text-black' : 'text-white')}>
          <span className="flex items-center">
            <UserCircle className="mr-2 h-6 w-6" />
            Turn: {PLAYER_NAMES[currentPlayer]}
          </span>
          {humanPlayerColor && (currentPlayer === humanPlayerColor ? <Smile className="h-6 w-6" title="You"/> : <Bot className="h-6 w-6" title="AI Player"/>)}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {diceValues !== null && (gameStatus === 'SELECT_TOKEN' || (gameStatus === 'ROLL_DICE' && pendingDiceValues.length > 0 /* means dice just rolled but no moves */) ) && (
          <div className="text-lg">
            <span className="font-semibold">Dice Rolled:</span>{' '}
            <span className={cn("font-bold text-2xl", playerStyle.text)}>
              {diceValues[0]} & {diceValues[1]}
            </span>
          </div>
        )}
         {pendingDiceValues.length > 0 && gameStatus === 'SELECT_TOKEN' && (
            <div className="text-md text-muted-foreground flex items-center">
                <Dices className="mr-2 h-4 w-4 text-accent"/>
                <span>Playable dice: {pendingDiceValues.join(' or ')}</span>
            </div>
        )}
        <div className="p-3 bg-muted dark:bg-muted/50 rounded-md shadow-inner min-h-[60px] flex items-center">
            <Info className="h-5 w-5 mr-2 text-muted-foreground flex-shrink-0" />
            <p className="text-sm text-foreground italic">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerPanel;

