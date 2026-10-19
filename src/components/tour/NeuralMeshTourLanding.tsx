import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle2, 
  Cpu, 
  Activity, 
  Server, 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Maximize2,
  Volume2,
  VolumeX,
  RotateCcw,
  Check
} from 'lucide-react';

interface NeuralMeshTourLandingProps {
  onExploreStudio?: () => void;
}

export const NeuralMeshTourLanding: React.FC<NeuralMeshTourLandingProps> = ({ onExploreStudio }) => {
  const [formData, setFormData] = useState({
    businessEmail: '',
    lastName: '',
    firstName: '',
    companyName: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(24); // percentage
  const [activeChapter, setActiveChapter] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.businessEmail.trim()) {
      errors.businessEmail = 'Business Email is required';
    } else if (!formData.businessEmail.includes('@')) {
      errors.businessEmail = 'Please provide a valid work email';
    }
    if (!formData.lastName.trim()) errors.lastName = 'Last Name is required';
    if (!formData.firstName.trim()) errors.firstName = 'First Name is required';
    if (!formData.companyName.trim()) errors.companyName = 'Company Name is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsUnlocked(true);
    setIsPlayingVideo(true);
  };

  const chapters = [
    { id: 1, title: '01. Zero-Copy I/O Pipeline & NVMe-oF', duration: '2:40' },
    { id: 2, title: '02. Sustaining 93% GPU Saturation on H100s', duration: '3:15' },
    { id: 3, title: '03. Token Cost Reduction & Telemetry Audit', duration: '4:05' },
  ];

  return (
    <div className="relative min-h-[calc(100vh-61px)] bg-[#070913] text-slate-100 overflow-x-hidden selection:bg-purple-500/30 selection:text-purple-200">
      {/* Background ambient neon radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-purple-600/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Hero Section */}
      <div className="relative pt-12 pb-8 px-6 max-w-5xl mx-auto flex flex-col items-center text-center z-10">
        {/* Tagline: Small, uppercase accent text centered at the top */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 mb-4 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            10-MINUTE GUIDED VIDEO
          </span>
        </div>

        {/* Main Headline: Centered, bold, white heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.12] mb-5">
          Take the NeuralMesh Product Tour.
        </h1>

        {/* Subheadline: Centered, muted gray descriptive text */}
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          See exactly how AI teams push GPU utilization up to 93% and cut the cost of every token, without re-architecting their stack.
        </p>
      </div>

      {/* Interactive Form Card & Background Preview Section */}
      <div className="relative max-w-5xl mx-auto px-6 pb-20 z-10">
        {/* Floating Neon Purple Glow Card */}
        <div className="relative mx-auto max-w-xl z-20">
          <div className="bg-slate-900/95 border border-purple-500/40 rounded-2xl p-7 md:p-8 shadow-[0_0_60px_rgba(168,85,247,0.3)] backdrop-blur-xl transition-all">
            {!isUnlocked ? (
              <>
                {/* Card Title */}
                <h2 className="text-xl md:text-2xl font-bold text-center text-white mb-6 tracking-tight">
                  Watch the Product Tour.
                </h2>

                {/* Form Grid: 2-column responsive grid */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Column 1: Business Email*, Last Name* */}
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Business Email<span className="text-purple-400">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.businessEmail}
                          onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                          placeholder="name@company.com"
                          className={`w-full px-3.5 py-2.5 text-xs bg-slate-950/90 border rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors ${
                            formErrors.businessEmail
                              ? 'border-rose-500 focus:border-rose-400'
                              : 'border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                          }`}
                        />
                        {formErrors.businessEmail && (
                          <span className="text-[11px] text-rose-400 mt-1 block">
                            {formErrors.businessEmail}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Last Name<span className="text-purple-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Smith"
                          className={`w-full px-3.5 py-2.5 text-xs bg-slate-950/90 border rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors ${
                            formErrors.lastName
                              ? 'border-rose-500 focus:border-rose-400'
                              : 'border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                          }`}
                        />
                        {formErrors.lastName && (
                          <span className="text-[11px] text-rose-400 mt-1 block">
                            {formErrors.lastName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Column 2: First Name*, Company Name* */}
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          First Name<span className="text-purple-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="Alex"
                          className={`w-full px-3.5 py-2.5 text-xs bg-slate-950/90 border rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors ${
                            formErrors.firstName
                              ? 'border-rose-500 focus:border-rose-400'
                              : 'border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                          }`}
                        />
                        {formErrors.firstName && (
                          <span className="text-[11px] text-rose-400 mt-1 block">
                            {formErrors.firstName}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Company Name<span className="text-purple-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          placeholder="Acme AI Labs"
                          className={`w-full px-3.5 py-2.5 text-xs bg-slate-950/90 border rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors ${
                            formErrors.companyName
                              ? 'border-rose-500 focus:border-rose-400'
                              : 'border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                          }`}
                        />
                        {formErrors.companyName && (
                          <span className="text-[11px] text-rose-400 mt-1 block">
                            {formErrors.companyName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Access 10-Minute Guided Tour</span>
                  </button>

                  <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                      Instant Access
                    </span>
                    <span>·</span>
                    <span>No Credit Card Required</span>
                  </div>
                </form>
              </>
            ) : (
              /* Unlocked Tour Interactive Video Player */
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold tracking-wider">
                      Tour Unlocked · Welcome {formData.firstName || 'Architect'}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      NeuralMesh Architecture Walkthrough
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsUnlocked(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Reset Form
                  </button>
                </div>

                {/* Simulated Guided Video Canvas */}
                <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col justify-between p-4 group">
                  {/* Top Video Overlay Bar */}
                  <div className="flex items-center justify-between text-xs z-10">
                    <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300 font-mono text-[10px]">
                      LIVE BENCHMARK DEMO
                    </span>
                    <span className="text-slate-400 font-mono text-[11px] tabular-nums">
                      {Math.floor((videoProgress / 100) * 10)}:24 / 10:00
                    </span>
                  </div>

                  {/* Center Video Content Mockup */}
                  <div className="flex flex-col items-center justify-center gap-2">
                    <button
                      onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                      className="w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 hover:scale-105 transition-transform cursor-pointer"
                    >
                      {isPlayingVideo ? <Check className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>
                    <span className="text-xs font-semibold text-white">
                      {chapters[activeChapter - 1]?.title}
                    </span>
                  </div>

                  {/* Bottom Video Progress Scrubber */}
                  <div className="flex flex-col gap-2 z-10">
                    <div
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                        setVideoProgress(Math.max(0, Math.min(100, pct)));
                      }}
                      className="w-full h-1.5 bg-slate-800 rounded-full cursor-pointer relative overflow-hidden"
                    >
                      <div
                        style={{ width: `${videoProgress}%` }}
                        className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Chapters selection */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Chapters:</span>
                  {chapters.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setActiveChapter(ch.id);
                        setVideoProgress(ch.id === 1 ? 15 : ch.id === 2 ? 45 : 80);
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        activeChapter === ch.id
                          ? 'bg-purple-950/60 border border-purple-800 text-purple-200'
                          : 'bg-slate-950/60 border border-slate-850 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{ch.title}</span>
                      <span className="font-mono text-[10px] text-slate-500">{ch.duration}</span>
                    </button>
                  ))}
                </div>

                {/* Explore Studio Action */}
                {onExploreStudio && (
                  <button
                    onClick={onExploreStudio}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1"
                  >
                    <span>Launch RR Data Analysis & Architecture Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Background Preview: Dimly lit, blurred mock application dashboard interface (NeuralMesh Observe) */}
        <div className="absolute top-28 inset-x-4 md:inset-x-0 z-0 pointer-events-none select-none">
          <div className="bg-slate-950/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl blur-[2px] opacity-40 transform scale-[0.98] transition-all">
            {/* Mock Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 font-bold text-xs">
                  NO
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">NeuralMesh Observe · Production Cluster</div>
                  <div className="text-[10px] text-slate-500 font-mono">16x NVIDIA H100 SXM5 · RoCE v2 Fabric</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-mono">
                  ACTIVE CLUSTER RUNNING
                </span>
              </div>
            </div>

            {/* Mock Telemetry Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">GPU Utilization</div>
                <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">93.4%</div>
                <div className="text-[10px] text-slate-500 font-mono">+38.2% vs Baseline</div>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Cluster Throughput</div>
                <div className="text-2xl font-bold font-mono text-purple-400 tabular-nums">3.8 TB/s</div>
                <div className="text-[10px] text-slate-500 font-mono">Zero-copy DirectStorage</div>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Token Cost Delta</div>
                <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">-42.8%</div>
                <div className="text-[10px] text-slate-500 font-mono">$0.00084 / 1k Tokens</div>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Token Latency (p99)</div>
                <div className="text-2xl font-bold font-mono text-white tabular-nums">11.2 ms</div>
                <div className="text-[10px] text-slate-500 font-mono">Stable TTFT</div>
              </div>
            </div>

            {/* Mock GPU Node Heatmap */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
                <span>16-Node Accelerator Heatmap (H100 SXM5 Load)</span>
                <span className="text-[10px] font-mono text-slate-500">Auto-balanced via RDMA</span>
              </div>
              <div className="grid grid-cols-8 gap-2">
                {[94, 93, 95, 92, 93, 94, 91, 95, 93, 92, 94, 96, 92, 93, 94, 93].map((load, idx) => (
                  <div key={idx} className="p-2 bg-slate-950 rounded border border-slate-800 text-center">
                    <div className="text-[9px] font-mono text-slate-500">N_{idx}</div>
                    <div className="text-[11px] font-mono font-bold text-emerald-400">{load}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
