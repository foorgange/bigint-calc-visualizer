
import { GoogleGenAI } from "@google/genai";
import { StepSnapshot, AlgorithmType } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in process.env.API_KEY");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const explainStep = async (step: StepSnapshot, num1: string, num2: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "请配置 API Key 以获取 AI 解释。";

  let algoName = "";
  if (step.algorithm === AlgorithmType.ADD) algoName = "高精度加法";
  else if (step.algorithm === AlgorithmType.SUB) algoName = "高精度减法";
  else if (step.algorithm === AlgorithmType.MUL) algoName = "高精度乘法 (BigInt * SmallInt)";
  else if (step.algorithm === AlgorithmType.MUL_BIG) algoName = "高精度乘法 (BigInt * BigInt)";
  else if (step.algorithm === AlgorithmType.DIV) algoName = "高精度除法 (BigInt / SmallInt)";
  else if (step.algorithm === AlgorithmType.DIV_BIG) algoName = "高精度除法 (BigInt / BigInt)";

  const prompt = `
    你是一个C++算法助教。请解释${algoName}算法的当前步骤。
    
    上下文:
    原始输入: a="${num1}", b="${num2}"
    当前状态:
    - 阶段: ${step.phase}
    - 算法类型: ${step.algorithm}
    ${step.swapOperands ? '- 注意: 由于 A < B，代码中交换了参数，计算的是 sub(B, A)，结果加负号。' : ''}
    - 数组 A (${step.algorithm.includes('DIV') ? '正序, 被除数' : '倒序, 被操作数'}): [${step.variables.A.join(", ")}]
    ${step.algorithm === AlgorithmType.MUL || step.algorithm === AlgorithmType.DIV 
        ? `- 小数 b: ${step.variables.b_val}` 
        : `- 数组 B (${step.algorithm.includes('DIV') ? '正序, 除数' : '倒序, 操作数'}): [${step.variables.B.join(", ")}]`
    }
    - 结果 C (${step.algorithm.includes('DIV') ? '正序生成中' : '倒序'}): [${step.variables.C.join(", ")}]
    - 当前索引 i: ${step.variables.i}
    ${step.variables.j !== undefined ? `- 内层索引 j: ${step.variables.j}` : ''}
    
    ${step.algorithm === AlgorithmType.DIV ? `- 当前余数 r: ${step.variables.r_val}` : ''}
    ${step.algorithm === AlgorithmType.DIV_BIG ? `- 当前余数向量 r: [${step.variables.r_vec?.join(", ")}]` : ''}
    ${step.algorithm === AlgorithmType.DIV_BIG ? `- 当前商的位 cnt: ${step.variables.cnt}` : ''}
    
    - 辅助变量 k (进位/借位): ${step.variables.k}
    - 临时值 (t/sum/val): ${step.variables.currentVal ?? 'N/A'}
    
    任务:
    用简洁、通俗易懂的中文解释这一步发生了什么，为什么要这样做。
    不要解释整个代码，只解释当前这一步的逻辑。不超过2句话。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "无法生成解释。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "获取 AI 解释时出错。";
  }
};
