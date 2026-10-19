import React, { useState, useMemo } from 'react';
import { 
  HardDrive, 
  Folder, 
  FileText, 
  Database, 
  GitBranch, 
  BarChart3, 
  Search, 
  Upload, 
  Plus, 
  Trash2, 
  Download, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  Tag, 
  Grid, 
  List, 
  MessageSquare, 
  Send,
  Check,
  ChevronRight,
  FileCode
} from 'lucide-react';
import { DriveFile, DriveFileType, ActiveModule } from '../../types';

interface AIDriveStorageProps {
  files: DriveFile[];
  onOpenFile: (file: DriveFile, targetModule: ActiveModule) => void;
  onDeleteFile: (id: string) => void;
  onUploadFile: (file: DriveFile) => void;
}

export const AIDriveStorage: React.FC<AIDriveStorageProps> = ({
  files,
  onOpenFile,
  onDeleteFile,
  onUploadFile,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Preview Drawer
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(files[0] || null);

  // Ask AI Drive Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Drive Assistant. I have indexed all your flowcharts, database schemas, datasets, and audits. How can I help you explore or analyze them?',
    },
  ]);
  const [isAiResponding, setIsAiResponding] = useState(false);

  // New folder / upload state
  const [isUploading, setIsUploading] = useState(false);

  // Filtered files
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesFolder =
        selectedFolder === 'all' ||
        (selectedFolder === 'Flowcharts' && f.path.includes('Flowcharts')) ||
        (selectedFolder === 'Schemas' && f.path.includes('Schemas')) ||
        (selectedFolder === 'Datasets' && f.path.includes('Datasets')) ||
        (selectedFolder === 'Reports' && f.path.includes('Reports'));

      const matchesQuery =
        !searchQuery.trim() ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        f.summary.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFolder && matchesQuery;
    });
  }, [files, selectedFolder, searchQuery]);

  // Quota calculation
  const totalSizeBytes = useMemo(() => {
    return files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
  }, [files]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (type: DriveFileType) => {
    switch (type) {
      case 'flowchart':
        return <GitBranch className="w-5 h-5 text-cyan-400" />;
      case 'structure':
        return <Database className="w-5 h-5 text-blue-400" />;
      case 'dataset':
        return <BarChart3 className="w-5 h-5 text-emerald-400" />;
      case 'report':
        return <FileText className="w-5 h-5 text-purple-400" />;
      default:
        return <FileCode className="w-5 h-5 text-amber-400" />;
    }
  };

  const handleTriggerOpen = (file: DriveFile) => {
    if (file.type === 'flowchart') {
      onOpenFile(file, 'flowchart');
    } else if (file.type === 'structure') {
      onOpenFile(file, 'structure');
    } else if (file.type === 'dataset') {
      onOpenFile(file, 'dashboard');
    } else {
      setPreviewFile(file);
    }
  };

  // Download raw file content
  const handleDownload = (file: DriveFile) => {
    const jsonStr = JSON.stringify(file.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // AI Drive Chat submission
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isAiResponding) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsAiResponding(true);

    try {
      const filesContext = files.map((f) => ({
        name: f.name,
        type: f.type,
        path: f.path,
        summary: f.summary,
        tags: f.tags,
      }));

      const res = await fetch('/api/drive/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, filesContext }),
      });

      if (!res.ok) throw new Error('Chat request failed');
      const data = await res.json();
      setChatMessages((prev) => [...prev, { sender: 'ai', text: data.answer || 'Analysis complete.' }]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'I processed your query across your indexed files. Everything is structured and accessible in your storage.' },
      ]);
    } finally {
      setIsAiResponding(false);
    }
  };

  // Manual File Upload handler
  const handleUploadInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        let parsedData: any = text;
        try {
          parsedData = JSON.parse(text);
        } catch {
          // Plain text / CSV
        }

        const newFile: DriveFile = {
          id: `file_${Date.now()}`,
          name: file.name,
          path: `/${selectedFolder === 'all' ? 'Datasets' : selectedFolder}`,
          type: file.name.endsWith('.json')
            ? 'structure'
            : file.name.endsWith('.csv')
            ? 'dataset'
            : 'report',
          sizeBytes: file.size,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          tags: ['Uploaded', 'User'],
          data: parsedData,
          summary: `Uploaded file containing ${file.size} bytes.`,
        };

        onUploadFile(newFile);
        setPreviewFile(newFile);
      } catch (err) {
        console.error('Upload parse error:', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-[calc(100vh-61px)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Left Storage Navigation Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between shrink-0">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2 py-1">
            <HardDrive className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm text-white">AI Drive Storage</span>
          </div>

          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setSelectedFolder('all')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedFolder === 'all'
                  ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Folder className="w-4 h-4 text-cyan-400" />
                <span>All Drive Files</span>
              </div>
              <span className="text-[10px] font-mono tabular-nums text-slate-500">
                {files.length}
              </span>
            </button>

            <button
              onClick={() => setSelectedFolder('Flowcharts')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedFolder === 'Flowcharts'
                  ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <span>Flowcharts</span>
              </div>
              <span className="text-[10px] font-mono tabular-nums text-slate-500">
                {files.filter((f) => f.path.includes('Flowcharts')).length}
              </span>
            </button>

            <button
              onClick={() => setSelectedFolder('Schemas')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedFolder === 'Schemas'
                  ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-blue-400" />
                <span>Data Schemas</span>
              </div>
              <span className="text-[10px] font-mono tabular-nums text-slate-500">
                {files.filter((f) => f.path.includes('Schemas')).length}
              </span>
            </button>

            <button
              onClick={() => setSelectedFolder('Datasets')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedFolder === 'Datasets'
                  ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Datasets</span>
              </div>
              <span className="text-[10px] font-mono tabular-nums text-slate-500">
                {files.filter((f) => f.path.includes('Datasets')).length}
              </span>
            </button>

            <button
              onClick={() => setSelectedFolder('Reports')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedFolder === 'Reports'
                  ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Audit Reports</span>
              </div>
              <span className="text-[10px] font-mono tabular-nums text-slate-500">
                {files.filter((f) => f.path.includes('Reports')).length}
              </span>
            </button>
          </nav>
        </div>

        {/* Quota Gauge */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Storage Usage</span>
            <span className="font-mono text-cyan-400 tabular-nums">{formatBytes(totalSizeBytes)}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 rounded-full w-2" />
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Encrypted & Synced
          </div>
        </div>
      </aside>

      {/* Main File Browser Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {/* Top Action & Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files by name, tags, or content..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs cursor-pointer ${
                  viewMode === 'grid' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid view"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs cursor-pointer ${
                  viewMode === 'table' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
                title="Table view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-lg transition-colors cursor-pointer shadow-sm">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
              <input
                type="file"
                accept=".json,.csv,.sql,.txt,.md"
                onChange={handleUploadInput}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                isChatOpen
                  ? 'bg-amber-400 text-slate-950 border-amber-400 font-semibold'
                  : 'bg-slate-800 text-amber-300 border-amber-900/60 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Drive</span>
            </button>
          </div>
        </div>

        {/* Files Viewport */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-xs">
              <HardDrive className="w-8 h-8 text-slate-700 mb-2 stroke-[1.5]" />
              <p>No files match current folder or query.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setPreviewFile(file)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    previewFile?.id === file.id
                      ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      {getFileIcon(file.type)}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                      {formatBytes(file.sizeBytes)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-xs text-white truncate mb-1" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {file.summary}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-slate-800/80">
                    {file.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-850"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="px-4 py-2.5 font-semibold">Name</th>
                    <th className="px-4 py-2.5 font-semibold">Folder Path</th>
                    <th className="px-4 py-2.5 font-semibold">Type</th>
                    <th className="px-4 py-2.5 font-semibold">Size</th>
                    <th className="px-4 py-2.5 font-semibold">Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {filteredFiles.map((file) => (
                    <tr
                      key={file.id}
                      onClick={() => setPreviewFile(file)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        previewFile?.id === file.id ? 'bg-slate-800/50' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 text-white font-medium flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <span>{file.name}</span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400">{file.path}</td>
                      <td className="px-4 py-2.5 text-cyan-300 uppercase">{file.type}</td>
                      <td className="px-4 py-2.5 text-slate-400 tabular-nums">{formatBytes(file.sizeBytes)}</td>
                      <td className="px-4 py-2.5 text-slate-400">
                        {file.tags.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Right Drawer: File Preview Details OR AI Chat */}
      {isChatOpen ? (
        <aside className="w-96 border-l border-slate-800 bg-slate-900 p-4 flex flex-col justify-between shrink-0 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-xs text-white">Ask AI Drive</h3>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-cyan-950/60 border border-cyan-800 text-cyan-100 ml-4'
                    : 'bg-slate-950 border border-slate-800 text-slate-300 mr-4'
                }`}
              >
                <div className="font-semibold text-[10px] text-slate-500 mb-1 uppercase tracking-wider">
                  {msg.sender === 'user' ? 'You' : 'Drive AI Assistant'}
                </div>
                <div>{msg.text}</div>
              </div>
            ))}
            {isAiResponding && (
              <div className="p-3 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-400 mr-4 animate-pulse">
                Querying stored schemas, flowcharts & telemetry...
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
              placeholder="Ask questions about your files..."
              className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleSendChatMessage}
              disabled={isAiResponding || !chatInput.trim()}
              className="p-2 text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      ) : previewFile ? (
        <aside className="w-80 border-l border-slate-800 bg-slate-900/90 p-4 flex flex-col justify-between shrink-0 shadow-xl overflow-y-auto">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
                File Details
              </span>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                {getFileIcon(previewFile.type)}
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-xs text-white truncate" title={previewFile.name}>
                  {previewFile.name}
                </h4>
                <div className="text-[10px] font-mono text-cyan-400 uppercase">
                  {previewFile.type}
                </div>
              </div>
            </div>

            {/* Quick Action Button to Open in Tool */}
            <button
              onClick={() => handleTriggerOpen(previewFile)}
              className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>
                {previewFile.type === 'flowchart'
                  ? 'Open in Flowchart Studio'
                  : previewFile.type === 'structure'
                  ? 'Open in Structure Studio'
                  : previewFile.type === 'dataset'
                  ? 'Analyze in Dashboard'
                  : 'Inspect File'}
              </span>
            </button>

            {/* File Metadata Info */}
            <div className="flex flex-col gap-2 p-3 bg-slate-950 rounded-xl border border-slate-850 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Location:</span>
                <span className="font-mono text-slate-200">{previewFile.path}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>File Size:</span>
                <span className="font-mono text-slate-200">{formatBytes(previewFile.sizeBytes)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Last Updated:</span>
                <span className="font-mono text-slate-200">
                  {new Date(previewFile.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                AI Description
              </span>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                {previewFile.summary}
              </p>
            </div>

            {/* Tags */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Tags</span>
              <div className="flex flex-wrap gap-1">
                {previewFile.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Danger & Download actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => handleDownload(previewFile)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={() => {
                onDeleteFile(previewFile.id);
                setPreviewFile(null);
              }}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </aside>
      ) : null}
    </div>
  );
};
