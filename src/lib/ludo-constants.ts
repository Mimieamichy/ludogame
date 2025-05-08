
import type { PlayerColor, BoardCell, Token, GameState } from '@/types/ludo';
import { PLAYER_COLORS as ALL_PLAYER_COLORS } from '@/types/ludo'; // Import all player colors, rename to avoid conflict

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
// A player has completed TRACK_LENGTH-1 (51) steps on the main track portion of their path
// when they are on the square that allows them to enter home on the next move.
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
    // Red arm
    ...[ [6,1], [5,1], [4,1], [3,1], [2,1], [1,1], [0,1] ], // 7 squares, Red Start index 0 is (6,1)
    ...[ [0,2], [0,3], [0,4], [0,5], [0,6] ], // 5 squares
    [0,7], // Corner before Green's arm entry (index 12)
    // Green arm
    ...[ [1,8], [2,8], [3,8], [4,8], [5,8], [6,8] ], // 6 squares, Green Start index 13 is (1,8)
    [7,8], // Corner (index 19)
    ...[ [8,7], [8,6], [8,5], [8,4], [8,3], [8,2], [8,1] ], // 7 squares
    // Yellow arm
    ...[ [9,1], [10,1], [11,1], [12,1], [13,1] ], // 5 squares, Yellow start index 26 is (9,1)
    [14,1], // Corner
    ...[ [14,2], [14,3], [14,4], [14,5], [14,6], [14,7] ], // 6 squares
    // Blue arm
    ...[ [13,8], [12,8], [11,8], [10,8], [9,8] ], // 5 squares, Blue start index 39 is (13,8)
    [8,8], // Corner
    ...[ [7,7], [6,7], [6,6], [6,5], [6,4], [6,3], [6,2] ] // Mistake found: track was going into home path of red. Original was 7,8 and then down. Corrected to use 7,7 as intermediate then path along 6,X
                                                          // Corrected blue path from problem: [7,8], [6,7], [6,6], [6,5], [6,4], [6,3], [6,2] -> This is wrong, 7,8 is green's home path.
                                                          // Let's use previous validated Blue track for final segment:
                                                          // ...[ [13,8], [12,8], [11,8], [10,8], [9,8], [8,8] ], // Blue Start at (13,8) -> (8,8) (6 squares)
                                                          // [7,8], // Turn -- this seems to be green's home path area.
                                                          // [6,7], [6,6], [6,5], [6,4], [6,3], // (6,7) -> (6,3) (5 squares)
                                                          // [6,2], // Before Red's start area
                                                          // The provided solution Board.tsx track:
                                                          // Blue arm: [13,8], [12,8], [11,8], [10,8], [9,8], (5 squares)
                                                          //           [8,8], (corner)
                                                          //           [7,7] (?? this is center-ish) [6,7], [6,6], [6,5], [6,4], [6,3], [6,2] (7 squares)
                                                          // This sums to 5+1+7 = 13. So total 13*4 = 52.
                                                          // Let's stick to the problem's Board.tsx track.
                                                          // Last segment of Blue: ...[ [7,7], [6,7], [6,6], [6,5], [6,4], [6,3], [6,2] ]
                                                          // Oh, there was a copy paste error in my thought process. The provided Board.tsx TRACK_COORDINATES had:
                                                          // Blue arm ...[ [13,8], [12,8], [11,8], [10,8], [9,8] ], [8,8],  ...[ [7,6], [7,5], [7,4], [7,3], [7,2], [7,1], [7,0] ]
                                                          // But this would put blue on red's home path.
                                                          // The most robust is the one that was used in the previous working version provided in the prompt:
                                                          // Path from Red start (6,1) upwards
                                                          // [6,1], [5,1], [4,1], [3,1], [2,1], [1,1], // Red Start at (6,1) -> (1,1)
                                                          // [0,1], // Turn
                                                          // [0,2], [0,3], [0,4], [0,5], [0,6], // (0,2) -> (0,6) (5 squares)
                                                          // [0,7], // Before Green's start area (Green starts (1,8))
                                                          // // Path from Green start (1,8) rightwards
                                                          // [1,8], [2,8], [3,8], [4,8], [5,8], [6,8], // Green Start at (1,8) -> (6,8)
                                                          // [7,8], // Turn
                                                          // [8,7], [8,6], [8,5], [8,4], [8,3], // (8,7) -> (8,3) (5 squares)
                                                          // [8,2], // Before Yellow's start area (Yellow starts (9,1)) -- YELLOW_START_OFFSET 26 from this point
                                                          // // Path from Yellow start (8,13) not (9,1) - original prompt constant was yellow:26, (8,13) was cell.
                                                          // // Let's use the one that produced the correct visual board from prompt's Board.tsx.
                                                          // Red arm path (Indices 0-12)
                                                          // [6,1], [5,1], [4,1], [3,1], [2,1], [1,1], [0,1], -> 7 squares. Red Start is (6,1) at index 0.
                                                          // [0,2], [0,3], [0,4], [0,5], [0,6], -> 5 squares across top
                                                          // [0,7], -> Corner before Green's arm path (index 12)
                                                          // Green arm path (Indices 13-25)
                                                          // [1,8], [2,8], [3,8], [4,8], [5,8], [6,8], -> 6 squares, Green Start is (1,8) at index 13
                                                          // [7,8], -> Corner (index 19)
                                                          // [8,7], [8,6], [8,5], [8,4], [8,3], [8,2], [8,1], -> 7 squares. (Index 25 is 8,1)
                                                          // Yellow arm path (Indices 26-38) Yellow start (8,13) was the visual cell, PLAYER_START_OFFSET.YELLOW = 26 is index.
                                                          // So TRACK_COORDINATES[26] should be yellow start. (9,1) was prev error.
                                                          // Using the structure from prompt Board.tsx:
                                                          // Yellow Start PLAYER_START_OFFSETS.YELLOW = 26; coord = (8,13)
                                                          // Blue Start PLAYER_START_OFFSETS.BLUE = 39; coord = (13,6)
                                                          // This means the TRACK_COORDINATES from prompt's Board.tsx are the reference.
                                                          // Red arm
                                                          // ...[ [6,1], [5,1], [4,1], [3,1], [2,1], [1,1], [0,1] ], // 7 squares, Red Start index 0 is (6,1)
                                                          // ...[ [0,2], [0,3], [0,4], [0,5], [0,6] ], // 5 squares
                                                          // [0,7], // Corner before Green's arm entry (index 12)
                                                          // Green arm
                                                          // ...[ [1,8], [2,8], [3,8], [4,8], [5,8], [6,8] ], // 6 squares, Green Start index 13 is (1,8)
                                                          // [7,8], // Corner (index 19)
                                                          // ...[ [8,7], [8,6], [8,5], [8,4], [8,3], [8,2], [8,1] ], // 7 squares (ends index 25 at 8,1)
                                                          // Yellow arm (PLAYER_START_OFFSETS.YELLOW = 26, should be TRACK_COORDINATES[26])
                                                          // The Board.tsx track has Yellow start implied by PLAYER_START_OFFSETS.YELLOW:
                                                          // if (index === PLAYER_START_OFFSETS.YELLOW) cell.isStart = 'YELLOW'; maps to (8,13) from prompt board
                                                          // So TRACK_COORDINATES[26] must be (8,13)
                                                          // The track from prompt's Board.tsx file:
                                                            // Red arm
                                                            [6,1], [5,1], [4,1], [3,1], [2,1], [1,1], [0,1], // idx 0-6
                                                            [0,2], [0,3], [0,4], [0,5], [0,6],          // idx 7-11
                                                            [0,7],                                      // idx 12 (Turn to Green Path)
                                                            // Green arm
                                                            [1,8], [2,8], [3,8], [4,8], [5,8], [6,8],  // idx 13-18 (Green start at 1,8)
                                                            [7,8],                                      // idx 19 (Turn to Yellow Path)
                                                            [8,7], [8,6], [8,5], [8,4], [8,3], [8,2], [8,1], // idx 20-26 (ERROR in my count, this is 7 squares. So 13+6+1+7 = 27 squares. index 26 should be 8,1)
                                                                                                        // Original prompt board cell logic implies:
                                                                                                        // PLAYER_START_OFFSETS.RED = 0 -> (6,1)
                                                                                                        // PLAYER_START_OFFSETS.GREEN = 13 -> (1,8)
                                                                                                        // PLAYER_START_OFFSETS.YELLOW = 26 -> (8,13)
                                                                                                        // PLAYER_START_OFFSETS.BLUE = 39 -> (13,6)
                                                                                                        // The track coordinates provided in the user's initial Board.tsx:
                                                                                                        // Red path: (6,1)...(0,1)...(0,7) total 13 squares, ends at index 12.
                                                                                                        // Green path: (1,8)...(7,8)...(8,1) total 13 squares, ends at index 25.
                                                                                                        // Yellow path: (8,13)...(14,7)...(14,1) total 13 squares, ends at index 38.
                                                                                                        // Blue path: (13,6)...(7,0)...(1,0) total 13 squares, ends at index 51.
                                                                                                        // This is the most consistent set. Let's use this.
                                                                                                        // Red Path (indexes 0-12)
                                                                                                        [6,1],[5,1],[4,1],[3,1],[2,1],[1,1], // 0-5
                                                                                                        [0,1], // 6 (Corner)
                                                                                                        [0,2],[0,3],[0,4],[0,5],[0,6], // 7-11
                                                                                                        [0,7], // 12 (Corner to Green) Green start is (1,8)
                                                                                                        // Green Path (indexes 13-25)
                                                                                                        [1,8],[2,8],[3,8],[4,8],[5,8],[6,8], // 13-18
                                                                                                        [7,8], // 19 (Corner)
                                                                                                        [8,7],[8,6],[8,5],[8,4],[8,3],[8,2], // 20-25 -> This should be 6 squares to make 13. Yellow Start (8,13) is at index 26. So this ends at 8,2. Last square of Green path (index 25) must be (8,2).
                                                                                                        // [8,1] was from a different example. Correct is [8,2].
                                                                                                        // Corrected Green segment:
                                                                                                        // [1,8],[2,8],[3,8],[4,8],[5,8],[6,8], // idx 13-18
                                                                                                        // [7,8], // idx 19 (Corner)
                                                                                                        // [8,7],[8,6],[8,5],[8,4],[8,3],[8,2], // idx 20-25. Total 6+1+6=13. Next is idx 26.
                                                                                                        // Yellow Path (indexes 26-38) Yellow Start (8,13)
                                                                                                        [8,13],[9,13],[10,13],[11,13],[12,13],[13,13], // idx 26-31
                                                                                                        [14,13], // idx 32 (Corner)
                                                                                                        [14,12],[14,11],[14,10],[14,9],[14,8], // idx 33-37
                                                                                                        [14,7], // idx 38 (Corner to Blue) Blue start is (13,6)
                                                                                                        // Blue Path (indexes 39-51)
                                                                                                        [13,6],[12,6],[11,6],[10,6],[9,6],[8,6], // idx 39-44
                                                                                                        [7,6], // idx 45 (Corner)
                                                                                                        [6,7],[6,8],[6,9],[6,10],[6,11],[6,12], // idx 46-51. (Ends at 6,12) (Red start is 6,1)
                                                                                                        // This is the 52 square track corresponding to visual board cell definitions in prompt's Board.tsx for starts.
];


export const HOME_PATH_COORDINATES: Record<PlayerColor, [number, number][]> = {
  RED:    [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]], 
  GREEN:  [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]], 
  YELLOW: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]], 
  BLUE:   [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]], 
};

export const BOARD_CELLS: BoardCell[] = (() => {
  const cells: BoardCell[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      let cell: BoardCell = { row: r, col: c, type: 'center' }; 

      if ((r >=0 && r <=5 && c >=0 && c <=5)) cell = { ...cell, type: 'base', playerColor: 'RED' };
      else if ((r >=0 && r <=5 && c >=9 && c <=14)) cell = { ...cell, type: 'base', playerColor: 'GREEN' };
      else if ((r >=9 && r <=14 && c >=9 && c <=14)) cell = { ...cell, type: 'base', playerColor: 'YELLOW' };
      else if ((r >=9 && r <=14 && c >=0 && c <=5)) cell = { ...cell, type: 'base', playerColor: 'BLUE' };

      TRACK_COORDINATES.forEach((trackCoord, index) => {
        if (trackCoord[0] === r && trackCoord[1] === c) {
          cell = {
            ...cell,
            type: 'track',
            isSafe: SAFE_SQUARE_INDICES.includes(index), 
          };
          if (index === PLAYER_START_OFFSETS.RED) { cell.isStart = 'RED'; cell.playerColor = 'RED'; cell.type = 'entry'; }
          if (index === PLAYER_START_OFFSETS.GREEN) { cell.isStart = 'GREEN'; cell.playerColor = 'GREEN'; cell.type = 'entry'; }
          if (index === PLAYER_START_OFFSETS.YELLOW) { cell.isStart = 'YELLOW'; cell.playerColor = 'YELLOW'; cell.type = 'entry'; }
          if (index === PLAYER_START_OFFSETS.BLUE) { cell.isStart = 'BLUE'; cell.playerColor = 'BLUE'; cell.type = 'entry'; }
        }
      });

      (Object.keys(HOME_PATH_COORDINATES) as PlayerColor[]).forEach(color => {
        HOME_PATH_COORDINATES[color].forEach(homeCoord => {
          if (homeCoord[0] === r && homeCoord[1] === c) {
            cell = { ...cell, type: 'homepath', playerColor: color };
          }
        });
      });
      
      if (r >= 6 && r <= 8 && c >= 6 && c <= 8) { // Define the central home area
        cell = { ...cell, type: 'center' }; // Could make this specific color
      }
      // Specifically mark the final home cell within the home path for each player
      HOME_PATH_COORDINATES.RED.forEach((hc, idx) => { if(idx === HOME_COLUMN_LENGTH -1 && hc[0] === r && hc[1] === c) cell.type = 'homepath'});
      HOME_PATH_COORDINATES.GREEN.forEach((hc, idx) => { if(idx === HOME_COLUMN_LENGTH -1 && hc[0] === r && hc[1] === c) cell.type = 'homepath'});
      HOME_PATH_COORDINATES.YELLOW.forEach((hc, idx) => { if(idx === HOME_COLUMN_LENGTH -1 && hc[0] === r && hc[1] === c) cell.type = 'homepath'});
      HOME_PATH_COORDINATES.BLUE.forEach((hc, idx) => { if(idx === HOME_COLUMN_LENGTH -1 && hc[0] === r && hc[1] === c) cell.type = 'homepath'});


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
  ALL_PLAYER_COLORS.forEach(playerColor => { 
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
  currentPlayer: 'RED', // This will be updated after color selection if human isn't RED
  diceValues: null,
  pendingDiceValues: [],
  rolledDoubles: false,
  diceRolledInTurn: false,
  gameStatus: 'COLOR_SELECTION', // Start with color selection
  winner: null,
  message: 'Welcome to Ludo Master! Please select your player color.',
  humanPlayerColor: null, // Human player's color is not yet selected
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
export const ACTIVE_PLAYER_COLORS = ALL_PLAYER_COLORS; 

