"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioController } from "@/lib/audioEngine";

export type PieceColor = "w" | "b";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

export type Piece = {
  type: PieceType;
  color: PieceColor;
};

export type Square = Piece | null;
export type Board = Square[][];

type Position = [number, number]; // [row, col]

export type CastlingRights = {
  wK: boolean; // White Kingside (O-O)
  wQ: boolean; // White Queenside (O-O-O)
  bK: boolean; // Black Kingside (O-O)
  bQ: boolean; // Black Queenside (O-O-O)
};

const INITIAL_CASTLING: CastlingRights = {
  wK: true,
  wQ: true,
  bK: true,
  bQ: true,
};

type Move = {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  isCastle?: "kingside" | "queenside";
  isEnPassant?: boolean;
};

// Standard starting board
function getInitialBoard(): Board {
  const board: Board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  const backRow: PieceType[] = ["r", "n", "b", "q", "k", "b", "n", "r"];
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: backRow[c], color: "b" };
    board[1][c] = { type: "p", color: "b" };
    board[6][c] = { type: "p", color: "w" };
    board[7][c] = { type: backRow[c], color: "w" };
  }
  return board;
}

// Piece values
const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece Square Tables for positional AI evaluation
const PST_PAWN = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const PST_KNIGHT = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const PST_BISHOP = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

// Generate pseudo-legal moves without castling (for attack checks)
function getRawMoves(board: Board, r: number, c: number): Position[] {
  const p = board[r][c];
  if (!p) return [];

  const moves: Position[] = [];
  const color = p.color;
  const oppColor: PieceColor = color === "w" ? "b" : "w";
  const dir = color === "w" ? -1 : 1;

  switch (p.type) {
    case "p": {
      // Forward steps
      if (inBounds(r + dir, c) && !board[r + dir][c]) {
        moves.push([r + dir, c]);
        const startRow = color === "w" ? 6 : 1;
        if (r === startRow && inBounds(r + 2 * dir, c) && !board[r + 2 * dir][c]) {
          moves.push([r + 2 * dir, c]);
        }
      }
      // Diagonal captures
      [-1, 1].forEach((dc) => {
        const nr = r + dir;
        const nc = c + dc;
        if (inBounds(nr, nc)) {
          const target = board[nr][nc];
          if (target && target.color === oppColor) {
            moves.push([nr, nc]);
          }
        }
      });
      break;
    }

    case "n": {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      knightOffsets.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (inBounds(nr, nc)) {
          const target = board[nr][nc];
          if (!target || target.color === oppColor) {
            moves.push([nr, nc]);
          }
        }
      });
      break;
    }

    case "b":
    case "r":
    case "q": {
      const directions: [number, number][] = [];
      if (p.type === "b" || p.type === "q") {
        directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      }
      if (p.type === "r" || p.type === "q") {
        directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      }

      directions.forEach(([dr, dc]) => {
        let nr = r + dr;
        let nc = c + dc;
        while (inBounds(nr, nc)) {
          const target = board[nr][nc];
          if (!target) {
            moves.push([nr, nc]);
          } else {
            if (target.color === oppColor) {
              moves.push([nr, nc]);
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      });
      break;
    }

    case "k": {
      const kingOffsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
      ];
      kingOffsets.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (inBounds(nr, nc)) {
          const target = board[nr][nc];
          if (!target || target.color === oppColor) {
            moves.push([nr, nc]);
          }
        }
      });
      break;
    }
  }

  return moves;
}

// Check if a square [r, c] is under attack by opponent
function isSquareAttacked(board: Board, r: number, c: number, attackerColor: PieceColor): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === attackerColor) {
        if (piece.type === "p") {
          // Pawn attacks are strictly diagonals
          const dir = attackerColor === "w" ? -1 : 1;
          if (row + dir === r && (col - 1 === c || col + 1 === c)) {
            return true;
          }
        } else {
          const moves = getRawMoves(board, row, col);
          if (moves.some(([mr, mc]) => mr === r && mc === c)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// Check if a king of `color` is in check on `board`
function isKingInCheck(board: Board, color: PieceColor): boolean {
  let kingPos: Position | null = null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === "k" && p.color === color) {
        kingPos = [r, c];
        break;
      }
    }
    if (kingPos) break;
  }

  if (!kingPos) return true;
  const oppColor: PieceColor = color === "w" ? "b" : "w";
  return isSquareAttacked(board, kingPos[0], kingPos[1], oppColor);
}

// Clone board
function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

// Apply move on a board (including castling movement & pawn promotion)
function makeBoardMove(board: Board, from: Position, to: Position): Board {
  const newBoard = cloneBoard(board);
  const piece = newBoard[from[0]][from[1]];
  if (!piece) return newBoard;

  newBoard[from[0]][from[1]] = null;

  // 1. Check for Castling (King moves 2 squares horizontally)
  if (piece.type === "k" && Math.abs(to[1] - from[1]) === 2) {
    const row = from[0];
    if (to[1] === 6) {
      // Kingside castle: Move Rook from col 7 to col 5
      const rook = newBoard[row][7];
      newBoard[row][7] = null;
      newBoard[row][5] = rook;
    } else if (to[1] === 2) {
      // Queenside castle: Move Rook from col 0 to col 3
      const rook = newBoard[row][0];
      newBoard[row][0] = null;
      newBoard[row][3] = rook;
    }
  }

  // 2. Handle Pawn Promotion
  if (piece.type === "p" && (to[0] === 0 || to[0] === 7)) {
    newBoard[to[0]][to[1]] = { type: "q", color: piece.color };
  } else {
    newBoard[to[0]][to[1]] = piece;
  }

  return newBoard;
}

// Update castling rights after a move
function updateCastlingRights(rights: CastlingRights, from: Position, to: Position): CastlingRights {
  const next = { ...rights };

  // If White King moves
  if (from[0] === 7 && from[1] === 4) {
    next.wK = false;
    next.wQ = false;
  }
  // If Black King moves
  if (from[0] === 0 && from[1] === 4) {
    next.bK = false;
    next.bQ = false;
  }

  // If White Rooks move or are captured
  if ((from[0] === 7 && from[1] === 7) || (to[0] === 7 && to[1] === 7)) next.wK = false;
  if ((from[0] === 7 && from[1] === 0) || (to[0] === 7 && to[1] === 0)) next.wQ = false;

  // If Black Rooks move or are captured
  if ((from[0] === 0 && from[1] === 7) || (to[0] === 0 && to[1] === 7)) next.bK = false;
  if ((from[0] === 0 && from[1] === 0) || (to[0] === 0 && to[1] === 0)) next.bQ = false;

  return next;
}

// Get all legal moves for a piece (including CASTLING)
function getLegalMoves(
  board: Board,
  r: number,
  c: number,
  castling: CastlingRights = INITIAL_CASTLING,
): Position[] {
  const piece = board[r][c];
  if (!piece) return [];

  const rawMoves = getRawMoves(board, r, c);
  const legalMoves = rawMoves.filter((to) => {
    const after = makeBoardMove(board, [r, c], to);
    return !isKingInCheck(after, piece.color);
  });

  // --- CASTLING RULES & VERIFICATION ---
  if (piece.type === "k") {
    const color = piece.color;
    const oppColor: PieceColor = color === "w" ? "b" : "w";

    if (color === "w" && r === 7 && c === 4) {
      // 1. White Kingside (O-O): Squares [7, 5] and [7, 6] must be empty & not attacked
      if (
        castling.wK &&
        board[7][5] === null &&
        board[7][6] === null &&
        board[7][7]?.type === "r" &&
        board[7][7]?.color === "w"
      ) {
        if (
          !isSquareAttacked(board, 7, 4, oppColor) &&
          !isSquareAttacked(board, 7, 5, oppColor) &&
          !isSquareAttacked(board, 7, 6, oppColor)
        ) {
          legalMoves.push([7, 6]);
        }
      }

      // 2. White Queenside (O-O-O): Squares [7, 3], [7, 2], [7, 1] empty & [7, 4, 3, 2] not attacked
      if (
        castling.wQ &&
        board[7][3] === null &&
        board[7][2] === null &&
        board[7][1] === null &&
        board[7][0]?.type === "r" &&
        board[7][0]?.color === "w"
      ) {
        if (
          !isSquareAttacked(board, 7, 4, oppColor) &&
          !isSquareAttacked(board, 7, 3, oppColor) &&
          !isSquareAttacked(board, 7, 2, oppColor)
        ) {
          legalMoves.push([7, 2]);
        }
      }
    } else if (color === "b" && r === 0 && c === 4) {
      // 1. Black Kingside (O-O)
      if (
        castling.bK &&
        board[0][5] === null &&
        board[0][6] === null &&
        board[0][7]?.type === "r" &&
        board[0][7]?.color === "b"
      ) {
        if (
          !isSquareAttacked(board, 0, 4, oppColor) &&
          !isSquareAttacked(board, 0, 5, oppColor) &&
          !isSquareAttacked(board, 0, 6, oppColor)
        ) {
          legalMoves.push([0, 6]);
        }
      }

      // 2. Black Queenside (O-O-O)
      if (
        castling.bQ &&
        board[0][3] === null &&
        board[0][2] === null &&
        board[0][1] === null &&
        board[0][0]?.type === "r" &&
        board[0][0]?.color === "b"
      ) {
        if (
          !isSquareAttacked(board, 0, 4, oppColor) &&
          !isSquareAttacked(board, 0, 3, oppColor) &&
          !isSquareAttacked(board, 0, 2, oppColor)
        ) {
          legalMoves.push([0, 2]);
        }
      }
    }
  }

  return legalMoves;
}

// Get all legal moves for a player with castling
function getAllLegalMoves(
  board: Board,
  color: PieceColor,
  castling: CastlingRights = INITIAL_CASTLING,
): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const targets = getLegalMoves(board, r, c, castling);
        targets.forEach((to) => {
          let isCastle: "kingside" | "queenside" | undefined = undefined;
          if (piece.type === "k" && Math.abs(to[1] - c) === 2) {
            isCastle = to[1] === 6 ? "kingside" : "queenside";
          }
          moves.push({
            from: [r, c],
            to,
            piece,
            captured: board[to[0]][to[1]] || undefined,
            isCastle,
          });
        });
      }
    }
  }
  return moves;
}

// Evaluate board for AI (Black)
function evaluateBoard(board: Board): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      let val = PIECE_VALUES[piece.type];
      let positional = 0;
      if (piece.type === "p") {
        positional = piece.color === "w" ? PST_PAWN[r][c] : PST_PAWN[7 - r][c];
      } else if (piece.type === "n") {
        positional = piece.color === "w" ? PST_KNIGHT[r][c] : PST_KNIGHT[7 - r][c];
      } else if (piece.type === "b") {
        positional = piece.color === "w" ? PST_BISHOP[r][c] : PST_BISHOP[7 - r][c];
      }

      val += positional;
      if (piece.color === "b") {
        score += val;
      } else {
        score -= val;
      }
    }
  }
  return score;
}

// AI Move Selector using Minimax
function findBestAiMove(
  board: Board,
  castling: CastlingRights,
  difficulty: "easy" | "hard" = "hard",
): Move | null {
  const moves = getAllLegalMoves(board, "b", castling);
  if (moves.length === 0) return null;

  if (difficulty === "easy") {
    moves.sort((a, b) => {
      const valA = a.captured ? PIECE_VALUES[a.captured.type] : a.isCastle ? 150 : 0;
      const valB = b.captured ? PIECE_VALUES[b.captured.type] : b.isCastle ? 150 : 0;
      return valB - valA + (Math.random() - 0.5) * 40;
    });
    return moves[0];
  }

  let bestMove: Move | null = null;
  let bestScore = -Infinity;

  moves.sort(() => Math.random() - 0.5);

  for (const move of moves) {
    const after = makeBoardMove(board, move.from, move.to);
    let score = evaluateBoard(after);

    if (move.isCastle) score += 200; // AI bonus for castling early!

    const nextCastling = updateCastlingRights(castling, move.from, move.to);
    const whiteReplies = getAllLegalMoves(after, "w", nextCastling);

    if (whiteReplies.length === 0) {
      if (isKingInCheck(after, "w")) {
        score += 15000;
      }
    } else {
      let minWhiteReply = Infinity;
      for (const wMove of whiteReplies.slice(0, 14)) {
        const afterWhite = makeBoardMove(after, wMove.from, wMove.to);
        const replyScore = evaluateBoard(afterWhite);
        if (replyScore < minWhiteReply) {
          minWhiteReply = replyScore;
        }
      }
      score = minWhiteReply;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove || moves[0];
}

const PIECE_GLYPHS: Record<PieceColor, Record<PieceType, string>> = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

type CyberChessProps = {
  onScore?: (score: number) => void;
  audio?: AudioController | null;
};

export function CyberChess({ onScore, audio }: CyberChessProps) {
  const [board, setBoard] = useState<Board>(getInitialBoard);
  const [castling, setCastling] = useState<CastlingRights>(INITIAL_CASTLING);
  const [selected, setSelected] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [turn, setTurn] = useState<PieceColor>("w");
  const [aiThinking, setAiThinking] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);
  const [gameStatus, setGameStatus] = useState<"playing" | "check" | "checkmate" | "stalemate">("playing");
  const [winner, setWinner] = useState<PieceColor | null>(null);
  const [capturedByWhite, setCapturedByWhite] = useState<Piece[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<Piece[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [difficulty, setDifficulty] = useState<"easy" | "hard">("hard");
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  const onScoreRef = useRef(onScore);
  useEffect(() => {
    onScoreRef.current = onScore;
  }, [onScore]);

  // Restart match
  const startNewGame = useCallback(() => {
    setBoard(getInitialBoard());
    setCastling(INITIAL_CASTLING);
    setSelected(null);
    setValidMoves([]);
    setTurn("w");
    setAiThinking(false);
    setLastMove(null);
    setGameStatus("playing");
    setWinner(null);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setPlayerScore(0);
    setMoveHistory([]);
    audio?.playSelect();
  }, [audio]);

  // Handle Square Selection
  const handleSquareClick = (r: number, c: number) => {
    if (turn !== "w" || aiThinking || gameStatus === "checkmate" || gameStatus === "stalemate") {
      return;
    }

    const clickedPiece = board[r][c];

    // Click on valid target square to execute move (including castling squares)
    if (selected) {
      const isTarget = validMoves.some(([tr, tc]) => tr === r && tc === c);
      if (isTarget) {
        executePlayerMove(selected, [r, c]);
        return;
      }
    }

    // Select friendly piece
    if (clickedPiece && clickedPiece.color === "w") {
      setSelected([r, c]);
      const moves = getLegalMoves(board, r, c, castling);
      setValidMoves(moves);
      audio?.playSelect();
    } else {
      setSelected(null);
      setValidMoves([]);
    }
  };

  // Execute Player Move
  const executePlayerMove = (from: Position, to: Position) => {
    const piece = board[from[0]][from[1]];
    if (!piece) return;

    const captured = board[to[0]][to[1]];
    const isCastlingMove = piece.type === "k" && Math.abs(to[1] - from[1]) === 2;
    const newBoard = makeBoardMove(board, from, to);
    const nextCastling = updateCastlingRights(castling, from, to);

    // Audio & Feedback
    if (isCastlingMove) {
      audio?.playMilestone();
      setPlayerScore((s) => {
        const next = s + 150; // Bonus for tactical castling
        onScoreRef.current?.(next);
        return next;
      });
    } else if (captured) {
      setCapturedByWhite((prev) => [...prev, captured]);
      const pts = PIECE_VALUES[captured.type];
      setPlayerScore((s) => {
        const next = s + pts;
        onScoreRef.current?.(next);
        return next;
      });
      audio?.playCollect(3);
    } else {
      audio?.playDodge();
    }

    setBoard(newBoard);
    setCastling(nextCastling);
    setSelected(null);
    setValidMoves([]);
    setLastMove({ from, to });

    const cols = ["a", "b", "c", "d", "e", "f", "g", "h"];
    let moveNotation = "";
    if (isCastlingMove) {
      moveNotation = to[1] === 6 ? "O-O (KINGSIDE 🏰)" : "O-O-O (QUEENSIDE 🏰)";
    } else {
      moveNotation = `${piece.type.toUpperCase()}${cols[from[1]]}${8 - from[0]}→${cols[to[1]]}${8 - to[0]}`;
    }
    setMoveHistory((h) => [...h.slice(-15), moveNotation]);

    // Check Black status
    const inCheck = isKingInCheck(newBoard, "b");
    const legalReplies = getAllLegalMoves(newBoard, "b", nextCastling);

    if (legalReplies.length === 0) {
      if (inCheck) {
        setGameStatus("checkmate");
        setWinner("w");
        setPlayerScore((s) => {
          const finalBonus = s + 2500;
          onScoreRef.current?.(finalBonus);
          return finalBonus;
        });
        audio?.playMilestone();
      } else {
        setGameStatus("stalemate");
      }
      return;
    }

    if (inCheck) {
      setGameStatus("check");
      audio?.playMilestone();
    } else {
      setGameStatus("playing");
    }

    setTurn("b");
    setAiThinking(true);
  };

  // AI Turn Handler
  useEffect(() => {
    if (turn !== "b" || gameStatus === "checkmate" || gameStatus === "stalemate") {
      return;
    }

    const aiTimer = setTimeout(() => {
      const bestMove = findBestAiMove(board, castling, difficulty);
      if (!bestMove) {
        if (isKingInCheck(board, "b")) {
          setGameStatus("checkmate");
          setWinner("w");
          audio?.playMilestone();
        } else {
          setGameStatus("stalemate");
        }
        setAiThinking(false);
        return;
      }

      const { from, to, piece, captured, isCastle } = bestMove;
      const newBoard = makeBoardMove(board, from, to);
      const nextCastling = updateCastlingRights(castling, from, to);

      if (isCastle) {
        audio?.playDodge();
      } else if (captured) {
        setCapturedByBlack((prev) => [...prev, captured]);
        audio?.playHit();
      } else {
        audio?.playJump();
      }

      setBoard(newBoard);
      setCastling(nextCastling);
      setLastMove({ from, to });
      setAiThinking(false);

      const cols = ["a", "b", "c", "d", "e", "f", "g", "h"];
      let moveNotation = "";
      if (isCastle) {
        moveNotation = isCastle === "kingside" ? "AI: O-O 🏰" : "AI: O-O-O 🏰";
      } else {
        moveNotation = `AI:${piece.type.toUpperCase()}${cols[from[1]]}${8 - from[0]}→${cols[to[1]]}${8 - to[0]}`;
      }
      setMoveHistory((h) => [...h.slice(-15), moveNotation]);

      // Check White status
      const inCheck = isKingInCheck(newBoard, "w");
      const whiteMoves = getAllLegalMoves(newBoard, "w", nextCastling);

      if (whiteMoves.length === 0) {
        if (inCheck) {
          setGameStatus("checkmate");
          setWinner("b");
          audio?.playHit();
        } else {
          setGameStatus("stalemate");
        }
        return;
      }

      if (inCheck) {
        setGameStatus("check");
        audio?.playHit();
      } else {
        setGameStatus("playing");
      }

      setTurn("w");
    }, 450);

    return () => clearTimeout(aiTimer);
  }, [turn, board, castling, difficulty, gameStatus, audio]);

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  return (
    <div className="play-column chess-container">
      {/* Chess HUD Top Bar */}
      <div className="chess-hud">
        <div className="chess-hud-player">
          <div className="player-avatar ai-avatar">
            <span>🤖</span>
          </div>
          <div className="player-meta">
            <span className="player-name coral">NEURAL AI (BLACK)</span>
            <div className="captured-tray">
              {capturedByBlack.map((p, i) => (
                <span key={i} className="captured-piece black">
                  {PIECE_GLYPHS.w[p.type]}
                </span>
              ))}
              {capturedByBlack.length === 0 && <small className="empty-tray">NO CAPTURES</small>}
            </div>
          </div>
        </div>

        <div className="chess-status-badge">
          {aiThinking ? (
            <span className="badge-pulse coral">
              <i className="spinner-dot" /> NEURAL ENGINE THINKING...
            </span>
          ) : gameStatus === "checkmate" ? (
            <span className="badge-pulse cyan">
              🏆 {winner === "w" ? "CHECKMATE! PLAYER WINS" : "CHECKMATE! AI WINS"}
            </span>
          ) : gameStatus === "check" ? (
            <span className="badge-pulse warning">⚠️ CHECK IN SECTOR!</span>
          ) : (
            <span className="badge-pulse cyan">⚡ YOUR MOVE (CYAN)</span>
          )}
        </div>

        <div className="chess-hud-player right">
          <div className="player-meta text-right">
            <span className="player-name cyan">CYBER OPERATOR (CYAN)</span>
            <div className="captured-tray right">
              {capturedByWhite.map((p, i) => (
                <span key={i} className="captured-piece white">
                  {PIECE_GLYPHS.b[p.type]}
                </span>
              ))}
              {capturedByWhite.length === 0 && <small className="empty-tray">NO CAPTURES</small>}
            </div>
          </div>
          <div className="player-avatar user-avatar">
            <span>✦</span>
          </div>
        </div>
      </div>

      {/* Interactive Chess Stage */}
      <div className="chess-board-wrapper">
        <div className="scanlines" />

        {/* Board Grid */}
        <div className="chess-board">
          {board.map((row, r) => (
            <div key={r} className="chess-row">
              {row.map((cell, c) => {
                const isLight = (r + c) % 2 === 0;
                const isSelected = selected && selected[0] === r && selected[1] === c;
                const isValidTarget = validMoves.some(([vr, vc]) => vr === r && vc === c);
                const isLast =
                  lastMove &&
                  ((lastMove.from[0] === r && lastMove.from[1] === c) ||
                    (lastMove.to[0] === r && lastMove.to[1] === c));
                const isKingCheck =
                  cell &&
                  cell.type === "k" &&
                  gameStatus === "check" &&
                  isKingInCheck(board, cell.color);

                // Special castle target highlight
                const isCastleTarget =
                  selected &&
                  board[selected[0]][selected[1]]?.type === "k" &&
                  Math.abs(c - selected[1]) === 2 &&
                  isValidTarget;

                return (
                  <button
                    key={c}
                    onClick={() => handleSquareClick(r, c)}
                    className={`chess-square ${isLight ? "light" : "dark"} ${
                      isSelected ? "selected" : ""
                    } ${isValidTarget ? "valid-target" : ""} ${
                      isCastleTarget ? "castle-target" : ""
                    } ${isLast ? "last-move" : ""} ${isKingCheck ? "king-check" : ""}`}
                    aria-label={`${files[c]}${8 - r} ${cell ? `${cell.color === "w" ? "white" : "black"} ${cell.type}` : "empty"}`}
                  >
                    {c === 0 && <span className="rank-label">{8 - r}</span>}
                    {r === 7 && <span className="file-label">{files[c]}</span>}

                    {/* Move indicator dot or capture ring */}
                    {isValidTarget && (
                      <span
                        className={`move-dot ${cell ? "capture-ring" : ""} ${
                          isCastleTarget ? "castle-dot" : ""
                        }`}
                      >
                        {isCastleTarget && <small className="castle-icon">🏰</small>}
                      </span>
                    )}

                    {/* Chess Piece Glyph */}
                    {cell && (
                      <span
                        className={`chess-piece ${cell.color === "w" ? "white-piece" : "black-piece"}`}
                      >
                        {PIECE_GLYPHS[cell.color][cell.type]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* End Game Overlay */}
        {(gameStatus === "checkmate" || gameStatus === "stalemate") && (
          <div className="chess-overlay">
            <p className="eyebrow danger">GRID MATCH CONCLUDED</p>
            <h2>{gameStatus === "checkmate" ? (winner === "w" ? "VICTORY ACHIEVED" : "SYSTEM CRUSHED") : "TACTICAL STALEMATE"}</h2>
            <p className="result">
              TELEMETRY CAPTURED: <b>{playerScore} PTS</b>
            </p>
            <div className="overlay-actions">
              <button className="start-button" onClick={startNewGame}>
                RELAUNCH CHESS DUEL <b>↻</b>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Actions Bar */}
      <div className="chess-controls-bar">
        <div className="chess-actions-left">
          <button
            className="chess-tool-btn"
            onClick={startNewGame}
            title="Reset Board"
          >
            ↺ NEW MATCH
          </button>
          <div className="diff-toggle">
            <span className="diff-label">AI PROTOCOL:</span>
            <button
              className={`diff-btn ${difficulty === "easy" ? "active" : ""}`}
              onClick={() => {
                setDifficulty("easy");
                audio?.playSelect();
              }}
            >
              NOVICE
            </button>
            <button
              className={`diff-btn ${difficulty === "hard" ? "active" : ""}`}
              onClick={() => {
                setDifficulty("hard");
                audio?.playSelect();
              }}
            >
              MASTER
            </button>
          </div>
        </div>

        <div className="chess-move-feed">
          <span className="feed-label">TELEMETRY LOG:</span>
          <div className="feed-log">
            {moveHistory.slice(-4).map((m, i) => (
              <span key={i} className="log-pill">
                {m}
              </span>
            ))}
            {moveHistory.length === 0 && <span className="log-empty">READY FOR OPENING MOVE</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
