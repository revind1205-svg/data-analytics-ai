import React, { useState } from 'react';
import { 
  Database, 
  GitCommit, 
  Network, 
  FolderTree, 
  Code2, 
  Table, 
  Sparkles, 
  Save, 
  Copy, 
  Check, 
  Key, 
  Link as LinkIcon, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Plus, 
  Play,
  RotateCcw,
  FileText,
  AlertCircle
} from 'lucide-react';
import { 
  StructureData, 
  StructureModality, 
  TableDefinition, 
  TreeNodeData, 
  StateMachineData,
  StateDef 
} from '../../types';
import { STARTER_STRUCTURES } from '../../data/mockData';

interface StructureStudioProps {
  initialData?: StructureData;
  onSaveToDrive?: (structure: StructureData) => void;
}

export const StructureStudio: React.FC<StructureStudioProps> = ({
  initialData,
  onSaveToDrive,
}) => {
  const [structure, setStructure] = useState<StructureData>(initialData || STARTER_STRUCTURES[0]);
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'mockData'>('visual');
  const [promptInput, setPromptInput] = useState('');
  const [selectedModality, setSelectedModality] = useState<StructureModality>(structure.type || 'relational');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // State Machine Simulator
  const [currentMachineState, setCurrentMachineState] = useState<string>(
    structure.stateMachine?.initialState || structure.stateMachine?.states[0]?.name || ''
  );

  // Tree collapsed set
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Copy & save feedback
  const [copiedCode, setCopiedCode] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleGenerate = async (overridePrompt?: string, overrideType?: StructureModality) => {
    const targetPrompt = overridePrompt || promptInput.trim();
    const targetType = overrideType || selectedModality;
    if (!targetPrompt) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch('/api/structure/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: targetPrompt, type: targetType }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data: StructureData = await response.json();
      if (data && data.title) {
        setStructure(data);
        setSelectedModality(data.type || targetType);
        if (data.stateMachine) {
          setCurrentMachineState(data.stateMachine.initialState || data.stateMachine.states[0]?.name || '');
        }
      }
    } catch (err: any) {
      console.error('Structure generate error:', err);
      setGenerationError(err.message || 'Failed to generate structure');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTreeNode = (nodePath: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodePath)) {
        next.delete(nodePath);
      } else {
        next.add(nodePath);
      }
      return next;
    });
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSave = () => {
    if (onSaveToDrive) {
      onSaveToDrive(structure);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    }
  };

  // Render Relational Tables (ERD Visualizer)
  const renderRelationalERD = () => {
    const tables = structure.tables || [];

    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <span>{tables.length} Database Tables</span>
            <span className="mx-2">·</span>
            <span>{structure.relations?.length || 0} Foreign Key Constraints</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <div
              key={table.name}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm hover:border-slate-700 transition-all"
            >
              <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-xs font-bold text-white">{table.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                  {table.columns.length} cols
                </span>
              </div>

              {table.description && (
                <div className="px-4 py-2 text-[11px] text-slate-400 border-b border-slate-800/60 bg-slate-950/30">
                  {table.description}
                </div>
              )}

              <div className="divide-y divide-slate-800/50">
                {table.columns.map((col) => (
                  <div
                    key={col.name}
                    className="px-4 py-2 flex items-center justify-between text-xs hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {col.isPrimary ? (
                        <span title="Primary Key">
                          <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        </span>
                      ) : col.foreignKey ? (
                        <span title={`Foreign Key: ${col.foreignKey}`}>
                          <LinkIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        </span>
                      ) : (
                        <div className="w-3.5 h-3.5" />
                      )}
                      <span className={`font-mono text-[11px] ${col.isPrimary ? 'text-amber-200 font-semibold' : 'text-slate-200'}`}>
                        {col.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-cyan-300/80 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {col.type}
                      </span>
                      {col.nullable && (
                        <span className="text-[9px] text-slate-500 font-mono">null</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {table.indexes && table.indexes.length > 0 && (
                <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                  <span className="text-slate-500 font-semibold">Indexes: </span>
                  {table.indexes.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Tree Hierarchy Visualizer
  const renderTree = (node?: TreeNodeData, path = 'root', depth = 0) => {
    if (!node) return null;
    const isCollapsed = collapsedNodes.has(path);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={path} className="flex flex-col text-xs">
        <div
          onClick={() => hasChildren && toggleTreeNode(path)}
          className={`flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer select-none ${
            depth === 0 ? 'bg-slate-900 border border-slate-800 mb-1' : ''
          }`}
          style={{ paddingLeft: `${Math.max(12, depth * 22)}px` }}
        >
          {hasChildren ? (
            isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )
          ) : (
            <div className="w-3.5 h-3.5" />
          )}

          <FolderTree className="w-3.5 h-3.5 text-cyan-400 shrink-0" />

          <span className="font-semibold text-slate-200">{node.name}</span>

          {node.type && (
            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
              {node.type}
            </span>
          )}

          {node.attributes && (
            <div className="flex items-center gap-1.5 ml-auto text-[10px] font-mono text-slate-400">
              {Object.entries(node.attributes).map(([k, v]) => (
                <span key={k} className="bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-850">
                  <span className="text-slate-500">{k}:</span> {String(v)}
                </span>
              ))}
            </div>
          )}
        </div>

        {hasChildren && !isCollapsed && (
          <div className="flex flex-col border-l border-slate-800/80 ml-5 pl-2 my-0.5">
            {node.children!.map((child, idx) => renderTree(child, `${path}/${child.name || idx}`, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render State Machine Visualizer
  const renderStateMachine = () => {
    const sm = structure.stateMachine;
    if (!sm) {
      return (
        <div className="p-8 text-center text-xs text-slate-500">
          No state machine data in current structure. Select State Machine or prompt AI to generate one.
        </div>
      );
    }

    const availableTransitions = sm.transitions.filter((t) => t.from === currentMachineState);

    return (
      <div className="flex flex-col gap-6 p-6">
        {/* Interactive Simulation Bar */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Active State:</span>
            <div className="px-3 py-1 bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-xs font-bold rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>{currentMachineState}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Trigger Transition:</span>
            {availableTransitions.length > 0 ? (
              availableTransitions.map((tr) => (
                <button
                  key={tr.event + tr.to}
                  onClick={() => setCurrentMachineState(tr.to)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  ⚡ {tr.event} → {tr.to}
                </button>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">Terminal state reached (No further transitions)</span>
            )}

            <button
              onClick={() => setCurrentMachineState(sm.initialState || sm.states[0]?.name || '')}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer ml-2"
              title="Reset state machine"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* States Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sm.states.map((st) => {
            const isCurrent = currentMachineState === st.name;
            return (
              <div
                key={st.name}
                onClick={() => setCurrentMachineState(st.name)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-bold text-xs ${isCurrent ? 'text-cyan-300' : 'text-white'}`}>
                    {st.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {st.isTerminal && (
                      <span className="text-[10px] font-mono text-rose-300 bg-rose-950 px-1.5 py-0.2 rounded border border-rose-900">
                        Terminal
                      </span>
                    )}
                    {st.name === sm.initialState && (
                      <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-900">
                        Initial
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">{st.description}</p>
              </div>
            );
          })}
        </div>

        {/* Transitions Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 font-semibold text-xs text-white">
            Automaton Transition Rules
          </div>
          <div className="divide-y divide-slate-800/60">
            {sm.transitions.map((tr, idx) => (
              <div key={idx} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-800/20">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-300 font-medium">{tr.from}</span>
                  <span className="text-slate-500">→</span>
                  <span className="font-mono text-cyan-300 font-medium">{tr.to}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 font-mono text-[11px] text-amber-300 rounded">
                    event: {tr.event}
                  </span>
                  {tr.guard && (
                    <span className="font-mono text-[10px] text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-900">
                      guard: {tr.guard}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render Mock Data Table
  const renderMockData = () => {
    const records = structure.sampleRecords || [];
    if (records.length === 0) {
      return (
        <div className="p-8 text-center text-xs text-slate-500">
          No mock records generated. Prompt AI with your structure requirements to generate sample data.
        </div>
      );
    }

    const columns = Object.keys(records[0] || {});

    return (
      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <span>{records.length} Realistic Mock Records</span>
            <span className="mx-2">·</span>
            <span>Schema Conformant</span>
          </div>

          <button
            onClick={() => handleCopyCode(JSON.stringify(records, null, 2))}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg cursor-pointer"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Mock JSON</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700/80 text-slate-300 font-mono">
                {columns.map((col) => (
                  <th key={col} className="px-4 py-2.5 font-semibold text-[11px]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {records.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2 text-slate-300 whitespace-nowrap">
                      {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const presetPrompts = [
    { label: 'Enterprise Multi-Tenant SaaS (PostgreSQL)', type: 'relational' as StructureModality },
    { label: 'Autonomous Courier Delivery State Machine', type: 'state_machine' as StructureModality },
    { label: 'Global Cloud Infrastructure Topology Tree', type: 'tree' as StructureModality },
    { label: 'E-Commerce Variant & Inventory Matrix', type: 'relational' as StructureModality },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-61px)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header & Generator Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm flex flex-col gap-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              <span>{structure.title}</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">{structure.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyCode(structure.sqlDdl || structure.typescriptDefinition)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              {savedFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{savedFeedback ? 'Saved in Drive' : 'Save to Drive'}</span>
            </button>
          </div>
        </div>

        {/* AI Generator Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <select
            value={selectedModality}
            onChange={(e) => setSelectedModality(e.target.value as StructureModality)}
            className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer shrink-0"
          >
            <option value="relational">Relational DB (PostgreSQL ERD)</option>
            <option value="state_machine">State Machine (Automaton)</option>
            <option value="tree">Hierarchy Tree</option>
            <option value="graph">Network Graph</option>
          </select>

          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Prompt AI structure (e.g. Fintech Ledger with Double-Entry Accounting, Healthcare Patient Graph)..."
            className="flex-1 px-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />

          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating || !promptInput.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Synthesizing...' : 'Generate Structure'}</span>
          </button>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-400">
          <span className="text-[11px] text-slate-500 shrink-0 font-medium">Quick Presets:</span>
          {presetPrompts.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setPromptInput(p.label);
                setSelectedModality(p.type);
                handleGenerate(p.label, p.type);
              }}
              className="px-2.5 py-1 text-[11px] bg-slate-800/80 hover:bg-slate-800 hover:text-cyan-300 border border-slate-700/60 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {generationError && (
        <div className="mx-4 mt-2 p-2.5 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{generationError}</span>
        </div>
      )}

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('visual')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'visual'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Visualizer</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'code'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>SQL & TypeScript Code</span>
          </button>
          <button
            onClick={() => setActiveTab('mockData')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'mockData'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Sample Mock Records</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Modality: <span className="text-cyan-400 font-semibold">{structure.type.toUpperCase()}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'visual' && (
          <>
            {structure.type === 'relational' && renderRelationalERD()}
            {structure.type === 'state_machine' && renderStateMachine()}
            {structure.type === 'tree' && (
              <div className="p-6">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  {renderTree(structure.tree)}
                </div>
              </div>
            )}
            {structure.type === 'graph' && (
              <div className="p-6">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <div className="text-xs font-semibold text-white mb-3">Graph Network Nodes & Links</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {structure.graph?.nodes.map((node) => (
                      <div key={node.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="font-mono text-xs text-cyan-300 font-bold">{node.label}</div>
                        <div className="text-[10px] text-slate-400">Category: {node.category || 'node'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'code' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {structure.sqlDdl && (
              <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between text-xs font-medium text-slate-200">
                  <span className="font-mono text-cyan-400">PostgreSQL Schema (DDL)</span>
                  <button
                    onClick={() => handleCopyCode(structure.sqlDdl!)}
                    className="p-1 hover:text-cyan-300 cursor-pointer"
                    title="Copy SQL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed bg-slate-950">
                  <code>{structure.sqlDdl}</code>
                </pre>
              </div>
            )}

            <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between text-xs font-medium text-slate-200">
                <span className="font-mono text-blue-400">TypeScript Type Definitions</span>
                <button
                  onClick={() => handleCopyCode(structure.typescriptDefinition)}
                  className="p-1 hover:text-cyan-300 cursor-pointer"
                  title="Copy TypeScript"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed bg-slate-950">
                <code>{structure.typescriptDefinition}</code>
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'mockData' && renderMockData()}
      </div>
    </div>
  );
};
