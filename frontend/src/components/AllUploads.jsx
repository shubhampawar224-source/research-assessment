import React, { useState, useEffect, useRef } from 'react';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AllUploads = ({ onOpenPdf, onPdfListUpdate }) => {
    const [allPdfs, setAllPdfs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPdfData, setSelectedPdfData] = useState(null); // { pdf: ..., sections: [] }
    const detailsRef = useRef(null);

    useEffect(() => {
        const fetchPdfs = async () => {
            try {
                const response = await fetch(`${API_URL}/api/v1/pdfs`);
                if (response.ok) {
                    const data = await response.json();
                    setAllPdfs(data.pdfs);
                }
            } catch (error) {
                console.error("Error fetching PDFs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPdfs();
    }, []);

    const filteredPdfs = allPdfs.filter(pdf =>
        pdf.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePdfClick = async (id) => {
        try {
            // Optional: Loading state for details could be added here
            const response = await fetch(`${API_URL}/api/v1/pdfs/${id}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedPdfData(data);
                // Scroll to details
                setTimeout(() => {
                    detailsRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } catch (error) {
            console.error("Error fetching PDF details:", error);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this PDF?')) {
            try {
                const response = await fetch(`${API_URL}/api/v1/pdfs/${id}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    setAllPdfs(prev => prev.filter(p => p.id !== id));
                    if (selectedPdfData?.pdf?.id === id) {
                        setSelectedPdfData(null);
                    }
                    if (onPdfListUpdate) onPdfListUpdate(); // Refresh parent list
                }
            } catch (error) {
                console.error("Error deleting PDF:", error);
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0f172a] text-gray-100 p-8">
            <header className="mb-8 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        All Documents
                    </h2>
                    <p className="text-slate-400 mt-2">Manage your uploaded research papers</p>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-64 p-2.5 pl-10"
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* PDF Grid */}
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="mb-12">
                        {filteredPdfs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredPdfs.map((pdf) => (
                                    <div
                                        key={pdf.id}
                                        onClick={() => handlePdfClick(pdf.id)}
                                        className={`bg-slate-800/50 border rounded-xl p-6 cursor-pointer group relative overflow-hidden transition-all ${selectedPdfData?.pdf?.id === pdf.id ? 'border-blue-500 ring-1 ring-blue-500/50 bg-slate-800' : 'border-slate-700 hover:bg-slate-800 hover:border-blue-500/50'}`}
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleDelete(e, pdf.id)}
                                                className="text-slate-400 hover:text-red-400 bg-slate-900/80 p-2 rounded-full backdrop-blur-sm"
                                                title="Delete PDF"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 shrink-0">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-200 truncate group-hover:text-blue-400 transition-colors" title={pdf.filename}>
                                                    {pdf.filename}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                                    <span>{new Date(pdf.upload_date).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>{pdf.sections_count} sections</span>
                                                    {pdf.total_pages > 0 && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{pdf.total_pages} pages</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p>No documents found matching "{searchTerm}"</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Selected PDF Content */}
                {selectedPdfData && (
                    <div ref={detailsRef} className="pb-20 animate-slide-up border-t border-slate-700 pt-8">
                        <h3 className="text-2xl font-bold text-gray-200 mb-6 flex items-center gap-3">
                            <span className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </span>
                            {selectedPdfData.pdf.filename}
                        </h3>

                        {/* Document Info Card */}
                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 mb-8 backdrop-blur-sm shadow-lg">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <label className="text-xs uppercase tracking-wider text-slate-400">Filename</label>
                                    <p className="font-medium text-gray-200 mt-1 truncate" title={selectedPdfData.pdf.filename}>{selectedPdfData.pdf.filename}</p>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-wider text-slate-400">Sections</label>
                                    <p className="font-medium text-gray-200 mt-1">{selectedPdfData.pdf.sections_count}</p>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-wider text-slate-400">Pages</label>
                                    <p className="font-medium text-gray-200 mt-1">{selectedPdfData.pdf.total_pages || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-wider text-slate-400">Date</label>
                                    <p className="font-medium text-gray-200 mt-1">{new Date(selectedPdfData.pdf.upload_date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Page Summaries */}
                        {selectedPdfData.pages && selectedPdfData.pages.length > 0 ? (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                                    Page Summaries
                                </h3>
                                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                                    <table className="w-full">
                                        <thead className="bg-slate-800/50 border-b border-slate-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-24">
                                                    Page
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                                    Summary
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {selectedPdfData.pages.map((page, idx) => (
                                                <tr
                                                    key={idx}
                                                    className="hover:bg-slate-800/50 transition-colors"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-medium text-blue-200">
                                                            {page.page_number}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-gray-300 leading-relaxed text-sm">
                                                            {page.summary || "Generating summary..."}
                                                        </p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-500 bg-slate-800/30 rounded-xl border border-slate-800 border-dashed">
                                No page summaries available for this document.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllUploads;
