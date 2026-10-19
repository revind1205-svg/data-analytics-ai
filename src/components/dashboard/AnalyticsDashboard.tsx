import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Upload, 
  Save, 
  Download, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  FileSpreadsheet,
  Check,
  RefreshCw
} from 'lucide-react';
import { Dataset, AnalysisReport } from '../../types';
import { STARTER_DATASETS } from '../../data/mockData';

interface AnalyticsDashboardProps {
  initialDataset?: Dataset;
  onSaveToDrive?: (reportData: any) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  initialDataset,
  onSaveToDrive,
}) => {
  const [datasets, setDatasets] = useState<Dataset[]>(STARTER_DATASETS);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(initialDataset?.id || STARTER_DATASETS[0].id);

  // Active dataset
  const activeDataset = useMemo(() => {
    return datasets.find((d) => d.id === selectedDatasetId) || datasets[0];
  }, [datasets, selectedDatasetId]);

  // AI Analysis state
  const [analysis, setAnalysis] = useState<AnalysisReport>(activeDataset.analysis || {
    summary: 'Dataset loaded and verified.',
    kpis: activeDataset.metrics,
    anomalies: [],
    correlations: [],
    takeaways: ['Data conforms to expected bounds.'],
  });

  const [aiQuery, setAiQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Search & Filter in Table
  const [tableSearch, setTableSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<string>(activeDataset.columns[0]);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Chart hover state
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ label: string; value: number } | null>(null);

  // Run AI Analysis
  const handleRunAnalysis = async (customQuery?: string) => {
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analytics/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetSummary: {
            name: activeDataset.name,
            columns: activeDataset.columns,
            totalRows: activeDataset.rows.length,
          },
          rows: activeDataset.rows,
          query: customQuery || aiQuery,
        }),
      });

      if (!response.ok) throw new Error('Analysis query failed');

      const data: AnalysisReport = await response.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle custom CSV / JSON upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          const rows = Array.isArray(parsed) ? parsed : [parsed];
          const cols = Object.keys(rows[0] || {});
          const newDataset: Dataset = {
            id: `ds_${Date.now()}`,
            name: file.name.replace('.json', ''),
            description: `Imported JSON dataset with ${rows.length} records.`,
            category: 'User Upload',
            columns: cols,
            rows,
            metrics: [
              { label: 'Total Rows', value: String(rows.length), delta: '+100%', trend: 'up' },
              { label: 'Fields Count', value: String(cols.length), delta: '0', trend: 'neutral' },
            ],
          };
          setDatasets((prev) => [newDataset, ...prev]);
          setSelectedDatasetId(newDataset.id);
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n').filter((l) => l.trim().length > 0);
          const cols = lines[0].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          const rows = lines.slice(1).map((line) => {
            const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
            const obj: Record<string, any> = {};
            cols.forEach((c, idx) => {
              const num = Number(vals[idx]);
              obj[c] = isNaN(num) ? vals[idx] : num;
            });
            return obj;
          });

          const newDataset: Dataset = {
            id: `ds_${Date.now()}`,
            name: file.name.replace('.csv', ''),
            description: `Imported CSV dataset with ${rows.length} rows.`,
            category: 'User Upload',
            columns: cols,
            rows,
            metrics: [
              { label: 'Total Rows', value: String(rows.length), delta: '+100%', trend: 'up' },
              { label: 'Columns', value: String(cols.length), delta: '0', trend: 'neutral' },
            ],
          };
          setDatasets((prev) => [newDataset, ...prev]);
          setSelectedDatasetId(newDataset.id);
        }
      } catch (err) {
        console.error('File parse error:', err);
      }
    };
    reader.readAsText(file);
  };

  // Filter & sort rows
  const filteredRows = useMemo(() => {
    let result = [...activeDataset.rows];

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    return result;
  }, [activeDataset.rows, tableSearch, sortColumn, sortDirection]);

  // Handle Save to Drive
  const handleSaveReport = () => {
    if (onSaveToDrive) {
      const reportFile = {
        title: `${activeDataset.name} - Automated AI Audit`,
        datasetId: activeDataset.id,
        analysis,
        exportedAt: new Date().toISOString(),
      };
      onSaveToDrive(reportFile);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    }
  };

  // Chart Calculation: Area Trend Chart
  const trendData = useMemo(() => {
    const rows = activeDataset.rows;
    if (rows.length === 0) return [];

    // Find first numeric column
    const numCol = activeDataset.columns.find((c) => typeof rows[0][c] === 'number') || activeDataset.columns[1];
    const labelCol = activeDataset.columns[0];

    return rows.map((r) => ({
      label: String(r[labelCol]),
      value: Number(r[numCol]) || 0,
    }));
  }, [activeDataset]);

  const maxVal = Math.max(...trendData.map((d) => d.value), 1);
  const minVal = Math.min(...trendData.map((d) => d.value), 0);

  // SVG Area path generator
  const areaPathD = useMemo(() => {
    if (trendData.length < 2) return '';
    const width = 600;
    const height = 180;
    const paddingX = 40;
    const paddingY = 20;

    const points = trendData.map((d, i) => {
      const x = paddingX + (i / (trendData.length - 1)) * (width - paddingX * 2);
      const y = height - paddingY - ((d.value - minVal) / (maxVal - minVal || 1)) * (height - paddingY * 2);
      return { x, y };
    });

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    let d = `M ${firstPoint.x} ${firstPoint.y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      d += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const closedPath = `${d} L ${lastPoint.x} ${height - paddingY} L ${firstPoint.x} ${height - paddingY} Z`;
    return { strokePath: d, fillPath: closedPath, points };
  }, [trendData, maxVal, minVal]);

  return (
    <div className="flex flex-col h-[calc(100vh-61px)] bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Top Header & Dataset Selector */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm flex flex-col gap-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <span>{activeDataset.name}</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">{activeDataset.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors whitespace-nowrap cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV / JSON</span>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={handleSaveReport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              {savedFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{savedFeedback ? 'Saved to Drive' : 'Save Audit'}</span>
            </button>
          </div>
        </div>

        {/* Dataset switch bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-500 font-medium shrink-0">Active Telemetry:</span>
          {datasets.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDatasetId(d.id);
                if (d.analysis) setAnalysis(d.analysis);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                d.id === selectedDatasetId
                  ? 'bg-slate-800 text-cyan-300 border-cyan-800 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Analytics Content Container */}
      <div className="p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(analysis?.kpis || activeDataset.metrics).map((kpi, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{kpi.label}</span>
                <span className={`flex items-center text-[11px] font-mono font-semibold ${
                  kpi.trend === 'up' ? 'text-emerald-400' : kpi.trend === 'down' ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {kpi.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : kpi.trend === 'down' ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
                  {kpi.delta}
                </span>
              </div>
              <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
                {kpi.value}
              </div>
              {kpi.insight && (
                <div className="text-[11px] text-slate-400">
                  {kpi.insight}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* RR Data Analysis AI Strategic Insights & Anomaly Panel */}
        <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl flex flex-col gap-4 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-300 font-bold text-[10px]">
                RR
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                RR Data Analysis AI · Deep-Dive & Anomaly Engine
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunAnalysis()}
                placeholder="Ask this dataset a specific question..."
                className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 w-64 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleRunAnalysis()}
                disabled={isAnalyzing}
                className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
              >
                {isAnalyzing ? 'Analyzing...' : 'Ask AI'}
              </button>
            </div>
          </div>

          {/* Executive Summary */}
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-850">
            {analysis.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Anomalies Detected */}
            <div className="flex flex-col gap-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Anomalies & Variance Detection</span>
              </div>
              <div className="flex flex-col gap-2">
                {analysis.anomalies.length > 0 ? (
                  analysis.anomalies.map((anom, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{anom.metric}</span>
                        <span className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded border ${
                          anom.severity === 'high' ? 'bg-red-950 text-red-300 border-red-800' : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}>
                          {anom.severity} priority
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{anom.description}</p>
                      <div className="text-[11px] text-cyan-300 font-medium">
                        Action: {anom.recommendedAction}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-slate-500 py-2">
                    No critical statistical anomalies detected within current threshold.
                  </div>
                )}
              </div>
            </div>

            {/* Strategic Takeaways */}
            <div className="flex flex-col gap-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Strategic Recommendations</span>
              </div>
              <div className="flex flex-col gap-2">
                {analysis.takeaways.map((takeaway, idx) => (
                  <div key={idx} className="p-2 bg-slate-900 rounded-lg border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-cyan-400 font-bold font-mono">0{idx + 1}.</span>
                    <span>{takeaway}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Visual Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Area Chart */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Timeline Progression & Velocity
                </h3>
                <span className="text-[11px] text-slate-400">
                  {trendData.length} observation windows recorded
                </span>
              </div>

              {hoveredDataPoint && (
                <div className="text-xs font-mono text-cyan-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {hoveredDataPoint.label}: {hoveredDataPoint.value.toLocaleString()}
                </div>
              )}
            </div>

            <div className="w-full h-52 relative flex items-center justify-center">
              {areaPathD && (
                <svg viewBox="0 0 600 180" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="40" y1="20" x2="560" y2="20" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="40" y1="90" x2="560" y2="90" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="40" y1="160" x2="560" y2="160" stroke="#334155" />

                  {/* Shaded Area */}
                  <path d={areaPathD.fillPath} fill="url(#areaGradient)" />

                  {/* Curve Stroke */}
                  <path d={areaPathD.strokePath} fill="none" stroke="#22d3ee" strokeWidth="2.5" />

                  {/* Interactive Points */}
                  {areaPathD.points.map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      className="hover:r-6 cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredDataPoint(trendData[i])}
                      onMouseLeave={() => setHoveredDataPoint(null)}
                    />
                  ))}
                </svg>
              )}
            </div>
          </div>

          {/* Categorical Bar Distribution Chart */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Binned Distribution & Capacity
                </h3>
                <span className="text-[11px] text-slate-400">Cohort relative breakdown</span>
              </div>
            </div>

            <div className="w-full h-52 flex items-end gap-2 px-4 pb-2 pt-6">
              {trendData.slice(0, 8).map((item, idx) => {
                const heightPct = Math.max(12, Math.round(((item.value - minVal) / (maxVal - minVal || 1)) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="text-[10px] font-mono text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.value > 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value}
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full rounded-t-md bg-gradient-to-t from-cyan-600 to-blue-500 hover:from-cyan-400 hover:to-blue-400 transition-all duration-200"
                    />
                    <span className="text-[10px] font-mono text-slate-400 truncate w-full text-center">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tabular Dataset Explorer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 bg-slate-850/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">Tabular Records Explorer</span>
              <span className="text-[11px] text-slate-500 font-mono">
                ({filteredRows.length} of {activeDataset.rows.length} rows)
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search rows or values..."
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  {activeDataset.columns.map((col) => (
                    <th
                      key={col}
                      onClick={() => {
                        if (sortColumn === col) {
                          setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
                        } else {
                          setSortColumn(col);
                          setSortDirection('asc');
                        }
                      }}
                      className="px-4 py-3 font-semibold cursor-pointer hover:text-white select-none whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col}</span>
                        {sortColumn === col && (
                          <span className="text-cyan-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    {activeDataset.columns.map((col) => {
                      const val = row[col];
                      const isNum = typeof val === 'number';
                      return (
                        <td
                          key={col}
                          className={`px-4 py-2.5 whitespace-nowrap ${
                            isNum ? 'text-slate-200 tabular-nums' : 'text-slate-300'
                          }`}
                        >
                          {isNum ? val.toLocaleString() : String(val ?? '')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
