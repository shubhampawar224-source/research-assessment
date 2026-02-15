# Research Paper Summarizer - Frontend

A beautiful, modern React application for uploading research papers and getting AI-powered section summaries.

## Features

✨ **Drag & Drop Upload** - Easy PDF file upload with drag-and-drop support  
🎨 **Premium UI** - Glassmorphism design with smooth animations  
⚡ **Real-time Streaming** - See summaries appear as they're generated  
📊 **Live Table Updates** - Dynamic table that updates as summaries stream in  
📱 **Responsive Design** - Works beautifully on all devices  

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first CSS framework
- **Glassmorphism** - Modern UI design trend
- **Server-Sent Events (SSE)** - Real-time streaming updates

## Design Features

- 🎨 Gradient backgrounds with purple/blue theme
- 💎 Glass-morphic cards with backdrop blur
- ✨ Smooth animations and transitions
- 🎯 Hover effects and micro-interactions
- 📱 Fully responsive layout
- 🌙 Dark mode optimized

## API Integration

The frontend connects to the FastAPI backend at `http://localhost:8000`:

- `POST /upload-pdf` - Upload PDF and receive streaming summaries
- `GET /pdfs` - Fetch list of uploaded PDFs
