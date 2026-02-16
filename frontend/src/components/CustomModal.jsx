import React from 'react';

const CustomModal = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'info', // 'info', 'success', 'error', 'confirm'
    onConfirm,
    confirmText = 'OK',
    cancelText = 'Cancel'
}) => {
    if (!isOpen) return null;

    const isConfirm = type === 'confirm';
    const isError = type === 'error';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
            <div
                className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md transform transition-all scale-100 animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`p-6 border-b border-slate-700/50 flex items-center gap-3 ${isError ? 'bg-red-500/10' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                        ${isError ? 'bg-red-500/20 text-red-400' :
                            isConfirm ? 'bg-blue-500/20 text-blue-400' :
                                'bg-green-500/20 text-green-400'}`}
                    >
                        {isError ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        ) : isConfirm ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-100">{title}</h3>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-slate-300 leading-relaxed text-sm">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0 flex justify-end gap-3">
                    {/* Always show Cancel for confirm type, or acts as Close for others if single button desired but standard alert usually has just OK */}
                    {isConfirm && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
                        >
                            {cancelText}
                        </button>
                    )}

                    <button
                        onClick={() => {
                            if (onConfirm) onConfirm();
                            onClose();
                        }}
                        className={`px-6 py-2 rounded-lg text-white font-medium shadow-lg transition-all transform hover:scale-105 active:scale-95 text-sm
                            ${isError ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' :
                                'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomModal;
