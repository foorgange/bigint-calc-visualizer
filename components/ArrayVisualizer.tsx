
import React from 'react';
import { VariableState, AlgorithmPhase, AlgorithmType } from '../types';

interface ArrayVisualizerProps {
  state: VariableState;
  phase: AlgorithmPhase;
  algorithm: AlgorithmType;
  isNegativeResult?: boolean;
}

export const ArrayVisualizer: React.FC<ArrayVisualizerProps> = ({ state, phase, algorithm, isNegativeResult }) => {
  const { A, B, C, k, i, j, currentVal, b_val, r_val, r_vec, cnt } = state;
  const isSub = algorithm === AlgorithmType.SUB;
  const isMulScalar = algorithm === AlgorithmType.MUL;
  const isMulBig = algorithm === AlgorithmType.MUL_BIG;
  const isDiv = algorithm === AlgorithmType.DIV;
  const isDivBig = algorithm === AlgorithmType.DIV_BIG;
  
  // Render a single digit box
  const DigitBox = ({ val, index, isActive, label, isCarry, isResult, isGhost, isScalar, isTarget, isTargetNext, isRemainder }: any) => (
    <div className={`flex flex-col items-center mx-1 transition-all duration-300 ${isGhost ? 'opacity-50' : ''}`}>
       {!isScalar && !isRemainder && <span className="text-[10px] text-slate-400 mb-1 font-mono">[{index}]</span>}
      <div 
        className={`
          w-10 h-12 md:w-14 md:h-16 rounded-lg flex items-center justify-center text-lg md:text-2xl font-bold border-2 shadow-sm
          ${isActive ? 'scale-110 z-10' : 'scale-100'}
          ${isCarry ? 'border-orange-500 bg-orange-100 text-orange-700' : ''}
          ${isResult || isTarget ? 'border-green-500 bg-green-100 text-green-700' : ''}
          ${isTargetNext ? 'border-orange-400 bg-orange-50 text-orange-600' : ''}
          ${isRemainder ? 'border-purple-500 bg-purple-100 text-purple-700' : ''}
          ${!isCarry && !isResult && isActive && !isTarget && !isTargetNext && !isRemainder ? 'border-blue-500 bg-blue-100 text-blue-700' : ''}
          ${!isActive && !isCarry && !isResult && !isTarget && !isTargetNext && !isRemainder ? 'border-slate-200 bg-white text-slate-700' : ''}
          ${isGhost ? 'border-dashed border-slate-300 bg-slate-50 text-slate-400' : ''}
        `}
      >
        {val !== undefined ? val : ''}
      </div>
      {label && <span className="text-xs mt-1 text-slate-500 font-medium">{label}</span>}
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-4 bg-slate-50 rounded-xl border border-slate-200 h-full overflow-x-auto">
      
      {/* Carry/Borrow Bubble - ADD/SUB/MUL_SCALAR */}
      {!isMulBig && !isDiv && !isDivBig && (
        <div className="flex items-center space-x-4 h-12">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                {isSub ? "借位 (k)" : (isMulScalar ? "进位 t (carry)" : "进位 (k)")}
            </span>
            <div className={`
            px-4 h-12 rounded-full flex items-center justify-center font-bold text-xl border-2 transition-all duration-300
            ${k > 0 ? 'bg-orange-500 text-white border-orange-600 shadow-lg scale-110' : 'bg-slate-100 text-slate-400 border-slate-200'}
            `}>
            {k}
            </div>
        </div>
      )}

      {/* Info Bar for Complex Algos */}
      {(isMulBig || isDiv || isDivBig) && phase === AlgorithmPhase.LOOP && (
           <div className="flex items-center space-x-6 h-12 bg-white px-6 rounded-full border border-slate-200 shadow-sm whitespace-nowrap overflow-x-auto">
             <div className="flex items-center space-x-2">
                 <span className="text-xs text-slate-500 font-bold uppercase">Idx i:</span>
                 <span className="text-blue-600 font-bold font-mono">{i}</span>
             </div>
             {isMulBig && (
                 <div className="flex items-center space-x-2">
                     <span className="text-xs text-slate-500 font-bold uppercase">Idx j:</span>
                     <span className="text-purple-600 font-bold font-mono">{j}</span>
                 </div>
             )}
             {isDiv && (
                  <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
                     <span className="text-xs text-slate-500 font-bold uppercase">Rem r:</span>
                     <span className="text-purple-600 font-bold font-mono">{r_val}</span>
                 </div>
             )}
              {isDivBig && (
                  <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
                     <span className="text-xs text-slate-500 font-bold uppercase">Cnt:</span>
                     <span className="text-green-600 font-bold font-mono">{cnt}</span>
                 </div>
             )}
           </div>
      )}

      <div className="relative p-6 bg-white rounded-xl shadow-sm border border-slate-100 min-w-min">
        {/* Vector A */}
        <div className="flex items-center mb-4">
          <div className="w-24 text-right pr-4 font-mono font-bold text-slate-600 whitespace-nowrap">
             {isDiv || isDivBig ? 'Divdnt A' : 'Vector A'}
          </div>
          <div className="flex flex-row">
            {A.map((val, idx) => (
              <DigitBox key={`A-${idx}`} val={val} index={idx} isActive={phase === AlgorithmPhase.LOOP && i === idx} />
            ))}
             {!isSub && !isMulScalar && !isMulBig && !isDiv && !isDivBig && phase === AlgorithmPhase.LOOP && i === A.length && (
               <DigitBox index={i} val="0" isGhost={true} />
            )}
          </div>
        </div>

        {/* Operator Sign */}
        <div className="absolute left-24 top-1/2 -translate-y-1/2 -translate-x-full pr-2 text-3xl text-slate-300 font-bold">
            {isSub ? '-' : (isMulScalar || isMulBig ? '×' : (isDiv || isDivBig ? '÷' : '+'))}
        </div>

        {/* Vector B or Scalar b */}
        <div className="flex items-center mb-6">
          <div className="w-24 text-right pr-4 font-mono font-bold text-slate-600 whitespace-nowrap">
              {isMulScalar || isDiv ? 'Int b' : (isDivBig ? 'Divisor B' : 'Vector B')}
          </div>
          <div className="flex flex-row">
            {(isMulScalar || isDiv) ? (
                <div className="ml-1">
                     <DigitBox val={b_val} isActive={phase === AlgorithmPhase.LOOP} isScalar={true} />
                </div>
            ) : (
                <>
                    {B.map((val, idx) => (
                        <DigitBox 
                            key={`B-${idx}`} 
                            val={val} 
                            index={idx} 
                            isActive={phase === AlgorithmPhase.LOOP && (isMulBig ? j === idx : (isDivBig ? false : i === idx))} 
                        />
                    ))}
                    {!isMulBig && !isDivBig && phase === AlgorithmPhase.LOOP && (i === B.length || (isSub && i >= B.length && i < A.length)) && (
                        <DigitBox index={i} val="0" isGhost={true} />
                    )}
                </>
            )}
          </div>
        </div>

        {/* Remainder for Div Big */}
        {isDivBig && (
            <div className="flex items-center mb-6 border-t border-slate-100 pt-4">
                 <div className="w-24 text-right pr-4 font-mono font-bold text-purple-600 whitespace-nowrap">Rem r</div>
                 <div className="flex flex-row">
                     {r_vec && r_vec.length > 0 ? r_vec.map((val, idx) => (
                        <DigitBox key={`r-${idx}`} val={val} index={idx} isRemainder={true} />
                     )) : (
                         <span className="text-slate-400 text-sm italic py-4">Empty</span>
                     )}
                 </div>
            </div>
        )}
        
        <div className="w-full border-b-2 border-slate-200 mb-6"></div>

        {/* Vector C (Result) */}
        <div className="flex items-center">
          <div className="w-24 text-right pr-4 font-mono font-bold text-green-600 whitespace-nowrap">
            {isDiv || isDivBig ? 'Quotient C' : 'Vector C'}
          </div>
          <div className="flex flex-row items-center flex-wrap max-w-[50vw]">
            {/* Negative Sign for Subtraction */}
            {isNegativeResult && (phase === AlgorithmPhase.FINISH) && (
                <div className="mr-2 text-2xl font-bold text-green-700">-</div>
            )}
            
            {C.map((val, idx) => {
                const isTarget = isMulBig && phase === AlgorithmPhase.LOOP && (i! + j! === idx);
                const isTargetNext = isMulBig && phase === AlgorithmPhase.LOOP && (i! + j! + 1 === idx);
                const isNewQuotient = (isDiv || isDivBig) && phase === AlgorithmPhase.LOOP && (idx === C.length - 1);
                
                return (
                    <DigitBox 
                        key={`C-${idx}`} 
                        val={val} 
                        index={idx} 
                        isResult={!isMulBig || phase === AlgorithmPhase.FINISH || phase === AlgorithmPhase.TRIM} 
                        isActive={isNewQuotient}
                        isTarget={isTarget}
                        isTargetNext={isTargetNext}
                    />
                );
            })}
            
            {/* Placeholder for Add/Sub/MulScalar */}
            {!isMulBig && !isDiv && !isDivBig && (phase === AlgorithmPhase.LOOP || phase === AlgorithmPhase.FLUSH) && (
               <div className="w-10 h-12 md:w-14 md:h-16 border-2 border-dashed border-green-200 bg-green-50 rounded-lg flex items-center justify-center text-green-400 mx-1 animate-pulse">?</div>
            )}
          </div>
        </div>
      </div>

      {/* Calculation Detail Panel */}
      {(phase === AlgorithmPhase.LOOP || phase === AlgorithmPhase.FLUSH) && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-900 font-mono shadow-inner w-full max-w-lg">
           <div className="flex justify-between items-center border-b border-blue-200 pb-2 mb-2">
             <span className="font-bold">Step Details {phase === AlgorithmPhase.LOOP ? (isMulBig ? `(i=${i}, j=${j})` : `(i=${i})`) : '(Flush)'}</span>
           </div>
           
           {algorithm === AlgorithmType.ADD && (
             <div className="grid grid-cols-1 gap-1">
               <p>A[{i}] = {i < A.length ? A[i] : 0}</p>
               <p>B[{i}] = {i < B.length ? B[i] : 0}</p>
               <div className="border-t border-blue-200 my-1"></div>
               <p className="font-bold">Sum = {currentVal}</p>
             </div>
           )}

           {algorithm === AlgorithmType.SUB && (
             <div className="grid grid-cols-1 gap-1">
                <p>Initial t = A[{i}] - k = {A[i] - k}</p>
                {i < B.length && (
                    <p>t -= B[{i}] ({B[i]}) -&gt; t = {A[i] - k - B[i]}</p>
                )}
                <div className="border-t border-blue-200 my-1"></div>
                <p className="font-bold">Final t = {currentVal}</p>
             </div>
           )}

            {isMulScalar && (
             <div className="grid grid-cols-1 gap-1">
                {phase === AlgorithmPhase.LOOP ? (
                    <>
                    <p>A[{i}] = {A[i]}</p>
                    <p>b = {b_val}</p>
                    <div className="border-t border-blue-200 my-1"></div>
                    <p className="font-bold">t = {currentVal}</p>
                    </>
                ) : (
                    <p>Remaining t = {currentVal}</p>
                )}
             </div>
           )}

           {isMulBig && (
             <div className="grid grid-cols-1 gap-1">
                 <p>A[{i}] = {A[i]}, B[{j}] = {B[j]}</p>
                 <p className="font-bold">Prod = {A[i] * B[j]}</p>
                 <div className="border-t border-blue-200 my-1"></div>
                 <p className="text-xs text-slate-500">C[{i+j!}] += Prod</p>
             </div>
           )}

            {isDiv && (
             <div className="grid grid-cols-1 gap-1">
                 <p>A[{i}] = {A[i]}</p>
                 <p>r (before) = {state.r_val}</p>
                 <p className="font-bold text-purple-600">r = r * 10 + A[{i}] = {currentVal}</p>
                 <div className="border-t border-blue-200 my-1"></div>
                 <p>Quotient Digit = {currentVal! < 0 ? '?' : Math.floor(currentVal! / b_val!)}</p>
                 <p>New Remainder = {currentVal! < 0 ? '?' : currentVal! % b_val!}</p>
             </div>
           )}

           {isDivBig && (
             <div className="grid grid-cols-1 gap-1">
                 <p>Current Index i: {i}</p>
                 <p>Checking r &ge; B</p>
                 <div className="border-t border-blue-200 my-1"></div>
                 <p className="font-bold">Subtractions (cnt): {cnt}</p>
                 <p className="text-xs text-slate-500">Remainder size: {r_vec?.length}</p>
             </div>
           )}

        </div>
      )}
      
       {phase === AlgorithmPhase.FINISH && (
        <div className="bg-green-50 border border-green-100 p-6 rounded-lg text-center shadow-lg w-full max-w-lg">
           <h3 className="text-lg font-bold text-green-800 mb-2">计算完成!</h3>
           <div className="grid grid-cols-1 gap-2">
                <div>
                   <p className="text-slate-600 text-sm">商 (Quotient):</p>
                   <div className="text-2xl font-mono font-bold tracking-widest text-green-700 break-all">
                        {isNegativeResult ? '-' : ''}{isDiv || isDivBig ? C.join('') : [...C].reverse().join('')}
                   </div>
                </div>
                {(isDiv || isDivBig) && (
                    <div className="border-t border-green-200 pt-2 mt-2">
                        <p className="text-slate-600 text-sm">余数 (Remainder):</p>
                        <div className="text-xl font-mono font-bold text-purple-700">
                             {isDiv ? r_val : (r_vec?.length ? r_vec.join('') : '0')}
                        </div>
                    </div>
                )}
           </div>
        </div>
      )}

    </div>
  );
};
