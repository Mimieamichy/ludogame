
import type { PlayerColor, BoardCell, Token, GameState } from '@/types/ludo';
import { PLAYER_COLORS as ALL_PLAYER_COLORS, ACTIVE_PLAYER_COLORS as EXPORTED_ACTIVE_PLAYER_COLORS } from '@/types/ludo';

export const ACTIVE_PLAYER_COLORS = EXPORTED_ACTIVE_PLAYER_COLORS;

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
  PLAYER_START_OFFSETS.RED, // Red's start
  (PLAYER_START_OFFSETS.RED + 8) % TRACK_LENGTH, // A common safe spot after Red's start
  PLAYER_START_OFFSETS.GREEN, // Green's start
  (PLAYER_START_OFFSETS.GREEN + 8) % TRACK_LENGTH, // A common safe spot after Green's start
  PLAYER_START_OFFSETS.YELLOW, // Yellow's start
  (PLAYER_START_OFFSETS.YELLOW + 8) % TRACK_LENGTH, // A common safe spot after Yellow's start
  PLAYER_START_OFFSETS.BLUE, // Blue's start
  (PLAYER_START_OFFSETS.BLUE + 8) % TRACK_LENGTH, // A common safe spot after Blue's start
];


export const GRID_SIZE = 15;

export const BASE_TOKEN_POSITIONS: Record<PlayerColor, [number, number][]> = {
  RED:    [[1,1], [1,4], [4,1], [4,4]], // Top-left quadrant
  GREEN:  [[1,10], [1,13], [4,10], [4,13]], // Top-right quadrant
  YELLOW: [[10,10], [10,13], [13,10], [13,13]], // Bottom-right quadrant
  BLUE:   [[10,1], [10,4], [13,1], [13,4]], // Bottom-left quadrant
};

export const TRACK_COORDINATES: [number, number][] = [
    // Red Path (starts at RED_START_ROW, RED_START_COL = [6,1], global index 0) - Moves RIGHT then UP then RIGHT
    [6,1],[6,2],[6,3],[6,4],[6,5],      // 0-4 (RIGHT on row 6)
    [5,6],[4,6],[3,6],[2,6],[1,6],      // 5-9 (UP on col 6)
    [0,6],                              // 10 (Corner before turning to Green's area approach)
    [0,7],                              // 11 (Cell in the middle top row)
    [0,8],                              // 12 (Cell before Green's start area)

    // Green Path (starts at GREEN_START_ROW, GREEN_START_COL = [1,8], global index 13) - Moves UP then LEFT then UP
    [1,8],[2,8],[3,8],[4,8],[5,8],      // 13-17 (DOWN on col 8)
    [6,9],[6,10],[6,11],[6,12],[6,13],  // 18-22 (RIGHT on row 6)
    [6,14],                             // 23 (Corner before turning to Yellow's area approach)
    [7,14],                             // 24 (Cell in the middle right col)
    [8,14],                             // 25 (Cell before Yellow's start area)
    
    // Yellow Path (starts at YELLOW_START_ROW, YELLOW_START_COL = [8,13], global index 26) - Moves LEFT then DOWN then LEFT
    [8,13],[8,12],[8,11],[8,10],[8,9],  // 26-30 (LEFT on row 8)
    [9,8],[10,8],[11,8],[12,8],[13,8], // 31-35 (DOWN on col 8)
    [14,8],                             // 36 (Corner before turning to Blue's area approach)
    [14,7],                             // 37 (Cell in the middle bottom row)
    [14,6],                             // 38 (Cell before Blue's start area)

    // Blue Path (starts at BLUE_START_ROW, BLUE_START_COL = [13,6], global index 39) - Moves DOWN then RIGHT then DOWN
    [13,6],[12,6],[11,6],[10,6],[9,6],  // 39-43 (UP on col 6)
    [8,5],[8,4],[8,3],[8,2],[8,1],      // 44-48 (LEFT on row 8)
    [8,0],                              // 49 (Corner before turning to Red's area approach)
    [7,0],                              // 50 (Cell in the middle left col)
    [6,0],                              // 51 (Cell before Red's start area, completing the loop)
];


export const HOME_PATH_COORDINATES: Record<PlayerColor, [number, number][]> = {
  RED:    [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],  // Enters from column 0, moves RIGHT along row 7
  GREEN:  [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],  // Enters from row 0, moves DOWN along column 7 (THIS IS WRONG FOR STD LUDO, GREEN ENTERS FROM ITS RIGHT)
                                                // Correct Green: Enters from row 6 (global index 18-22), moves RIGHT along row 7.
                                                // New Green Home Path: [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]] is for top player entering down.
                                                // Traditional Green home path is from its right: e.g. [1,7] is start of home for green player on right.
                                                // Based on TRACK_COORDINATES, Green home entry is after [6,13] (idx 22) -> moves to [7,13] ... [7,8]
  // If Green track is [1,8]...[5,8] then [6,9]...[6,13], home path should be [2,7] [3,7] [4,7] [5,7] [6,7] [7,7]
  // For Green starting at [1,8] (top-right): moves DOWN column 8, then RIGHT on row 6. Home path is column 7, downwards.
  // Green home path: [1,7], [2,7], [3,7], [4,7], [5,7], [6,7] (if green is top player, this is correct for top to bottom)
  // Given standard board, Green is on the right. Track: [1,8] down, [6,9] right. Home entry from approx [7,14] or [6,14].
  // Green home path: [2,7], [3,7], [4,7], [5,7], [6,7], [7,7] (This is incorrect, green moves along a row into center)
  // Typical Green (right side player) home path: moves LEFT along row 7. e.g. from [7,13] to [7,8]
  // Let's correct GREEN and BLUE home paths based on typical Ludo board.
  // RED: [7,1],[7,2],[7,3],[7,4],[7,5],[7,6] -> Correct (moves right)
  // YELLOW: [7,13],[7,12],[7,11],[7,10],[7,9],[7,8] -> Correct (moves left)
  
  // For GREEN (Player on the right side, path ends at [6,14] before home): home path is [1,7],[2,7],[3,7],[4,7],[5,7],[6,7] (downwards on col 7)
  // This seems to be a common representation where green is on top.
  // If green is on the right, its home path is horizontal:
  // GREEN:  [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]], // This would be if Green was like Yellow but on top.
                                                      // The track for Green ends near [7,14] (idx 24). So home path is LEFT on row 7 from col 13 to 8.
                                                      // This is IDENTICAL TO YELLOW if Yellow's track ended there.
                                                      // Let's use standard Ludo paths:
                                                      // Red enters from left, moves right on row 7
                                                      // Green enters from top, moves down on col 7
                                                      // Yellow enters from right, moves left on row 7
                                                      // Blue enters from bottom, moves up on col 7
                                                      // --> This means YELLOW and BLUE HOME_PATH_COORDINATES need to be adjusted
                                                      // The provided TRACK_COORDINATES already define a clockwise path.
                                                      // Red enters home from approx [6,0] or [7,0] towards [7,1]..[7,6]
                                                      // Green enters home from approx [0,7] or [0,8] towards [1,7]..[6,7]
                                                      // Yellow enters home from approx [7,14] or [8,14] towards [7,13]..[7,8]
                                                      // Blue enters home from approx [14,7] or [14,6] towards [13,7]..[8,7]
  // Re-evaluating HOME_PATH_COORDINATES based on standard Ludo and clockwise TRACK_COORDINATES:
  // RED: Correct. Path ends near [6,0], home entry is [7,1]..[7,6] (moving right)
  // GREEN: Path ends near [0,8], home entry is [1,7]..[6,7] (moving down)
  // GREEN:  [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]], 
  // YELLOW: Path ends near [8,14], home entry is [7,13]..[7,8] (moving left) - This is correct for Yellow.
  YELLOW: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
  // BLUE: Path ends near [14,6], home entry is [13,7]..[8,7] (moving up)
  BLUE:   [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]], 
};

export const BOARD_CELLS: BoardCell[] = (() => {
  const cells: BoardCell[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      let cell: BoardCell = { row: r, col: c, type: 'center' }; 

      // Define Base areas (6x6 corners)
      if ((r >=0 && r <=5 && c >=0 && c <=5)) cell = { ...cell, type: 'base', playerColor: 'RED' }; // Top-left
      else if ((r >=0 && r <=5 && c >=9 && c <=14)) cell = { ...cell, type: 'base', playerColor: 'GREEN' }; // Top-right
      else if ((r >=9 && r <=14 && c >=9 && c <=14)) cell = { ...cell, type: 'base', playerColor: 'YELLOW' }; // Bottom-right
      else if ((r >=9 && r <=14 && c >=0 && c <=5)) cell = { ...cell, type: 'base', playerColor: 'BLUE' }; // Bottom-left

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
      // This is the 3x3 square in the middle: (6,6) to (8,8)
      if (r >= 6 && r <= 8 && c >= 6 && c <= 8) { 
        let isHomePathEnd = false;
        // Check if this specific cell is the *end* of a home path for any player
        (Object.keys(HOME_PATH_COORDINATES) as PlayerColor[]).forEach(color => {
            const playerHomePath = HOME_PATH_COORDINATES[color];
            if (playerHomePath && playerHomePath.length > 0) { 
                const finalHomeSpot = playerHomePath[HOME_COLUMN_LENGTH-1]; // The last cell in the home path
                if (finalHomeSpot[0] === r && finalHomeSpot[1] === c) {
                    isHomePathEnd = true; // This cell is indeed a final home spot for a player
                }
            }
        });
        // If it's part of the 3x3 center area BUT NOT a final home spot, it's 'center' type
        if (!isHomePathEnd) { 
            cell = { row: r, col: c, type: 'center' }; 
        }
        // If it IS a final home spot, its type ('homepath') and playerColor were already set above.
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
  GREEN: 'Player 2 (Green)', // Not used in 2-player
  YELLOW: 'Player 2 (Yellow)', // For 2-player mode, Yellow is P2
  BLUE: 'Player 4 (Blue)', // Not used in 2-player
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

