
import type { GameState, Token, PlayerColor, ValidMove } from '@/types/ludo';
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
  ACTIVE_PLAYER_COLORS, 
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

      state.tokens.forEach(otherToken => {
        if (
          otherToken.player !== tokenToMove.player &&
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
    // A player needs to complete TRACK_LENGTH steps from their start to *enter* the home column.
    // pathProgress TRACK_LENGTH means it has landed on the square *after* its home entry point, i.e., first step in home column.
    if (currentPathProgress < TRACK_LENGTH && newProposedPathProgress >= TRACK_LENGTH) {
        const stepsIntoHomeColumn = newProposedPathProgress - TRACK_LENGTH;
        if (stepsIntoHomeColumn < HOME_COLUMN_LENGTH -1) { // Moving within home path (0-4)
             validMoves.push({
                tokenId: tokenToMove.id,
                newPosition: stepsIntoHomeColumn, // For 'home' status, position is index in home column (0-5)
                newStatus: 'home',
                newPathProgress: newProposedPathProgress, 
                dieValueUsed: dieValue,
             });
        } else if (stepsIntoHomeColumn === HOME_COLUMN_LENGTH - 1) { // Reached exact final home spot (index 5)
             validMoves.push({
                tokenId: tokenToMove.id,
                newPosition: stepsIntoHomeColumn, 
                newStatus: 'home',
                newPathProgress: newProposedPathProgress,
                dieValueUsed: dieValue,
            });
        } // If exact roll required and it overshoots final spot, it's not a valid move for home.
          // If HOME_ENTRY_EXACT_ROLL_REQUIRED is false, overshooting means it just goes to the last spot. (Not implemented here for simplicity)
    } else if (newProposedPathProgress < TRACK_LENGTH) { // Stays on main track
        const newGlobalTrackPos = (playerStartOffset + newProposedPathProgress) % TRACK_LENGTH;
        let captureTargetId: string | undefined = undefined;
        
        state.tokens.forEach(otherToken => {
            if (
                otherToken.player !== tokenToMove.player &&
                otherToken.status === 'track' &&
                calculateGlobalTrackPosition(otherToken) === newGlobalTrackPos &&
                !SAFE_SQUARE_INDICES.includes(newGlobalTrackPos)
            ) {
                captureTargetId = otherToken.id;
            }
        });

        validMoves.push({
            tokenId: tokenToMove.id,
            newPosition: newProposedPathProgress, // For 'track' status, position is pathProgress
            newStatus: 'track',
            newPathProgress: newProposedPathProgress,
            captureTargetId,
            dieValueUsed: dieValue,
        });
    } // If newProposedPathProgress >= TRACK_LENGTH but doesn't land validly in home, it's not a move.

  } else if (tokenToMove.status === 'home') {
    const currentHomePos = tokenToMove.position; // This is 0-4 for path, 5 for final spot
    const newHomePos = currentHomePos + dieValue;

    if (newHomePos < HOME_COLUMN_LENGTH - 1) { // Moving within home path (0-4)
      validMoves.push({
        tokenId: tokenToMove.id,
        newPosition: newHomePos,
        newStatus: 'home',
        newPathProgress: tokenToMove.pathProgress + dieValue, 
        dieValueUsed: dieValue,
      });
    } else if (newHomePos === HOME_COLUMN_LENGTH - 1) { // Arrived at final home spot (index 5)
       validMoves.push({
        tokenId: tokenToMove.id,
        newPosition: newHomePos, 
        newStatus: 'home',
        newPathProgress: tokenToMove.pathProgress + dieValue,
        dieValueUsed: dieValue,
      });
    } else if (!HOME_ENTRY_EXACT_ROLL_REQUIRED && newHomePos > HOME_COLUMN_LENGTH -1) {
        // If exact roll not required, and overshot, counts as landing home (not standard, but for completion)
        validMoves.push({
            tokenId: tokenToMove.id,
            newPosition: HOME_COLUMN_LENGTH - 1, 
            newStatus: 'home',
            newPathProgress: tokenToMove.pathProgress + dieValue, // pathProgress still accumulates
            dieValueUsed: dieValue,
        });
    }
  }
  return validMoves;
}


export function getAllPossibleMoves(state: GameState): ValidMove[] {
  if (state.pendingDiceValues.length === 0 || state.gameStatus !== 'SELECT_TOKEN') return [];
  
  let allMoves: ValidMove[] = [];
  const uniquePendingDice = Array.from(new Set(state.pendingDiceValues)); // Use unique dice if player can choose

  state.tokens
    .filter(token => token.player === state.currentPlayer && 
                     (token.status !== 'home' || token.position < HOME_COLUMN_LENGTH - 1))
    .forEach(token => {
      uniquePendingDice.forEach(dieValue => { // Generate moves for each unique pending die value
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
  newState.tokens[movedTokenIndex].position = move.newPosition; // This is now correctly the new 'position' field value
  newState.tokens[movedTokenIndex].pathProgress = move.newPathProgress;

  const dieValueIndex = newState.pendingDiceValues.indexOf(move.dieValueUsed);
  if (dieValueIndex > -1) {
    newState.pendingDiceValues.splice(dieValueIndex, 1);
  } else if (newState.rolledDoubles && newState.pendingDiceValues.includes(move.dieValueUsed)) {
    // If it was doubles, all pending values are the same. Remove one.
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
      newState.tokens[capturedTokenIndex].pathProgress = -1; // Reset path progress
      newState.message = `${PLAYER_NAMES[newState.tokens[movedTokenIndex].player]} captured ${PLAYER_NAMES[capturedPlayer]}'s token with a ${move.dieValueUsed}!`;
       // If capture gives another turn (common house rule, not implemented here by default)
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
        // No more moves with remaining dice, pass turn effects
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
      // Note: `rolledDoubles` might be used for 3 consecutive doubles rule later.
      // For now, it just grants another turn.
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
    // If passing because of no moves after a roll, and that roll was doubles, player might still get another turn.
    if (newState.rolledDoubles && ROLL_DOUBLES_GETS_ANOTHER_TURN && newState.pendingDiceValues.length === (newState.diceValues?.[0] === newState.diceValues?.[1] ? 4 : 2) ) { // No moves made with any dice from a double roll
        newState.gameStatus = 'ROLL_DICE';
        newState.diceValues = null;
        newState.pendingDiceValues = [];
        // `rolledDoubles` stays true for consecutive check, or reset if not tracking that.
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
      
      // Check if any of the unique pending dice values can make a move with this token
      const uniquePendingDice = Array.from(new Set(state.pendingDiceValues));
      for (const dieValue of uniquePendingDice) {
        if (getValidMovesForDie(state, token.id, dieValue).length > 0) {
            return true;
        }
      }
  }
  return false;
}
