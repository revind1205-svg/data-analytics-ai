import React, { useState } from 'react';
import { TopBar } from './components/TopBar';
import { FlowchartEditor } from './components/flowchart/FlowchartEditor';
import { StructureStudio } from './components/structure/StructureStudio';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { AIDriveStorage } from './components/drive/AIDriveStorage';
import { ThreeTopologyScene } from './components/three/ThreeTopologyScene';
import { LiveVoiceModal } from './components/voice/LiveVoiceModal';
import { GeminiChatbotDrawer } from './components/ai/GeminiChatbotDrawer';
import { NeuralMeshTourLanding } from './components/tour/NeuralMeshTourLanding';
import { 
  ActiveModule, 
  FlowchartData, 
  StructureData, 
  Dataset, 
  DriveFile 
} from './types';
import { 
  STARTER_FLOWCHARTS, 
  STARTER_STRUCTURES, 
  STARTER_DATASETS, 
  STARTER_DRIVE_FILES 
} from './data/mockData';

export default function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('tour');

  // Shared application state across tools
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>(STARTER_DRIVE_FILES);
  const [currentFlowchart, setCurrentFlowchart] = useState<FlowchartData>(STARTER_FLOWCHARTS[0]);
  const [currentStructure, setCurrentStructure] = useState<StructureData>(STARTER_STRUCTURES[0]);
  const [currentDataset, setCurrentDataset] = useState<Dataset>(STARTER_DATASETS[0]);

  // Voice & Chatbot Modal/Drawer states
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Save Flowchart to Drive
  const handleSaveFlowchartToDrive = (flowchart: FlowchartData) => {
    const existingIdx = driveFiles.findIndex(
      (f) => f.data?.id === flowchart.id || f.name.toLowerCase().includes(flowchart.title.toLowerCase().slice(0, 10))
    );
    const fileName = `${flowchart.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;

    const newFile: DriveFile = {
      id: flowchart.id || `file_fc_${Date.now()}`,
      name: fileName,
      path: '/Flowcharts',
      type: 'flowchart',
      sizeBytes: JSON.stringify(flowchart).length,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      tags: [flowchart.category || 'Architecture', 'AI Generated', 'Flowchart'],
      data: flowchart,
      summary: flowchart.description || 'Flowchart process pipeline',
    };

    if (existingIdx !== -1) {
      setDriveFiles((prev) => {
        const copy = [...prev];
        copy[existingIdx] = newFile;
        return copy;
      });
      showToast(`Updated "${fileName}" in AI Drive`);
    } else {
      setDriveFiles((prev) => [newFile, ...prev]);
      showToast(`Saved "${fileName}" to AI Drive /Flowcharts`);
    }
  };

  // 2. Save Structure to Drive
  const handleSaveStructureToDrive = (structure: StructureData) => {
    const fileName = `${structure.title.replace(/[^a-zA-Z0-9]/g, '_')}.${structure.type === 'relational' ? 'sql' : 'json'}`;
    const newFile: DriveFile = {
      id: structure.id || `file_str_${Date.now()}`,
      name: fileName,
      path: '/Schemas',
      type: 'structure',
      sizeBytes: JSON.stringify(structure).length,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      tags: [structure.type.toUpperCase(), 'Database', 'Schema'],
      data: structure,
      summary: structure.description || 'Data structure architectural model',
    };

    setDriveFiles((prev) => [newFile, ...prev]);
    showToast(`Saved "${fileName}" to AI Drive /Schemas`);
  };

  // 3. Save Analytics Report to Drive
  const handleSaveReportToDrive = (reportData: any) => {
    const fileName = `Audit_${Date.now().toString().slice(-4)}.json`;
    const newFile: DriveFile = {
      id: `file_rep_${Date.now()}`,
      name: fileName,
      path: '/Reports',
      type: 'report',
      sizeBytes: JSON.stringify(reportData).length,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      tags: ['Audit', 'Analytics', 'Telemetry'],
      data: reportData,
      summary: reportData.analysis?.summary || 'Executive telemetry audit and anomaly detection',
    };

    setDriveFiles((prev) => [newFile, ...prev]);
    showToast(`Saved "${fileName}" to AI Drive /Reports`);
  };

  // Open File from Drive directly into appropriate Studio module
  const handleOpenFileFromDrive = (file: DriveFile, targetModule: ActiveModule) => {
    if (targetModule === 'flowchart' && file.data) {
      setCurrentFlowchart(file.data);
      setActiveModule('flowchart');
      showToast(`Opened "${file.name}" in Flowchart Studio`);
    } else if (targetModule === 'structure' && file.data) {
      setCurrentStructure(file.data);
      setActiveModule('structure');
      showToast(`Opened "${file.name}" in Structure Studio`);
    } else if (targetModule === 'dashboard' && file.data) {
      setCurrentDataset(file.data);
      setActiveModule('dashboard');
      showToast(`Loaded "${file.name}" into Analytics Dashboard`);
    }
  };

  // Delete File
  const handleDeleteDriveFile = (id: string) => {
    setDriveFiles((prev) => prev.filter((f) => f.id !== id));
    showToast('File removed from storage');
  };

  // Upload File
  const handleUploadDriveFile = (newFile: DriveFile) => {
    setDriveFiles((prev) => [newFile, ...prev]);
    showToast(`Uploaded "${newFile.name}" to AI Drive`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract Navigation */}
      <TopBar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        onQuickCreate={(module) => setActiveModule(module)}
        onOpenVoice={() => setIsVoiceModalOpen(true)}
        onOpenChat={() => setIsChatbotOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2 bg-cyan-950 border border-cyan-800 text-cyan-200 text-xs font-semibold rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Module Viewport */}
      <main className="flex-1 overflow-hidden">
        {activeModule === 'tour' && (
          <NeuralMeshTourLanding
            onExploreStudio={() => setActiveModule('flowchart')}
          />
        )}

        {activeModule === 'flowchart' && (
          <FlowchartEditor
            initialData={currentFlowchart}
            onSaveToDrive={handleSaveFlowchartToDrive}
          />
        )}

        {activeModule === 'structure' && (
          <StructureStudio
            initialData={currentStructure}
            onSaveToDrive={handleSaveStructureToDrive}
          />
        )}

        {activeModule === 'dashboard' && (
          <AnalyticsDashboard
            initialDataset={currentDataset}
            onSaveToDrive={handleSaveReportToDrive}
          />
        )}

        {activeModule === 'drive' && (
          <AIDriveStorage
            files={driveFiles}
            onOpenFile={handleOpenFileFromDrive}
            onDeleteFile={handleDeleteDriveFile}
            onUploadFile={handleUploadDriveFile}
          />
        )}

        {activeModule === 'topology' && (
          <ThreeTopologyScene
            onBackToStudio={() => setActiveModule('flowchart')}
          />
        )}
      </main>

      {/* Gemini Live Voice Conversation Modal (gemini-3.8-live) */}
      <LiveVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />

      {/* Gemini Multi-Turn Chatbot Drawer with Search & Maps Grounding & Audio Transcription */}
      <GeminiChatbotDrawer
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
      />
    </div>
  );
}
