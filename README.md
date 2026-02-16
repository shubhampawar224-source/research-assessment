# 📚 Research Paper Summarizer

An AI-powered web application that automatically summarizes research paper sections using Google's Gemini API. Upload a PDF, and watch as each section is analyzed and summarized in real-time with a beautiful, modern interface.

![Tech Stack](https://img.shields.io/badge/React-18.2-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan)
![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-purple)

## ✨ Features

- 📄 **Segregated Summaries** - Automatically splits pages into logical sections (e.g., "1. Introduction", "2.1 Methods").
- 🤖 **Hybrid Extraction** - Uses Regex for speed + AI for accuracy to detect headers.
- ⚡ **Real-time Streaming** - Summaries appear instantly via Server-Sent Events (SSE).
- 📊 **Smart Dashboard** - Separate rows for each section title.
- 🖼️ **Collapsible Content** - Clean UI that truncates long text by default.
- 💾 **Persistent Storage** - SQLite database to save all your analyses.

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.8+ or 3.11
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/app/apikey))

### 1️⃣ Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   - Create a `.env` file in the `backend/` directory.
   - Add your API key:
     ```env
     GEMINI_API_KEY=your_actual_api_key_here
     ```
5. Run the server:
   ```bash
   python main.py
   ```
   *Server will start at `http://localhost:8000`*

### 2️⃣ Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *App will run at `http://localhost:5173`*

   *App will run at `http://localhost:5173`*

### 3️⃣ Docker Deployment
Run the entire application in production mode using Docker Compose.

1. **Prerequisites:**
   - Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).

2. **Configuration:**
   - Create a `.env` file in the root directory with your API key:
     ```env
     GEMINI_API_KEY=your_actual_api_key_here
     ```

3. **Start the Application:**
   ```bash
   docker-compose up --build
   ```
   
4. **Access:**
   - **Frontend App:** Open `http://localhost:5173`
   - **Backend API:** Runnable at `http://localhost:8000`

5. **Stop:**
   - Press `Ctrl+C` in the terminal or run:
     ```bash
     docker-compose down
     ```

---

## 🌊 How the Streaming Works

The application uses a sophisticated streaming pipeline to deliver results immediately, rather than waiting for the entire PDF to be processed.

1.  **Chunked Upload**: The PDF is uploaded and processed page-by-page.
2.  **Hybrid Heading Extraction**:
    *   **Regex Pass**: The system first scans for standard academic headings (e.g., `1. Introduction`, `IV. Methodology`) using strict regex patterns to ensure speed.
    *   **AI Fallback**: If regex fails, a lightweight Gemini call analyzes the page layout to identify semantic sections.
3.  **Segregated Generative Task**:
    *   Detected headings are used to split the page context.
    *   Independent calls are made to Gemini to summarize *specific sections* (e.g., "Summarize only the 'Data Collection' part of page 3").
4.  **SSE Streaming**:
    *   As each section summary is generated, it is immediately yielded to the frontend via **Server-Sent Events (SSE)**.
    *   The frontend interprets these events to dynamically append rows to the results table in real-time.

---

## 🧠 Assumptions & Design Decisions

### 1. Granularity over Brevity
**Design Decision**: Instead of one summary per page, we implemented **Segregated Summaries**.
*   *Reasoning*: Research papers often contain multiple distinct topics on a single page (e.g., the end of "Related Work" and start of "Methodology"). Summarizing them together loses context. Splitting them into separate table rows provides cleaner, more actionable insights.

### 2. Hybrid Extraction Strategy
**Design Decision**: We combine Regex with LLM-based extraction.
*   *Assumption*: Most papers follow standard formatting (Introduction -> Methods -> Results).
*   *Reasoning*: Regex is near-instant (~0ms), while LLMs take time. We prioritize Regex for 90% of cases and fall back to AI only when necessary, optimizing for both latency and robustness.

### 3. Model Choice (Gemini 2.0 Flash-Lite)
**Assumption**: Speed is critical for a "real-time" feel.
*   *Decision*: We selected **Gemini 2.0 Flash-Lite** because it offers the best balance of extremely low latency and high reasoning capability, essential for processing 10-20 pages quickly without making the user wait.

### 4. Database Persistence
**Assumption**: Users want to revisit past analyses.
*   *Decision*: We use **SQLAlchemy + SQLite**. This keeps the deployment simple (no external DB required) while ensuring that once a paper is analyzed, its summaries are saved and don't need to be re-generated.

---

## 🏗️ Project Structure

```
research-paper-summarizer/
├── frontend/                 # React + Vite
│   ├── src/components/       # Dashboard, AllUploads, etc.
│   └── ...
└── backend/                  # FastAPI
    ├── api/v1/               # Routes & Logic
    │   └── pdf_routes.py     # Main streaming endpoints
    ├── helper/               # Helper Modules
    │   └── process_help.py   # AI & text processing logic
    ├── database.py           # SQLite models
    └── main.py               # Server entry point
```

## 📄 License
Created for Innowhyte Take-Home Assignment.
