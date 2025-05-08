
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { GameState, Token, ValidMove, PlayerColor } from '@/types/ludo';
import { INITIAL_GAME_STATE, PLAYER_NAMES, ACTIVE_PLAYER_COLORS, PLAYER_TAILWIND_COLORS } from '@/lib/ludo-constants';
import { rollDice, applyMove, getAllPossibleMoves, playerHasAnyMoves, passTurn } from '@/lib/ludo-logic';
import Board from './Board';
import Dice from './Dice';
import PlayerPanel from './PlayerPanel';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LucideAlertTriangle, RotateCcw } from 'lucide-react';

export default function LudoGame() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE());
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [highlightedMoves, setHighlightedMoves] = useState<ValidMove[]>([]);
  const [showPassButton, setShowPassButton] = useState(false);


  useEffect(() => {
    if (gameState.gameStatus === 'START_GAME') {
        setGameState(prev => ({...prev, gameStatus: 'ROLL_DICE'}));
    }
  }, [gameState.gameStatus]);

  const handleDiceRoll = useCallback(() => {
    if (gameState.gameStatus !== 'ROLL_DICE' || gameState.diceRolledInTurn) return;

    const diceResults = rollDice(); 
    const isDoubles = diceResults[0] === diceResults[1];
    
    setGameState(prev => {
      const newPendingDice = isDoubles ? 
        [diceResults[0], diceResults[0], diceResults[0], diceResults[0]] : 
        [diceResults[0], diceResults[1]];

      const newState = { 
        ...prev, 
        diceValues: diceResults,
        pendingDiceValues: newPendingDice,
        rolledDoubles: isDoubles,
        diceRolledInTurn: true 
      };
      const hasMoves = playerHasAnyMoves(newState);
      
      if (hasMoves) {
        return { ...newState, gameStatus: 'SELECT_TOKEN', message: `${PLAYER_NAMES[prev.currentPlayer]} rolled ${diceResults[0]} & ${diceResults[1]}. Select a token.` };
      } else {
        setShowPassButton(true);
        return { ...newState, gameStatus: 'ROLL_DICE', message: `${PLAYER_NAMES[prev.currentPlayer]} rolled ${diceResults[0]} & ${diceResults[1]}. No valid moves. Pass turn.` };
      }
    });
  }, [gameState.gameStatus, gameState.diceRolledInTurn]);

  const handleTokenSelect = useCallback((token: Token) => {
    if (gameState.gameStatus !== 'SELECT_TOKEN' || token.player !== gameState.currentPlayer || gameState.pendingDiceValues.length === 0) {
      setSelectedTokenId(null);
      setHighlightedMoves([]);
      return;
    }
    
    setSelectedTokenId(token.id);
    const allMovesForPlayer = getAllPossibleMoves({ ...gameState });
    setHighlightedMoves(allMovesForPlayer.filter(m => m.tokenId === token.id));

  }, [gameState]);
  
  const handleMoveSelect = useCallback((move: ValidMove) => {
    if (gameState.gameStatus !== 'SELECT_TOKEN' || !selectedTokenId || !highlightedMoves.some(hm => 
        hm.tokenId === move.tokenId && 
        hm.newPosition === move.newPosition && 
        hm.newStatus === move.newStatus && 
        hm.dieValueUsed === move.dieValueUsed
    )) {
        return;
    }
    
    const nextGameState = applyMove(gameState, move);
    setGameState(nextGameState);
    setSelectedTokenId(null); 
    
    if (nextGameState.gameStatus === 'SELECT_TOKEN' && nextGameState.pendingDiceValues.length > 0) {
        setHighlightedMoves(getAllPossibleMoves(nextGameState));
    } else {
        setHighlightedMoves([]);
    }
    setShowPassButton(false); 
  }, [gameState, selectedTokenId, highlightedMoves]);

  const handlePassTurn = useCallback(() => {
    if (showPassButton && ((gameState.gameStatus === 'ROLL_DICE' && gameState.diceRolledInTurn) || 
                           (gameState.gameStatus === 'SELECT_TOKEN' && !playerHasAnyMoves(gameState))) ) {
        setGameState(prev => passTurn(prev));
        setSelectedTokenId(null);
        setHighlightedMoves([]);
        setShowPassButton(false);
    }
  }, [showPassButton, gameState]);

  const handleResetGame = () => {
    setGameState(INITIAL_GAME_STATE());
    setSelectedTokenId(null);
    setHighlightedMoves([]);
    setShowPassButton(false);
  };

  useEffect(() => {
    if (gameState.gameStatus === 'SELECT_TOKEN' && gameState.pendingDiceValues.length > 0) {
        const hasMoves = playerHasAnyMoves(gameState);
        if (!hasMoves) {
            setShowPassButton(true);
            // Ensure message reflects the actual pending dice
            const currentPendingDice = gameState.pendingDiceValues.length > 0 ? gameState.pendingDiceValues.join(', ') : "any dice";
            setGameState(prev => ({
                ...prev, 
                message: `${PLAYER_NAMES[prev.currentPlayer]} has no valid moves with pending dice: ${currentPendingDice}. Pass turn.`
            }));
        } else {
             setShowPassButton(false); // Has moves, so hide pass button
            // Refresh highlighted moves based on current selection or all possible moves
            const allPlayerMoves = getAllPossibleMoves(gameState);
            if (selectedTokenId) {
                 setHighlightedMoves(allPlayerMoves.filter(m => m.tokenId === selectedTokenId));
            } else {
                 setHighlightedMoves(allPlayerMoves); // Show all possible moves for current player
            }
        }
    } else if (gameState.gameStatus !== 'SELECT_TOKEN') {
        setHighlightedMoves([]); 
        setSelectedTokenId(null); 
        setShowPassButton(false); // Generally hide pass button outside select_token unless no moves from roll
    }
     // Special case: After rolling, if no moves, show pass button.
    if (gameState.gameStatus === 'ROLL_DICE' && gameState.diceRolledInTurn && gameState.diceValues && !playerHasAnyMoves(gameState)) {
        setShowPassButton(true);
    }

  }, [gameState, selectedTokenId]);


  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-100 to-stone-200 dark:from-slate-800 dark:to-stone-900 text-foreground">
      <header className="mb-6 text-center">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-red-500">
          Ludo Master Pro
        </h1>
      </header>

      {gameState.gameStatus === 'GAME_OVER' && gameState.winner && (
        <Alert variant="default" className="mb-4 max-w-md bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-700">
          <LucideAlertTriangle className="h-5 w-5 text-green-700 dark:text-green-400" />
          <AlertTitle className="font-bold text-green-800 dark:text-green-300">Game Over!</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            {PLAYER_NAMES[gameState.winner]} wins! Congratulations!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 w-full max-w-7xl items-start">
        <div className="hidden md:flex flex-col items-center space-y-2 p-4 bg-card rounded-lg shadow-md self-start mt-[calc(5rem+24px)]"> {/* Approximate alignment with PlayerPanel */}
             <h3 className="text-xl font-semibold text-muted-foreground mb-2">Players</h3>
             {ACTIVE_PLAYER_COLORS.map(color => (
                <div 
                    key={color} 
                    className={`p-2 rounded w-full text-center font-medium transition-all duration-300
                        ${color === gameState.currentPlayer 
                            ? `${PLAYER_TAILWIND_COLORS[color].bg} ${PLAYER_TAILWIND_COLORS[color].text === 'text-yellow-900' ? 'text-black' : 'text-white'} shadow-lg scale-105` 
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                >
                    {PLAYER_NAMES[color]}
                </div>
             ))}
        </div>
        
        <div className="flex justify-center items-center">
          <Board
            tokens={gameState.tokens}
            onTokenSelect={handleTokenSelect}
            selectedTokenId={selectedTokenId}
            highlightedMoves={highlightedMoves}
            currentPlayer={gameState.currentPlayer}
            onMoveSelect={handleMoveSelect}
            gameStatus={gameState.gameStatus}
          />
        </div>

        <div className="flex flex-col items-center md:items-start space-y-6 p-6 bg-card rounded-xl shadow-xl self-start">
          <PlayerPanel
            currentPlayer={gameState.currentPlayer}
            diceValues={gameState.diceValues}
            pendingDiceValues={gameState.pendingDiceValues}
            message={gameState.message}
            gameStatus={gameState.gameStatus}
          />
          
          <Dice
            values={gameState.diceValues}
            pendingDiceValues={gameState.pendingDiceValues}
            onRoll={handleDiceRoll}
            disabled={gameState.gameStatus !== 'ROLL_DICE' || gameState.diceRolledInTurn || gameState.gameStatus === 'GAME_OVER'}
          />

          {showPassButton && (
             <Button onClick={handlePassTurn} variant="outline" className="w-full" disabled={gameState.gameStatus === 'GAME_OVER'}>
                Pass Turn
            </Button>
          )}
          
          <Button onClick={handleResetGame} variant="destructive" className="w-full mt-auto">
            <RotateCcw className="mr-2 h-5 w-5" />
            Reset Game
          </Button>
        </div>
      </div>
      <footer className="mt-8 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Ludo Master Pro. Four Player - Two Dice Edition.</p>
      </footer>
    </div>
  );
}
