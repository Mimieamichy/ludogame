
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DICE_DOT_LAYOUTS } from '@/lib/ludo-constants';
import { cn } from '@/lib/utils';
import { Dices } from 'lucide-react';

interface DiceProps {
  value: number | null;
  onRoll: () => void;
  disabled: boolean;
}

const Dice: React.FC<DiceProps> = ({ value, onRoll, disabled }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number | null>(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleRoll = () => {
    if (disabled) return;
    setIsRolling(true);
    onRoll(); // Parent handles actual dice logic and updates `value` prop

    // Animation simulation
    let rollCount = 0;
    const interval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount > 10) { // Stop animation after some rolls
        clearInterval(interval);
        setIsRolling(false);
        // The actual value prop will update displayValue via useEffect
      }
    }, 50);

    // Ensure final value is displayed after animation
    setTimeout(() => {
      clearInterval(interval); // Clear interval if it's still running
      setIsRolling(false);
      setDisplayValue(value); // Make sure final prop value is shown
    }, 600); 
  };
  
  useEffect(() => {
    if (!isRolling) {
      setDisplayValue(value);
    }
  }, [value, isRolling]);


  const Dot: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn("w-3 h-3 md:w-4 md:h-4 bg-foreground rounded-full", className)} />
  );

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className={cn(
        "w-20 h-20 md:w-24 md:h-24 bg-card border-2 border-primary rounded-lg shadow-lg p-2 flex items-center justify-center transition-transform duration-300",
        isRolling ? "animate-spin" : ""
      )}>
        {displayValue !== null && (
          <div className={cn("w-full h-full grid p-1 gap-1", 
            displayValue === 1 ? "grid-cols-1 grid-rows-1 place-items-center" :
            displayValue === 2 ? "grid-cols-1 grid-rows-2 place-items-center" :
            displayValue === 3 ? "grid-cols-1 grid-rows-3 place-items-center" :
            displayValue === 4 ? "grid-cols-2 grid-rows-2" :
            displayValue === 5 ? "grid-cols-3 grid-rows-3" : // 5 dots is tricky with simple grid
            "grid-cols-2 grid-rows-3" // 6 dots
          )}>
            {displayValue === 1 && <Dot className="self-center justify-self-center"/>}
            {displayValue === 2 && (<><Dot className="self-start justify-self-start"/><Dot className="self-end justify-self-end"/></>)}
            {displayValue === 3 && (<><Dot className="self-start justify-self-start"/><Dot className="self-center justify-self-center"/><Dot className="self-end justify-self-end"/></>)}
            {displayValue === 4 && DICE_DOT_LAYOUTS[4].map((cls, i) => <Dot key={i} className={cls} />)}
            {displayValue === 5 && (
              <>
                <Dot className="col-start-1 row-start-1" />
                <Dot className="col-start-3 row-start-1" />
                <Dot className="col-start-2 row-start-2" />
                <Dot className="col-start-1 row-start-3" />
                <Dot className="col-start-3 row-start-3" />
              </>
            )}
            {displayValue === 6 && DICE_DOT_LAYOUTS[6].map((cls, i) => <Dot key={i} className={cls} />)}
          </div>
        )}
      </div>
      <Button
        onClick={handleRoll}
        disabled={disabled || isRolling}
        className="w-full text-lg font-semibold bg-accent hover:bg-accent/90 text-accent-foreground py-3 px-6 rounded-lg shadow-md transition-transform hover:scale-105 active:scale-95"
        aria-label="Roll dice"
      >
        <Dices className="mr-2 h-6 w-6" />
        {isRolling ? 'Rolling...' : (value === null ? 'Roll Dice' : `Rolled: ${value}`)}
      </Button>
    </div>
  );
};

export default Dice;
