
import type { GameState, Token, PlayerColor, ValidMove } from '@/types/ludo';
import {
  PLAYER_START_OFFSETS,
  PLAYER_HOME_ENTRY_POINTS,
  TRACK_LENGTH,
  HOME_COLUMN_LENGTH,
  TOKENS_PER_PLAYER,
  SAFE_SQUARE_INDICES,
  SIX_REQUIRED_TO_MOVE_OUT,
  ROLL_SIX_GETS_ANOTHER_TURN,
  CAPTURE_SENDS_TO_BASE,
  HOME_ENTRY_EXACT_ROLL_REQUIRED,
  ACTIVE_PLAYER_COLORS,
  PLAYER_NAMES,
} from './ludo-constants';

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function getNextPlayer(currentPlayer: PlayerColor): PlayerColor {
  const currentIndex = ACTIVE_PLAYER_COLORS.indexOf(currentPlayer);
  return ACTIVE_PLAYER_COLORS[(currentIndex + 1) % ACTIVE_PLAYER_COLORS.length];
}

export function calculateTokenPathPosition(token: Token): number {
  if (token.status !== 'track') return -1; // Not on track
  const playerStart = PLAYER_START_OFFSETS[token.player];
  return (playerStart + token.pathProgress) % TRACK_LENGTH;
}

export function getValidMoves(state: GameState, tokenId: string): ValidMove[] {
  if (!state.diceValue) return [];

  const tokenToMove = state.tokens.find(t => t.id === tokenId);
  if (!tokenToMove || tokenToMove.player !== state.currentPlayer) return [];

  const dice = state.diceValue;
  const validMoves: ValidMove[] = [];

  const playerStartOffset = PLAYER_START_OFFSETS[tokenToMove.player];
  const playerHomeEntry = PLAYER_HOME_ENTRY_POINTS[tokenToMove.player];

  if (tokenToMove.status === 'base') {
    if (dice === 6 || (!SIX_REQUIRED_TO_MOVE_OUT && dice > 0)) { // Typically 6 required
      const startPositionOnTrack = playerStartOffset;
      let captureTargetId: string | undefined = undefined;

      // Check for capture at start position
      state.tokens.forEach(otherToken => {
        if (
          otherToken.player !== tokenToMove.player &&
          otherToken.status === 'track' &&
          calculateTokenPathPosition(otherToken) === startPositionOnTrack &&
          !SAFE_SQUARE_INDICES.includes(startPositionOnTrack)
        ) {
          captureTargetId = otherToken.id;
        }
      });
      
      validMoves.push({
        tokenId: tokenToMove.id,
        newPosition: startPositionOnTrack, // This is the logical track index
        newStatus: 'track',
        newPathProgress: 0,
        captureTargetId,
      });
    }
  } else if (tokenToMove.status === 'track') {
    const currentTrackPos = calculateTokenPathPosition(tokenToMove);
    let newPathProgress = tokenToMove.pathProgress + dice;

    // Check if moving into home column
    if (tokenToMove.pathProgress < TRACK_LENGTH && newPathProgress >= TRACK_LENGTH - (TRACK_LENGTH - 1 - playerHomeEntry + playerStartOffset) % TRACK_LENGTH ) {
      // More precisely, if current position + dice crosses playerHomeEntry
      // Simplified: if newPathProgress would put it past the point it should enter home.
      // The pathProgress for home entry is relative to the player's start.
      // A token completes 51 squares from its start to enter home.
      // This means pathProgress will be 51 when it enters its home path.
      
      const squaresToHomeEntry = (playerHomeEntry - currentTrackPos + TRACK_LENGTH) % TRACK_LENGTH;
      
      // If dice roll lands exactly on home entry or passes it
      if (dice > squaresToHomeEntry) {
          const homePathPosition = dice - (squaresToHomeEntry + 1);
          if (homePathPosition < HOME_COLUMN_LENGTH) {
             validMoves.push({
                tokenId: tokenToMove.id,
                newPosition: homePathPosition,
                newStatus: 'home',
                newPathProgress: tokenToMove.pathProgress + dice, // Continue tracking total for win condition
             });
          } else if (homePathPosition === HOME_COLUMN_LENGTH && HOME_ENTRY_EXACT_ROLL_REQUIRED) {
            // Exact roll needed for final spot, this logic needs adjustment
            // The pathProgress for 'home' status refers to steps into the home column (0-5)
          }
      }
    }

    // if it can enter the home column:
    const stepsNeededToReachHomeStart = (playerHomeEntry - currentTrackPos + TRACK_LENGTH) % TRACK_LENGTH;
    if (tokenToMove.pathProgress + dice > ( (playerHomeEntry - playerStartOffset + TRACK_LENGTH) % TRACK_LENGTH) ) { // Passes entry point
        const stepsIntoHomeColumn = (tokenToMove.pathProgress + dice) - ( (playerHomeEntry - playerStartOffset + TRACK_LENGTH) % TRACK_LENGTH +1);
        if (stepsIntoHomeColumn < HOME_COLUMN_LENGTH) { // Max 5 steps in home path + 1 for actual home
            validMoves.push({
                tokenId: tokenToMove.id,
                newPosition: stepsIntoHomeColumn,
                newStatus: 'home',
                newPathProgress: tokenToMove.pathProgress + dice,
            });
        } else if (stepsIntoHomeColumn === HOME_COLUMN_LENGTH && !HOME_ENTRY_EXACT_ROLL_REQUIRED) {
           // Reached home
             validMoves.push({
                tokenId: tokenToMove.id,
                newPosition: HOME_COLUMN_LENGTH -1, // final home spot
                newStatus: 'home',
                newPathProgress: tokenToMove.pathProgress + dice,
            });
        } else if (HOME_ENTRY_EXACT_ROLL_REQUIRED && stepsIntoHomeColumn === HOME_COLUMN_LENGTH -1) {
             validMoves.push({
                tokenId: tokenToMove.id,
                newPosition: HOME_COLUMN_LENGTH -1,
                newStatus: 'home',
                newPathProgress: tokenToMove.pathProgress + dice,
            });
        }
    } else { // Stays on main track
        const newTrackPos = (currentTrackPos + dice) % TRACK_LENGTH;
        let captureTargetId: string | undefined = undefined;
        // Check for capture
        state.tokens.forEach(otherToken => {
            if (
                otherToken.player !== tokenToMove.player &&
                otherToken.status === 'track' &&
                calculateTokenPathPosition(otherToken) === newTrackPos &&
                !SAFE_SQUARE_INDICES.includes(newTrackPos)
            ) {
                captureTargetId = otherToken.id;
            }
        });

        validMoves.push({
            tokenId: tokenToMove.id,
            newPosition: newTrackPos,
            newStatus: 'track',
            newPathProgress: tokenToMove.pathProgress + dice,
            captureTargetId,
        });
    }

  } else if (tokenToMove.status === 'home') {
    const newHomePos = tokenToMove.position + dice;
    if (newHomePos < HOME_COLUMN_LENGTH) {
      validMoves.push({
        tokenId: tokenToMove.id,
        newPosition: newHomePos,
        newStatus: 'home',
        newPathProgress: tokenToMove.pathProgress + dice, // pathProgress continues for win check
      });
    } else if (newHomePos === HOME_COLUMN_LENGTH -1 && HOME_ENTRY_EXACT_ROLL_REQUIRED) { // Arrived home
       validMoves.push({
        tokenId: tokenToMove.id,
        newPosition: HOME_COLUMN_LENGTH -1, // Index of the final home spot
        newStatus: 'home',
        newPathProgress: tokenToMove.pathProgress + dice,
      });
    }
  }
  return validMoves;
}

export function getAllPossibleMoves(state: GameState): ValidMove[] {
  if (!state.diceValue || state.gameStatus !== 'SELECT_TOKEN') return [];
  
  let allMoves: ValidMove[] = [];
  state.tokens
    .filter(token => token.player === state.currentPlayer)
    .forEach(token => {
      allMoves.push(...getValidMoves(state, token.id));
    });
  return allMoves;
}

export function applyMove(currentState: GameState, move: ValidMove): GameState {
  const newState = JSON.parse(JSON.stringify(currentState)) as GameState; // Deep copy

  const movedTokenIndex = newState.tokens.findIndex(t => t.id === move.tokenId);
  if (movedTokenIndex === -1) return currentState; // Should not happen

  newState.tokens[movedTokenIndex].status = move.newStatus;
  newState.tokens[movedTokenIndex].position = move.newPosition;
  newState.tokens[movedTokenIndex].pathProgress = move.newPathProgress;

  if (move.captureTargetId && CAPTURE_SENDS_TO_BASE) {
    const capturedTokenIndex = newState.tokens.findIndex(t => t.id === move.captureTargetId);
    if (capturedTokenIndex !== -1) {
      newState.tokens[capturedTokenIndex].status = 'base';
      // Find an empty base slot for the captured token
      const baseSlots = newState.tokens
        .filter(t => t.player === newState.tokens[capturedTokenIndex].player && t.status === 'base')
        .map(t => t.position);
      let newBasePos = 0;
      while(baseSlots.includes(newBasePos) && newBasePos < TOKENS_PER_PLAYER) {
        newBasePos++;
      }
      newState.tokens[capturedTokenIndex].position = newBasePos;
      newState.tokens[capturedTokenIndex].pathProgress = 0;
      newState.message = `${PLAYER_NAMES[newState.tokens[movedTokenIndex].player]} captured ${PLAYER_NAMES[newState.tokens[capturedTokenIndex].player]}'s token!`;
    }
  } else {
    newState.message = `${PLAYER_NAMES[newState.tokens[movedTokenIndex].player]} moved a token.`;
  }

  // Check for win condition
  const playerTokens = newState.tokens.filter(t => t.player === newState.currentPlayer);
  const allHome = playerTokens.every(t => t.status === 'home' && t.position === HOME_COLUMN_LENGTH -1); // All tokens in final home spot
  if (allHome) {
    newState.gameStatus = 'GAME_OVER';
    newState.winner = newState.currentPlayer;
    newState.message = `${PLAYER_NAMES[newState.currentPlayer]} wins! Congratulations!`;
    return newState;
  }

  // Handle next turn / dice roll
  if (newState.diceValue === 6 && ROLL_SIX_GETS_ANOTHER_TURN) {
    newState.rolledSix = true; // Mark that a six was used for a move
    newState.gameStatus = 'ROLL_DICE';
    newState.diceValue = null;
    newState.diceRolledInTurn = false;
    newState.message += ` Rolled a 6, roll again!`;
  } else {
    newState.currentPlayer = getNextPlayer(newState.currentPlayer);
    newState.gameStatus = 'ROLL_DICE';
    newState.diceValue = null;
    newState.rolledSix = false;
    newState.diceRolledInTurn = false;
    newState.message = `${PLAYER_NAMES[newState.currentPlayer]}'s turn. Roll the dice.`;
  }
  
  return newState;
}

export function passTurn(currentState: GameState): GameState {
    const newState = JSON.parse(JSON.stringify(currentState)) as GameState;
    newState.currentPlayer = getNextPlayer(newState.currentPlayer);
    newState.gameStatus = 'ROLL_DICE';
    newState.diceValue = null;
    newState.rolledSix = false;
    newState.diceRolledInTurn = false;
    newState.message = `Turn passed. ${PLAYER_NAMES[newState.currentPlayer]}'s turn. Roll the dice.`;
    return newState;
}

// Helper to check if a player has any valid moves at all
export function playerHasAnyMoves(state: GameState): boolean {
  if (!state.diceValue) return false;
  const playerTokens = state.tokens.filter(t => t.player === state.currentPlayer);
  for (const token of playerTokens) {
    if (getValidMoves(state, token.id).length > 0) {
      return true;
    }
  }
  return false;
}
