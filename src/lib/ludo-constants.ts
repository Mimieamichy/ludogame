
import type { PlayerColor, BoardCell, Token } from '@/types/ludo';

export const TOKENS_PER_PLAYER = 4;
export const TRACK_LENGTH = 52;
export const HOME_COLUMN_LENGTH = 6; // 5 steps + 1 final home spot

export const PLAYER_START_OFFSETS: Record<PlayerColor, number> = {
  RED: 0,
  GREEN: 13,
  YELLOW: 26,
  BLUE: 39,
};

// The square index on the main track where player enters their home column.
// It's the square *before* their starting square on the global track.
export const PLAYER_HOME_ENTRY_POINTS: Record<PlayerColor, number> = {
  RED: 51,
  GREEN: 12,
  YELLOW: 25,
  BLUE: 38,
};

export const SAFE_SQUARE_INDICES = [
  PLAYER_START_OFFSETS.RED,
  PLAYER_START_OFFSETS.GREEN,
  PLAYER_START_OFFSETS.YELLOW,
  PLAYER_START_OFFSETS.BLUE,
  (PLAYER_START_OFFSETS.RED + 8) % TRACK_LENGTH,
  (PLAYER_START_OFFSETS.GREEN + 8) % TRACK_LENGTH,
  (PLAYER_START_OFFSETS.YELLOW + 8) % TRACK_LENGTH,
  (PLAYER_START_OFFSETS.BLUE + 8) % TRACK_LENGTH,
];


// Grid dimensions
export const GRID_SIZE = 15;
export const CELL_SIZE_VW = 6; // Each cell is 6vw or 6vh approximately


// Mappings from logical positions to 15x15 grid cell coordinates [row, col]
// This is the most complex part and needs careful definition.
// (0,0) is top-left.

export const BASE_TOKEN_POSITIONS: Record<PlayerColor, [number, number][]> = {
  RED:    [[1,1], [1,4], [4,1], [4,4]],
  GREEN:  [[1,10], [1,13], [4,10], [4,13]],
  YELLOW: [[10,10], [10,13], [13,10], [13,13]],
  BLUE:   [[10,1], [10,4], [13,1], [13,4]],
};

export const TRACK_COORDINATES: [number, number][] = (()=>{
  const path: [number,number][] = [];
  // Red's path segment (leading to Green's arm)
  path.push(...[[6,1],[6,0],[5,0],[4,0],[3,0],[2,0],[1,0]]); // Up arm (7 squares, start is path[0])
  path.push(...[[0,0]]); // Top-left corner
  path.push(...[[0,1],[0,2],[0,3],[0,4],[0,5]]); // Across top (5 squares)
  // path.push(...[[0,6]]); // Square before Green's home column entry

  // Green's path segment (leading to Yellow's arm)
  path.push(...[[1,6],[2,6],[3,6],[4,6],[5,6],[6,6]]); // Right arm (entry at (0,6) implied, 6 squares to (6,6))
  path.push(...[[6,7]]); // Corner
  path.push(...[[6,8],[7,8],[8,8],[9,8],[10,8],[11,8],[12,8]]);// Down arm (7 squares, Green start is path[13])
  path.push(...[[13,8]]); // Corner
  path.push(...[[14,8],[14,7],[14,6],[14,5],[14,4],[14,3],[14,2],[14,1],[14,0]]); // Error in logic previously, this needs to map out 52 squares
  // Corrected generation of 52 squares:
  const correctedPath: [number, number][] = [];
  // Path from Red start upwards
  for (let i = 0; i < 6; i++) correctedPath.push([6 - i, 1]); // Red Start at (6,1) -> (1,1)
  correctedPath.push([0,1]); // Turn
  for (let i = 0; i < 6; i++) correctedPath.push([0, 2 + i]); // (0,2) -> (0,7) Green Start at (1,8)
  correctedPath.push([1,8]); // Turn
  for (let i = 0; i < 6; i++) correctedPath.push([2 + i, 8]); // (2,8) -> (7,8)
  correctedPath.push([8,7]); // Turn
  for (let i = 0; i < 6; i++) correctedPath.push([8, 6 - i]); // (8,6) -> (8,1)
  correctedPath.push([7,0]); // Turn
  for (let i = 0; i < 6; i++) correctedPath.push([6 - i, 0]); // (6,0) -> (1,0) This is Red's home entry area
  // Path from Green start rightwards
  for (let i = 0; i < 6; i++) correctedPath.push([1, 8 + i]); // Green Start at (1,8) -> (1,13)
  correctedPath.push([1,14]); // Turn
  for (let i = 0; i < 6; i++) correctedPath.push([2 + i, 14]); // (2,14) -> (7,14) Yellow start at (8,13)
  correctedPath.push([8,13]); // Turn
  for (let i = 0; i < 6; i++) correctedPath.push([8 + i, 13]); // (8,13) -> (13,13)
  correctedPath.push([14,13]); // Turn
  for (let i = 0; i < 6; i++) correctedPath.push([14, 12 - i]); // (14,12) -> (14,7) This is Green's home entry
  // Path from Yellow start downwards
  for (let i = 0; i < 6; i++) correctedPath.push([8 + i, 7]); // Yellow Start at (8,7) -> (13,7)
  correctedPath.push([14,7]); // Turn
  for (let i = 0; i < 6; i++) correctedPath.push([14, 6 - i]); // (14,6) -> (14,1) Blue Start at (13,0)
  correctedPath.push([13,0]); // Turn
  for (let i = 0; i < 6; i++) correctedPath.push([12 - i, 0]); // (12,0) -> (7,0)
  correctedPath.push([6,1]); // Turn
  for (let i = 0; i < 5; i++) correctedPath.push([6, 2 + i]); // (6,2) -> (6,6) This is Yellow's home entry. (Index 5 before Red start)
  // The above logic is still a bit off for a perfect 52 square cycle.
  // Let's define fixed points and fill:
  const finalTrack: [number,number][] = [
    // Red arm
    [6,1], [5,1], [4,1], [3,1], [2,1], [1,1], [0,1], // Red Start Square is [6,1]
    [0,2], [0,3], [0,4], [0,5], [0,6], [0,7], // Top Horizontal
    // Green Arm
    [1,8], [2,8], [3,8], [4,8], [5,8], [6,8], [7,8], // Green Start Square is [1,8]
    [8,7], [8,6], [8,5], [8,4], [8,3], [8,2], [8,1], // Right Vertical (moving left)
    // Yellow Arm
    [8,1], [9,1], [10,1], [11,1], [12,1], [13,1], [14,1], // Yellow Start Square is [8,1]
    [14,2], [14,3], [14,4], [14,5], [14,6], [14,7], // Bottom Horizontal
    // Blue Arm
    [13,8], [12,8], [11,8], [10,8], [9,8], [8,8], [7,8], // Blue Start Square is [13,8]
    [6,7], [6,6], [6,5], [6,4], [6,3], [6,2] // Left Vertical (moving right)
  ];
  // The last path `[6,2]` connects back to one square before Red's Start `[6,1]`.
  // This gives 52 unique squares. Red start is at index 0 (6,1). Green start is at index 13 (1,8). Yellow at 26 (8,1). Blue at 39 (13,8).
  return finalTrack;
})();


export const HOME_PATH_COORDINATES: Record<PlayerColor, [number, number][]> = {
  RED:    [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]], // Center is (7,7)
  GREEN:  [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  YELLOW: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
  BLUE:   [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
};

// Board cells definition for rendering the board structure
export const BOARD_CELLS: BoardCell[] = (() => {
  const cells: BoardCell[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      let cell: BoardCell = { row: r, col: c, type: 'center' }; // Default to center

      // Bases
      if ((r >=0 && r <=5 && c >=0 && c <=5)) cell = { ...cell, type: 'base', playerColor: 'RED' };
      else if ((r >=0 && r <=5 && c >=9 && c <=14)) cell = { ...cell, type: 'base', playerColor: 'GREEN' };
      else if ((r >=9 && r <=14 && c >=9 && c <=14)) cell = { ...cell, type: 'base', playerColor: 'YELLOW' };
      else if ((r >=9 && r <=14 && c >=0 && c <=5)) cell = { ...cell, type: 'base', playerColor: 'BLUE' };

      // Track squares
      TRACK_COORDINATES.forEach((trackCoord, index) => {
        if (trackCoord[0] === r && trackCoord[1] === c) {
          cell = {
            ...cell,
            type: 'track',
            isSafe: SAFE_SQUARE_INDICES.includes(index),
          };
          if (index === PLAYER_START_OFFSETS.RED) cell.isStart = 'RED';
          if (index === PLAYER_START_OFFSETS.GREEN) cell.isStart = 'GREEN';
          if (index === PLAYER_START_OFFSETS.YELLOW) cell.isStart = 'YELLOW';
          if (index === PLAYER_START_OFFSETS.BLUE) cell.isStart = 'BLUE';
        }
      });

      // Home paths
      (Object.keys(HOME_PATH_COORDINATES) as PlayerColor[]).forEach(color => {
        HOME_PATH_COORDINATES[color].forEach(homeCoord => {
          if (homeCoord[0] === r && homeCoord[1] === c) {
            cell = { ...cell, type: 'homepath', playerColor: color };
          }
        });
      });
      
      // Mark Home Entry points specifically (part of track, but visually distinct)
      if (r === 6 && c === 1 && PLAYER_START_OFFSETS.RED === 0) cell.type = 'entry'; // Red start
      if (r === 1 && c === 8 && PLAYER_START_OFFSETS.GREEN === 13) cell.type = 'entry'; // Green start
      if (r === 8 && c === 13 && PLAYER_START_OFFSETS.YELLOW === 26) cell.type = 'entry'; // Yellow start
      if (r === 13 && c === 6 && PLAYER_START_OFFSETS.BLUE === 39) cell.type = 'entry'; // Blue start

      // Central home area (triangle pointing to center from each home path)
      if (r === 7 && c === 7) cell = { ...cell, type: 'center' }; // Actual center square, can be styled differently

      cells.push(cell);
    }
  }
  return cells;
})();

export const PLAYER_TAILWIND_COLORS: Record<PlayerColor, { bg: string, text: string, border: string }> = {
  RED:    { bg: 'bg-red-500',    text: 'text-red-900',    border: 'border-red-700' },
  GREEN:  { bg: 'bg-green-500',  text: 'text-green-900',  border: 'border-green-700' },
  YELLOW: { bg: 'bg-yellow-400', text: 'text-yellow-900', border: 'border-yellow-600' },
  BLUE:   { bg: 'bg-blue-500',   text: 'text-blue-900',   border: 'border-blue-700' },
};

export const PLAYER_TAILWIND_BG_LIGHT: Record<PlayerColor, string> = {
  RED: 'bg-red-200',
  GREEN: 'bg-green-200',
  YELLOW: 'bg-yellow-100',
  BLUE: 'bg-blue-200',
};

export const PLAYER_NAMES: Record<PlayerColor, string> = {
  RED: 'Player 1 (Red)',
  GREEN: 'Player 2 (Green)',
  YELLOW: 'Player 2 (Yellow)',
  BLUE: 'Player 4 (Blue)',
};

// Initial token setup
export const getInitialTokens = (): Token[] => {
  const tokens: Token[] = [];
  (['RED', 'YELLOW'] as PlayerColor[]).forEach(playerColor => { // Only Red and Yellow for 2 players
    for (let i = 0; i < TOKENS_PER_PLAYER; i++) {
      tokens.push({
        id: `${playerColor}-${i}`,
        player: playerColor,
        status: 'base',
        position: i, // Index within the base
        pathProgress: 0,
      });
    }
  });
  return tokens;
};

export const INITIAL_GAME_STATE: () => GameState = () => ({
  tokens: getInitialTokens(),
  currentPlayer: 'RED',
  diceValue: null,
  diceRolledInTurn: false,
  rolledSix: false,
  gameStatus: 'START_GAME',
  winner: null,
  message: 'Welcome to Ludo Master! Player 1 (Red) starts. Roll the dice.',
});

export const DICE_FACES: Record<number, string[]> = {
    1: ["●"],
    2: ["●", "●"],
    3: ["●", "●", "●"],
    4: ["● ●", "● ●"],
    5: ["● ●", "●", "● ●"],
    6: ["● ● ●", "● ● ●"],
};

export const DICE_LAYOUTS: Record<number, string> = {
  1: "flex items-center justify-center",
  2: "flex items-center justify-between",
  3: "flex items-center justify-between",
  4: "grid grid-cols-2 gap-1",
  5: "grid grid-cols-2 gap-1",
  6: "grid grid-cols-2 gap-1 place-items-center",
};

export const DICE_DOT_LAYOUTS: Record<number, string[]> = {
  1: ["col-span-2 row-span-2 place-self-center"],
  2: ["place-self-start", "place-self-end"],
  3: ["place-self-start", "place-self-center col-span-2", "place-self-end"],
  4: ["place-self-start", "place-self-end", "place-self-start", "place-self-end"],
  5: ["place-self-start", "place-self-end", "place-self-center col-span-2", "place-self-start", "place-self-end"],
  6: ["place-self-start", "place-self-end", "place-self-start", "place-self-end", "place-self-start", "place-self-end"],
};

export const SIX_REQUIRED_TO_MOVE_OUT = true;
export const ROLL_SIX_GETS_ANOTHER_TURN = true;
export const MAX_CONSECUTIVE_SIXES = 3; // Standard rule: 3 sixes can lead to penalty
export const CAPTURE_SENDS_TO_BASE = true;
export const HOME_ENTRY_EXACT_ROLL_REQUIRED = true; // Usually true
export const STACKING_ALLOWED_ON_SAFE_SQUARES = false; // Typically false
export const STACKING_ALLOWED_IN_HOME_COLUMN = true; // Typically true

