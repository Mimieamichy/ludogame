
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DICE_DOT_LAYOUTS } from '@/lib/ludo-constants';
import { cn } from '@/lib/utils';
import { Dices } from 'lucide-react';

interface DiceProps {
  values: [number, number] | null;
  onRoll: () => void;
  disabled: boolean;
  pendingDiceValues: number[];
}

const SingleDieDisplay: React.FC<{ dieValue: number | null; isRollingPart: boolean; isUsed: boolean }> = ({ dieValue, isRollingPart, isUsed }) => {
  const Dot: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn("w-2 h-2 md:w-2.5 md:h-2.5 bg-foreground rounded-full", className)} />
  );

  let currentDisplayValue = dieValue;
  if (isRollingPart && currentDisplayValue === null) {
    // Animation handled by parent, but can show a placeholder if needed
  }

  return (
    <div className={cn(
        "w-16 h-16 md:w-20 md:h-20 bg-card border-2 border-primary rounded-lg shadow-md p-1 flex items-center justify-center transition-all duration-150",
        isRollingPart && "animate-spin",
        isUsed ? "opacity-40 ring-2 ring-muted" : "opacity-100",
      )}>
        {currentDisplayValue !== null && (
          // Using a 3x3 grid for 5, and 2x3 for 6 for better dot layout
          <div className={cn("w-full h-full grid p-0.5 gap-0.5", 
            currentDisplayValue === 1 ? "grid-cols-3 grid-rows-3" : // For centering 1
            currentDisplayValue === 2 ? "grid-cols-3 grid-rows-3" : // For diagonal 2
            currentDisplayValue === 3 ? "grid-cols-3 grid-rows-3" : // For diagonal 3
            currentDisplayValue === 4 ? "grid-cols-3 grid-rows-3" : // For 4 corners in 3x3
            currentDisplayValue === 5 ? "grid-cols-3 grid-rows-3" : 
            "grid-cols-3 grid-rows-3" // For 6 dots in 2 columns
          )}>
            {DICE_DOT_LAYOUTS[currentDisplayValue as keyof typeof DICE_DOT_LAYOUTS]?.map((cls, i) => <Dot key={i} className={cls} />)}
          </div>
        )}
      </div>
  );
};


const Dice: React.FC<DiceProps> = ({ values, onRoll, disabled, pendingDiceValues }) => {
  const [isRollingAnim, setIsRollingAnim] = useState(false);
  const [animDisplayValues, setAnimDisplayValues] = useState<[number, number] | null>(values);

  useEffect(() => {
    if (!isRollingAnim) { // Only update from props if not currently animating
        setAnimDisplayValues(values);
    }
  }, [values, isRollingAnim]);

  const handleRoll = () => {
    if (disabled || isRollingAnim) return;
    setIsRollingAnim(true);
    onRoll(); // Parent handles actual dice logic and updates `values` prop

    let rollCount = 0;
    const tempDisplayInterval = setInterval(() => {
      setAnimDisplayValues([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
      rollCount++;
      if (rollCount > 10) {
        clearInterval(tempDisplayInterval);
        setIsRollingAnim(false);
        // The actual `values` prop will update animDisplayValues via useEffect after animation
      }
    }, 50);

    // Ensure final value is displayed after animation if interval cleared early
    setTimeout(() => {
      if (isRollingAnim) { // Check if animation is still marked as running
        clearInterval(tempDisplayInterval); 
        setIsRollingAnim(false);
      }
      // `values` prop should take over via useEffect
    }, 600); 
  };
  

  const getButtonText = () => {
    if (isRollingAnim) return 'Rolling...';
    if (values === null) return 'Roll Dice';
    // If dice rolled, show what was rolled, even if some are pending
    return `Rolled: ${values[0]} & ${values[1]}`;
  };

  // Determine if a die value has been used
  // This logic needs to be robust if dice values can be the same.
  // Example: rolled [3, 3], pending [3]. Which 3 was used?
  // A simple way: if a value from `values` is NOT in `pendingDiceValues`, it's used.
  // If values = [3,5] and pending = [5], then 3 is used.
  // If values = [3,3] and pending = [3], then one 3 is used.
  // We can count occurrences.
  const countOccurrences = (arr: number[], val: number) => arr.filter(item => item === val).length;

  let die1Used = false;
  let die2Used = false;

  if (values) {
    const val1 = values[0];
    const val2 = values[1];
    const initialCount1 = countOccurrences(values, val1);
    const initialCount2 = countOccurrences(values, val2);
    const pendingCount1 = countOccurrences(pendingDiceValues, val1);
    const pendingCount2 = countOccurrences(pendingDiceValues, val2);

    if (val1 === val2) { // Doubles
        const usedCount = initialCount1 - pendingCount1;
        if(usedCount >=1) die1Used = true;
        if(usedCount >=2) die2Used = true;
    } else {
        if (pendingCount1 < initialCount1) die1Used = true;
        if (pendingCount2 < initialCount2) die2Used = true;
    }
  }


  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex space-x-3">
        <SingleDieDisplay dieValue={animDisplayValues ? animDisplayValues[0] : null} isRollingPart={isRollingAnim} isUsed={die1Used && !isRollingAnim} />
        <SingleDieDisplay dieValue={animDisplayValues ? animDisplayValues[1] : null} isRollingPart={isRollingAnim} isUsed={die2Used && !isRollingAnim} />
      </div>
      <Button
        onClick={handleRoll}
        disabled={disabled || isRollingAnim}
        className="w-full text-lg font-semibold bg-accent hover:bg-accent/90 text-accent-foreground py-3 px-6 rounded-lg shadow-md transition-transform hover:scale-105 active:scale-95"
        aria-label="Roll dice"
      >
        <Dices className="mr-2 h-6 w-6" />
        {getButtonText()}
      </Button>
    </div>
  );
};

export default Dice;
