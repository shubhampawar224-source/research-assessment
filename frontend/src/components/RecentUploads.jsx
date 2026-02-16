import React from 'react';
import Icons from '../helpers/Icons';

const RecentUploads = ({
    pdfList,
    expandedPdfId,
    expandedPdfSections,
    expandedSectionKey,
    toggleRecentPdf,
    toggleSectionSummary,
    loadPdfToMain
}) => {
    return (
        <aside className="w-80 bg-slate-900 border-l border-slate-700 flex flex-col hidden lg:flex z-10 box-border">
            <div className="p-5 border-b border-slate-700 bg-slate-900/50 backdrop-blur">
                <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                    <Icons.History /> Recent Uploads
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                {pdfList.map((pdf) => (
                    <div key={pdf.id} className="border-b border-slate-800">
                        {/* Accordion Header */}
                        <div
                            onClick={() => toggleRecentPdf(pdf.id)}
                            className={`p-4 cursor-pointer hover:bg-slate-800 transition-all ${expandedPdfId === pdf.id ? 'bg-slate-800' : ''}`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-sm text-gray-200 truncate w-4/5 block" title={pdf.filename}>
                                    {pdf.filename}
                                </span>
                                <Icons.ChevronDown className={`text-slate-500 transition-transform ${expandedPdfId === pdf.id ? 'rotate-180' : ''}`} />
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>{new Date(pdf.upload_date).toLocaleDateString()}</span>
                                <span>{pdf.sections_count} sections</span>
                            </div>
                        </div>

                        {/* Accordion Content */}
                        {expandedPdfId === pdf.id && (
                            <div className="bg-slate-950/50 shadow-inner animate-fade-in">
                                <button
                                    onClick={() => loadPdfToMain(pdf.id)}
                                    className="w-full text-center py-2 text-xs font-semibold text-blue-400 hover:bg-slate-900 border-b border-slate-800 transition-colors"
                                >
                                    OPEN FULL ANALYSIS
                                </button>
                                <div className="space-y-0.5">
                                    {expandedPdfSections[pdf.id] && (
                                        expandedPdfSections[pdf.id].map((sec, idx) => (
                                            <div
                                                key={idx}
                                                onClick={(e) => toggleSectionSummary(e, pdf.id, sec.section_id || idx)}
                                                className="px-4 py-3 hover:bg-slate-800/50 cursor-pointer border-l-2 border-transparent hover:border-blue-500 transition-all flex flex-col group"
                                            >
                                                <div className="flex justify-between items-center w-full">
                                                    <span className="text-xs text-slate-400 group-hover:text-gray-300 w-10/12 truncate" title={sec.title}>
                                                        {sec.title}
                                                    </span>
                                                    <span className="text-[10px] text-slate-600 group-hover:text-blue-400">
                                                        p.{sec.start_page}
                                                    </span>
                                                </div>

                                                {expandedSectionKey === `${pdf.id}-${sec.section_id || idx}` && (
                                                    <p className="mt-2 text-xs text-slate-400 leading-relaxed bg-slate-900/50 p-2 rounded animate-fade-in">
                                                        {(sec.summary || sec.content)
                                                            ? (sec.summary || sec.content).slice(0, 150) + ((sec.summary || sec.content).length > 150 ? '...' : '')
                                                            : 'No content available.'}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {pdfList.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        No recent uploads
                    </div>
                )}
            </div>
        </aside>
    );
};

export default RecentUploads;
