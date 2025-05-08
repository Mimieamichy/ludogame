
import type { GameState, Token, PlayerColor, ValidMove } from '@/types/ludo';
import { ACTIVE_PLAYER_COLORS } from '@/types/ludo'; // Import directly from types
import {
  PLAYER_START_OFFSETS,
  PLAYER_HOME_ENTRY_POINTS,
  TRACK_LENGTH,
  HOME_COLUMN_LENGTH,
  TOKENS_PER_PLAYER,
  SAFE_SQUARE_INDICES,
  SIX_REQUIRED_TO_MOVE_OUT,
  ROLL_DOUBLES_GETS_ANOTHER_TURN,
  CAPTURE_SENDS_TO_BASE,
  HOME_ENTRY_EXACT_ROLL_REQUIRED,
  PLAYER_NAMES,
  // ACTIVE_PLAYER_COLORS is now imported from @/types/ludo
} from './ludo-constants';

export function rollDice(): [number, number] {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
}

export function getNextPlayer(currentPlayer: PlayerColor): PlayerColor {
  const currentIndex = ACTIVE_PLAYER_COLORS.indexOf(currentPlayer);
  return ACTIVE_PLAYER_COLORS[(currentIndex + 1) % ACTIVE_PLAYER_COLORS.length];
}

// Calculates the global track coordinate (0-51) for a token on the track.
export function calculateGlobalTrackPosition(token: Token): number {
  if (token.status !== 'track') return -1; 
  // pathProgress for track tokens is 0 to TRACK_LENGTH - 1 (i.e., 0 to 51)
  // It represents steps taken *from their specific starting square*.
  const playerStart = PLAYER_START_OFFSETS[token.player];
  return (playerStart + token.pathProgress) % TRACK_LENGTH;
}


export function getValidMovesForDie(state: GameState, tokenId: string, dieValue: number): ValidMove[] {
  const tokenToMove = state.tokens.find(t => t.id === tokenId);
  if (!tokenToMove || tokenToMove.player !== state.currentPlayer) return [];

  const validMoves: ValidMove[] = [];
  const playerStartOffset = PLAYER_START_OFFSETS[tokenToMove.player];
  // playerHomeEntry is the global track index *before* the player's home path.
  // A token starting at playerStartOffset completes TRACK_LENGTH-1 steps on the main track to reach this point.
  const globalTrackPosForHomeEntry = PLAYER_HOME_ENTRY_POINTS[tokenToMove.player];


  if (tokenToMove.status === 'base') {
    if (dieValue === 6 || (!SIX_REQUIRED_TO_MOVE_OUT && dieValue > 0)) {
      const startGlobalPos = playerStartOffset;
      let captureTargetId: string | undefined = undefined;

      // Check for captures only against active AI player's tokens if AI player exists
      const opponentPlayer = state.aiPlayerColor && state.aiPlayerColor !== tokenToMove.player ? state.aiPlayerColor : null;

      state.tokens.forEach(otherToken => {
        if (
          otherToken.player !== tokenToMove.player &&
          (opponentPlayer === null || otherToken.player === opponentPlayer) && // Only consider opponent if defined
          otherToken.status === 'track' &&
          calculateGlobalTrackPosition(otherToken) === startGlobalPos &&
          !SAFE_SQUARE_INDICES.includes(startGlobalPos)
        ) {
          captureTargetId = otherToken.id;
        }
      });
      
      validMoves.push({
        tokenId: tokenToMove.id,
        newPosition: 0, // For 'track' status, newPosition becomes its pathProgress from its start (0)
        newStatus: 'track',
        newPathProgress: 0, 
        captureTargetId,
        dieValueUsed: dieValue,
      });
    }
  } else if (tokenToMove.status === 'track') {
    const currentPathProgress = tokenToMove.pathProgress; // This is 0 to TRACK_LENGTH-1
    const newProposedPathProgress = currentPathProgress + dieValue;

    // Check if moving into home column.
    if (currentPathProgress < TRACK_LENGTH && newProposedPathProgress >= TRACK_LENGTH) {
        const stepsIntoHomeColumn = newProposedPathProgress - TRACK_LENGTH;
        if (stepsIntoHomeColumn < HOME_COLUMN_LENGTH -1) { 
             validMoves.push({
                tokenId: tokenToMove.id,
                newPosition: stepsIntoHomeColumn, 
                newStatus: 'home',
                newPathProgress: newProposedPathProgress, 
                dieValueUsed: dieValue,
             });
        } else if (stepsIntoHomeColumn === HOME_COLUMN_LENGTH - 1) { 
             validMoves.push({
                tokenId: tokenToMove.id,
                newPosition: stepsIntoHomeColumn, 
                newStatus: 'home',
                newPathProgress: newProposedPathProgress,
                dieValueUsed: dieValue,
            });
        } 
    } else if (newProposedPathProgress < TRACK_LENGTH) { 
        const newGlobalTrackPos = (playerStartOffset + newProposedPathProgress) % TRACK_LENGTH;
        let captureTargetId: string | undefined = undefined;
        
        const opponentPlayer = state.aiPlayerColor && state.aiPlayerColor !== tokenToMove.player ? state.aiPlayerColor : null;

        state.tokens.forEach(otherToken => {
            if (
                otherToken.player !== tokenToMove.player &&
                (opponentPlayer === null || otherToken.player === opponentPlayer) &&
                otherToken.status === 'track' &&
                calculateGlobalTrackPosition(otherToken) === newGlobalTrackPos &&
                !SAFE_SQUARE_INDICES.includes(newGlobalTrackPos)
            ) {
                captureTargetId = otherToken.id;
            }
        });

        validMoves.push({
            tokenId: tokenToMove.id,
            newPosition: newProposedPathProgress, 
            newStatus: 'track',
            newPathProgress: newProposedPathProgress,
            captureTargetId,
            dieValueUsed: dieValue,
        });
    } 

  } else if (tokenToMove.status === 'home') {
    const currentHomePos = tokenToMove.position; 
    const newHomePos = currentHomePos + dieValue;

    if (newHomePos < HOME_COLUMN_LENGTH - 1) { 
      validMoves.push({
        tokenId: tokenToMove.id,
        newPosition: newHomePos,
        newStatus: 'home',
        newPathProgress: tokenToMove.pathProgress + dieValue, 
        dieValueUsed: dieValue,
      });
    } else if (newHomePos === HOME_COLUMN_LENGTH - 1) { 
       validMoves.push({
        tokenId: tokenToMove.id,
        newPosition: newHomePos, 
        newStatus: 'home',
        newPathProgress: tokenToMove.pathProgress + dieValue,
        dieValueUsed: dieValue,
      });
    } else if (!HOME_ENTRY_EXACT_ROLL_REQUIRED && newHomePos > HOME_COLUMN_LENGTH -1) {
        validMoves.push({
            tokenId: tokenToMove.id,
            newPosition: HOME_COLUMN_LENGTH - 1, 
            newStatus: 'home',
            newPathProgress: tokenToMove.pathProgress + dieValue, 
            dieValueUsed: dieValue,
        });
    }
  }
  return validMoves;
}


export function getAllPossibleMoves(state: GameState): ValidMove[] {
  if (state.pendingDiceValues.length === 0 || state.gameStatus !== 'SELECT_TOKEN') return [];
  
  let allMoves: ValidMove[] = [];
  const uniquePendingDice = Array.from(new Set(state.pendingDiceValues)); 

  state.tokens
    .filter(token => token.player === state.currentPlayer && 
                     (token.status !== 'home' || token.position < HOME_COLUMN_LENGTH - 1))
    .forEach(token => {
      uniquePendingDice.forEach(dieValue => { 
        allMoves.push(...getValidMovesForDie(state, token.id, dieValue));
      });
    });
  return allMoves;
}

export function applyMove(currentState: GameState, move: ValidMove): GameState {
  const newState: GameState = JSON.parse(JSON.stringify(currentState)); 

  const movedTokenIndex = newState.tokens.findIndex(t => t.id === move.tokenId);
  if (movedTokenIndex === -1) return currentState; 

  newState.tokens[movedTokenIndex].status = move.newStatus;
  newState.tokens[movedTokenIndex].position = move.newPosition; 
  newState.tokens[movedTokenIndex].pathProgress = move.newPathProgress;

  const dieValueIndex = newState.pendingDiceValues.indexOf(move.dieValueUsed);
  if (dieValueIndex > -1) {
    newState.pendingDiceValues.splice(dieValueIndex, 1);
  } else if (newState.rolledDoubles && newState.pendingDiceValues.includes(move.dieValueUsed)) {
     const firstInstanceOfDouble = newState.pendingDiceValues.findIndex(d => d === move.dieValueUsed);
     if (firstInstanceOfDouble > -1) newState.pendingDiceValues.splice(firstInstanceOfDouble, 1);
  }


  if (move.captureTargetId && CAPTURE_SENDS_TO_BASE) {
    const capturedTokenIndex = newState.tokens.findIndex(t => t.id === move.captureTargetId);
    if (capturedTokenIndex !== -1) {
      const capturedPlayer = newState.tokens[capturedTokenIndex].player;
      newState.tokens[capturedTokenIndex].status = 'base';
      const baseSlots = newState.tokens
        .filter(t => t.player === capturedPlayer && t.status === 'base')
        .map(t => t.position);
      let newBasePos = 0;
      while(baseSlots.includes(newBasePos) && newBasePos < TOKENS_PER_PLAYER) {
        newBasePos++;
      }
      newState.tokens[capturedTokenIndex].position = newBasePos;
      newState.tokens[capturedTokenIndex].pathProgress = -1; 
      newState.message = `${PLAYER_NAMES[newState.tokens[movedTokenIndex].player]} captured ${PLAYER_NAMES[capturedPlayer]}'s token with a ${move.dieValueUsed}!`;
    }
  } else {
    newState.message = `${PLAYER_NAMES[newState.tokens[movedTokenIndex].player]} moved a token with a ${move.dieValueUsed}.`;
  }

  const playerTokens = newState.tokens.filter(t => t.player === newState.currentPlayer);
  const allHome = playerTokens.every(t => t.status === 'home' && t.position === HOME_COLUMN_LENGTH - 1);
  if (allHome) {
    newState.gameStatus = 'GAME_OVER';
    newState.winner = newState.currentPlayer;
    newState.message = `${PLAYER_NAMES[newState.currentPlayer]} wins! Congratulations!`;
    return newState;
  }

  if (newState.pendingDiceValues.length > 0) {
      const hasMoreMoves = playerHasAnyMoves(newState);
      if(hasMoreMoves) {
        newState.gameStatus = 'SELECT_TOKEN';
        newState.message += ` Play remaining die/dice: ${newState.pendingDiceValues.join(', ')}.`;
      } else {
        if (newState.rolledDoubles && ROLL_DOUBLES_GETS_ANOTHER_TURN) {
             newState.gameStatus = 'ROLL_DICE';
             newState.diceValues = null; 
             newState.pendingDiceValues = [];
             newState.diceRolledInTurn = false; 
             newState.message = `No more moves for ${PLAYER_NAMES[currentState.currentPlayer]} with pending dice. Rolled doubles, roll again!`;
        } else {
            newState.currentPlayer = getNextPlayer(newState.currentPlayer);
            newState.gameStatus = 'ROLL_DICE';
            newState.diceValues = null;
            newState.pendingDiceValues = [];
            newState.rolledDoubles = false;
            newState.diceRolledInTurn = false;
            newState.message = `No valid moves left for ${PLAYER_NAMES[currentState.currentPlayer]}. ${PLAYER_NAMES[newState.currentPlayer]}'s turn.`;
        }
      }
  } else { 
    if (newState.rolledDoubles && ROLL_DOUBLES_GETS_ANOTHER_TURN) {
      newState.gameStatus = 'ROLL_DICE';
      newState.diceValues = null; 
      newState.pendingDiceValues = [];
      newState.diceRolledInTurn = false; 
      newState.message += ` Rolled doubles, roll again!`;
    } else {
      newState.currentPlayer = getNextPlayer(newState.currentPlayer);
      newState.gameStatus = 'ROLL_DICE';
      newState.diceValues = null;
      newState.pendingDiceValues = [];
      newState.rolledDoubles = false;
      newState.diceRolledInTurn = false;
      newState.message = `${PLAYER_NAMES[newState.currentPlayer]}'s turn. Roll the dice.`;
    }
  }
  
  return newState;
}

export function passTurn(currentState: GameState): GameState {
    const newState = JSON.parse(JSON.stringify(currentState)) as GameState;
    if (newState.rolledDoubles && ROLL_DOUBLES_GETS_ANOTHER_TURN && newState.pendingDiceValues.length === (newState.diceValues?.[0] === newState.diceValues?.[1] ? 4 : 2) ) { 
        newState.gameStatus = 'ROLL_DICE';
        newState.diceValues = null;
        newState.pendingDiceValues = [];
        newState.diceRolledInTurn = false;
        newState.message = `No moves for ${PLAYER_NAMES[currentState.currentPlayer]}. Rolled doubles, ${PLAYER_NAMES[currentState.currentPlayer]} rolls again.`;
    } else {
        newState.currentPlayer = getNextPlayer(newState.currentPlayer);
        newState.gameStatus = 'ROLL_DICE';
        newState.diceValues = null;
        newState.pendingDiceValues = [];
        newState.rolledDoubles = false;
        newState.diceRolledInTurn = false;
        newState.message = `Turn passed. ${PLAYER_NAMES[newState.currentPlayer]}'s turn. Roll the dice.`;
    }
    return newState;
}

export function playerHasAnyMoves(state: GameState): boolean {
  if (state.pendingDiceValues.length === 0) return false;
  const playerTokens = state.tokens.filter(t => t.player === state.currentPlayer);
  for (const token of playerTokens) {
      if (token.status === 'home' && token.position === HOME_COLUMN_LENGTH - 1) continue; 
      
      const uniquePendingDice = Array.from(new Set(state.pendingDiceValues));
      for (const dieValue of uniquePendingDice) {
        if (getValidMovesForDie(state, token.id, dieValue).length > 0) {
            return true;
        }
      }
  }
  return false;
}

