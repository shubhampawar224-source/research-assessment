# 📚 Research Paper Summarizer

An AI-powered web application that automatically summarizes research paper sections using Google's Gemini API. Upload a PDF, and watch as each section is analyzed and summarized in real-time with a beautiful, modern interface.

![Tech Stack](https://img.shields.io/badge/React-18.2-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan)
![Gemini](https://img.shields.io/badge/Gemini-API-purple)

## ✨ Features

- 📄 **PDF Upload** - Drag & drop or click to upload research papers
- 🤖 **AI Summarization** - Powered by Google Gemini API
- ⚡ **Real-time Streaming** - See summaries appear as they're generated
- 📊 **Live Table Display** - Dynamic updates as sections are processed
- 🎨 **Premium UI** - Modern glassmorphism design with smooth animations
- 📱 **Responsive** - Works on desktop, tablet, and mobile
- 💾 **PDF History** - View previously uploaded documents

## 🏗️ Project Structure

```
research-paper-summarizer/
├── frontend/                 # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── App.jsx          # Main application component
│   │   ├── main.jsx         # React entry point
│   │   └── index.css        # Global styles with TailwindCSS
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── README.md
│
└── backend/                  # Python + FastAPI
    ├── main.py              # FastAPI server with endpoints
    ├── requirements.txt     # Python dependencies
    ├── .env.example         # Environment variables template
    └── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment:
```bash
copy .env.example .env  # Windows
cp .env.example .env    # Mac/Linux
```

5. Edit `.env` and add your Gemini API key:
```env
GEMINI_API_KEY=your_actual_api_key_here
PORT=8000
FRONTEND_URL=http://localhost:5173
```

6. Run the server:
```bash
python main.py
```

Backend will be running at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will be running at `http://localhost:5173`

## 📖 How It Works

1. **Upload PDF** - User uploads a research paper in PDF format
2. **Text Extraction** - Backend extracts text using PyPDF2
3. **Section Detection** - Identifies sections based on common headers (Introduction, Methods, Results, etc.)
4. **AI Summarization** - Each section is sent to Gemini API for summarization
5. **Streaming Response** - Summaries are streamed back to frontend in real-time
6. **Live Display** - Table updates dynamically as summaries arrive

## 🎨 Design Highlights

- **Glassmorphism** - Frosted glass effect with backdrop blur
- **Gradient Backgrounds** - Purple to blue gradient theme
- **Smooth Animations** - Fade-in, slide-up, and hover effects
- **Custom Scrollbar** - Styled to match the theme
- **Loading States** - Elegant spinners and shimmer effects
- **Responsive Grid** - Adapts to all screen sizes

## 🔧 API Endpoints

### `POST /upload-pdf`
Upload a PDF and receive streaming summaries

**Request:**
- Content-Type: `multipart/form-data`
- Body: PDF file

**Response:**
- Server-Sent Events (SSE) stream
- Returns metadata, section summaries, and completion status

### `GET /pdfs`
Get list of all uploaded PDFs

**Response:**
```json
{
  "pdfs": [
    {
      "id": 1,
      "filename": "research_paper.pdf",
      "upload_date": "2026-02-14T17:00:00",
      "sections_count": 8
    }
  ]
}
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Server-Sent Events** - Real-time updates

### Backend
- **FastAPI** - Web framework
- **PyPDF2** - PDF text extraction
- **Google Gemini API** - AI summarization
- **Uvicorn** - ASGI server
- **python-dotenv** - Environment management

## 📝 Example Output

When you upload a research paper, you'll see a table like this:

| Section Title | Summary |
|--------------|---------|
| 1. Introduction | Introduces the research problem, background, and motivation... |
| 2. Related Work | Summarizes previous work and highlights the gap this paper addresses... |
| 3.1 Dataset Description | Describes the dataset used, including source and preprocessing... |
| 4. Experimental Setup | Covers training strategy, evaluation metrics, and baseline comparisons... |

## 🔒 Security Notes

- Never commit your `.env` file with actual API keys
- The `.env.example` file is provided as a template
- Keep your Gemini API key secure

## 🐛 Troubleshooting

**Backend won't start:**
- Check if Python virtual environment is activated
- Verify all dependencies are installed
- Ensure `.env` file exists with valid API key

**Frontend can't connect to backend:**
- Verify backend is running on port 8000
- Check CORS settings in `main.py`
- Ensure no firewall is blocking the connection

**PDF upload fails:**
- Check file is a valid PDF
- Ensure PDF contains extractable text (not scanned images)
- Verify file size is reasonable

## 📄 License

This project is created for the Innowhyte Take-Home Assignment.

## 🙏 Acknowledgments

- Google Gemini API for AI-powered summarization
- FastAPI for the excellent Python web framework
- React and Vite for modern frontend development
- TailwindCSS for beautiful, utility-first styling

---

**Built with ❤️ for research paper analysis**
