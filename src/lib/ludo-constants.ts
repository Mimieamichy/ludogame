import type { PlayerColor, BoardCell, Token, GameState } from '@/types/ludo';
import { PLAYER_COLORS as ALL_PLAYER_COLORS, ACTIVE_PLAYER_COLORS } from '@/types/ludo'; // Import ACTIVE_PLAYER_COLORS

export const TOKENS_PER_PLAYER = 4;
export const TRACK_LENGTH = 52; // Number of squares in the main track loop
export const HOME_COLUMN_LENGTH = 6; // 5 steps + 1 final home spot (indices 0-5)

export const PLAYER_START_OFFSETS: Record<PlayerColor, number> = {
  RED: 0,
  GREEN: 13,
  YELLOW: 26,
  BLUE: 39,
};

// This is the global track index *before* which a player enters their home column.
export const PLAYER_HOME_ENTRY_POINTS: Record<PlayerColor, number> = {
  RED: (PLAYER_START_OFFSETS.RED + TRACK_LENGTH - 1) % TRACK_LENGTH, 
  GREEN: (PLAYER_START_OFFSETS.GREEN + TRACK_LENGTH - 1) % TRACK_LENGTH, 
  YELLOW: (PLAYER_START_OFFSETS.YELLOW + TRACK_LENGTH - 1) % TRACK_LENGTH, 
  BLUE: (PLAYER_START_OFFSETS.BLUE + TRACK_LENGTH - 1) % TRACK_LENGTH,  
};


export const SAFE_SQUARE_INDICES: number[] = [
  PLAYER_START_OFFSETS.RED,
  PLAYER_START_OFFSETS.GREEN,
  PLAYER_START_OFFSETS.YELLOW,
  PLAYER_START_OFFSETS.BLUE,
  (PLAYER_START_OFFSETS.RED + 8) % TRACK_LENGTH,
  (PLAYER_START_OFFSETS.GREEN + 8) % TRACK_LENGTH,
  (PLAYER_START_OFFSETS.YELLOW + 8) % TRACK_LENGTH,
  (PLAYER_START_OFFSETS.BLUE + 8) % TRACK_LENGTH,
];


export const GRID_SIZE = 15;

export const BASE_TOKEN_POSITIONS: Record<PlayerColor, [number, number][]> = {
  RED:    [[1,1], [1,4], [4,1], [4,4]],
  GREEN:  [[1,10], [1,13], [4,10], [4,13]],
  YELLOW: [[10,10], [10,13], [13,10], [13,13]],
  BLUE:   [[10,1], [10,4], [13,1], [13,4]],
};

export const TRACK_COORDINATES: [number, number][] = [
    // Red Path (starts at [6,1], global index 0) - Moves UP then RIGHT
    [6,1],[5,1],[4,1],[3,1],[2,1],[1,1], // 0-5 (Red's first arm, UP on col 1)
    [0,1],                               // 6   (Red's top-left corner)
    [0,2],[0,3],[0,4],[0,5],[0,6],       // 7-11(Red's second arm, RIGHT on row 0)
    [0,7],                               // 12  (Red's top-right corner, leads to Green's path)

    // Green Path (starts at [1,8], global index 13) - Moves RIGHT then DOWN
    [1,8],[1,9],[1,10],[1,11],[1,12],[1,13], // 13-18 (Green's first arm, RIGHT on row 1)
    [1,14],                              // 19  (Green's top-right corner)
    [2,14],[3,14],[4,14],[5,14],[6,14],     // 20-24 (Green's second arm, DOWN on col 14)
    [7,14],                              // 25  (Green's bottom-right corner, leads to Yellow's path)

    // Yellow Path (starts at [8,13], global index 26) - Moves DOWN then LEFT
    [8,13],[9,13],[10,13],[11,13],[12,13],[13,13], // 26-31 (Yellow's first arm, DOWN on col 13)
    [14,13],                             // 32  (Yellow's bottom-right corner)
    [14,12],[14,11],[14,10],[14,9],[14,8],   // 33-37 (Yellow's second arm, LEFT on row 14)
    [14,7],                              // 38  (Yellow's bottom-left corner, leads to Blue's path)

    // Blue Path (starts at [13,6], global index 39) - Moves LEFT then UP
    [13,6],[13,5],[13,4],[13,3],[13,2],[13,1], // 39-44 (Blue's first arm, LEFT on row 13)
    [13,0],                              // 45  (Blue's bottom-left corner)
    [12,0],[11,0],[10,0],[9,0],[8,0],     // 46-50 (Blue's second arm, UP on col 0)
    [7,0],                               // 51  (Blue's top-left corner, leads to Red's path / home entry for Red)
];


export const HOME_PATH_COORDINATES: Record<PlayerColor, [number, number][]> = {
  RED:    [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],  // Moves RIGHT into home
  GREEN:  [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],  // Moves DOWN into home
  YELLOW: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]], // Moves LEFT into home
  BLUE:   [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]], // Moves UP into home
};

export const BOARD_CELLS: BoardCell[] = (() => {
  const cells: BoardCell[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      let cell: BoardCell = { row: r, col: c, type: 'center' }; 

      // Define Base areas
      if ((r >=0 && r <=5 && c >=0 && c <=5)) cell = { ...cell, type: 'base', playerColor: 'RED' };
      else if ((r >=0 && r <=5 && c >=9 && c <=14)) cell = { ...cell, type: 'base', playerColor: 'GREEN' };
      else if ((r >=9 && r <=14 && c >=9 && c <=14)) cell = { ...cell, type: 'base', playerColor: 'YELLOW' };
      else if ((r >=9 && r <=14 && c >=0 && c <=5)) cell = { ...cell, type: 'base', playerColor: 'BLUE' };

      // Define Track cells, including player start cells
      TRACK_COORDINATES.forEach((trackCoord, index) => {
        if (trackCoord[0] === r && trackCoord[1] === c) {
          cell = { 
            row: r, 
            col: c,
            type: 'track',
            isSafe: SAFE_SQUARE_INDICES.includes(index), 
          };
          // Assign playerColor and isStart for player-specific start cells
          if (index === PLAYER_START_OFFSETS.RED) { cell.isStart = 'RED'; cell.playerColor = 'RED';}
          else if (index === PLAYER_START_OFFSETS.GREEN) { cell.isStart = 'GREEN'; cell.playerColor = 'GREEN';}
          else if (index === PLAYER_START_OFFSETS.YELLOW) { cell.isStart = 'YELLOW'; cell.playerColor = 'YELLOW';}
          else if (index === PLAYER_START_OFFSETS.BLUE) { cell.isStart = 'BLUE'; cell.playerColor = 'BLUE';}
        }
      });

      // Define Home Path cells
      (Object.keys(HOME_PATH_COORDINATES) as PlayerColor[]).forEach(color => {
        HOME_PATH_COORDINATES[color].forEach(homeCoord => {
          if (homeCoord[0] === r && homeCoord[1] === c) {
            cell = { 
              row: r, 
              col: c, 
              type: 'homepath', 
              playerColor: color 
            };
          }
        });
      });
      
      // Define the central Home area (innermost part of the cross)
      if (r >= 6 && r <= 8 && c >= 6 && c <= 8) { 
        let isCenterHomePathEnd = false;
        (Object.keys(HOME_PATH_COORDINATES) as PlayerColor[]).forEach(color => {
            if (HOME_PATH_COORDINATES[color]) { 
                const finalHomePos = HOME_PATH_COORDINATES[color][HOME_COLUMN_LENGTH-1];
                if (finalHomePos[0] === r && finalHomePos[1] === c) {
                    isCenterHomePathEnd = true;
                }
            }
        });
        if (!isCenterHomePathEnd) { 
            cell = { row: r, col: c, type: 'center' }; 
        }
      }

      cells.push(cell);
    }
  }
  return cells;
})();

export const PLAYER_TAILWIND_COLORS: Record<PlayerColor, { bg: string, text: string, border: string, lightBg: string }> = {
  RED:    { bg: 'bg-red-500',    text: 'text-red-900',    border: 'border-red-700', lightBg: 'bg-red-200' },
  GREEN:  { bg: 'bg-green-500',  text: 'text-green-900',  border: 'border-green-700', lightBg: 'bg-green-200' },
  YELLOW: { bg: 'bg-yellow-400', text: 'text-yellow-900', border: 'border-yellow-600', lightBg: 'bg-yellow-100' },
  BLUE:   { bg: 'bg-blue-500',   text: 'text-blue-900',   border: 'border-blue-700', lightBg: 'bg-blue-200' },
};

export const PLAYER_TAILWIND_BG_LIGHT: Record<PlayerColor, string> = {
  RED: PLAYER_TAILWIND_COLORS.RED.lightBg,
  GREEN: PLAYER_TAILWIND_COLORS.GREEN.lightBg,
  YELLOW: PLAYER_TAILWIND_COLORS.YELLOW.lightBg,
  BLUE: PLAYER_TAILWIND_COLORS.BLUE.lightBg,
};

export const PLAYER_NAMES: Record<PlayerColor, string> = {
  RED: 'Player 1 (Red)',
  GREEN: 'Player 2 (Green)',
  YELLOW: 'Player 3 (Yellow)',
  BLUE: 'Player 4 (Blue)',
};

export const getInitialTokens = (): Token[] => {
  const tokens: Token[] = [];
  ACTIVE_PLAYER_COLORS.forEach(playerColor => { 
    for (let i = 0; i < TOKENS_PER_PLAYER; i++) {
      tokens.push({
        id: `${playerColor}-${i}`,
        player: playerColor,
        status: 'base',
        position: i, 
        pathProgress: -1, 
      });
    }
  });
  return tokens;
};

export const INITIAL_GAME_STATE: () => GameState = () => ({
  tokens: getInitialTokens(),
  currentPlayer: ACTIVE_PLAYER_COLORS[0], 
  diceValues: null,
  pendingDiceValues: [],
  rolledDoubles: false,
  diceRolledInTurn: false,
  gameStatus: 'COLOR_SELECTION', 
  winner: null,
  message: `Welcome to Ludo! ${ACTIVE_PLAYER_COLORS.length}-player game. Please select your color.`,
  humanPlayerColor: null,
  aiPlayerColor: null,
});


export const DICE_DOT_LAYOUTS: Record<number, string[]> = {
    1: ["col-start-2 row-start-2"], 
    2: ["col-start-1 row-start-1", "col-start-3 row-start-3"], 
    3: ["col-start-1 row-start-1", "col-start-2 row-start-2", "col-start-3 row-start-3"], 
    4: ["col-start-1 row-start-1", "col-start-3 row-start-1", "col-start-1 row-start-3", "col-start-3 row-start-3"], 
    5: ["col-start-1 row-start-1", "col-start-3 row-start-1", "col-start-2 row-start-2", "col-start-1 row-start-3", "col-start-3 row-start-3"], 
    6: ["col-start-1 row-start-1", "col-start-3 row-start-1", "col-start-1 row-start-2", "col-start-3 row-start-2", "col-start-1 row-start-3", "col-start-3 row-start-3"], 
};


export const SIX_REQUIRED_TO_MOVE_OUT = true;
export const ROLL_DOUBLES_GETS_ANOTHER_TURN = true; 
export const MAX_CONSECUTIVE_DOUBLES = 3; 
export const CAPTURE_SENDS_TO_BASE = true;
export const HOME_ENTRY_EXACT_ROLL_REQUIRED = true; 
export const STACKING_ALLOWED_ON_SAFE_SQUARES = true; 
export const STACKING_ALLOWED_IN_HOME_COLUMN = true;
