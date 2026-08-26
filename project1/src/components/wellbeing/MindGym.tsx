import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Gamepad2,
  Trophy,
  Lock,
  RefreshCw,
  Brain,
  Puzzle,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Timer,
  Star,
  Award,
  ChevronRight,
} from "lucide-react";
import {
  db,
  doc,
  getDoc,
  setDoc,
  handleFirestoreError,
  OperationType,
} from "@/firebase";
import { translations } from "@/lib/translations";
import { sounds } from "@/lib/sounds";
import { getVariant } from "@/lib/abTesting";

// --- Sudoku Game Component ---
type Difficulty = "Easy" | "Medium" | "Hard";

const SudokuGame = ({
  onComplete,
  onCancel,
  stats,
  updateStats,
}: {
  onComplete: (time: number, difficulty: Difficulty) => void;
  onCancel: () => void;
  stats: any;
  updateStats: (
    game: "sudoku" | "focusFlow",
    time: number,
    difficulty: Difficulty,
  ) => void;
}) => {
  const [grid, setGrid] = useState<(number | null)[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [initialGrid, setInitialGrid] = useState<boolean[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null,
  );
  const [isComplete, setIsComplete] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [errors, setErrors] = useState<boolean[][]>(
    Array(9)
      .fill(null)
      .map(() => Array(9).fill(false)),
  );
  const [showInstructions, setShowInstructions] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);

  // Simple Sudoku generator logic
  const generateSudoku = useCallback((diff: Difficulty) => {
    // Base valid Sudoku
    const base = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ];

    // Shuffle rows/cols within blocks for variety
    const shuffled = [...base];
    setSolution(shuffled);

    const cellsToRemove = diff === "Easy" ? 30 : diff === "Medium" ? 45 : 55;
    const newGrid = shuffled.map((row) => [...row]);
    let removed = 0;
    while (removed < cellsToRemove) {
      const r = Math.floor(Math.random() * 9);
      const c = Math.floor(Math.random() * 9);
      if (newGrid[r][c] !== null) {
        newGrid[r][c] = null;
        removed++;
      }
    }

    setGrid(newGrid);
    setInitialGrid(newGrid.map((row) => row.map((cell) => cell !== null)));
    setErrors(
      Array(9)
        .fill(null)
        .map(() => Array(9).fill(false)),
    );
    setTimer(0);
    setIsActive(true);
    setIsComplete(false);
    setShowSummary(false);
    setIsNewBest(false);
  }, []);

  useEffect(() => {
    if (!showInstructions) {
      generateSudoku(difficulty);
    }
  }, [difficulty, generateSudoku, showInstructions]);

  useEffect(() => {
    let interval: any;
    if (isActive && !isComplete) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isComplete]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCellClick = (r: number, c: number) => {
    if (initialGrid[r][c] || isComplete) return;
    setSelectedCell([r, c]);
    sounds.click();
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || isComplete) return;
    const [r, c] = selectedCell;

    const newGrid = [...grid.map((row) => [...row])];
    newGrid[r][c] = num;
    setGrid(newGrid);

    const newErrors = [...errors.map((row) => [...row])];
    const isError = num !== solution[r][c];
    newErrors[r][c] = isError;
    setErrors(newErrors);

    if (isError) {
      sounds.error();
    } else {
      sounds.correct();
    }

    const isFull = newGrid.every((row, ri) =>
      row.every((cell, ci) => cell === solution[ri][ci]),
    );
    if (isFull) {
      setIsComplete(true);
      setIsActive(false);
      sounds.complete();

      const bestTimeKey = `bestTime${difficulty}` as keyof typeof stats.sudoku;
      const currentBest = stats.sudoku[bestTimeKey];
      if (currentBest === null || timer < currentBest) {
        setIsNewBest(true);
      }

      updateStats("sudoku", timer, difficulty);
      setTimeout(() => setShowSummary(true), 1500);
    }
  };

  if (showInstructions) {
    return (
      <div className="text-center space-y-8 py-10">
        <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto border border-blue-500/30 glow-blue">
          <Brain size={40} className="text-blue-400" />
        </div>
        <div className="space-y-4">
          <h3 className="text-2xl font-display uppercase tracking-widest">
            BetterYou Sudoku Guide
          </h3>
          <p className="text-xs opacity-60 leading-relaxed max-w-xs mx-auto">
            Fill the 9x9 grid so that each row, column, and 3x3 section contains
            all digits from 1 to 9.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 max-w-xs mx-auto">
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 text-left">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
              1
            </div>
            <p className="text-[10px] uppercase tracking-wider font-bold opacity-70">
              Select an empty cell
            </p>
          </div>
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 text-left">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
              2
            </div>
            <p className="text-[10px] uppercase tracking-wider font-bold opacity-70">
              Choose a number from the bottom
            </p>
          </div>
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 text-left">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
              3
            </div>
            <p className="text-[10px] uppercase tracking-wider font-bold opacity-70">
              Complete the grid as fast as possible
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            sounds.click();
            setShowInstructions(false);
          }}
          className="px-12 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all"
          aria-label="Start Sudoku training"
        >
          Begin Training
        </button>
      </div>
    );
  }

  if (showSummary) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-10 py-10"
      >
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30 glow-blue relative">
          <Award size={48} className="text-green-400" />
          {isNewBest && (
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter"
            >
              New Best!
            </motion.div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-3xl font-display uppercase tracking-tighter">
            Training Complete
          </h3>
          <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">
            Cognitive Reset Successful
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="glass-surface-vibrant p-6 rounded-[32px] border border-white/10">
            <p className="text-[9px] uppercase tracking-widest font-black opacity-30 mb-2">
              Time Taken
            </p>
            <p className="text-2xl font-display font-black text-blue-400">
              {formatTime(timer)}
            </p>
          </div>
          <div className="glass-surface-vibrant p-6 rounded-[32px] border border-white/10">
            <p className="text-[9px] uppercase tracking-widest font-black opacity-30 mb-2">
              Difficulty
            </p>
            <p className="text-2xl font-display font-black text-purple-400">
              {difficulty}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => onComplete(timer, difficulty)}
            className="px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3 mx-auto"
          >
            Log Session & Close <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 max-w-md mx-auto">
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/10">
        <div className="flex gap-2" role="group" aria-label="Select difficulty">
          {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => {
                sounds.click();
                setDifficulty(d);
              }}
              className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${difficulty === d ? "bg-blue-500 text-white glow-blue" : "bg-white/5 text-white/30 hover:bg-white/10"}`}
              aria-pressed={difficulty === d}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Timer size={14} className="text-blue-400" />
          <span
            className="text-xl font-mono font-black text-blue-400"
            aria-label={`Time elapsed: ${formatTime(timer)}`}
          >
            {formatTime(timer)}
          </span>
        </div>
      </div>

      <div
        className="grid grid-cols-9 gap-1 bg-white/5 p-2 rounded-[24px] border border-white/10 shadow-2xl relative"
        role="grid"
        aria-label="Sudoku board"
      >
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <motion.button
              key={`${r}-${c}`}
              whileHover={!initialGrid[r][c] ? { scale: 1.05, zIndex: 10 } : {}}
              onClick={() => handleCellClick(r, c)}
              className={`aspect-square flex items-center justify-center text-xs font-black rounded-lg transition-all
              ${initialGrid[r][c] ? "bg-white/5 text-white/20" : "bg-white/10 text-blue-400 hover:bg-white/20"}
              ${selectedCell?.[0] === r && selectedCell?.[1] === c ? "ring-2 ring-blue-500 bg-blue-500/30" : ""}
              ${errors[r][c] ? "bg-red-500/20 text-red-500 ring-1 ring-red-500/50" : ""}
              ${(r + 1) % 3 === 0 && r < 8 ? "mb-1" : ""}
              ${(c + 1) % 3 === 0 && c < 8 ? "mr-1" : ""}
            `}
              aria-label={`Cell at row ${r + 1}, column ${c + 1}. ${cell ? `Value: ${cell}` : "Empty"}`}
              aria-readonly={initialGrid[r][c]}
            >
              {cell}
            </motion.button>
          )),
        )}
      </div>

      <div
        className="grid grid-cols-9 gap-2"
        role="group"
        aria-label="Number input"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <motion.button
            key={num}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNumberInput(num)}
            className="aspect-square bg-white/5 hover:bg-blue-500 border border-white/10 hover:border-blue-400 rounded-xl flex items-center justify-center text-blue-400 hover:text-white font-black transition-all text-sm"
            aria-label={`Input number ${num}`}
          >
            {num}
          </motion.button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-3 px-6 py-3 bg-green-500/20 border border-green-500/40 rounded-full text-green-400 font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl">
                <CheckCircle2 size={18} /> Puzzle Solved!
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onCancel}
          className="text-[9px] uppercase tracking-[0.4em] font-black opacity-30 hover:opacity-100 transition-all"
        >
          Quit Training
        </button>
      </div>
    </div>
  );
};

// --- Focus Flow Game Component ---
const FocusFlowGame = ({
  onComplete,
  onCancel,
  stats,
  updateStats,
}: {
  onComplete: (time: number, difficulty: Difficulty) => void;
  onCancel: () => void;
  stats: any;
  updateStats: (
    game: "sudoku" | "focusFlow",
    time: number,
    difficulty: Difficulty,
  ) => void;
}) => {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);

  const gridSize =
    difficulty === "Easy" ? 9 : difficulty === "Medium" ? 16 : 25;
  const cols =
    difficulty === "Easy"
      ? "grid-cols-3"
      : difficulty === "Medium"
        ? "grid-cols-4"
        : "grid-cols-5";

  const generateGame = useCallback((diff: Difficulty) => {
    const size = diff === "Easy" ? 9 : diff === "Medium" ? 16 : 25;
    const nums = Array.from({ length: size }, (_, i) => i + 1).sort(
      () => Math.random() - 0.5,
    );
    setNumbers(nums);
    setNextNumber(1);
    setTimer(0);
    setIsActive(true);
    setIsComplete(false);
    setShowSummary(false);
    setIsNewBest(false);
  }, []);

  useEffect(() => {
    if (!showInstructions) {
      generateGame(difficulty);
    }
  }, [difficulty, generateGame, showInstructions]);

  useEffect(() => {
    let interval: any;
    if (isActive && !isComplete) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isComplete]);

  const handleNumberClick = (num: number) => {
    if (num === nextNumber) {
      sounds.correct();
      if (num === gridSize) {
        setIsComplete(true);
        setIsActive(false);
        sounds.complete();

        const bestTimeKey =
          `bestTime${difficulty}` as keyof typeof stats.focusFlow;
        const currentBest = stats.focusFlow[bestTimeKey];
        if (currentBest === null || timer < currentBest) {
          setIsNewBest(true);
        }

        updateStats("focusFlow", timer, difficulty);
        setTimeout(() => setShowSummary(true), 1500);
      } else {
        setNextNumber((prev) => prev + 1);
      }
    } else {
      sounds.error();
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (showInstructions) {
    return (
      <div className="text-center space-y-8 py-10">
        <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto border border-purple-500/30 glow-purple">
          <Puzzle size={40} className="text-purple-400" />
        </div>
        <div className="space-y-4">
          <h3 className="text-2xl font-display uppercase tracking-widest">
            Focus Flow Guide
          </h3>
          <p className="text-xs opacity-60 leading-relaxed max-w-xs mx-auto">
            Find and click the numbers in ascending order as quickly as
            possible.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 max-w-xs mx-auto">
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 text-left">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
              1
            </div>
            <p className="text-[10px] uppercase tracking-wider font-bold opacity-70">
              Locate the target number
            </p>
          </div>
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 text-left">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
              2
            </div>
            <p className="text-[10px] uppercase tracking-wider font-bold opacity-70">
              Click to advance to the next
            </p>
          </div>
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 text-left">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
              3
            </div>
            <p className="text-[10px] uppercase tracking-wider font-bold opacity-70">
              Clear the entire grid
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            sounds.click();
            setShowInstructions(false);
          }}
          className="px-12 py-4 bg-purple-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all"
          aria-label="Start Focus Flow training"
        >
          Begin Training
        </button>
      </div>
    );
  }

  if (showSummary) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-10 py-10"
      >
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30 glow-purple relative">
          <Award size={48} className="text-green-400" />
          {isNewBest && (
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter"
            >
              New Best!
            </motion.div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-3xl font-display uppercase tracking-tighter">
            Focus Restored
          </h3>
          <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">
            Cognitive Reset Successful
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="glass-surface-vibrant p-6 rounded-[32px] border border-white/10">
            <p className="text-[9px] uppercase tracking-widest font-black opacity-30 mb-2">
              Time Taken
            </p>
            <p className="text-2xl font-display font-black text-purple-400">
              {formatTime(timer)}
            </p>
          </div>
          <div className="glass-surface-vibrant p-6 rounded-[32px] border border-white/10">
            <p className="text-[9px] uppercase tracking-widest font-black opacity-30 mb-2">
              Difficulty
            </p>
            <p className="text-2xl font-display font-black text-blue-400">
              {difficulty}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => onComplete(timer, difficulty)}
            className="px-12 py-4 bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3 mx-auto"
          >
            Log Session & Close <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 max-w-md mx-auto">
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/10">
        <div className="flex gap-2" role="group" aria-label="Select difficulty">
          {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => {
                sounds.click();
                setDifficulty(d);
              }}
              className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${difficulty === d ? "bg-purple-500 text-white glow-purple" : "bg-white/5 text-white/30 hover:bg-white/10"}`}
              aria-pressed={difficulty === d}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Timer size={14} className="text-purple-400" />
          <span
            className="text-xl font-mono font-black text-purple-400"
            aria-label={`Time elapsed: ${formatTime(timer)}`}
          >
            {formatTime(timer)}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center px-4">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.4em] font-black opacity-30">
            Target
          </span>
          <span className="text-3xl font-display text-purple-400 font-black">
            {nextNumber}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-[0.4em] font-black opacity-30">
            Max
          </span>
          <span className="text-3xl font-display text-white/40 font-black">
            {gridSize}
          </span>
        </div>
      </div>

      <div
        className={`grid ${cols} gap-4 p-4 bg-white/5 rounded-[32px] border border-white/10 shadow-2xl relative`}
        role="grid"
        aria-label="Focus Flow grid"
      >
        {numbers.map((num) => (
          <motion.button
            key={num}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNumberClick(num)}
            className={`aspect-square rounded-2xl flex items-center justify-center text-xl font-display font-black transition-all border
              ${
                num < nextNumber
                  ? "bg-green-500/20 border-green-500/40 text-green-400 opacity-40"
                  : num === nextNumber
                    ? "bg-gradient-to-br from-purple-600 to-purple-400 border-purple-300 text-white shadow-2xl glow-purple scale-110 z-20"
                    : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white hover:border-white/20"
              }
            `}
            aria-label={`Number ${num}`}
            aria-current={num === nextNumber ? "step" : undefined}
            disabled={num < nextNumber}
          >
            {num}
          </motion.button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-3 px-6 py-3 bg-green-500/20 border border-green-500/40 rounded-full text-green-400 font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl">
                <CheckCircle2 size={18} /> Focus Restored!
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onCancel}
          className="text-[9px] uppercase tracking-[0.4em] font-black opacity-30 hover:opacity-100 transition-all"
        >
          Quit Training
        </button>
      </div>
    </div>
  );
};

interface MindGymProps {
  userId: string;
  language?: string;
}

export default function MindGym({
  userId,
  language = "English",
}: MindGymProps) {
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentGame, setCurrentGame] = useState<"sudoku" | "puzzle" | null>(
    null,
  );
  const [stats, setStats] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const t = translations[language] || translations.English;

  useEffect(() => {
    if (hasPlayedToday) {
      const updateTimer = () => {
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setHours(24, 0, 0, 0);
        const diff = tomorrow.getTime() - now.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      };
      updateTimer();
      const timer = setInterval(updateTimer, 1000);
      return () => clearInterval(timer);
    }
  }, [hasPlayedToday]);

  const motivationalVariant = getVariant("mind_gym_motivation", ["A", "B"]);

  const motivationalMessages = {
    A: "One session a day keeps the mental fog away.",
    B: "Sharpen your mind, conquer your studies.",
  };

  useEffect(() => {
    checkPlayStatus();
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      const docRef = doc(db, "gameStats", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setStats(docSnap.data());
      } else {
        const initialStats = {
          userId,
          sudoku: {
            gamesPlayed: 0,
            bestTimeEasy: null,
            bestTimeMedium: null,
            bestTimeHard: null,
          },
          focusFlow: {
            gamesPlayed: 0,
            bestTimeEasy: null,
            bestTimeMedium: null,
            bestTimeHard: null,
          },
        };
        await setDoc(docRef, initialStats);
        setStats(initialStats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const updateStats = async (
    game: "sudoku" | "focusFlow",
    time: number,
    difficulty: Difficulty,
  ) => {
    if (!stats) return;

    const newStats = { ...stats };
    const gameStats = newStats[game];
    gameStats.gamesPlayed += 1;

    const bestTimeKey = `bestTime${difficulty}` as keyof typeof gameStats;
    if (
      gameStats[bestTimeKey] === null ||
      time < (gameStats[bestTimeKey] as number)
    ) {
      (gameStats[bestTimeKey] as any) = time;
    }

    try {
      await setDoc(doc(db, "gameStats", userId), newStats);
      setStats(newStats);
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  };

  const checkPlayStatus = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const docRef = doc(db, "gameLogs", `${userId}_${today}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setHasPlayedToday(true);
      }
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.GET,
        `gameLogs/${userId}_${new Date().toISOString().split("T")[0]}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const logPlay = async (time: number, difficulty: Difficulty) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      await setDoc(doc(db, "gameLogs", `${userId}_${today}`), {
        userId,
        date: today,
        playedAt: new Date().toISOString(),
        game: currentGame,
        time,
        difficulty,
      });
      setHasPlayedToday(true);
      setCurrentGame(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "gameLogs");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="animate-spin text-[#ff4e00]" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#ff4e00] via-purple-500 to-blue-500">
            {t.mindGym}
          </h2>
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">
            {t.cognitiveReset}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
            <Trophy size={16} className="text-yellow-500" />
            <span className="text-xs font-bold uppercase tracking-widest">
              {t.dailyLimit}
            </span>
          </div>
        </div>
      </div>

      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="glass-surface-vibrant p-6 rounded-[32px] border border-white/10">
            <p className="text-[9px] uppercase tracking-widest font-black opacity-30 mb-2">
              Total Games
            </p>
            <p className="text-2xl font-display font-black">
              {(stats.sudoku?.gamesPlayed || 0) +
                (stats.focusFlow?.gamesPlayed || 0)}
            </p>
          </div>
          <div className="glass-surface-vibrant p-6 rounded-[32px] border border-white/10">
            <p className="text-[9px] uppercase tracking-widest font-black opacity-30 mb-2">
              Sudoku Best
            </p>
            <p className="text-2xl font-display font-black text-blue-400">
              {stats.sudoku?.bestTimeEasy
                ? `${Math.floor(stats.sudoku.bestTimeEasy / 60)}:${(stats.sudoku.bestTimeEasy % 60).toString().padStart(2, "0")}`
                : "--:--"}
            </p>
          </div>
          <div className="glass-surface-vibrant p-6 rounded-[32px] border border-white/10">
            <p className="text-[9px] uppercase tracking-widest font-black opacity-30 mb-2">
              Focus Best
            </p>
            <p className="text-2xl font-display font-black text-purple-400">
              {stats.focusFlow?.bestTimeEasy
                ? `${Math.floor(stats.focusFlow.bestTimeEasy / 60)}:${(stats.focusFlow.bestTimeEasy % 60).toString().padStart(2, "0")}`
                : "--:--"}
            </p>
          </div>
          <div className="glass-surface-vibrant p-6 rounded-[32px] border border-white/10">
            <p className="text-[9px] uppercase tracking-widest font-black opacity-30 mb-2">
              Daily Streak
            </p>
            <p className="text-2xl font-display font-black text-orange-500">
              1
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sudoku Card */}
        <motion.div
          whileHover={!hasPlayedToday ? { y: -5, scale: 1.02 } : {}}
          className={`glass-surface-vibrant rounded-[40px] p-10 relative overflow-hidden border border-white/10 transition-all ${hasPlayedToday ? "opacity-50 grayscale" : ""}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          <div className="relative z-10">
            <div className="w-16 h-16 bg-blue-500/20 rounded-[24px] flex items-center justify-center text-blue-500 mb-8 border border-blue-500/30 glow-blue">
              <Brain size={32} />
            </div>
            <h3 className="text-xl font-display uppercase tracking-tighter mb-4">
              BetterYou Sudoku
            </h3>
            <p className="text-xs opacity-50 leading-relaxed mb-8">
              A classic logic-based number placement puzzle. Perfect for
              sharpening your pattern recognition and logical thinking.
            </p>
            <button
              onClick={() => !hasPlayedToday && setCurrentGame("sudoku")}
              disabled={hasPlayedToday}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:hover:scale-100 active:scale-95"
            >
              {hasPlayedToday ? (
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-2">
                    <Lock size={14} /> {t.playedToday}
                  </div>
                  <div className="text-[8px] opacity-60 font-mono tracking-tighter">
                    {t.nextSessionIn}: {timeLeft}
                  </div>
                </div>
              ) : (
                t.startTraining
              )}
            </button>
          </div>
        </motion.div>

        {/* Puzzle Card */}
        <motion.div
          whileHover={!hasPlayedToday ? { y: -5, scale: 1.02 } : {}}
          className={`glass-surface-vibrant rounded-[40px] p-10 relative overflow-hidden border border-white/10 transition-all ${hasPlayedToday ? "opacity-50 grayscale" : ""}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
          <div className="relative z-10">
            <div className="w-16 h-16 bg-purple-500/20 rounded-[24px] flex items-center justify-center text-purple-500 mb-8 border border-purple-500/30 glow-purple">
              <Puzzle size={32} />
            </div>
            <h3 className="text-xl font-display uppercase tracking-tighter mb-4">
              Focus Flow
            </h3>
            <p className="text-xs opacity-50 leading-relaxed mb-8">
              A spatial reasoning puzzle designed to reset your mental state and
              prepare you for the next deep work session.
            </p>
            <button
              onClick={() => !hasPlayedToday && setCurrentGame("puzzle")}
              disabled={hasPlayedToday}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:hover:scale-100 active:scale-95"
            >
              {hasPlayedToday ? (
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-2">
                    <Lock size={14} /> {t.playedToday}
                  </div>
                  <div className="text-[8px] opacity-60 font-mono tracking-tighter">
                    {t.nextSessionIn}: {timeLeft}
                  </div>
                </div>
              ) : (
                t.startTraining
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Game Modal */}
      <AnimatePresence>
        {currentGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4"
          >
            <div className="max-w-2xl w-full">
              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Sparkles className="text-[#ff4e00] animate-pulse" />
                  <h2 className="text-5xl font-display uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#ff4e00] to-purple-500">
                    {currentGame === "sudoku"
                      ? "BetterYou Sudoku"
                      : "Focus Flow"}
                  </h2>
                  <Sparkles className="text-[#ff4e00] animate-pulse" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">
                  Cognitive Calibration in Progress
                </p>
              </div>

              <div className="glass-surface-vibrant rounded-[50px] p-12 border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff4e00]/20 to-transparent" />

                {currentGame === "sudoku" ? (
                  <SudokuGame
                    onComplete={logPlay}
                    onCancel={() => setCurrentGame(null)}
                    stats={stats}
                    updateStats={updateStats}
                  />
                ) : (
                  <FocusFlowGame
                    onComplete={logPlay}
                    onCancel={() => setCurrentGame(null)}
                    stats={stats}
                    updateStats={updateStats}
                  />
                )}
              </div>

              <div className="mt-12 flex items-center justify-center gap-6 opacity-40">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span className="text-[10px] uppercase tracking-widest">
                    Daily session will be logged upon completion
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-10 bg-gradient-to-br from-[#ff4e00]/10 via-transparent to-purple-500/10 border border-white/10 rounded-[40px] flex items-start gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Brain size={120} />
        </div>
        <div className="p-4 bg-[#ff4e00]/20 rounded-3xl border border-[#ff4e00]/30 glow-orange relative z-10">
          <Sparkles size={24} className="text-[#ff4e00]" />
        </div>
        <div className="relative z-10">
          <h4 className="text-sm font-bold uppercase tracking-widest text-[#ff4e00] mb-3">
            The Golden Rule
          </h4>
          <p className="text-xs leading-relaxed opacity-60 italic max-w-2xl">
            "Mini-games are designed as a 'Cognitive Reset'. To prevent
            addiction and ensure they remain a productive break, you are limited
            to one session per day. Use it when you truly feel the mental
            fatigue setting in."
          </p>
        </div>
      </div>
    </div>
  );
}
