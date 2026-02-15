import React from 'react';
import Icons from '../helpers/Icons';

const Dashboard = ({
    metadata,
    uploading,
    file,
    sections,
    pages,
    selectedPdf,
    fileInputRef,
    handleFileChange,
    handleUpload,
    openPdfAtPage,
    setFile
}) => {
    return (
        <main className="flex-1 flex flex-col relative overflow-hidden">
            {/* Top Header */}
            <header className="h-16 border-b border-slate-700 bg-slate-900/50 backdrop-blur-md flex items-center px-6 justify-between">
                <h2 className="text-lg font-semibold text-gray-200">
                    {metadata ? metadata.filename : 'New Analysis'}
                </h2>
            </header>

            {/* Split Layout: Upload Top, Summaries Bottom */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* TOP SECTION: Upload Area (40% height) */}
                <div className="h-2/5 border-b border-slate-700 p-6 overflow-y-auto custom-scrollbar">
                    {/* Document Info Card */}
                    {metadata && (
                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm animate-fade-in shadow-lg mb-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-xs uppercase tracking-wider text-slate-400">Filename</label>
                                    <p className="font-medium text-gray-200 mt-1 truncate text-sm" title={metadata.filename}>{metadata.filename}</p>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-wider text-slate-400">Sections</label>
                                    <p className="font-medium text-gray-200 mt-1 text-sm">{metadata.sections_count}</p>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-wider text-slate-400">Pages</label>
                                    <p className="font-medium text-gray-200 mt-1 text-sm">{metadata.total_pages || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-wider text-slate-400">Date</label>
                                    <p className="font-medium text-gray-200 mt-1 text-sm">{new Date(metadata.upload_date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Upload Area - Only show when not uploading and no pages */}
                    {!uploading && pages.length === 0 && (
                        <div className="flex items-center justify-center h-full">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={(e) => {
                                    e.preventDefault(); e.stopPropagation();
                                    const file = e.dataTransfer.files[0];
                                    if (file && file.type === 'application/pdf') setFile(file);
                                }}
                                className="w-full max-w-xl border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-slate-800/30 transition-all cursor-pointer group"
                            >
                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <Icons.Upload />
                                </div>
                                <h3 className="text-xl font-bold text-gray-200 mb-2">
                                    {file ? file.name : 'Upload Research Paper'}
                                </h3>
                                <p className="text-slate-400 mb-4 text-sm">Drag & drop your PDF here or click to browse</p>

                                {file && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                                        disabled={uploading}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium shadow-lg hover:shadow-blue-500/25 transition-all"
                                    >
                                        {uploading ? 'Processing...' : 'Start Analysis'}
                                    </button>
                                )}
                                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                            </div>
                        </div>
                    )}

                    {/* Processing Indicator - Show when uploading but no pages yet */}
                    {uploading && pages.length === 0 && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-300 font-medium">Reading PDF...</p>
                                <p className="text-slate-400 text-sm mt-2">Extracting pages</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* BOTTOM SECTION: Summary Details (60% height) */}
                <div className="h-3/5 p-6 overflow-y-auto custom-scrollbar bg-slate-900/30">
                    {/* Processing Banner */}
                    {uploading && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center gap-3 mb-4">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <div>
                                <p className="text-blue-200 font-medium text-sm">Processing document...</p>
                                <p className="text-blue-300/70 text-xs">Pages: {pages.length} | Summaries appear in real-time</p>
                            </div>
                        </div>
                    )}

                    {/* Summary Table - Always show structure during upload */}
                    {(uploading || pages.length > 0) ? (
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                                Page Summaries {uploading && <span className="text-xs text-slate-400 font-normal">(Live - {pages.length} pages)</span>}
                            </h3>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-950 border-b border-slate-800">
                                            <th className="p-3 font-semibold text-slate-400 text-sm w-12">Page</th>
                                            <th className="p-3 font-semibold text-slate-400 text-sm w-1/4">Section/Title</th>
                                            <th className="p-3 font-semibold text-slate-400 text-sm w-1/4">Content</th>
                                            <th className="p-3 font-semibold text-slate-400 text-sm w-1/3">Summary</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {pages.length > 0 ? (
                                            pages.map((page) => (
                                                <tr
                                                    key={`page-${page.page_number}`}
                                                    onClick={() => openPdfAtPage(selectedPdf ? selectedPdf.id : metadata?.id, page.page_number)}
                                                    className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                                                >
                                                    <td className="p-3 align-top">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openPdfAtPage(selectedPdf ? selectedPdf.id : metadata?.id, page.page_number);
                                                            }}
                                                            className="text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded transition-all"
                                                        >
                                                            {page.page_number}
                                                        </button>
                                                    </td>
                                                    <td className="p-3 text-blue-300 text-sm font-medium align-top">
                                                        {page.title ? (
                                                            <span className="flex items-center gap-2">
                                                                <span className="text-blue-400">📑</span>
                                                                {page.title}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-500 text-xs italic">No section heading</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-gray-400 text-xs leading-relaxed align-top font-mono">
                                                        <div className="max-h-24 overflow-y-auto custom-scrollbar">
                                                            {page.content ? page.content.substring(0, 200) + (page.content.length > 200 ? '...' : '') : 'Extracting...'}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-gray-300 text-xs leading-relaxed align-top">
                                                        {page.summary ? (
                                                            <span>{page.summary}</span>
                                                        ) : (
                                                            <span className="flex items-center gap-2 text-slate-400">
                                                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                                                Generating...
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="p-6 text-center text-slate-400">
                                                    <p className="text-sm">Waiting for pages...</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">
                            <div className="text-center">
                                <p className="text-lg font-medium mb-2">No summaries yet</p>
                                <p className="text-sm">Upload a PDF to see page summaries here</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default Dashboard;
