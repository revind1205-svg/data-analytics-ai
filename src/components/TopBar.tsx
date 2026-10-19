import React from 'react';
import { 
  GitBranch, 
  Database, 
  BarChart3, 
  HardDrive, 
  Plus, 
  Sparkles,
  Layers,
  Radio,
  Bot,
  Play
} from 'lucide-react';
import { ActiveModule } from '../types';

interface TopBarProps {
  activeModule: ActiveModule;
  setActiveModule: (mod: ActiveModule) => void;
  onQuickCreate: (type: ActiveModule) => void;
  onOpenVoice: () => void;
  onOpenChat: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeModule,
  setActiveModule,
  onQuickCreate,
  onOpenVoice,
  onOpenChat,
}) => {
  const [showCreateMenu, setShowCreateMenu] = React.useState(false);

  const navItems = [
    { id: 'tour' as ActiveModule, label: 'Product Tour', icon: Play },
    { id: 'dashboard' as ActiveModule, label: 'RR Data Analysis', icon: BarChart3 },
    { id: 'flowchart' as ActiveModule, label: 'Flowchart AI', icon: GitBranch },
    { id: 'structure' as ActiveModule, label: 'Structure Studio', icon: Database },
    { id: 'drive' as ActiveModule, label: 'AI Drive Storage', icon: HardDrive },
    { id: 'topology' as ActiveModule, label: '3D Topology', icon: Layers },
  ];

  return (
    <header className="flex items-center justify-between gap-6 px-6 py-3.5 border-b border-slate-800 bg-[#090b14]/95 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: RR DATA ANALYSIS AI Logo & Wordmark */}
      <button 
        onClick={() => setActiveModule('tour')}
        className="flex items-center gap-3 shrink-0 text-left cursor-pointer group"
      >
        {/* Stylized RR geometric monogram icon */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-indigo-600 to-cyan-500 p-0.5 shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center transition-transform group-hover:scale-105">
          <div className="w-full h-full bg-slate-950/80 rounded-[6px] flex items-center justify-center">
            <span className="text-xs font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-300">
              RR
            </span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-black tracking-wider text-white whitespace-nowrap shrink-0 font-sans">
            RR DATA ANALYSIS AI
          </span>
          <span className="text-[9px] font-mono tracking-widest text-purple-400 uppercase leading-none">
            INTELLIGENCE STUDIO
          </span>
        </div>
      </button>

      {/* Zone 2: Clean single-line text navigation links */}
      <nav className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800/80 rounded-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-purple-950/80 text-purple-200 border border-purple-800/80 shadow-sm shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Actions + Voice & Chat Triggers */}
      <div className="flex items-center gap-2.5 shrink-0 relative">
        {/* Gemini Live Voice API */}
        <button
          onClick={onOpenVoice}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Open Gemini 3.8 Live Voice Call"
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline">Live Voice</span>
        </button>

        {/* Gemini Multi-Turn Chatbot */}
        <button
          onClick={onOpenChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Open Gemini Chat & Grounding"
        >
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Gemini Chat</span>
        </button>

        {/* New Asset Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-500 hover:to-indigo-500 shadow-sm shadow-purple-500/20 transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Asset</span>
          </button>

          {showCreateMenu && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowCreateMenu(false)} 
              />
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-1.5 z-40 flex flex-col gap-1">
                <button
                  onClick={() => {
                    setActiveModule('tour');
                    setShowCreateMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="font-medium">Product Tour</div>
                    <div className="text-[11px] text-slate-400">10-Min Guided Video</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onQuickCreate('flowchart');
                    setShowCreateMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <GitBranch className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-medium">Prompt Flowchart</div>
                    <div className="text-[11px] text-slate-400">Generate logic diagram</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onQuickCreate('structure');
                    setShowCreateMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Database className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="font-medium">Design Data Structure</div>
                    <div className="text-[11px] text-slate-400">SQL, Tree, or State Machine</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onQuickCreate('dashboard');
                    setShowCreateMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-medium">Analyze Dataset</div>
                    <div className="text-[11px] text-slate-400">Deep-dive insights & charts</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onQuickCreate('drive');
                    setShowCreateMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-medium">Upload to AI Drive</div>
                    <div className="text-[11px] text-slate-400">Store JSON, CSV, or code</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onQuickCreate('topology');
                    setShowCreateMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="font-medium">3D Spatial Topology</div>
                    <div className="text-[11px] text-slate-400">Interactive Three.js scene</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* User Workspace Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800 text-xs">
          <div className="w-7 h-7 rounded-full bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-300 font-bold text-[11px] tracking-tight">
            RR
          </div>
        </div>
      </div>
    </header>
  );
};
