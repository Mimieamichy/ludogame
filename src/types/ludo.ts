
export type PlayerColor = 'RED' | 'GREEN' | 'YELLOW' | 'BLUE';
export const PLAYER_COLORS: PlayerColor[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
export const ACTIVE_PLAYER_COLORS: PlayerColor[] = ['RED', 'YELLOW']; // For 2-player game

export type TokenStatus = 'base' | 'track' | 'home';

export interface Token {
  id: string; // e.g., RED-0, YELLOW-2
  player: PlayerColor;
  status: TokenStatus;
  position: number; // if 'track', 0-51 (global track); if 'home', 0-5 (home column); if 'base', 0-3 (index in base)
  pathProgress: number; // total squares moved on track from player's start, to handle home entry
}

export interface GameState {
  tokens: Token[];
  currentPlayer: PlayerColor;
  diceValue: number | null;
  diceRolledInTurn: boolean; // True if dice has been rolled for the current part of the turn
  rolledSix: boolean; // True if current valid roll was a six, grants another roll if move made
  gameStatus: 'ROLL_DICE' | 'SELECT_TOKEN' | 'GAME_OVER' | 'START_GAME';
  winner: PlayerColor | null;
  message: string; // To display game messages/instructions
}

export interface ValidMove {
  tokenId: string;
  newPosition: number;
  newStatus: TokenStatus;
  newPathProgress: number;
  captureTargetId?: string; // ID of token to be captured
}

export interface BoardCell {
  row: number;
  col: number;
  type: 'base' | 'track' | 'homepath' | 'center' | 'entry';
  playerColor?: PlayerColor; // For base, homepath, entry
  isSafe?: boolean; // For track cells
  isStart?: PlayerColor; // Marks start square for a player
}