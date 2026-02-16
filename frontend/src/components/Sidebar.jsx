import React, { useState } from 'react';
import Icons from '../helpers/Icons';

const Sidebar = ({ activeView, setActiveView, onNewAnalysis }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => setIsOpen(!isOpen);

    const handleNavigation = (view) => {
        setActiveView(view);
        setIsOpen(false);
    };

    return (
        <>
            {/* Mobile Header & Toggle */}
            <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-700 w-full z-20 sticky top-0">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Research AI
                </h1>
                <button onClick={toggleSidebar} className="text-slate-400 hover:text-white">
                    {isOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Sidebar Content */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-700 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-slate-700 hidden md:block">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Research AI
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-16 md:mt-0">
                    <button
                        onClick={() => { onNewAnalysis(); setIsOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg w-full transition-all shadow-lg shadow-blue-900/20 mb-6"
                    >
                        <Icons.Upload />
                        <span className="font-medium">New Analysis</span>
                    </button>

                    <button
                        onClick={() => handleNavigation('dashboard')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all ${activeView === 'dashboard' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-gray-100'}`}
                    >
                        <Icons.Home />
                        <span className="font-medium">Dashboard</span>
                    </button>
                    <button
                        onClick={() => handleNavigation('all-uploads')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all ${activeView === 'all-uploads' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-gray-100'}`}
                    >
                        <Icons.History />
                        <span className="font-medium">All Uploads</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-400 text-center">Version 1.0.0</p>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}
        </>
    );
};

export default Sidebar;
