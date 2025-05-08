
export type PlayerColor = 'RED' | 'GREEN' | 'YELLOW' | 'BLUE';
export const PLAYER_COLORS: PlayerColor[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
// export const ACTIVE_PLAYER_COLORS: PlayerColor[] = ['RED', 'GREEN', 'YELLOW', 'BLUE']; // For 4-player game
export const ACTIVE_PLAYER_COLORS: PlayerColor[] = ['RED', 'YELLOW']; // For 2-player game

export type TokenStatus = 'base' | 'track' | 'home';

export interface Token {
  id: string; // e.g., RED-0, YELLOW-2
  player: PlayerColor;
  status: TokenStatus;
  position: number; // if 'base', index in base (0-3); if 'track', pathProgress from player's start; if 'home', index in home column (0-5)
  pathProgress: number; // total squares effectively moved from player's start, used for game logic and determining home entry
}

export interface GameState {
  tokens: Token[];
  currentPlayer: PlayerColor;
  diceValues: [number, number] | null; // Stores the result of the two dice rolled
  pendingDiceValues: number[]; // Stores dice values yet to be played in the current turn
  rolledDoubles: boolean; // True if the current roll was a double
  diceRolledInTurn: boolean; // True if dice has been rolled for the current turn phase
  gameStatus: 'COLOR_SELECTION' | 'ROLL_DICE' | 'SELECT_TOKEN' | 'GAME_OVER' | 'START_GAME';
  winner: PlayerColor | null;
  message: string; // To display game messages/instructions
  humanPlayerColor: PlayerColor | null; // Identifies the color controlled by the human player
  aiPlayerColor?: PlayerColor | null; // Identifies the color controlled by the AI player
  // numConsecutiveDoubles: number; // For future advanced rules like 3 doubles penalty
}

export interface ValidMove {
  tokenId: string;
  newPosition: number; // New 'position' value for the token based on its newStatus
  newStatus: TokenStatus;
  newPathProgress: number; // Updated pathProgress for the token
  captureTargetId?: string; // ID of token to be captured
  dieValueUsed: number; // Which die value generated this move
}

export interface BoardCell {
  row: number;
  col: number;
  type: 'base' | 'track' | 'homepath' | 'center' | 'entry';
  playerColor?: PlayerColor; // For base, homepath, entry
  isSafe?: boolean; // For track cells
  isStart?: PlayerColor; // Marks start square for a player
}

