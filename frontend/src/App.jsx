import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AllUploads from './components/AllUploads';
import RecentUploads from './components/RecentUploads';
import PdfViewerModal from './components/PdfViewerModal';
import CustomModal from './components/CustomModal';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const App = () => {
    // Application State
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [sections, setSections] = useState([]);
    const [pages, setPages] = useState([]); // New state for pages
    const [sectionSummaries, setSectionSummaries] = useState([]); // Individual section/heading summaries
    const [pdfList, setPdfList] = useState([]);
    const [metadata, setMetadata] = useState(null);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [pdfViewerUrl, setPdfViewerUrl] = useState(null);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const [expandedPdfId, setExpandedPdfId] = useState(null);
    const [expandedPdfSections, setExpandedPdfSections] = useState({});
    const [expandedSectionKey, setExpandedSectionKey] = useState(null);

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: null
    });

    const showModal = (config) => {
        setModal({ ...config, isOpen: true });
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchPdfList();
    }, [activeView]); // Refresh list when view changes

    // --- API Interactions ---

    const fetchPdfList = async () => {
        try {
            const response = await fetch(`${API_URL}/api/v1/pdfs`);
            const data = await response.json();
            setPdfList(data.pdfs);
        } catch (error) {
            console.error('Error fetching PDF list:', error);
        }
    };

    const fetchPdfDetailsForExpand = async (pdfId) => {
        try {
            const response = await fetch(`${API_URL}/api/v1/pdfs/${pdfId}`);
            const data = await response.json();
            setExpandedPdfSections(prev => ({ ...prev, [pdfId]: data.sections }));
        } catch (error) {
            console.error('Error fetching PDF details:', error);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            showModal({ title: 'No File Selected', message: 'Please select a PDF file first.', type: 'info' });
            return;
        }

        setUploading(true);
        setSections([]);
        setPages([]); // Reset pages
        setMetadata(null);
        setSelectedPdf(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_URL}/api/v1/upload-pdf`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop();

                for (const line of lines) {
                    console.log('DEBUG: Received line:', line);
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        console.log('DEBUG: Parsed data:', data);

                        if (data.type === 'metadata') {
                            setMetadata(data.data);
                            setSelectedPdf(data.data);
                        } else if (data.type === 'extraction_complete') {
                            console.log(`DEBUG: Extraction complete, ${data.total_pages} pages ready for summarization`);
                            // Phase 1 complete, Phase 2 starting
                        } else if (data.page_num) {
                            console.log(`DEBUG: Page ${data.page_num} data:`, {
                                page_num: data.page_num,
                                has_content: !!data.content,
                                summary_length: data.summary?.length || 0,
                                streaming: data.streaming
                            });

                            // Handle Page Summary Stream - Force new array for React to detect changes
                            setPages(prev => {
                                const existingIndex = prev.findIndex(p => p.page_number === data.page_num);
                                console.log('DEBUG: Existing page index:', existingIndex, 'Total pages:', prev.length);

                                if (existingIndex >= 0) {
                                    // Update existing page - create new array
                                    const newPages = [...prev];
                                    const existingPage = newPages[existingIndex];

                                    newPages[existingIndex] = {
                                        ...existingPage,
                                        title: data.title || existingPage.title || '',
                                        summary: data.streaming
                                            ? (existingPage.summary || '') + (data.summary || '')
                                            : (data.summary || existingPage.summary || ''),
                                        content: data.content || existingPage.content
                                    };

                                    console.log('DEBUG: Updated page', data.page_num, ':', newPages[existingIndex]);
                                    return newPages;
                                } else {
                                    // Add new page
                                    const newPage = {
                                        page_id: data.page_id,
                                        page_number: data.page_num,
                                        title: data.title || '',
                                        summary: data.summary || '',
                                        content: data.content || ''
                                    };
                                    console.log('DEBUG: Adding new page:', newPage);
                                    return [...prev, newPage];
                                }
                            });
                        } else if (data.section) {
                            // Keep section logic for backward compatibility/metadata if needed, 
                            // but we are focusing on pages now.
                            // You can choose to keep or remove dependent on if you want both.
                            // For now keeping it doesn't hurt.
                            setSections(prev => {
                                const existing = prev.find(s => s.section_id === data.section_id);
                                if (existing) {
                                    return prev.map(s =>
                                        s.section_id === data.section_id
                                            ? { ...s, summary: s.summary + (data.summary || '') }
                                            : s
                                    );
                                } else {
                                    return [...prev, {
                                        section_id: data.section_id,
                                        title: data.section,
                                        summary: data.summary || ''
                                    }];
                                }
                            });
                        } else if (data.type === 'section_summary') {
                            setSectionSummaries(prev => {
                                const newSummary = {
                                    id: data.section_id,
                                    page_number: data.page_num,
                                    section_title: data.section_title,
                                    summary: data.summary,
                                    created_at: new Date().toISOString()
                                };
                                return [...prev, newSummary];
                            });
                        } else if (data.type === 'complete') {
                            fetchPdfList();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error uploading PDF:', error);
            showModal({ title: 'Upload Failed', message: 'Error uploading PDF. Please check your connection and try again.', type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    // --- Event Handlers & Logic ---

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
        } else {
            showModal({ title: 'Invalid File', message: 'Please select a valid PDF file.', type: 'error' });
        }
    };

    const toggleRecentPdf = (pdfId) => {
        if (expandedPdfId === pdfId) {
            setExpandedPdfId(null);
        } else {
            setExpandedPdfId(pdfId);
            if (!expandedPdfSections[pdfId]) {
                fetchPdfDetailsForExpand(pdfId);
            }
        }
    };

    const toggleSectionSummary = (e, pdfId, sectionId) => {
        e.stopPropagation();
        const key = `${pdfId}-${sectionId}`;
        setExpandedSectionKey(expandedSectionKey === key ? null : key);
    };

    const openPdfAtPage = (pdfId, page) => {
        // Fallback to currently active metadata ID if selectedPdf is null (e.g. fresh upload)
        const targetId = pdfId || (metadata ? metadata.id : null);
        if (!targetId) return;

        const pdfUrl = `${API_URL}/api/v1/pdfs/${targetId}/file#page=${page || 1}`;
        setPdfViewerUrl(pdfUrl);
        setShowPdfModal(true);
    };

    const loadPdfToMain = async (pdfId) => {
        try {
            setFile(null);
            setSections([]);
            setPages([]);
            setMetadata(null);
            setUploading(true);
            setActiveView('dashboard');

            const response = await fetch(`${API_URL}/api/v1/pdfs/${pdfId}`);
            const data = await response.json();

            setMetadata(data.pdf);
            setSelectedPdf(data.pdf);
            setSections(data.sections);
            setSections(data.sections);
            setPages(data.pages || []); // Load pages
            setSectionSummaries(data.section_summaries || []); // Load section summaries
            setUploading(false);
        } catch (error) {
            console.error("Error loading PDF", error);
            setUploading(false);
        }
    };

    const handleNewAnalysis = () => {
        setMetadata(null);
        setSections([]);
        setSections([]);
        setPages([]);
        setSectionSummaries([]);
        setFile(null);
        setActiveView('dashboard');
    };

    const closePdfModal = () => {
        setShowPdfModal(false);
        setPdfViewerUrl(null);
    };

    const handlePdfDeleted = (deletedId) => {
        // Refresh the list
        fetchPdfList();

        // If the deleted PDF is the one currently loaded on the dashboard
        if (metadata && metadata.id === deletedId) {
            handleNewAnalysis();
        }

        // If it was selected
        if (selectedPdf && selectedPdf.id === deletedId) {
            setSelectedPdf(null);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-[#0f172a] text-gray-100 overflow-hidden font-sans">

            <Sidebar
                activeView={activeView}
                setActiveView={setActiveView}
                onNewAnalysis={handleNewAnalysis}
            />

            {activeView === 'dashboard' ? (
                <Dashboard
                    metadata={metadata}
                    uploading={uploading}
                    file={file}
                    sections={sections}
                    pages={pages} // Pass pages
                    sectionSummaries={sectionSummaries} // Pass section summaries
                    selectedPdf={selectedPdf}
                    fileInputRef={fileInputRef}
                    handleFileChange={handleFileChange}
                    handleUpload={handleUpload}
                    openPdfAtPage={openPdfAtPage}
                    setFile={setFile}
                />
            ) : (
                <AllUploads onOpenPdf={loadPdfToMain} onPdfListUpdate={fetchPdfList} onPdfDeleted={handlePdfDeleted} />
            )}

            {activeView === 'dashboard' && (
                <RecentUploads
                    pdfList={pdfList}
                    expandedPdfId={expandedPdfId}
                    expandedPdfSections={expandedPdfSections}
                    expandedSectionKey={expandedSectionKey}
                    toggleRecentPdf={toggleRecentPdf}
                    toggleSectionSummary={toggleSectionSummary}
                    loadPdfToMain={loadPdfToMain}
                />
            )}

            {showPdfModal && (
                <PdfViewerModal
                    pdfViewerUrl={pdfViewerUrl}
                    closePdfModal={closePdfModal}
                />
            )}

            <CustomModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
                confirmText={modal.confirmText || 'OK'}
                cancelText={modal.cancelText || 'Cancel'}
            />
        </div>
    );
};

export default App;
