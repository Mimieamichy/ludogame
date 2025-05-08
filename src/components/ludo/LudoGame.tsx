
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { GameState, Token, ValidMove, PlayerColor } from '@/types/ludo';
import { ACTIVE_PLAYER_COLORS } from '@/types/ludo'; 
import { INITIAL_GAME_STATE, PLAYER_NAMES, PLAYER_TAILWIND_COLORS } from '@/lib/ludo-constants';
import { rollDice, applyMove, getAllPossibleMoves, playerHasAnyMoves, passTurn } from '@/lib/ludo-logic';
import Board from './Board';
import Dice from './Dice';
import PlayerPanel from './PlayerPanel';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LucideAlertTriangle, RotateCcw, Users, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function LudoGame() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE());
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [highlightedMoves, setHighlightedMoves] = useState<ValidMove[]>([]);
  const [showPassButton, setShowPassButton] = useState(false);


  useEffect(() => {
    if (gameState.gameStatus === 'START_GAME' && gameState.humanPlayerColor && gameState.aiPlayerColor) {
        setGameState(prev => ({
            ...prev, 
            gameStatus: 'ROLL_DICE',
            currentPlayer: prev.humanPlayerColor!, 
            message: `${PLAYER_NAMES[prev.humanPlayerColor!]}'s turn. Roll the dice.`
        }));
    }
  }, [gameState.gameStatus, gameState.humanPlayerColor, gameState.aiPlayerColor]);


  const handleColorSelect = (color: PlayerColor) => {
    const aiColor = ACTIVE_PLAYER_COLORS.find(c => c !== color);
    if (!aiColor) {
        console.error("Could not assign AI color");
        setGameState(prev => ({...prev, message: "Error setting up AI player. Please reset."}));
        return;
    }

    setGameState(prev => ({
        ...INITIAL_GAME_STATE(), // Reset game state first
        humanPlayerColor: color,
        aiPlayerColor: aiColor,
        currentPlayer: color, 
        gameStatus: 'ROLL_DICE', 
        message: `You are ${PLAYER_NAMES[color]}. AI is ${PLAYER_NAMES[aiColor]}. Your turn, roll the dice!`
    }));
  };


  const handleDiceRoll = useCallback(() => {
    if (gameState.gameStatus !== 'ROLL_DICE' || gameState.diceRolledInTurn || gameState.currentPlayer !== gameState.humanPlayerColor) return;

    const diceResults = rollDice(); 
    const isDoubles = diceResults[0] === diceResults[1];
    
    setGameState(prev => {
      const newPendingDice = isDoubles ? 
        [diceResults[0], diceResults[0], diceResults[0], diceResults[0]] : 
        [diceResults[0], diceResults[1]];

      let newState = { 
        ...prev, 
        diceValues: diceResults,
        pendingDiceValues: newPendingDice,
        rolledDoubles: isDoubles,
        diceRolledInTurn: true 
      };
      const hasMoves = playerHasAnyMoves(newState);
      
      if (hasMoves) {
        return { ...newState, gameStatus: 'SELECT_TOKEN', message: `You rolled ${diceResults[0]} & ${diceResults[1]}. Select a token.` };
      } else {
        setShowPassButton(true);
        // Keep gameStatus as ROLL_DICE to allow passing, message updated by useEffect later if pass needed
        return { ...newState, gameStatus: 'ROLL_DICE', message: `You rolled ${diceResults[0]} & ${diceResults[1]}. No valid moves. Pass turn.` };
      }
    });
  }, [gameState.gameStatus, gameState.diceRolledInTurn, gameState.humanPlayerColor, gameState.currentPlayer]);

  const handleTokenSelect = useCallback((token: Token) => {
    if (gameState.gameStatus !== 'SELECT_TOKEN' || token.player !== gameState.currentPlayer || gameState.pendingDiceValues.length === 0 || gameState.currentPlayer !== gameState.humanPlayerColor) {
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
    ) || gameState.currentPlayer !== gameState.humanPlayerColor) {
        return;
    }
    
    const nextGameState = applyMove(gameState, move);
    setGameState(nextGameState);
    setSelectedTokenId(null); 
    
    if (nextGameState.gameStatus === 'SELECT_TOKEN' && nextGameState.pendingDiceValues.length > 0) {
        // Re-evaluate moves for the current player with remaining dice
        const currentTokenIdIfStillSelected = nextGameState.tokens.find(t => t.id === selectedTokenId && t.player === nextGameState.currentPlayer) ? selectedTokenId : null;
        
        if(currentTokenIdIfStillSelected) {
            const allPossible = getAllPossibleMoves(nextGameState);
            setHighlightedMoves(allPossible.filter(m => m.tokenId === currentTokenIdIfStillSelected));
        } else {
            setHighlightedMoves(getAllPossibleMoves(nextGameState)); // Or empty if no token should be auto-selected
        }
    } else {
        setHighlightedMoves([]);
    }
    setShowPassButton(false); 
  }, [gameState, selectedTokenId, highlightedMoves]);

  const handlePassTurn = useCallback(() => {
    if (gameState.currentPlayer !== gameState.humanPlayerColor) return; 
    // Allow passing if:
    // 1. Dice rolled, status is ROLL_DICE (meaning no moves were found immediately after roll)
    // 2. Status is SELECT_TOKEN, but no moves are actually possible with current pending dice
    if (showPassButton && 
        ( (gameState.gameStatus === 'ROLL_DICE' && gameState.diceRolledInTurn) || 
          (gameState.gameStatus === 'SELECT_TOKEN' && !playerHasAnyMoves(gameState)) 
        )
       ) {
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
    // AI Player Logic
    if (gameState.humanPlayerColor && gameState.aiPlayerColor && gameState.currentPlayer === gameState.aiPlayerColor && gameState.gameStatus !== 'GAME_OVER' && gameState.gameStatus !== 'COLOR_SELECTION') {
        const aiActionTimeout = setTimeout(() => {
            if (gameState.gameStatus === 'ROLL_DICE' && !gameState.diceRolledInTurn) {
                const diceResults = rollDice();
                const isDoubles = diceResults[0] === diceResults[1];
                setGameState(prev => {
                    const newPendingDice = isDoubles ? [diceResults[0], diceResults[0], diceResults[0], diceResults[0]] : [diceResults[0], diceResults[1]];
                    let newState = { ...prev, diceValues: diceResults, pendingDiceValues: newPendingDice, rolledDoubles: isDoubles, diceRolledInTurn: true };
                    const hasMoves = playerHasAnyMoves(newState);
                    if (hasMoves) {
                        return { ...newState, gameStatus: 'SELECT_TOKEN', message: `AI (${PLAYER_NAMES[prev.currentPlayer!]}) rolled ${diceResults[0]} & ${diceResults[1]}. AI is thinking...` };
                    } else {
                         // If AI has no moves after rolling, pass turn
                        return passTurn({...newState, message: `AI (${PLAYER_NAMES[prev.currentPlayer!]}) rolled ${diceResults[0]} & ${diceResults[1]}. No moves. Passing.`});
                    }
                });
            } else if (gameState.gameStatus === 'SELECT_TOKEN') {
                const possibleMoves = getAllPossibleMoves(gameState);
                if (possibleMoves.length > 0) {
                    // Basic AI: Prefer moves that capture or move out of base, or move furthest
                    let bestMove = possibleMoves[0]; // Default to the first valid move
                    // Simple AI strategy:
                    // 1. Capture if possible
                    // 2. Move token out of base if possible (especially with a 6)
                    // 3. Move token furthest on track
                    // 4. Move token into home path
                    // 5. Move token within home path (closest to home)
                    let priorityMove: ValidMove | null = null;

                    for (const move of possibleMoves) {
                        const tokenBeingMoved = gameState.tokens.find(t => t.id === move.tokenId)!;
                        if (move.captureTargetId) { priorityMove = move; break; } // Highest priority: capture
                        if (tokenBeingMoved.status === 'base' && move.newStatus === 'track') { // Second: move out of base
                            if (!priorityMove || priorityMove.newStatus !== 'track') priorityMove = move;
                        }
                    }
                    if (priorityMove) {
                        bestMove = priorityMove;
                    } else { // If no capture or move-out, pick a "good" move
                        possibleMoves.sort((a, b) => {
                            const tokenA = gameState.tokens.find(t => t.id === a.tokenId)!;
                            const tokenB = gameState.tokens.find(t => t.id === b.tokenId)!;

                            // Prefer moving into home over staying on track
                            if (a.newStatus === 'home' && b.newStatus === 'track') return -1;
                            if (b.newStatus === 'home' && a.newStatus === 'track') return 1;

                            // If both moving into/within home, prefer closer to final spot
                            if (a.newStatus === 'home' && b.newStatus === 'home') {
                                return b.newPosition - a.newPosition; // Higher position (closer to end) is better
                            }
                            // If both on track, prefer moving further
                            if (a.newStatus === 'track' && b.newStatus === 'track') {
                                return b.newPathProgress - a.newPathProgress;
                            }
                            return 0;
                        });
                        bestMove = possibleMoves[0];
                    }
                    setGameState(applyMove(gameState, bestMove));
                } else { // No possible moves for AI with current dice
                     setGameState(passTurn(gameState));
                }
            }
        }, 1500 + Math.random() * 1000); // Add some variability to AI thinking time

        return () => clearTimeout(aiActionTimeout);
    }


    // UI updates for human player
    if (gameState.currentPlayer === gameState.humanPlayerColor) {
        if (gameState.gameStatus === 'SELECT_TOKEN' && gameState.pendingDiceValues.length > 0) {
            const hasMoves = playerHasAnyMoves(gameState);
            if (!hasMoves) {
                setShowPassButton(true);
                const currentPendingDice = gameState.pendingDiceValues.length > 0 ? gameState.pendingDiceValues.join(' & ') : "any dice";
                setGameState(prev => ({
                    ...prev, 
                    message: `You have no valid moves with pending dice: ${currentPendingDice}. Pass turn.`
                }));
            } else {
                 setShowPassButton(false); 
                const allPlayerMoves = getAllPossibleMoves(gameState);
                if (selectedTokenId) {
                     const movesForSelected = allPlayerMoves.filter(m => m.tokenId === selectedTokenId);
                     setHighlightedMoves(movesForSelected);
                     if(movesForSelected.length === 0 && allPlayerMoves.length > 0) {
                         // Selected token has no moves with current dice, but other tokens might.
                         // Clear selection to allow player to pick another token, or show pass if no other token has moves.
                         setSelectedTokenId(null); 
                         // No, don't set highlighted to allPlayerMoves, player must explicitly select another.
                         // If they can't, the !hasMoves above will catch it for overall pass.
                     }
                } else {
                     setHighlightedMoves([]); 
                }
            }
        } else if (gameState.gameStatus === 'ROLL_DICE' && gameState.diceRolledInTurn && !playerHasAnyMoves(gameState)) {
            // This covers the case where dice are rolled, but no moves are found immediately
            setShowPassButton(true);
            setGameState(prev => ({
                ...prev, 
                message: `You rolled ${prev.diceValues ? prev.diceValues.join(' & ') : ''}. No valid moves. Pass turn.`
            }));
        } else if (gameState.gameStatus !== 'SELECT_TOKEN') { // e.g. back to ROLL_DICE or GAME_OVER
            setHighlightedMoves([]); 
            setSelectedTokenId(null); 
            setShowPassButton(false); 
        }
    } else { // AI's turn or game over/color selection
        setHighlightedMoves([]);
        setSelectedTokenId(null);
        setShowPassButton(false);
    }
    

  }, [gameState, selectedTokenId]);


  if (gameState.gameStatus === 'COLOR_SELECTION' || !gameState.humanPlayerColor) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-100 to-stone-200 dark:from-slate-800 dark:to-stone-900 text-foreground">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 flex items-center justify-center">
                        <Palette className="mr-3 h-8 w-8" /> Choose Your Color
                    </CardTitle>
                    <CardDescription className="text-center text-muted-foreground">
                        Select which color you want to play as. The AI will take the other color.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                    {ACTIVE_PLAYER_COLORS.map(color => (
                        <Button
                            key={color}
                            onClick={() => handleColorSelect(color)}
                            className={cn(
                                "w-full h-20 text-xl font-semibold transition-all duration-200 ease-in-out transform hover:scale-105 shadow-lg",
                                PLAYER_TAILWIND_COLORS[color].bg,
                                PLAYER_TAILWIND_COLORS[color].text === 'text-yellow-900' ? 'text-black hover:text-white' : 'text-white',
                                `hover:${PLAYER_TAILWIND_COLORS[color].bg}/90`
                            )}
                        >
                            {PLAYER_NAMES[color].split('(')[1].replace(')','')} {/* Extracts color name e.g. "Red" */}
                        </Button>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-100 to-stone-200 dark:from-slate-800 dark:to-stone-900 text-foreground">
      <header className="mb-6 text-center">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-red-500">
          Ludo Master Pro
        </h1>
        <p className="text-muted-foreground">Two Player Mode: You vs AI</p>
      </header>

      {gameState.gameStatus === 'GAME_OVER' && gameState.winner && (
        <Alert variant="default" className="mb-4 max-w-md bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-700">
          <LucideAlertTriangle className="h-5 w-5 text-green-700 dark:text-green-400" />
          <AlertTitle className="font-bold text-green-800 dark:text-green-300">Game Over!</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            {PLAYER_NAMES[gameState.winner]} wins! Congratulations!
            {gameState.winner !== gameState.humanPlayerColor && gameState.winner === gameState.aiPlayerColor && " (AI)"}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 w-full max-w-7xl items-start">
        <div className="hidden md:flex flex-col items-center space-y-2 p-4 bg-card rounded-lg shadow-md self-start mt-[calc(5rem+24px)]"> 
             <h3 className="text-xl font-semibold text-muted-foreground mb-2 flex items-center"><Users className="mr-2 h-5 w-5"/>Players</h3>
             {ACTIVE_PLAYER_COLORS.map(color => (
                <div 
                    key={color} 
                    className={`p-3 rounded-md w-full text-center font-medium transition-all duration-300 text-sm
                        ${color === gameState.currentPlayer 
                            ? `${PLAYER_TAILWIND_COLORS[color].bg} ${PLAYER_TAILWIND_COLORS[color].text === 'text-yellow-900' ? 'text-black' : 'text-white'} shadow-lg scale-105 ring-2 ring-offset-2 ${PLAYER_TAILWIND_COLORS[color].border}` 
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                >
                    {PLAYER_NAMES[color]} {color === gameState.humanPlayerColor ? "(You)" : (color === gameState.aiPlayerColor ? "(AI)" : "")}
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
            humanPlayerColor={gameState.humanPlayerColor}
          />
        </div>

        <div className="flex flex-col items-center md:items-start space-y-6 p-6 bg-card rounded-xl shadow-xl self-start">
          <PlayerPanel
            currentPlayer={gameState.currentPlayer}
            diceValues={gameState.diceValues}
            pendingDiceValues={gameState.pendingDiceValues}
            message={gameState.message}
            gameStatus={gameState.gameStatus}
            isHumanPlayer={gameState.currentPlayer === gameState.humanPlayerColor}
            humanPlayerColor={gameState.humanPlayerColor}
          />
          
          <Dice
            values={gameState.diceValues}
            pendingDiceValues={gameState.pendingDiceValues}
            onRoll={handleDiceRoll}
            disabled={gameState.gameStatus !== 'ROLL_DICE' || gameState.diceRolledInTurn || gameState.gameStatus === 'GAME_OVER' || gameState.currentPlayer !== gameState.humanPlayerColor}
          />

          {showPassButton && gameState.currentPlayer === gameState.humanPlayerColor && (
             <Button onClick={handlePassTurn} variant="outline" className="w-full" disabled={gameState.gameStatus === 'GAME_OVER' || !(gameState.gameStatus === 'ROLL_DICE' && gameState.diceRolledInTurn && !playerHasAnyMoves(gameState)) && !(gameState.gameStatus === 'SELECT_TOKEN' && !playerHasAnyMoves(gameState))  }>
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
        <p>&copy; {new Date().getFullYear()} Mae Techs.</p>
      </footer>
    </div>
  );
}

