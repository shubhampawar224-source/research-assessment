import React from 'react';
import Icons from '../helpers/Icons';

const PdfViewerModal = ({ pdfViewerUrl, closePdfModal }) => {
    if (!pdfViewerUrl) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={closePdfModal}
        >
            <div
                className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900 rounded-t-xl">
                    <h3 className="text-lg font-semibold text-white truncate max-w-3xl">
                        PDF Viewer
                    </h3>
                    <button
                        onClick={closePdfModal}
                        className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors"
                    >
                        <Icons.Close />
                    </button>
                </div>
                <div className="flex-1 overflow-hidden bg-slate-800 relative">
                    <iframe
                        src={pdfViewerUrl}
                        className="w-full h-full"
                        title="PDF Viewer"
                    />
                </div>
            </div>
        </div>
    );
};

export default PdfViewerModal;
