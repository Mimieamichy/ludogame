import type { GameState, Token, PlayerColor, ValidMove } from '@/types/ludo';
import { ACTIVE_PLAYER_COLORS } from '@/types/ludo'; // Import directly from types
import {
  PLAYER_START_OFFSETS,
  // PLAYER_HOME_ENTRY_POINTS, // Not directly used here, derived from pathProgress logic
  TRACK_LENGTH,
  HOME_COLUMN_LENGTH,
  TOKENS_PER_PLAYER,
  SAFE_SQUARE_INDICES,
  SIX_REQUIRED_TO_MOVE_OUT,
  ROLL_DOUBLES_GETS_ANOTHER_TURN,
  CAPTURE_SENDS_TO_BASE,
  HOME_ENTRY_EXACT_ROLL_REQUIRED,
  PLAYER_NAMES,
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

/**
 * Calculates the global track coordinate (0 to TRACK_LENGTH - 1) for a token on the track.
 * @param token The token for which to calculate the global track position.
 * @returns The global track position (0-51) or -1 if the token is not on the track or data is invalid.
 */
export function calculateGlobalTrackPosition(token: Token): number {
  if (token.status !== 'track') return -1;
  // token.pathProgress for 'track' status is its progress (0 to TRACK_LENGTH-1) from its player-specific start.
  const playerStartOffset = PLAYER_START_OFFSETS[token.player];
  // The global position is the player's start offset + their progress along the track, modulo track length.
  return (playerStartOffset + token.pathProgress) % TRACK_LENGTH;
}


/**
 * Generates valid moves for a specific token with a given die value.
 * - `token.position` meaning:
 *   - 'base': 0-3 index within the base.
 *   - 'track': This is effectively the token's `pathProgress` (0 to TRACK_LENGTH-1) relative to its player's start.
 *   - 'home': 0-indexed step into the home column (0 to HOME_COLUMN_LENGTH-1).
 * - `token.pathProgress` meaning:
 *   - 'base': -1 (or not applicable).
 *   - 'track': Steps taken on the main track from the player's start (0 to TRACK_LENGTH-1).
 *   - 'home': Total steps taken from player's start, including track and home path (e.g., TRACK_LENGTH + steps_in_home_column).
 */
export function getValidMovesForDie(state: GameState, tokenId: string, dieValue: number): ValidMove[] {
  const tokenToMove = state.tokens.find(t => t.id === tokenId);
  if (!tokenToMove || tokenToMove.player !== state.currentPlayer) return [];

  const validMoves: ValidMove[] = [];
  const playerStartOffset = PLAYER_START_OFFSETS[tokenToMove.player];

  if (tokenToMove.status === 'base') {
    if (dieValue === 6 || (!SIX_REQUIRED_TO_MOVE_OUT && dieValue > 0)) {
      const startGlobalPos = playerStartOffset; // Global position of the player's starting square
      let captureTargetId: string | undefined = undefined;

      const opponentPlayer = state.aiPlayerColor && state.aiPlayerColor !== tokenToMove.player ? state.aiPlayerColor : null;

      state.tokens.forEach(otherToken => {
        if (
          otherToken.player !== tokenToMove.player &&
          (opponentPlayer === null || otherToken.player === opponentPlayer) &&
          otherToken.status === 'track' &&
          calculateGlobalTrackPosition(otherToken) === startGlobalPos && // Check if opponent is on this start square
          !SAFE_SQUARE_INDICES.includes(startGlobalPos) // And it's not a safe square
        ) {
          captureTargetId = otherToken.id;
        }
      });
      
      validMoves.push({
        tokenId: tokenToMove.id,
        newPosition: 0, // For 'track' status, newPosition becomes its pathProgress from its start (0)
        newStatus: 'track',
        newPathProgress: 0, // Starting on the track, pathProgress relative to start is 0
        captureTargetId,
        dieValueUsed: dieValue,
      });
    }
  } else if (tokenToMove.status === 'track') {
    const currentTrackPathProgress = tokenToMove.position; // For 'track', position *is* pathProgress from player start
    const newProposedTotalPathProgress = tokenToMove.pathProgress + dieValue; // Update overall progress

    // Check if moving into home column.
    // A token is on the track if its currentTrackPathProgress < TRACK_LENGTH.
    // It enters home if newProposedTotalPathProgress reaches or exceeds TRACK_LENGTH.
    if (currentTrackPathProgress < TRACK_LENGTH && newProposedTotalPathProgress >= TRACK_LENGTH) {
        const stepsIntoHomeColumn = newProposedTotalPathProgress - TRACK_LENGTH; // 0-indexed for home path
        if (stepsIntoHomeColumn < HOME_COLUMN_LENGTH -1) { // Not yet the final spot
             validMoves.push({
                tokenId: tokenToMove.id,
                newPosition: stepsIntoHomeColumn, // Store 0-indexed home path position
                newStatus: 'home',
                newPathProgress: newProposedTotalPathProgress, // Store overall progress
                dieValueUsed: dieValue,
             });
        } else if (stepsIntoHomeColumn === HOME_COLUMN_LENGTH - 1) { // Reached the final home spot
             validMoves.push({
                tokenId: tokenToMove.id,
                newPosition: stepsIntoHomeColumn, // Final home spot index
                newStatus: 'home',
                newPathProgress: newProposedTotalPathProgress,
                dieValueUsed: dieValue,
            });
        } 
        // If HOME_ENTRY_EXACT_ROLL_REQUIRED is false and overshot, it's handled in 'home' status logic
        // or by simply not adding a move if it overshoots beyond the final spot.
    } else if (newProposedTotalPathProgress < TRACK_LENGTH) { // Still on the main track
        const newTrackPathProgress = newProposedTotalPathProgress; // pathProgress for track is just total path progress
        const newGlobalTrackPos = (playerStartOffset + newTrackPathProgress) % TRACK_LENGTH;
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
            newPosition: newTrackPathProgress, // Store new path progress (relative to player start) as position for track status
            newStatus: 'track',
            newPathProgress: newTrackPathProgress, // Overall progress matches track progress here
            captureTargetId,
            dieValueUsed: dieValue,
        });
    } 

  } else if (tokenToMove.status === 'home') {
    const currentHomePos = tokenToMove.position; // This is 0-indexed within the home column
    const newHomePos = currentHomePos + dieValue;
    const newTotalPathProgress = tokenToMove.pathProgress + dieValue;


    if (newHomePos < HOME_COLUMN_LENGTH - 1) { // Moving within the home path, not to the final spot yet
      validMoves.push({
        tokenId: tokenToMove.id,
        newPosition: newHomePos,
        newStatus: 'home',
        newPathProgress: newTotalPathProgress,
        dieValueUsed: dieValue,
      });
    } else if (newHomePos === HOME_COLUMN_LENGTH - 1) { // Moving to the final home spot
       validMoves.push({
        tokenId: tokenToMove.id,
        newPosition: newHomePos, 
        newStatus: 'home',
        newPathProgress: newTotalPathProgress,
        dieValueUsed: dieValue,
      });
    } else if (!HOME_ENTRY_EXACT_ROLL_REQUIRED && newHomePos > HOME_COLUMN_LENGTH - 1 && currentHomePos < HOME_COLUMN_LENGTH - 1 ) {
        // If exact roll not required, currently not in final spot, and overshot, allow moving to final spot.
        validMoves.push({
            tokenId: tokenToMove.id,
            newPosition: HOME_COLUMN_LENGTH - 1, // Move to final spot
            newStatus: 'home',
            newPathProgress: newTotalPathProgress, // Update progress normally, it represents effort
            dieValueUsed: dieValue,
        });
    }
    // If HOME_ENTRY_EXACT_ROLL_REQUIRED is true, or if already in final spot, overshooting is not allowed (no move generated).
  }
  return validMoves;
}


export function getAllPossibleMoves(state: GameState): ValidMove[] {
  if (state.pendingDiceValues.length === 0 || state.gameStatus !== 'SELECT_TOKEN') return [];
  
  let allMoves: ValidMove[] = [];
  const uniquePendingDice = Array.from(new Set(state.pendingDiceValues)); 

  state.tokens
    .filter(token => token.player === state.currentPlayer && 
                     (token.status !== 'home' || token.position < HOME_COLUMN_LENGTH - 1)) // Token not in final home spot
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

  // Update token properties
  newState.tokens[movedTokenIndex].status = move.newStatus;
  // `move.newPosition` is the local position for 'base'/'home', or pathProgress for 'track'.
  newState.tokens[movedTokenIndex].position = move.newPosition;
  newState.tokens[movedTokenIndex].pathProgress = move.newPathProgress; // Overall progress from player's start

  // Consume the die value used
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
        .map(t => t.position); // These are 0-3 indices
      let newBasePos = 0;
      while(baseSlots.includes(newBasePos) && newBasePos < TOKENS_PER_PLAYER) {
        newBasePos++;
      }
      newState.tokens[capturedTokenIndex].position = newBasePos; // Assign 0-3 index for base
      newState.tokens[capturedTokenIndex].pathProgress = -1; // Reset path progress for base tokens
      newState.message = `${PLAYER_NAMES[newState.tokens[movedTokenIndex].player]} captured ${PLAYER_NAMES[capturedPlayer]}'s token with a ${move.dieValueUsed}!`;
    }
  } else {
    newState.message = `${PLAYER_NAMES[newState.tokens[movedTokenIndex].player]} moved a token with a ${move.dieValueUsed}.`;
  }

  const playerTokens = newState.tokens.filter(t => t.player === newState.currentPlayer);
  const allHome = playerTokens.every(t => t.status === 'home' && t.position === HOME_COLUMN_LENGTH - 1); // All tokens reached final home spot
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
      newState.message += ` Rolled doubles, ${PLAYER_NAMES[currentState.currentPlayer]} rolls again!`;
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
    // If player rolled doubles, couldn't move with any of the 4 dice values, they still get to roll again.
    const wasDoublesAndAllDicePending = newState.rolledDoubles && 
                                      newState.diceValues && 
                                      newState.diceValues[0] === newState.diceValues[1] &&
                                      newState.pendingDiceValues.length === 4;
    // Or if not doubles, but normal roll and couldn't move with either of the 2 dice values.
    const wasNormalRollAndAllDicePending = !newState.rolledDoubles &&
                                           newState.diceValues &&
                                           newState.pendingDiceValues.length === 2;

    if (ROLL_DOUBLES_GETS_ANOTHER_TURN && wasDoublesAndAllDicePending) { 
        newState.gameStatus = 'ROLL_DICE';
        newState.diceValues = null;
        newState.pendingDiceValues = [];
        newState.diceRolledInTurn = false;
        // rolledDoubles status for the current player for this turn is maintained for potential "3 doubles" rule.
        // It will be freshly set by the next roll.
        newState.message = `No moves for ${PLAYER_NAMES[currentState.currentPlayer]}. Rolled doubles, ${PLAYER_NAMES[currentState.currentPlayer]} rolls again.`;
    } else {
        // Normal pass to next player
        newState.currentPlayer = getNextPlayer(newState.currentPlayer);
        newState.gameStatus = 'ROLL_DICE';
        newState.diceValues = null;
        newState.pendingDiceValues = [];
        newState.rolledDoubles = false; // Reset for the new player's turn
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

