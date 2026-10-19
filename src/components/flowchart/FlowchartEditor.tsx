import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Sparkles, 
  Download, 
  Save, 
  Copy, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Plus, 
  Trash2, 
  Edit3, 
  GitBranch, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  Layers,
  AlertCircle
} from 'lucide-react';
import { FlowchartData, FlowNode, FlowEdge, FlowNodeType } from '../../types';
import { STARTER_FLOWCHARTS } from '../../data/mockData';

interface FlowchartEditorProps {
  initialData?: FlowchartData;
  onSaveToDrive?: (flowchart: FlowchartData) => void;
}

export const FlowchartEditor: React.FC<FlowchartEditorProps> = ({
  initialData,
  onSaveToDrive,
}) => {
  const [flowchart, setFlowchart] = useState<FlowchartData>(initialData || STARTER_FLOWCHARTS[0]);
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Canvas Viewport transform (Pan & Zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Node Dragging
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Selected Node for editing
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [editNodeData, setEditNodeData] = useState<Partial<FlowNode>>({});

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [simSpeedMs, setSimSpeedMs] = useState(1500);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Copied alert feedback
  const [copiedMermaid, setCopiedMermaid] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const canvasRef = useRef<SVGSVGElement | null>(null);

  // Sync if initialData changes externally
  useEffect(() => {
    if (initialData) {
      setFlowchart(initialData);
      setCurrentStepIndex(0);
      setIsSimulating(false);
    }
  }, [initialData]);

  // Simulation tick loop
  useEffect(() => {
    if (isSimulating && flowchart.simulation?.steps) {
      const totalSteps = flowchart.simulation.steps.length;
      simulationTimerRef.current = setTimeout(() => {
        if (currentStepIndex < totalSteps - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          setIsSimulating(false);
        }
      }, simSpeedMs);
    }

    return () => {
      if (simulationTimerRef.current) {
        clearTimeout(simulationTimerRef.current);
      }
    };
  }, [isSimulating, currentStepIndex, flowchart.simulation, simSpeedMs]);

  const activeSimulationStep = flowchart.simulation?.steps?.[currentStepIndex];
  const activeSimNodeId = activeSimulationStep?.nodeId;

  // Handle AI Prompt Generation
  const handleGenerate = async (overridePrompt?: string) => {
    const targetPrompt = overridePrompt || promptInput.trim();
    if (!targetPrompt) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch('/api/flowchart/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: targetPrompt }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data: FlowchartData = await response.json();
      if (data && data.nodes && data.nodes.length > 0) {
        setFlowchart(data);
        setCurrentStepIndex(0);
        setIsSimulating(false);
        setPan({ x: 50, y: 30 });
        setZoom(0.95);
      } else {
        throw new Error('Invalid structure returned from generator');
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setGenerationError(err.message || 'Failed to generate flowchart');
    } finally {
      setIsGenerating(false);
    }
  };

  // Node Drag Handlers
  const handleNodeMouseDown = (e: React.MouseEvent, node: FlowNode) => {
    e.stopPropagation();
    setDraggingNodeId(node.id);
    setSelectedNodeId(node.id);
    setDragOffset({
      x: e.clientX / zoom - node.x,
      y: e.clientY / zoom - node.y,
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !draggingNodeId) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      const newX = Math.round(e.clientX / zoom - dragOffset.x);
      const newY = Math.round(e.clientY / zoom - dragOffset.y);

      setFlowchart((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n)),
      }));
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  // Auto-arrange layout
  const handleAutoArrange = () => {
    const nodeMap = new Map<string, FlowNode>();
    flowchart.nodes.forEach((n) => nodeMap.set(n.id, n));

    // Basic vertical ranking
    const visited = new Set<string>();
    const levels: string[][] = [];

    // Find start nodes
    const incomingEdgeCount = new Map<string, number>();
    flowchart.nodes.forEach((n) => incomingEdgeCount.set(n.id, 0));
    flowchart.edges.forEach((e) => {
      incomingEdgeCount.set(e.to, (incomingEdgeCount.get(e.to) || 0) + 1);
    });

    let currentLevel = flowchart.nodes
      .filter((n) => n.type === 'start' || (incomingEdgeCount.get(n.id) || 0) === 0)
      .map((n) => n.id);

    if (currentLevel.length === 0 && flowchart.nodes.length > 0) {
      currentLevel = [flowchart.nodes[0].id];
    }

    while (currentLevel.length > 0) {
      levels.push(currentLevel);
      currentLevel.forEach((id) => visited.add(id));

      const nextLevel: string[] = [];
      for (const id of currentLevel) {
        const outgoing = flowchart.edges.filter((e) => e.from === id);
        for (const edge of outgoing) {
          if (!visited.has(edge.to) && !nextLevel.includes(edge.to)) {
            nextLevel.push(edge.to);
          }
        }
      }
      currentLevel = nextLevel;
    }

    // Add unvisited nodes
    flowchart.nodes.forEach((n) => {
      if (!visited.has(n.id)) {
        levels.push([n.id]);
      }
    });

    const updatedNodes = flowchart.nodes.map((node) => {
      let levelIdx = levels.findIndex((lvl) => lvl.includes(node.id));
      if (levelIdx === -1) levelIdx = 0;
      const rankInLevel = levels[levelIdx].indexOf(node.id);
      const levelWidth = levels[levelIdx].length;

      const baseX = 300;
      const xSpacing = 240;
      const calculatedX = baseX + (rankInLevel - (levelWidth - 1) / 2) * xSpacing;
      const calculatedY = 60 + levelIdx * 125;

      return {
        ...node,
        x: calculatedX,
        y: calculatedY,
      };
    });

    setFlowchart((prev) => ({ ...prev, nodes: updatedNodes }));
  };

  // Node editing actions
  const handleOpenEdit = (node: FlowNode) => {
    setSelectedNodeId(node.id);
    setEditNodeData({ ...node });
    setIsEditingNode(true);
  };

  const handleSaveNodeEdit = () => {
    if (!selectedNodeId) return;
    setFlowchart((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === selectedNodeId ? { ...n, ...editNodeData } : n)),
    }));
    setIsEditingNode(false);
  };

  const handleDeleteNode = (id: string) => {
    setFlowchart((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== id),
      edges: prev.edges.filter((e) => e.from !== id && e.to !== id),
    }));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const handleAddNode = () => {
    const newId = `node_${Date.now().toString().slice(-4)}`;
    const newNode: FlowNode = {
      id: newId,
      label: 'New Process Step',
      type: 'process',
      description: 'Custom execution operation',
      x: 260,
      y: (flowchart.nodes[flowchart.nodes.length - 1]?.y || 100) + 110,
      stateVariable: 'customVar = true',
    };

    setFlowchart((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
    setSelectedNodeId(newId);
  };

  const handleCopyMermaid = () => {
    const code =
      flowchart.mermaid ||
      `graph TD\n` +
        flowchart.edges.map((e) => `  ${e.from} -->|${e.label || ''}| ${e.to}`).join('\n');
    navigator.clipboard.writeText(code);
    setCopiedMermaid(true);
    setTimeout(() => setCopiedMermaid(false), 2000);
  };

  const handleSave = () => {
    if (onSaveToDrive) {
      onSaveToDrive(flowchart);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    }
  };

  // Render node shape based on type
  const renderNodeShape = (node: FlowNode, isActiveSim: boolean) => {
    const isSelected = selectedNodeId === node.id;
    const width = 180;
    const height = 64;

    const getColors = () => {
      switch (node.type) {
        case 'start':
          return {
            fill: '#064e3b',
            stroke: '#10b981',
            text: '#a7f3d0',
            badge: 'Start',
            icon: Play,
          };
        case 'end':
          return {
            fill: '#4c0519',
            stroke: '#f43f5e',
            text: '#fecdd3',
            badge: 'Terminal',
            icon: ShieldCheck,
          };
        case 'decision':
          return {
            fill: '#451a03',
            stroke: '#f59e0b',
            text: '#fde68a',
            badge: 'Decision',
            icon: GitBranch,
          };
        case 'delay':
          return {
            fill: '#3b0764',
            stroke: '#a855f7',
            text: '#e9d5ff',
            badge: 'Delay/Queue',
            icon: Clock,
          };
        default:
          return {
            fill: '#0f172a',
            stroke: '#06b6d4',
            text: '#cffafe',
            badge: 'Process',
            icon: Layers,
          };
      }
    };

    const colors = getColors();
    const IconComponent = colors.icon;

    return (
      <g
        key={node.id}
        transform={`translate(${node.x - width / 2}, ${node.y - height / 2})`}
        onMouseDown={(e) => handleNodeMouseDown(e, node)}
        className="cursor-move select-none"
      >
        {/* Active glowing ring during execution simulation */}
        {isActiveSim && (
          <rect
            x="-4"
            y="-4"
            width={width + 8}
            height={height + 8}
            rx="12"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="3"
            className="animate-pulse"
          />
        )}

        {/* Node Body Card */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          rx={node.type === 'start' || node.type === 'end' ? '24' : '8'}
          fill={colors.fill}
          stroke={isSelected ? '#38bdf8' : colors.stroke}
          strokeWidth={isSelected ? '2.5' : '1.5'}
          className="transition-colors filter drop-shadow-md"
        />

        {/* Node Type Top Accent Tag */}
        <text
          x="12"
          y="18"
          fill={colors.text}
          fontSize="10"
          fontWeight="600"
          className="uppercase tracking-wider pointer-events-none"
        >
          {colors.badge}
        </text>

        {/* Main Action Label */}
        <text
          x="12"
          y="36"
          fill="#f8fafc"
          fontSize="12"
          fontWeight="600"
          className="pointer-events-none"
        >
          {node.label.length > 22 ? node.label.slice(0, 20) + '…' : node.label}
        </text>

        {/* State Variable Subtext */}
        {node.stateVariable && (
          <text
            x="12"
            y="52"
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
            className="pointer-events-none"
          >
            {node.stateVariable.length > 24 ? node.stateVariable.slice(0, 22) + '…' : node.stateVariable}
          </text>
        )}

        {/* Edit Button on hover/selected */}
        {isSelected && (
          <g
            transform={`translate(${width - 24}, 8)`}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(node);
            }}
            className="cursor-pointer"
          >
            <rect width="18" height="18" rx="4" fill="#0284c7" />
            <Edit3 x="3" y="3" width="12" height="12" color="#ffffff" />
          </g>
        )}
      </g>
    );
  };

  // Render directional bezier connector
  const renderEdge = (edge: FlowEdge) => {
    const fromNode = flowchart.nodes.find((n) => n.id === edge.from);
    const toNode = flowchart.nodes.find((n) => n.id === edge.to);
    if (!fromNode || !toNode) return null;

    const startX = fromNode.x;
    const startY = fromNode.y + 32;
    const endX = toNode.x;
    const endY = toNode.y - 32;

    const deltaY = endY - startY;
    const midY = startY + deltaY / 2;

    // Smooth Bezier path
    const pathD = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
    const midPointX = (startX + endX) / 2;
    const midPointY = (startY + endY) / 2;

    const isStepActive =
      activeSimNodeId === edge.to &&
      currentStepIndex > 0 &&
      flowchart.simulation?.steps[currentStepIndex - 1]?.nodeId === edge.from;

    return (
      <g key={edge.id} className="pointer-events-none">
        <path
          d={pathD}
          fill="none"
          stroke={isStepActive ? '#38bdf8' : '#475569'}
          strokeWidth={isStepActive ? '2.5' : '1.5'}
          strokeDasharray={isStepActive ? '6,3' : 'none'}
          markerEnd="url(#arrowhead)"
          className={isStepActive ? 'transition-all' : ''}
        />

        {edge.label && (
          <g transform={`translate(${midPointX}, ${midPointY})`}>
            <rect
              x="-40"
              y="-10"
              width="80"
              height="20"
              rx="4"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="1"
            />
            <text
              x="0"
              y="4"
              fill="#94a3b8"
              fontSize="10"
              textAnchor="middle"
              className="font-medium"
            >
              {edge.label.length > 14 ? edge.label.slice(0, 13) + '…' : edge.label}
            </text>
          </g>
        )}
      </g>
    );
  };

  const presetPrompts = [
    'Adaptive Multi-Factor Authentication Flow',
    'High-Concurrency Order Settlement Pipeline',
    'Microservices Circuit Breaker & Retry Strategy',
    'Autonomous KYC Customer Risk Evaluation',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-61px)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Controls & Prompt Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm flex flex-col gap-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-cyan-400" />
              <span>{flowchart.title}</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">{flowchart.description}</p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoArrange}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              Auto-Align
            </button>
            <button
              onClick={handleAddNode}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Step</span>
            </button>
            <button
              onClick={handleCopyMermaid}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              {copiedMermaid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMermaid ? 'Copied' : 'Mermaid'}</span>
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

        {/* AI Prompt Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="Prompt AI to generate any workflow (e.g. Distributed Saga Orchestrator, User Onboarding, Refund Approval)..."
              className="w-full px-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating || !promptInput.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Synthesizing...' : 'Generate with AI'}</span>
          </button>
        </div>

        {/* Preset quick pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-400">
          <span className="text-[11px] text-slate-500 shrink-0 font-medium">Quick Presets:</span>
          {presetPrompts.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setPromptInput(preset);
                handleGenerate(preset);
              }}
              className="px-2.5 py-1 text-[11px] bg-slate-800/80 hover:bg-slate-800 hover:text-cyan-300 border border-slate-700/60 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {preset}
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

      {/* Main Interactive Canvas Area */}
      <div className="relative flex-1 overflow-hidden bg-slate-950 canvas-grid-pattern">
        {/* Floating Simulation Controls */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800/90 rounded-xl shadow-lg backdrop-blur-md">
          <button
            onClick={() => {
              if (isSimulating) {
                setIsSimulating(false);
              } else {
                if (currentStepIndex >= (flowchart.simulation?.steps.length || 1) - 1) {
                  setCurrentStepIndex(0);
                }
                setIsSimulating(true);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              isSimulating
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isSimulating ? 'Pause' : 'Run Simulation'}</span>
          </button>

          <button
            onClick={() => {
              const maxSteps = (flowchart.simulation?.steps.length || 1) - 1;
              setCurrentStepIndex((prev) => (prev < maxSteps ? prev + 1 : 0));
            }}
            disabled={isSimulating}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
            title="Step Forward"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setIsSimulating(false);
              setCurrentStepIndex(0);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          <div className="flex items-center gap-1 text-[11px] text-slate-400 px-2 font-mono tabular-nums">
            <span>Step</span>
            <span className="text-cyan-400 font-bold">{currentStepIndex + 1}</span>
            <span>/</span>
            <span>{flowchart.simulation?.steps.length || flowchart.nodes.length}</span>
          </div>
        </div>

        {/* Floating Zoom & Viewport Tools */}
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg backdrop-blur-md">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono tabular-nums px-2 text-slate-400">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 40, y: 30 });
            }}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Live Step Execution Ticker Box */}
        {activeSimulationStep && (
          <div className="absolute bottom-4 left-4 z-10 max-w-md p-3 bg-slate-900/95 border border-cyan-800/80 rounded-xl shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                Simulating Step {activeSimulationStep.stepIndex}
              </span>
              <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                Node ID: {activeSimulationStep.nodeId}
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-100 mb-1">
              {activeSimulationStep.actionDescription}
            </div>
            <div className="text-[11px] font-mono bg-slate-950 p-1.5 rounded border border-slate-800 text-cyan-300">
              {activeSimulationStep.stateSummary}
            </div>
          </div>
        )}

        {/* SVG Canvas */}
        <svg
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#64748b" />
            </marker>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Draw Connecting Edges */}
            {flowchart.edges.map(renderEdge)}

            {/* Draw Interactive Nodes */}
            {flowchart.nodes.map((node) => renderNodeShape(node, activeSimNodeId === node.id))}
          </g>
        </svg>
      </div>

      {/* Edit Node Modal */}
      {isEditingNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>Edit Workflow Step</span>
              </h3>
              <button
                onClick={() => setIsEditingNode(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-slate-400 mb-1 block">Step Label / Action</label>
                <input
                  type="text"
                  value={editNodeData.label || ''}
                  onChange={(e) => setEditNodeData({ ...editNodeData, label: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 mb-1 block">Step Type</label>
                <select
                  value={editNodeData.type || 'process'}
                  onChange={(e) => setEditNodeData({ ...editNodeData, type: e.target.value as FlowNodeType })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="start">Start (Ingress / Trigger)</option>
                  <option value="process">Process (Computation / Execution)</option>
                  <option value="decision">Decision (Branching Condition)</option>
                  <option value="delay">Delay / Queue</option>
                  <option value="end">End (Terminal State)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 mb-1 block">Description</label>
                <textarea
                  rows={2}
                  value={editNodeData.description || ''}
                  onChange={(e) => setEditNodeData({ ...editNodeData, description: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 mb-1 block">State Variable Mutation</label>
                <input
                  type="text"
                  value={editNodeData.stateVariable || ''}
                  onChange={(e) => setEditNodeData({ ...editNodeData, stateVariable: e.target.value })}
                  placeholder="e.g. status = 'AUTHENTICATED'"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  if (selectedNodeId) handleDeleteNode(selectedNodeId);
                  setIsEditingNode(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Step</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingNode(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNodeEdit}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
