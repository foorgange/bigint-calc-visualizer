
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowRight, Play, RotateCcw, Pause, Sparkles, Settings, Calculator, Minus, Plus, X, Divide } from 'lucide-react';
import { CodeViewer } from './components/CodeViewer';
import { ArrayVisualizer } from './components/ArrayVisualizer';
import { explainStep } from './services/geminiService';
import { StepSnapshot, AlgorithmPhase, VariableState, AlgorithmType } from './types';
import { DEFAULT_NUM1, DEFAULT_NUM2, CPP_CODE_ADD, CPP_CODE_SUB, CPP_CODE_MUL, CPP_CODE_MUL_BIG, CPP_CODE_DIV, CPP_CODE_DIV_BIG } from './constants';

const App: React.FC = () => {
  // Inputs
  const [num1Str, setNum1Str] = useState(DEFAULT_NUM1);
  const [num2Str, setNum2Str] = useState(DEFAULT_NUM2);
  const [algoType, setAlgoType] = useState<AlgorithmType>(AlgorithmType.ADD);
  
  // Playback State
  const [history, setHistory] = useState<StepSnapshot[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // AI State
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- Addition Logic ---
  const generateAddSteps = (a: string, b: string): StepSnapshot[] => {
    const steps: StepSnapshot[] = [];
    const currentVars: VariableState = { A: [], B: [], C: [], k: 0, i: 0, currentVal: null };

    steps.push({
      algorithm: AlgorithmType.ADD,
      phase: AlgorithmPhase.INPUT,
      variables: JSON.parse(JSON.stringify(currentVars)),
      description: "程序开始，输入 string a, b",
      highlightLine: 24
    });

    for (let i = a.length - 1; i >= 0; i--) currentVars.A.push(parseInt(a[i]));
    for (let i = b.length - 1; i >= 0; i--) currentVars.B.push(parseInt(b[i]));

    steps.push({
      algorithm: AlgorithmType.ADD,
      phase: AlgorithmPhase.PREPARE,
      variables: JSON.parse(JSON.stringify(currentVars)),
      description: "将字符串逆序存入 vector A 和 B",
      highlightLine: 25
    });

    const maxLen = Math.max(currentVars.A.length, currentVars.B.length);
    for (let i = 0; i < maxLen; i++) {
        currentVars.i = i;
        currentVars.currentVal = null;
        
        steps.push({
            algorithm: AlgorithmType.ADD,
            phase: AlgorithmPhase.LOOP,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `循环 i=${i}。检查 A[${i}] 和 B[${i}]`,
            highlightLine: 9
        });

        let valA = i < currentVars.A.length ? currentVars.A[i] : 0;
        let valB = i < currentVars.B.length ? currentVars.B[i] : 0;
        let tempK = currentVars.k + valA + valB;
        currentVars.currentVal = tempK;

        steps.push({
            algorithm: AlgorithmType.ADD,
            phase: AlgorithmPhase.LOOP,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `计算 sum = k + A[${i}] + B[${i}] = ${tempK}`,
            highlightLine: 10
        });

        const digit = tempK % 10;
        currentVars.C.push(digit);
        
        steps.push({
            algorithm: AlgorithmType.ADD,
            phase: AlgorithmPhase.LOOP,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `C.push_back(${tempK} % 10) -> ${digit}`,
            highlightLine: 12
        });

        currentVars.k = Math.floor(tempK / 10);
        
        steps.push({
            algorithm: AlgorithmType.ADD,
            phase: AlgorithmPhase.LOOP,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `更新进位 k = ${tempK} / 10 -> ${currentVars.k}`,
            highlightLine: 13
        });
    }
    currentVars.currentVal = null;

    if (currentVars.k > 0) {
        currentVars.C.push(1);
        steps.push({
            algorithm: AlgorithmType.ADD,
            phase: AlgorithmPhase.LOOP,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: "存在剩余进位，C.push_back(1)",
            highlightLine: 15
        });
    }

    steps.push({
        algorithm: AlgorithmType.ADD,
        phase: AlgorithmPhase.FINISH,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "算法完成，逆序输出 C",
        highlightLine: 28
    });

    return steps;
  };

  // --- Subtraction Logic ---
  const generateSubSteps = (aStr: string, bStr: string): StepSnapshot[] => {
    const steps: StepSnapshot[] = [];
    const currentVars: VariableState = { A: [], B: [], C: [], k: 0, i: 0, currentVal: null };
    const toVec = (s: string) => s.split('').reverse().map(Number);
    
    steps.push({
        algorithm: AlgorithmType.SUB,
        phase: AlgorithmPhase.INPUT,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "程序开始，输入 string a, b",
        highlightLine: 35
    });
    
    let vecA = toVec(aStr);
    let vecB = toVec(bStr);
    currentVars.A = [...vecA];
    currentVars.B = [...vecB];

    steps.push({
        algorithm: AlgorithmType.SUB,
        phase: AlgorithmPhase.PREPARE,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "将字符串逆序存入 vector A 和 B",
        highlightLine: 36
    });

    const cmp = (A: number[], B: number[]) => {
        if (A.length !== B.length) return A.length > B.length;
        for (let i = A.length - 1; i >= 0; i--) {
            if (A[i] !== B[i]) return A[i] > B[i];
        }
        return true;
    };

    const isAGreaterOrEqual = cmp(vecA, vecB);
    let isNegativeResult = !isAGreaterOrEqual;
    let mainA = isAGreaterOrEqual ? vecA : vecB;
    let mainB = isAGreaterOrEqual ? vecB : vecA;
    
    currentVars.A = [...mainA];
    currentVars.B = [...mainB];
    
    steps.push({
        algorithm: AlgorithmType.SUB,
        phase: AlgorithmPhase.COMPARE,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: isAGreaterOrEqual 
            ? "cmp(A,B) 为 true。执行 C = sub(A, B)。" 
            : "cmp(A,B) 为 false。A < B，执行 C = sub(B, A)，并输出 '-'。",
        highlightLine: isAGreaterOrEqual ? 39 : 40,
        isNegativeResult,
        swapOperands: !isAGreaterOrEqual
    });

    for (let i = 0; i < mainA.length; i++) {
        currentVars.i = i;
        currentVars.currentVal = null;
        
        steps.push({
            algorithm: AlgorithmType.SUB,
            phase: AlgorithmPhase.LOOP,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `循环 i=${i}。计算 t = A[${i}] - k`,
            highlightLine: 21,
            isNegativeResult
        });

        let t = mainA[i] - currentVars.k;
        currentVars.currentVal = t;
        
        steps.push({
            algorithm: AlgorithmType.SUB,
            phase: AlgorithmPhase.LOOP,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `t = ${mainA[i]} - ${currentVars.k} = ${t}`,
            highlightLine: 22,
            isNegativeResult
        });

        if (i < mainB.length) {
            t -= mainB[i];
            currentVars.currentVal = t;
             steps.push({
                algorithm: AlgorithmType.SUB,
                phase: AlgorithmPhase.LOOP,
                variables: JSON.parse(JSON.stringify(currentVars)),
                description: `i < B.size()，t -= B[${i}] (${mainB[i]}) -> t = ${t}`,
                highlightLine: 23,
                isNegativeResult
            });
        }

        if (t < 0) {
            t += 10;
            currentVars.k = 1;
            steps.push({
                algorithm: AlgorithmType.SUB,
                phase: AlgorithmPhase.LOOP,
                variables: { ...JSON.parse(JSON.stringify(currentVars)), currentVal: t - 10 }, 
                description: `t < 0 (${t-10})，借位：t += 10 -> ${t}, k = 1`,
                highlightLine: 24,
                isNegativeResult
            });
        } else {
            currentVars.k = 0;
            steps.push({
                algorithm: AlgorithmType.SUB,
                phase: AlgorithmPhase.LOOP,
                variables: JSON.parse(JSON.stringify(currentVars)),
                description: `t >= 0，不借位：k = 0`,
                highlightLine: 25,
                isNegativeResult
            });
        }
        
        currentVars.currentVal = t; 
        currentVars.C.push(t);
        steps.push({
            algorithm: AlgorithmType.SUB,
            phase: AlgorithmPhase.LOOP,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `C.push_back(${t})`,
            highlightLine: 26,
            isNegativeResult
        });
    }
    
    currentVars.currentVal = null;
    currentVars.i = mainA.length;

    steps.push({
        algorithm: AlgorithmType.SUB,
        phase: AlgorithmPhase.TRIM,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "去除前导零",
        highlightLine: 28,
        isNegativeResult
    });

    let popped = false;
    while (currentVars.C.length > 1 && currentVars.C[currentVars.C.length - 1] === 0) {
        currentVars.C.pop();
        popped = true;
    }
    
    if (popped) {
         steps.push({
            algorithm: AlgorithmType.SUB,
            phase: AlgorithmPhase.TRIM,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: "发现前导零并移除",
            highlightLine: 28,
            isNegativeResult
        });
    }

    steps.push({
        algorithm: AlgorithmType.SUB,
        phase: AlgorithmPhase.FINISH,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: `计算完成。${isNegativeResult ? '由于 A < B，输出负号。' : ''}逆序输出 C。`,
        highlightLine: 41,
        isNegativeResult
    });

    return steps;
  };

  // --- Multiplication Logic ---
  const generateMulSteps = (aStr: string, bStr: string): StepSnapshot[] => {
    const steps: StepSnapshot[] = [];
    const currentVars: VariableState = { A: [], B: [], C: [], k: 0, i: 0, currentVal: null, b_val: 0 };
    
    steps.push({
        algorithm: AlgorithmType.MUL,
        phase: AlgorithmPhase.INPUT,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "程序开始，输入 string a, int b",
        highlightLine: 28
    });

    for (let i = aStr.length - 1; i >= 0; i--) currentVars.A.push(parseInt(aStr[i]));
    const bInt = parseInt(bStr);
    currentVars.b_val = isNaN(bInt) ? 0 : bInt;

    steps.push({
        algorithm: AlgorithmType.MUL,
        phase: AlgorithmPhase.PREPARE,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "a 转为 vector A (逆序), b 存为 int",
        highlightLine: 31
    });

    currentVars.k = 0;

    for(let i=0; i<currentVars.A.length; i++) {
        currentVars.i = i;
        currentVars.currentVal = null;
        let t = currentVars.k; 
        
        steps.push({
            algorithm: AlgorithmType.MUL,
            phase: AlgorithmPhase.LOOP,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `循环 i=${i}。t = t + A[${i}]*b`,
            highlightLine: 12
        });
        
        t += currentVars.A[i] * currentVars.b_val;
        currentVars.currentVal = t;

        steps.push({
            algorithm: AlgorithmType.MUL,
            phase: AlgorithmPhase.LOOP,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `t = ${currentVars.k} + ${currentVars.A[i]} * ${currentVars.b_val} = ${t}`,
            highlightLine: 12
        });

        currentVars.C.push(t % 10);
        steps.push({
            algorithm: AlgorithmType.MUL,
            phase: AlgorithmPhase.LOOP,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `C.push_back(${t} % 10) -> ${t%10}`,
            highlightLine: 13
        });

        currentVars.k = Math.floor(t / 10);
        steps.push({
            algorithm: AlgorithmType.MUL,
            phase: AlgorithmPhase.LOOP,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `计算进位: t = ${t} / 10 -> ${currentVars.k}`,
            highlightLine: 14
        });
    }

    currentVars.i = currentVars.A.length;
    currentVars.currentVal = currentVars.k;

    while(currentVars.k > 0) {
         steps.push({
            algorithm: AlgorithmType.MUL,
            phase: AlgorithmPhase.FLUSH,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `处理剩余进位 t=${currentVars.k}`,
            highlightLine: 16
        });

        let t = currentVars.k;
        currentVars.C.push(t % 10);
        
        steps.push({
            algorithm: AlgorithmType.MUL,
            phase: AlgorithmPhase.FLUSH,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `C.push_back(${t} % 10) -> ${t%10}`,
            highlightLine: 18
        });

        currentVars.k = Math.floor(t / 10);
        currentVars.currentVal = currentVars.k;
    }

    steps.push({
        algorithm: AlgorithmType.MUL,
        phase: AlgorithmPhase.TRIM,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "去除前导零",
        highlightLine: 21
    });

    let popped = false;
    while (currentVars.C.length > 1 && currentVars.C[currentVars.C.length - 1] === 0) {
        currentVars.C.pop();
        popped = true;
    }
    
    if (popped) {
         steps.push({
            algorithm: AlgorithmType.MUL,
            phase: AlgorithmPhase.TRIM,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: "发现前导零并移除",
            highlightLine: 21
        });
    }

    steps.push({
        algorithm: AlgorithmType.MUL,
        phase: AlgorithmPhase.FINISH,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "算法完成，逆序输出 C",
        highlightLine: 33
    });

    return steps;
  };

  // --- Multiplication Big Logic ---
  const generateMulBigSteps = (aStr: string, bStr: string): StepSnapshot[] => {
    const steps: StepSnapshot[] = [];
    const initSize = aStr.length + bStr.length + 5;
    const currentVars: VariableState = { 
        A: [], 
        B: [], 
        C: new Array(initSize).fill(0), 
        k: 0, 
        i: 0, 
        j: 0,
        currentVal: null 
    };
    
    steps.push({
        algorithm: AlgorithmType.MUL_BIG,
        phase: AlgorithmPhase.INPUT,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "程序开始，输入 string a, b",
        highlightLine: 21
    });

    for (let i = aStr.length - 1; i >= 0; i--) currentVars.A.push(parseInt(aStr[i]));
    for (let i = bStr.length - 1; i >= 0; i--) currentVars.B.push(parseInt(bStr[i]));

    steps.push({
        algorithm: AlgorithmType.MUL_BIG,
        phase: AlgorithmPhase.PREPARE,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "a, b 转为 vector A, B (逆序), 初始化 C 为 0",
        highlightLine: 23
    });

    for (let i = 0; i < currentVars.A.length; i++) {
        currentVars.i = i;
        for (let j = 0; j < currentVars.B.length; j++) {
            currentVars.j = j;
            
            steps.push({
                algorithm: AlgorithmType.MUL_BIG,
                phase: AlgorithmPhase.LOOP,
                variables: JSON.parse(JSON.stringify(currentVars)),
                description: `循环 i=${i}, j=${j}。C[${i}+${j}] += A[${i}]*B[${j}]`,
                highlightLine: 9
            });

            currentVars.C[i + j] += currentVars.A[i] * currentVars.B[j];
            
            steps.push({
                algorithm: AlgorithmType.MUL_BIG,
                phase: AlgorithmPhase.LOOP,
                variables: JSON.parse(JSON.stringify(currentVars)),
                description: `C[${i+j}] 累加后为 ${currentVars.C[i+j]}`,
                highlightLine: 10
            });

            currentVars.C[i + j + 1] += Math.floor(currentVars.C[i + j] / 10);

            steps.push({
                algorithm: AlgorithmType.MUL_BIG,
                phase: AlgorithmPhase.LOOP,
                variables: JSON.parse(JSON.stringify(currentVars)),
                description: `处理进位: C[${i+j+1}] += C[${i+j}] / 10`,
                highlightLine: 11
            });

            currentVars.C[i + j] %= 10;

            steps.push({
                algorithm: AlgorithmType.MUL_BIG,
                phase: AlgorithmPhase.LOOP,
                variables: JSON.parse(JSON.stringify(currentVars)),
                description: `当前位取模: C[${i+j}] %= 10`,
                highlightLine: 12
            });
        }
    }

    steps.push({
        algorithm: AlgorithmType.MUL_BIG,
        phase: AlgorithmPhase.TRIM,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "去除前导零",
        highlightLine: 15
    });

    let popped = false;
    while (currentVars.C.length > 1 && currentVars.C[currentVars.C.length - 1] === 0) {
        currentVars.C.pop();
        popped = true;
    }
    
    if (popped) {
         steps.push({
            algorithm: AlgorithmType.MUL_BIG,
            phase: AlgorithmPhase.TRIM,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: "发现前导零并移除",
            highlightLine: 15
        });
    }

    steps.push({
        algorithm: AlgorithmType.MUL_BIG,
        phase: AlgorithmPhase.FINISH,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "算法完成，逆序输出 C",
        highlightLine: 31
    });

    return steps;
  };

  // --- Division Logic (Scalar) ---
  const generateDivSteps = (aStr: string, bStr: string): StepSnapshot[] => {
    const steps: StepSnapshot[] = [];
    // Note: DIV A is MSD first.
    const currentVars: VariableState = { A: [], B: [], C: [], k: 0, i: 0, currentVal: null, r_val: 0, b_val: 0 };
    
    steps.push({
        algorithm: AlgorithmType.DIV,
        phase: AlgorithmPhase.INPUT,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "程序开始，输入 string a, int B",
        highlightLine: 23
    });

    // Code: for(int i=0; i<a.size(); i++) A.push_back(a[i] - '0');
    // A stores MSD at index 0
    for (let i = 0; i < aStr.length; i++) currentVars.A.push(parseInt(aStr[i]));
    const bInt = parseInt(bStr);
    currentVars.b_val = isNaN(bInt) ? 1 : bInt;
    if (currentVars.b_val === 0) currentVars.b_val = 1; // Avoid div by zero

    steps.push({
        algorithm: AlgorithmType.DIV,
        phase: AlgorithmPhase.PREPARE,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "A 正序存储 (MSD at 0), r = 0",
        highlightLine: 25
    });

    for(let i = 0; i < currentVars.A.length; i++) {
        currentVars.i = i;
        
        steps.push({
            algorithm: AlgorithmType.DIV,
            phase: AlgorithmPhase.LOOP,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `循环 i=${i}, 当前位 A[${i}]=${currentVars.A[i]}`,
            highlightLine: 8
        });

        // r = r * 10 + A[i]
        const oldR = currentVars.r_val || 0;
        currentVars.r_val = oldR * 10 + currentVars.A[i];
        currentVars.currentVal = currentVars.r_val; // Use currentVal to show r update in detail panel

        steps.push({
            algorithm: AlgorithmType.DIV,
            phase: AlgorithmPhase.LOOP,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `r = r * 10 + A[i] = ${oldR}*10 + ${currentVars.A[i]} = ${currentVars.r_val}`,
            highlightLine: 10
        });

        // C.push_back(r / B)
        const q = Math.floor(currentVars.r_val / currentVars.b_val);
        currentVars.C.push(q);

        steps.push({
            algorithm: AlgorithmType.DIV,
            phase: AlgorithmPhase.LOOP,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `商 q = r / B = ${q}, C.push_back(q)`,
            highlightLine: 11
        });

        // r %= B
        currentVars.r_val = currentVars.r_val % currentVars.b_val;
        
        steps.push({
            algorithm: AlgorithmType.DIV,
            phase: AlgorithmPhase.LOOP,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `更新余数 r %= B -> ${currentVars.r_val}`,
            highlightLine: 12
        });
    }

    // Reverse C
    // Code: reverse(C.begin(), C.end());
    // Note: C was pushed MSD first in logic, but standard big int is often LSD first output?
    // Wait, div code pushes MSD first: 123/2 -> 0, 6, 1. C=[0,6,1]. 
    // Then reverse -> [1,6,0]. Then pop_back -> [1,6].
    // Final print reverse -> 6, 1. (61).
    // Let's emulate the code flow.
    
    // BUT! `C.push_back(r/B)` pushes from MSD.
    // E.g. 100 / 2. i=0, A[0]=1. r=1. q=0. C=[0].
    // i=1, A[1]=0. r=10. q=5. C=[0,5].
    // i=2, A[2]=0. r=0. q=0. C=[0,5,0].
    // Code says `reverse(C.begin(), C.end())`. C becomes [0,5,0]. 
    // Wait, if input 100/2, result 50. C should be [0,5].
    // Code pushes [0, 5, 0]. Reverse -> [0, 5, 0]. Pop back -> [0, 5].
    // Output reverse -> 5, 0. Correct.
    
    // My visualizer variable state C is displayed left-to-right.
    // I will modify C in place.
    currentVars.C.reverse();
    
    steps.push({
        algorithm: AlgorithmType.DIV,
        phase: AlgorithmPhase.PREPARE,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "reverse(C.begin(), C.end())",
        highlightLine: 14
    });

    while (currentVars.C.length > 1 && currentVars.C[currentVars.C.length - 1] === 0) {
        currentVars.C.pop();
    }
    
    steps.push({
        algorithm: AlgorithmType.DIV,
        phase: AlgorithmPhase.TRIM,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "去除前导零",
        highlightLine: 15
    });

    steps.push({
        algorithm: AlgorithmType.DIV,
        phase: AlgorithmPhase.FINISH,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "算法完成，逆序输出 C，输出余数 r",
        highlightLine: 28
    });

    return steps;
  };

  // --- Division Logic (Big) ---
  const generateDivBigSteps = (aStr: string, bStr: string): StepSnapshot[] => {
    const steps: StepSnapshot[] = [];
    const currentVars: VariableState = { A: [], B: [], C: [], k: 0, i: 0, r_vec: [], cnt: 0, currentVal: null };
    
    steps.push({
        algorithm: AlgorithmType.DIV_BIG,
        phase: AlgorithmPhase.INPUT,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "程序开始，输入 string a, b",
        highlightLine: 47
    });

    // A and B MSD first
    for (let i = 0; i < aStr.length; i++) currentVars.A.push(parseInt(aStr[i]));
    for (let i = 0; i < bStr.length; i++) currentVars.B.push(parseInt(bStr[i]));

    steps.push({
        algorithm: AlgorithmType.DIV_BIG,
        phase: AlgorithmPhase.PREPARE,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "A, B 正序存储 (MSD at 0)",
        highlightLine: 49
    });

    // Helper: Compare r (vector) >= B (vector)
    const ge = (vecR: number[], vecB: number[]) => {
        if (vecR.length !== vecB.length) return vecR.length > vecB.length;
        for (let i = 0; i < vecR.length; i++) {
            if (vecR[i] !== vecB[i]) return vecR[i] > vecB[i];
        }
        return true;
    };

    // Helper: Sub r -= B (MSD first vectors, but sub logic goes LSD to MSD)
    const subVector = (vecR: number[], vecB: number[]) => {
        let t = 0;
        for (let i = vecR.length - 1, j = vecB.length - 1; i >= 0; i--, j--) {
            let bVal = j >= 0 ? vecB[j] : 0;
            vecR[i] -= bVal + t;
            if (vecR[i] < 0) {
                vecR[i] += 10;
                t = 1;
            } else {
                t = 0;
            }
        }
        // Remove leading zeros
        while (vecR.length > 1 && vecR[0] === 0) vecR.shift();
    };

    for(let i = 0; i < currentVars.A.length; i++) {
        currentVars.i = i;
        currentVars.cnt = 0;
        
        // r.push_back(A[i])
        currentVars.r_vec!.push(currentVars.A[i]);
        
        steps.push({
            algorithm: AlgorithmType.DIV_BIG,
            phase: AlgorithmPhase.LOOP,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `Loop i=${i}. r.push_back(A[i]) -> append ${currentVars.A[i]}`,
            highlightLine: 24
        });

        // while(r.size() > 1 && r[0] == 0) r.erase(r.begin());
        while(currentVars.r_vec!.length > 1 && currentVars.r_vec![0] === 0) {
            currentVars.r_vec!.shift();
        }

        // while(r >= B)
        while(ge(currentVars.r_vec!, currentVars.B)) {
            steps.push({
                algorithm: AlgorithmType.DIV_BIG,
                phase: AlgorithmPhase.LOOP,
                variables: JSON.parse(JSON.stringify(currentVars)),
                description: `r >= B, 执行减法 r -= B, cnt++`,
                highlightLine: 29
            });

            subVector(currentVars.r_vec!, currentVars.B);
            currentVars.cnt!++;
            
            steps.push({
                algorithm: AlgorithmType.DIV_BIG,
                phase: AlgorithmPhase.LOOP,
                variables: JSON.parse(JSON.stringify(currentVars)),
                description: `减法后 r=${currentVars.r_vec!.join('')}, cnt=${currentVars.cnt}`,
                highlightLine: 30
            });
        }
        
        currentVars.C.push(currentVars.cnt!);
        steps.push({
            algorithm: AlgorithmType.DIV_BIG,
            phase: AlgorithmPhase.LOOP,
            variables: JSON.parse(JSON.stringify(currentVars)),
            description: `C.push_back(cnt) -> ${currentVars.cnt}`,
            highlightLine: 33
        });
    }

    // while(C.size() > 1 && C[0] == 0) C.erase(C.begin());
    while(currentVars.C.length > 1 && currentVars.C[0] === 0) {
        currentVars.C.shift();
    }
    
    steps.push({
        algorithm: AlgorithmType.DIV_BIG,
        phase: AlgorithmPhase.TRIM,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "去除商的前导零",
        highlightLine: 35
    });

    steps.push({
        algorithm: AlgorithmType.DIV_BIG,
        phase: AlgorithmPhase.FINISH,
        variables: JSON.parse(JSON.stringify(currentVars)),
        description: "计算完成，输出商 C 和 余数 r",
        highlightLine: 53
    });

    return steps;
  };

  // Generate Steps Effect
  useEffect(() => {
    let steps = [];
    if (algoType === AlgorithmType.ADD) steps = generateAddSteps(num1Str, num2Str);
    else if (algoType === AlgorithmType.SUB) steps = generateSubSteps(num1Str, num2Str);
    else if (algoType === AlgorithmType.MUL) steps = generateMulSteps(num1Str, num2Str);
    else if (algoType === AlgorithmType.MUL_BIG) steps = generateMulBigSteps(num1Str, num2Str);
    else if (algoType === AlgorithmType.DIV) steps = generateDivSteps(num1Str, num2Str);
    else if (algoType === AlgorithmType.DIV_BIG) steps = generateDivBigSteps(num1Str, num2Str);
    
    setHistory(steps);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setAiExplanation(null);
  }, [num1Str, num2Str, algoType]);

  // Timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev < history.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, history.length, playbackSpeed]);

  const handleNext = () => {
    if (currentStepIndex < history.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setAiExplanation(null);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setAiExplanation(null);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    setAiExplanation(null);
  };

  const handleAskAI = async () => {
    setIsAiLoading(true);
    const step = history[currentStepIndex];
    const explanation = await explainStep(step, num1Str, num2Str);
    setAiExplanation(explanation);
    setIsAiLoading(false);
  };

  const handleNumChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (/^\d*$/.test(val)) {
          setter(val);
      }
  };

  const getCode = () => {
      switch(algoType) {
          case AlgorithmType.ADD: return CPP_CODE_ADD;
          case AlgorithmType.SUB: return CPP_CODE_SUB;
          case AlgorithmType.MUL: return CPP_CODE_MUL;
          case AlgorithmType.MUL_BIG: return CPP_CODE_MUL_BIG;
          case AlgorithmType.DIV: return CPP_CODE_DIV;
          case AlgorithmType.DIV_BIG: return CPP_CODE_DIV_BIG;
          default: return "";
      }
  };

  const currentStep = history[currentStepIndex];

  if (!currentStep) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-sm gap-4">
        <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg text-white 
                ${algoType === AlgorithmType.ADD ? 'bg-indigo-600' : 
                (algoType === AlgorithmType.SUB ? 'bg-emerald-600' : 
                (algoType.includes('MUL') ? 'bg-rose-600' : 'bg-purple-600'))}`}>
                <Calculator size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                高精度算法可视化
            </h1>
        </div>
        
        {/* Algorithm Switcher */}
        <div className="bg-slate-100 p-1 rounded-lg flex space-x-1 overflow-x-auto">
             <button onClick={() => setAlgoType(AlgorithmType.ADD)} className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${algoType === AlgorithmType.ADD ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                 <Plus size={16} className="mr-1" /> 加法
             </button>
             <button onClick={() => setAlgoType(AlgorithmType.SUB)} className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${algoType === AlgorithmType.SUB ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                 <Minus size={16} className="mr-1" /> 减法
             </button>
             <button onClick={() => setAlgoType(AlgorithmType.MUL)} className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${(algoType === AlgorithmType.MUL || algoType === AlgorithmType.MUL_BIG) ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                 <X size={16} className="mr-1" /> 乘法
             </button>
             <button onClick={() => setAlgoType(AlgorithmType.DIV)} className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${(algoType === AlgorithmType.DIV || algoType === AlgorithmType.DIV_BIG) ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                 <Divide size={16} className="mr-1" /> 除法
             </button>
        </div>

        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-600">Speed:</span>
                <select 
                    value={playbackSpeed} 
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-1.5"
                >
                    <option value={2000}>Slow</option>
                    <option value={1000}>Normal</option>
                    <option value={500}>Fast</option>
                </select>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Panel */}
        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto">
            
            {/* Input Config */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col gap-4">
                
                {/* Mode Toggles */}
                {(algoType.includes('MUL')) && (
                    <div className="flex space-x-4 mb-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" checked={algoType === AlgorithmType.MUL} onChange={() => setAlgoType(AlgorithmType.MUL)} className="text-rose-600 focus:ring-rose-500"/>
                            <span className="text-sm font-medium text-slate-700">高精度 x 低精度</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" checked={algoType === AlgorithmType.MUL_BIG} onChange={() => setAlgoType(AlgorithmType.MUL_BIG)} className="text-rose-600 focus:ring-rose-500"/>
                            <span className="text-sm font-medium text-slate-700">高精度 x 高精度</span>
                        </label>
                    </div>
                )}
                {(algoType.includes('DIV')) && (
                    <div className="flex space-x-4 mb-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" checked={algoType === AlgorithmType.DIV} onChange={() => setAlgoType(AlgorithmType.DIV)} className="text-purple-600 focus:ring-purple-500"/>
                            <span className="text-sm font-medium text-slate-700">高精度 / 低精度</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" checked={algoType === AlgorithmType.DIV_BIG} onChange={() => setAlgoType(AlgorithmType.DIV_BIG)} className="text-purple-600 focus:ring-purple-500"/>
                            <span className="text-sm font-medium text-slate-700">高精度 / 高精度</span>
                        </label>
                    </div>
                )}

                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                            数值 A (BigInt)
                        </label>
                        <input 
                            type="text" 
                            value={num1Str}
                            onChange={handleNumChange(setNum1Str)}
                            disabled={currentStepIndex > 0}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 font-mono text-lg"
                        />
                    </div>
                    <div className="pb-3 text-slate-400 font-bold text-xl">
                        {algoType === AlgorithmType.ADD ? '+' : (algoType === AlgorithmType.SUB ? '-' : (algoType.includes('MUL') ? '×' : '÷'))}
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                            {algoType === AlgorithmType.MUL || algoType === AlgorithmType.DIV ? '数值 b (int)' : '数值 B (BigInt)'}
                        </label>
                        <input 
                            type="text" 
                            value={num2Str}
                            onChange={handleNumChange(setNum2Str)}
                            disabled={currentStepIndex > 0}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 font-mono text-lg"
                        />
                    </div>
                    <div className="pb-1">
                    {currentStepIndex > 0 && (
                        <button onClick={handleReset} className="text-sm text-red-500 hover:text-red-700 font-medium underline">
                            Reset
                        </button>
                    )}
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Progress</span>
                    <span>{currentStepIndex + 1} / {history.length}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                        className={`h-2 rounded-full transition-all duration-300 
                        ${algoType === AlgorithmType.ADD ? 'bg-indigo-600' : 
                        (algoType === AlgorithmType.SUB ? 'bg-emerald-600' : 
                        (algoType.includes('MUL') ? 'bg-rose-600' : 'bg-purple-600'))}`}
                        style={{ width: `${((currentStepIndex + 1) / history.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Visualizer */}
            <div className="flex-1 min-h-[400px] mb-6 relative">
                 <ArrayVisualizer 
                    state={currentStep.variables} 
                    phase={currentStep.phase} 
                    algorithm={algoType}
                    isNegativeResult={currentStep.isNegativeResult}
                 />
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 flex justify-between items-center sticky bottom-0 z-20">
                <div className="flex space-x-2">
                    <button onClick={handlePrev} disabled={currentStepIndex === 0} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-700 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)} 
                        className={`
                            flex items-center space-x-2 px-6 py-2 rounded-lg font-bold text-white transition-all
                            ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 
                                (algoType === AlgorithmType.ADD ? 'bg-indigo-600 hover:bg-indigo-700' : 
                                (algoType === AlgorithmType.SUB ? 'bg-emerald-600 hover:bg-emerald-700' : 
                                (algoType.includes('MUL') ? 'bg-rose-600 hover:bg-rose-700' : 'bg-purple-600 hover:bg-purple-700')))}
                        `}
                    >
                        {isPlaying ? <><Pause size={20} /><span>Pause</span></> : <><Play size={20} /><span>Play</span></>}
                    </button>

                    <button onClick={handleNext} disabled={currentStepIndex === history.length - 1} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-700 transition-colors">
                        <ArrowRight size={24} />
                    </button>

                     <button onClick={handleReset} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors ml-4">
                        <RotateCcw size={20} />
                    </button>
                </div>

                <div className="flex items-center">
                     <button
                        onClick={handleAskAI}
                        disabled={isAiLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full text-sm font-medium shadow-md transition-all disabled:opacity-70"
                     >
                         <Sparkles size={16} />
                         <span>{isAiLoading ? 'Thinking...' : 'AI Explain'}</span>
                     </button>
                </div>
            </div>
             
             {/* Info */}
             <div className="mt-4 grid grid-cols-1 gap-4">
                 <div className={`bg-white border-l-4 ${algoType === AlgorithmType.ADD ? 'border-indigo-500' : (algoType === AlgorithmType.SUB ? 'border-emerald-500' : (algoType.includes('MUL') ? 'border-rose-500' : 'border-purple-500'))} p-4 rounded-r-lg shadow-sm`}>
                     <h3 className="font-bold text-slate-800 text-lg mb-1">Current Action</h3>
                     <p className="text-slate-600 text-lg">{currentStep.description}</p>
                 </div>
                 
                 {aiExplanation && (
                     <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg shadow-sm animate-fade-in relative">
                         <div className="absolute top-2 right-2 text-purple-200">
                             <Sparkles size={40} className="opacity-20" />
                         </div>
                         <h3 className="font-bold text-purple-800 text-sm uppercase tracking-wide mb-2">Gemini Analysis</h3>
                         <p className="text-purple-900 leading-relaxed">{aiExplanation}</p>
                     </div>
                 )}
             </div>

        </div>

        {/* Code Panel */}
        <div className="hidden md:flex md:w-1/3 lg:w-1/4 bg-slate-900 p-4 border-l border-slate-800 flex-col">
            <CodeViewer code={getCode()} highlightLine={currentStep.highlightLine} />
        </div>

      </main>
    </div>
  );
};

export default App;
