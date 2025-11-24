# 🧮 BigInt Calc Visualizer | 高精度算法可视化平台

> 一个基于 React 和 Gemini AI 的交互式 C++ 高精度算法可视化教学工具。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61dafb.svg?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg?style=flat-square&logo=typescript)
![Gemini AI](https://img.shields.io/badge/Google-Gemini_2.5-8e44ad.svg?style=flat-square&logo=google-bard)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38b2ac.svg?style=flat-square&logo=tailwind-css)

## 📖 简介 (Introduction)

在计算机科学和算法竞赛（如 OI, ACM/ICPC）中，C++ 的 `long long` 类型往往不足以处理超大整数的运算。**高精度算法 (High Precision Arithmetic)**通过数组模拟人工计算过程来解决这一问题。

本项目旨在将这些抽象的代码逻辑转化为直观的动态图形。通过同步显示**内存数组状态**、**指针移动**、**进位/借位逻辑**以及**源代码执行行**，帮助初学者深入理解高精度加、减、乘、除的底层原理。此外，项目集成了 **Google Gemini AI**，可实时为每一步操作提供自然语言解释。

## ✨ 主要特性 (Features)

*   **全套算法支持**：
    *   ➕ **高精度加法** (BigInt + BigInt)
    *   ➖ **高精度减法** (BigInt - BigInt) - 自动处理负数结果
    *   ✖️ **高精度乘法** (BigInt × int / BigInt × BigInt)
    *   ➗ **高精度除法** (BigInt ÷ int / BigInt ÷ BigInt)
*   **深度可视化**：
    *   动态展示 `Vector` 数组内容的变化。
    *   高亮显示当前操作的数字块、进位 (Carry)、借位 (Borrow) 和余数 (Remainder)。
    *   清晰标记循环指针 `i` (外层) 和 `j` (内层) 的位置。
*   **代码同步**：右侧实时显示对应的 C++ 源代码，并高亮当前正在执行的代码行。
*   **🤖 AI 智能助教**：集成 Google Gemini 2.5 Flash 模型，点击 "AI Explain" 即可获取当前步骤的通俗解释。
*   **播放控制**：支持单步执行、自动播放、暂停以及 3 档播放速度调节。
*   **现代 UI 设计**：采用 Glassmorphism 风格、Inter 字体和 JetBrains Mono 代码字体，提供极佳的阅读体验。

## 🛠️ 技术栈 (Tech Stack)

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **AI Integration**: Google GenAI SDK (`@google/genai`)
*   **Build Tool**: Vite (Recommended) or Parcel

## 🚀 快速开始 (Getting Started)

### 前置要求

*   Node.js (v18+)
*   Google Gemini API Key (用于 AI 解释功能)

### 安装步骤

1.  **克隆仓库**
    ```bash
    git clone https://github.com/your-username/bigint-visualizer.git
    cd bigint-visualizer
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **配置环境变量**
    在项目根目录创建 `.env` 文件，并填入你的 API Key：
    ```env
    # .env
    API_KEY=your_google_gemini_api_key_here
    ```
    *(注：如果是通过 Web 容器运行，请确保 `process.env.API_KEY` 在运行时可用)*

4.  **启动项目**
    ```bash
    npm start
    # 或
    npm run dev
    ```

## 🧠 算法可视化细节

### 1. 高精度加法 (Addition)
模拟竖式加法。
*   **逻辑**：`A[i] + B[i] + k`。
*   **可视化重点**：展示进位 `k` 如何产生并传递到下一位。

### 2. 高精度减法 (Subtraction)
模拟竖式减法。
*   **逻辑**：`A[i] - B[i] - k`。
*   **特色**：自动检测 `A < B` 的情况，交换操作数计算并标记负号。展示借位 `k=1` 时的 `+10` 操作。

### 3. 高精度乘法 (Multiplication)
*   **高精 × 低精**：将低精度数视为一个整体，与高精度数的每一位相乘。
*   **高精 × 高精**：双重循环模拟。`C[i+j] += A[i] * B[j]`。
*   **可视化重点**：展示内层循环 `j` 扫描 `B` 数组，以及结果累加到 `C` 数组特定位置的过程。

### 4. 高精度除法 (Division)
*   **高精 ÷ 低精**：逐位试除。`r = r * 10 + A[i]`，商为 `r / b`，新余数为 `r % b`。
*   **高精 ÷ 高精**：减法模拟除法。不断从余数中减去除数，直到余数小于除数，统计减去的次数作为商。
*   **可视化重点**：动态展示余数向量 `r` 的构建和被减过程。


