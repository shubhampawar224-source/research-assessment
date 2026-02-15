import React from 'react';
import Icons from '../helpers/Icons';

const Sidebar = ({ activeView, setActiveView, onNewAnalysis }) => {
    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col hidden md:flex z-10 transition-all">
            <div className="p-6 border-b border-slate-700">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Research AI
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <button
                    onClick={onNewAnalysis}
                    className="flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg w-full transition-all shadow-lg shadow-blue-900/20 mb-6"
                >
                    <Icons.Upload />
                    <span className="font-medium">New Analysis</span>
                </button>

                <button
                    onClick={() => setActiveView('dashboard')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all ${activeView === 'dashboard' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-gray-100'}`}
                >
                    <Icons.Home />
                    <span className="font-medium">Dashboard</span>
                </button>
                <button
                    onClick={() => setActiveView('all-uploads')}
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
    );
};

export default Sidebar;
