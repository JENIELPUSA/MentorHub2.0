import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Play, 
  Square, 
  RotateCcw, 
  ClipboardCheck, 
  X, 
  PenTool, 
  Settings, 
  Code, 
  ShieldCheck, 
  Wand2, 
  Terminal, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  HelpCircle,
  Award
} from 'lucide-react';

export default function App() {
  // Study details & Panelist Info
  const [studyTitle, setStudyTitle] = useState('WEB-BASED AUTOMATED SYSTEM EVALUATION AND DIAGNOSTIC MATRIX');
  const [panelistName, setPanelistName] = useState('Dr. Santos');
  const [panelistRole, setPanelistRole] = useState('Lead Panelist');
  const [comments, setComments] = useState('');

  // Rubrics Evaluation Criteria (Points 0-20 per section based on the rubric image)
  // 1. System Performance & Features (30% weight)
  const [scorePerf, setScorePerf] = useState(19); 
  // 2. User Interface & Usability (25% weight)
  const [scoreUI, setScoreUI] = useState(18); 
  // 3. System Architecture & Security (25% weight)
  const [scoreArch, setScoreArch] = useState(19); 
  // 4. Response to Questions (20% weight)
  const [scoreResponse, setScoreResponse] = useState(18); 

  // Computed metrics
  const [overallScore, setOverallScore] = useState(92.5);
  const [verdict, setVerdict] = useState('PASSED');
  const [evalGrade, setEvalGrade] = useState('EXCELLENT');

  // Interactive Simulation State
  const [isScanning, setIsScanning] = useState(false);
  const [statusText, setStatusText] = useState('IDLE / STANDBY');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Diagnostic Logs
  const [logs, setLogs] = useState([
    { id: 1, type: 'cyan', text: '[00:00:01] System Evaluation Rubrics Matrix v2.0 loaded.' },
    { id: 2, type: 'info', text: '[00:00:03] Evaluation Criteria aligned with official Capstone Defense Rubrics.' }
  ]);

  const logConsoleRef = useRef(null);

  const addLog = (message, type = 'info') => {
    const now = new Date();
    const timestamp = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
    setLogs((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), type, text: `${timestamp} ${message}` }
    ]);
  };

  // Auto scroll log console
  useEffect(() => {
    if (logConsoleRef.current) {
      logConsoleRef.current.scrollTop = logConsoleRef.current.scrollHeight;
    }
  }, [logs]);

  // Recalculate score based on rubrics weighting formula
  const computeWeightedScore = (p, u, a, r) => {
    // Each score is / 20. Total percentage = (p/20)*30 + (u/20)*25 + (a/20)*25 + (r/20)*20
    const weighted = ((p / 20) * 30) + ((u / 20) * 25) + ((a / 20) * 25) + ((r / 20) * 20);
    return weighted.toFixed(1);
  };

  useEffect(() => {
    let interval = null;
    if (isScanning) {
      setStatusText('EVALUATION IN PROGRESS');
      interval = setInterval(() => {
        const np = Math.floor(Math.random() * 5) + 16;
        const nu = Math.floor(Math.random() * 5) + 16;
        const na = Math.floor(Math.random() * 5) + 16;
        const nr = Math.floor(Math.random() * 5) + 16;

        setScorePerf(np);
        setScoreUI(nu);
        setScoreArch(na);
        setScoreResponse(nr);

        const calculated = computeWeightedScore(np, nu, na, nr);
        setOverallScore(calculated);

        const messages = [
          'Evaluating System Performance & Features (30%)...',
          'Assessing UI Usability & Design Aesthetics (25%)...',
          'Testing System Architecture, Security & Reliability (25%)...',
          'Verifying Panelist Q&A / Defense Readiness (20%)...'
        ];
        addLog(messages[Math.floor(Math.random() * messages.length)], 'info');
      }, 1300);
    } else {
      if (statusText !== 'IDLE / STANDBY' && statusText !== 'EVALUATION COMPLETED') {
        setStatusText('IDLE / STANDBY');
      }
    }
    return () => clearInterval(interval);
  }, [isScanning, statusText]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const finalScore = computeWeightedScore(scorePerf, scoreUI, scoreArch, scoreResponse);
    setOverallScore(finalScore);

    let grade = 'EXCELLENT';
    let v = 'PASSED';

    if (finalScore < 75) {
      grade = 'NEEDS REVISION';
      v = 'RE-EVALUATE';
    } else if (finalScore < 88) {
      grade = 'SATISFACTORY';
      v = 'PASSED w/ REVISIONS';
    }

    setEvalGrade(grade);
    setVerdict(v);
    setStatusText('EVALUATION COMPLETED');

    addLog(`Evaluated Study: "${studyTitle}"`, 'cyan');
    addLog(`Rubric Assessment by: ${panelistName} (${panelistRole})`, 'cyan');
    addLog(`Weighted Final Score: ${finalScore}% - Verdict: ${v}`, 'success');
    if (comments) {
      addLog(`Panelist Remarks: "${comments}"`, 'info');
    }

    setIsModalOpen(false);
  };

  const handleReset = () => {
    setIsScanning(false);
    setScorePerf(19);
    setScoreUI(18);
    setScoreArch(19);
    setScoreResponse(18);
    setOverallScore(92.5);
    setPanelistName('Dr. Santos');
    setVerdict('PASSED');
    setEvalGrade('EXCELLENT');
    setStatusText('IDLE / STANDBY');
    addLog('Reset evaluation rubrics to default benchmarks.', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 relative font-sans selection:bg-cyan-500 selection:text-white">
      {/* Background Grid Pattern & Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-200/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-[400px] h-[400px] bg-blue-200/40 rounded-full blur-[100px] pointer-events-none" />

      {}
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Header Section */}
        <header className="bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 shrink-0">
              <Cpu className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-ping" />
            </div>
            <div>
              <h1 className="font-bold text-xl md:text-2xl tracking-wider bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 bg-clip-text text-transparent">
                SYSTEM EVALUATION MATRIX & RUBRICS
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">
                  RUBRIC assessment
                </span>
                <h2 className="text-sm md:text-base font-bold text-slate-800 line-clamp-1">
                  {studyTitle}
                </h2>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs tracking-wider font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>RUBRICS EVALUATION</span>
            </button>
            <button
              onClick={() => {
                if (isScanning) {
                  setIsScanning(false);
                  addLog('Evaluation simulation paused.', 'warning');
                } else {
                  setIsScanning(true);
                  addLog('Running rubrics diagnostic simulation...', 'cyan');
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs tracking-wider font-bold shadow-md shadow-cyan-500/20 transition-all flex items-center gap-2"
            >
              {isScanning ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isScanning ? 'STOP SIMULATION' : 'SIMULATE EVALUATION'}</span>
            </button>
            <button
              onClick={handleReset}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 transition-all text-xs font-semibold"
              title="Reset Evaluation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {}
        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Rotating System Graphic Core */}
          <div className="lg:col-span-7 bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-sm rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden min-h-[460px]">
            
            {/* Top Status */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs tracking-widest text-cyan-600 uppercase font-bold flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> Diagnostic Core
              </span>
              <div className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-2 font-semibold">
                <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-amber-500 animate-ping' : 'bg-cyan-500'}`} />
                <span>{statusText}</span>
              </div>
            </div>

            {/* Rotating Graphic Visualizer */}
            <div className="relative flex-1 flex items-center justify-center my-6 py-6">
              <div className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full border border-cyan-400/30 border-dashed animate-[spin_12s_linear_infinite]" />
              <div className="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2 border-t-cyan-500 border-r-transparent border-b-blue-600 border-l-transparent animate-[spin_8s_linear_infinite_reverse]" />
              <div className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full border border-sky-400/50 border-dotted animate-[spin_6s_linear_infinite]" />
              <div className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-cyan-200 border-t-cyan-500 border-b-indigo-500 animate-[spin_10s_linear_infinite]" />
              
              <div className="relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-white/95 border-2 border-cyan-400 flex flex-col items-center justify-center shadow-[0_10px_25px_rgba(6,182,212,0.15)] backdrop-blur-md">
                <span className="text-[10px] tracking-widest text-slate-500 uppercase font-semibold">Rubric Grade</span>
                <span className="font-extrabold text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-b from-cyan-600 to-blue-700 my-0.5">
                  {overallScore}%
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  overallScore >= 88 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-300' 
                    : overallScore >= 75 
                    ? 'bg-amber-50 text-amber-600 border-amber-300' 
                    : 'bg-rose-50 text-rose-600 border-rose-300'
                }`}>
                  {evalGrade}
                </span>
              </div>
            </div>

            {/* Bottom Panel Details */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200 text-center">
              <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Evaluator</p>
                <p className="text-xs sm:text-sm font-bold font-mono text-cyan-700 truncate">{panelistName}</p>
              </div>
              <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Verdict</p>
                <p className={`text-xs sm:text-sm font-bold font-mono ${verdict.includes('PASSED') ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {verdict}
                </p>
              </div>
              <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Status</p>
                <p className="text-xs sm:text-sm font-bold font-mono text-sky-600">FINALIZED</p>
              </div>
            </div>

          </div>

          {}
          {/* Right Column: Rubrics Breakdown & Console */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Criteria Progress Modules based on official Rubric */}
            <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-sm rounded-2xl p-5 flex-1 flex flex-col justify-between">
              <h2 className="text-sm font-bold text-slate-800 tracking-wider flex items-center justify-between mb-4">
                <span>EVALUATION RUBRICS BREAKDOWN</span>
                <Award className="w-4 h-4 text-cyan-600" />
              </h2>

              {/* Criterion 1: Performance (30%) */}
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-cyan-600" /> 1. System Performance & Features (30%)
                  </span>
                  <span className="font-mono text-cyan-600 font-bold">{scorePerf} / 20 pts</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${(scorePerf / 20) * 100}%` }}
                  />
                </div>
              </div>

              {/* Criterion 2: UI & Usability (25%) */}
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-indigo-600" /> 2. User Interface & Usability (25%)
                  </span>
                  <span className="font-mono text-indigo-600 font-bold">{scoreUI} / 20 pts</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${(scoreUI / 20) * 100}%` }}
                  />
                </div>
              </div>

              {/* Criterion 3: Architecture & Security (25%) */}
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> 3. Architecture & Security (25%)
                  </span>
                  <span className="font-mono text-emerald-600 font-bold">{scoreArch} / 20 pts</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${(scoreArch / 20) * 100}%` }}
                  />
                </div>
              </div>

              {/* Criterion 4: Response to Questions (20%) */}
              <div className="space-y-1.5 mb-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-sky-600" /> 4. Response to Questions (20%)
                  </span>
                  <span className="font-mono text-sky-600 font-bold">{scoreResponse} / 20 pts</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${(scoreResponse / 20) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Diagnostic Console Log Box */}
            <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-sm rounded-2xl p-4 h-48 flex flex-col">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-600" /> LIVE EVALUATION LOGS
                </span>
                <span className="text-[10px] font-mono text-slate-400">AUTO-SCROLL</span>
              </div>
              <div ref={logConsoleRef} className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1.5 pr-2">
                {logs.map((log) => (
                  <p
                    key={log.id}
                    className={
                      log.type === 'success'
                        ? 'text-emerald-600 font-semibold'
                        : log.type === 'warning'
                        ? 'text-amber-600 font-semibold'
                        : log.type === 'cyan'
                        ? 'text-cyan-700 font-bold'
                        : 'text-slate-600'
                    }
                  >
                    {log.text}
                  </p>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {}
      {/* PANEL EVALUATION MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 relative border border-cyan-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">OFFICIAL RUBRICS ASSESSMENT FORM</h3>
                <p className="text-xs text-slate-500">Ipasok ang opisyal na puntos (0-20 pts) para sa bawat rubrics criteria.</p>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pamagat ng Study / Capstone Project
                </label>
                <input
                  type="text"
                  required
                  value={studyTitle}
                  onChange={(e) => setStudyTitle(e.target.value)}
                  placeholder="Ilagay ang pamagat ng proyekto..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pangalan ng Panelist / Evaluator
                  </label>
                  <input
                    type="text"
                    required
                    value={panelistName}
                    onChange={(e) => setPanelistName(e.target.value)}
                    placeholder="Hal. Dr. Santos"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role / Designation
                  </label>
                  <select
                    value={panelistRole}
                    onChange={(e) => setPanelistRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  >
                    <option value="Lead Panelist">Lead Panelist</option>
                    <option value="Technical Evaluator">Technical Evaluator</option>
                    <option value="UI/UX Specialist">UI/UX Specialist</option>
                    <option value="Domain Expert">Domain Expert</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs text-cyan-700 font-bold uppercase tracking-wider">Official Rubric Criteria (0 - 20 Points per Section)</h4>
                
                {/* Rubric 1 */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">1. System Performance & Features (30% Weight)</span>
                      <span className="text-[10px] text-slate-500">Core functionality, features completeness, error handling.</span>
                    </div>
                    <span className="text-xs font-mono text-cyan-600 font-bold">{scorePerf} / 20 pts</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={scorePerf}
                    onChange={(e) => setScorePerf(Number(e.target.value))}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                </div>

                {/* Rubric 2 */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">2. User Interface & Usability (25% Weight)</span>
                      <span className="text-[10px] text-slate-500">Visual design, responsiveness, intuitive user journey.</span>
                    </div>
                    <span className="text-xs font-mono text-indigo-600 font-bold">{scoreUI} / 20 pts</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={scoreUI}
                    onChange={(e) => setScoreUI(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Rubric 3 */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">3. System Architecture & Security (25% Weight)</span>
                      <span className="text-[10px] text-slate-500">Data protection, role permissions, database design.</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-600 font-bold">{scoreArch} / 20 pts</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={scoreArch}
                    onChange={(e) => setScoreArch(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                {/* Rubric 4 */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">4. Response to Questions / Q&A (20% Weight)</span>
                      <span className="text-[10px] text-slate-500">16-20 pts: Answered well with reference to own work and subject mastery.</span>
                    </div>
                    <span className="text-xs font-mono text-sky-600 font-bold">{scoreResponse} / 20 pts</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={scoreResponse}
                    onChange={(e) => setScoreResponse(Number(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Panelist Feedback & Recommendations
                </label>
                <textarea
                  rows="2"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Maglagay ng karagdagang suhestiyon o rekomendasyon..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
                >
                  SUBMIT ASSESSMENT
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}