
export enum AlgorithmPhase {
  INPUT = 'INPUT',
  PREPARE = 'PREPARE', // Reversing strings to vectors
  COMPARE = 'COMPARE', // Check which number is larger (for subtraction)
  LOOP = 'LOOP',       // Main loop
  FLUSH = 'FLUSH',     // Processing remaining carry (multiplication)
  TRIM = 'TRIM',       // Removing leading zeros (subtraction/multiplication)
  FINISH = 'FINISH'    // Final result processing
}

export enum AlgorithmType {
  ADD = 'ADD',
  SUB = 'SUB',
  MUL = 'MUL',      // High Precision x Low Precision (int)
  MUL_BIG = 'MUL_BIG', // High Precision x High Precision
  DIV = 'DIV',      // High Precision / Low Precision
  DIV_BIG = 'DIV_BIG' // High Precision / High Precision
}

export interface VariableState {
  A: number[];
  B: number[]; // Used for ADD/SUB/MUL_BIG/DIV_BIG
  b_val?: number; // Used for MUL/DIV (scalar)
  C: number[];
  k: number; // Carry, Borrow, or 't' in MUL
  i: number; // Loop index
  j?: number; // Inner loop index for MUL_BIG
  currentVal: number | null; // Temp sum, difference, or product (t in C++ code)
  
  // Division specific
  r_val?: number; // Remainder for Scalar Division
  r_vec?: number[]; // Remainder vector for Big Division
  cnt?: number; // Quotient digit counter
}

export interface StepSnapshot {
  algorithm: AlgorithmType;
  phase: AlgorithmPhase;
  variables: VariableState;
  description: string;
  highlightLine: number; // Line number in the C++ code to highlight
  explanation?: string; // Optional AI explanation
  isNegativeResult?: boolean; // Specific for subtraction
  swapOperands?: boolean; // To indicate if we are doing B - A instead of A - B
}
