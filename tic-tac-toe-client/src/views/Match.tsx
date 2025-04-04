import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import socket from "../socket";
import "../styles/Match.css";

type Cell = "X" | "O" | null;
const initialBoard: Cell[] = Array(9).fill(null);

const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const checkWinner = (board: ("X" | "O" | null)[]): "X" | "O" | "draw" | null => {
  for (const combination of winningCombinations) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  // Draw if no winner and board is full
  if (board.every(cell => cell !== null)) {
    return "draw";
  }
  return null;
};

const Match: React.FC = () => {
  const { id: matchId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Cell[]>(initialBoard);
  const [mySymbol, setMySymbol] = useState<Cell>(null);
  const [currentTurn, setCurrentTurn] = useState<"X" | "O">("X");
  const [winner, setWinner] = useState<Cell | "draw" | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    if (matchId) {
      socket.emit("ready", matchId);
    }

    socket.on("assign_symbol", (symbol: "X" | "O") => {
      setMySymbol(symbol);
    });

    socket.on("game_move", (symbol: "X" | "O", idx: number) => {
      setBoard((prevBoard) => {
        if (prevBoard[idx]) return prevBoard;
        const newBoard = [...prevBoard];
        newBoard[idx] = symbol;
        
        // check for a winner or draw 
        const moveWinner = checkWinner(newBoard);
        if (moveWinner) {
          setWinner(moveWinner);
          // lock the board if the game is over
          setIsWaiting(true);
        } else {
          const newTurn = symbol === "X" ? "O" : "X";
          setCurrentTurn(newTurn);
          setIsWaiting(false);
        }
        
        return newBoard;
      });
    });
  
    return () => {
      socket.off("assign_symbol");
      socket.off("game_move");
    };
  }, [matchId]);
    
  const handleClick = (idx: number) => {
    if (board[idx] || winner || isWaiting) return;
    if (mySymbol !== currentTurn) {
      alert("It's not your turn!");
      return;
    }
  
    const newBoard = [...board];
    newBoard[idx] = mySymbol;
  
    const result = checkWinner(newBoard);
    const isWin = result === mySymbol;
    const isDraw = result === "draw";
  
    setIsWaiting(true);
    socket.emit("game_move", matchId, mySymbol, idx, isWin, isDraw);
  };
  
    
  const renderCell = (idx: number) => {
    const cellClass = `game-cell ${board[idx] ? `filled ${board[idx]?.toLowerCase()}` : ""}`;
    return (
      <div
        onClick={() => handleClick(idx)}
        className={cellClass}
      >
        {board[idx]}
      </div>
    );
  };

  return (
    <div className="match-container">
      <h1 className="match-title">Tic Tac Toe Battle!</h1>
      
      {mySymbol ? (
        <div className="match-info">
          Your symbol: <span className="player-symbol">{mySymbol}</span>
        </div>
      ) : (
        <div className="loading-symbol">Waiting for symbol assignment...</div>
      )}
      
      {winner && winner !== "draw" && (
        <h2 className="winner-announcement">{winner} wins the battle!</h2>
      )}
      
      {winner === "draw" && (
        <h2 className="winner-announcement">It's a draw!</h2>
      )}
      
      {!winner && mySymbol && (
        <div className="current-turn">
          Current turn: <span className="turn-indicator">{currentTurn}</span>
        </div>
      )}
      
      <div className="game-board">
        {Array(9)
          .fill(null)
          .map((_, idx) => (
            <React.Fragment key={idx}>{renderCell(idx)}</React.Fragment>
          ))}
      </div>
      
      {winner && (
        <button 
          onClick={() => navigate("/dashboard")} 
          className="back-button"
        >
          Back to Dashboard
        </button>
      )}
    </div>
  );
};

export default Match;