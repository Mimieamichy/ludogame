
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { GameState, Token, ValidMove, PlayerColor } from '@/types/ludo';
import { INITIAL_GAME_STATE, PLAYER_NAMES, ACTIVE_PLAYER_COLORS } from '@/lib/ludo-constants';
import { rollDice, applyMove, getAllPossibleMoves, playerHasAnyMoves, passTurn } from '@/lib/ludo-logic';
import Board from './Board';
import Dice from './Dice';
import PlayerPanel from './PlayerPanel';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LucideAlertTriangle } from 'lucide-react';

export default function LudoGame() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE());
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [validMovesForSelectedToken, setValidMovesForSelectedToken] = useState<ValidMove[]>([]);
  const [highlightedMoves, setHighlightedMoves] = useState<ValidMove[]>([]);
  const [showPassButton, setShowPassButton] = useState(false);


  useEffect(() => {
    if (gameState.gameStatus === 'START_GAME') {
        // Could add a "Start Game" button here if needed
        // For now, auto-transitions to first player's turn
        setGameState(prev => ({...prev, gameStatus: 'ROLL_DICE'}));
    }
  }, [gameState.gameStatus]);

  const handleDiceRoll = useCallback(() => {
    if (gameState.gameStatus !== 'ROLL_DICE' || gameState.diceRolledInTurn) return;

    const diceResult = rollDice();
    
    setGameState(prev => {
      const newState = { ...prev, diceValue: diceResult, diceRolledInTurn: true, rolledSix: diceResult === 6 };
      const hasMoves = playerHasAnyMoves(newState);
      
      if (hasMoves) {
        return { ...newState, gameStatus: 'SELECT_TOKEN', message: `${PLAYER_NAMES[prev.currentPlayer]} rolled a ${diceResult}. Select a token to move.` };
      } else {
        setShowPassButton(true);
        return { ...newState, gameStatus: 'ROLL_DICE', message: `${PLAYER_NAMES[prev.currentPlayer]} rolled a ${diceResult}. No valid moves. Pass turn.` };
      }
    });
  }, [gameState]);

  const handleTokenSelect = useCallback((token: Token) => {
    if (gameState.gameStatus !== 'SELECT_TOKEN' || token.player !== gameState.currentPlayer || !gameState.diceValue) {
      setSelectedTokenId(null);
      setValidMovesForSelectedToken([]);
      setHighlightedMoves([]);
      return;
    }
    
    setSelectedTokenId(token.id);
    const moves = getAllPossibleMoves({ ...gameState }); // Ensure we pass current dice value
    setValidMovesForSelectedToken(moves.filter(m => m.tokenId === token.id));
    setHighlightedMoves(moves.filter(m => m.tokenId === token.id));

  }, [gameState]);
  
  const handleMoveSelect = useCallback((move: ValidMove) => {
    if (gameState.gameStatus !== 'SELECT_TOKEN' || !selectedTokenId || !validMovesForSelectedToken.find(m => m.newPosition === move.newPosition && m.newStatus === move.newStatus)) {
      return;
    }
    
    setGameState(prev => applyMove(prev, move));
    setSelectedTokenId(null);
    setValidMovesForSelectedToken([]);
    setHighlightedMoves([]);
    setShowPassButton(false);
  }, [gameState, selectedTokenId, validMovesForSelectedToken]);

  const handlePassTurn = useCallback(() => {
    if (showPassButton && gameState.gameStatus === 'ROLL_DICE' && gameState.diceRolledInTurn) {
        setGameState(prev => passTurn(prev));
        setShowPassButton(false);
    }
  }, [showPassButton, gameState]);

  const handleResetGame = () => {
    setGameState(INITIAL_GAME_STATE());
    setSelectedTokenId(null);
    setValidMovesForSelectedToken([]);
    setHighlightedMoves([]);
    setShowPassButton(false);
  };

  useEffect(() => {
    // Auto-pass if dice rolled, in SELECT_TOKEN, but no moves available for any token
    // This state should ideally be caught by playerHasAnyMoves after dice roll
    if (gameState.gameStatus === 'SELECT_TOKEN' && gameState.diceValue && !playerHasAnyMoves(gameState)) {
        setShowPassButton(true);
        setGameState(prev => ({...prev, message: `${PLAYER_NAMES[prev.currentPlayer]} has no valid moves with a ${prev.diceValue}. Pass turn.`}));
    }
  }, [gameState]);


  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-100 to-stone-200 dark:from-slate-800 dark:to-stone-900">
      <header className="mb-6 text-center">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-red-500">
          Ludo Master
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

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 w-full max-w-6xl">
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

        <div className="flex flex-col items-center md:items-start space-y-6 p-6 bg-card rounded-xl shadow-xl">
          <PlayerPanel
            currentPlayer={gameState.currentPlayer}
            diceValue={gameState.diceValue}
            message={gameState.message}
            gameStatus={gameState.gameStatus}
          />
          
          <Dice
            value={gameState.diceValue}
            onRoll={handleDiceRoll}
            disabled={gameState.gameStatus !== 'ROLL_DICE' || gameState.diceRolledInTurn || gameState.gameStatus === 'GAME_OVER'}
          />

          {showPassButton && (
             <Button onClick={handlePassTurn} variant="outline" className="w-full" disabled={gameState.gameStatus === 'GAME_OVER'}>
                Pass Turn
            </Button>
          )}
          
          <Button onClick={handleResetGame} variant="destructive" className="w-full mt-auto">
            Reset Game
          </Button>
        </div>
      </div>
      <footer className="mt-8 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Ludo Master. Built with Next.js & Tailwind CSS.</p>
      </footer>
    </div>
  );
}
