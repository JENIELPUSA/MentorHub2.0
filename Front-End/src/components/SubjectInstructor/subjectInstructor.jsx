import React, { useState, useMemo, useCallback } from 'react';
import {
  FaBars,
  FaAward,
  FaBell,
  FaUserGraduate,
  FaChartPie,
  FaPeopleGroup,
  FaHeading,
  FaComments,
  FaFileSignature,
  FaGavel,
  FaBullhorn,
  FaChartLine,
  FaXmark,
  FaCircleCheck,
  FaClock,
  FaCircleXmark,
  FaMagnifyingGlassChart,
  FaLocationDot,
  FaCalendarPlus,
  FaPlus,
  FaUsersGear,
  FaFileCircleExclamation,
  FaHandshake,
  FaShieldCheck,
  FaChevronRight,
  FaGithub,
  FaPenToSquare,
  FaTrash,
  FaFilePdf,
  FaUserTie,
  FaClockRotateLeft,
  FaInfoCircle,
  FaTriangleExclamation,
  FaCommentDots,
  FaCalendarCheck,
  FaShieldHalved,
  FaPenNib,
  FaSearch
} from 'react-icons/fa6';

// ===================== DATA =====================
const INIT_GROUPS = [
  {
    id: 1,
    code: 'CG-2026-01',
    projectTitle: 'AI-Powered Crop Pest Detection Mobile App',
    category: 'Capstone 2',
    program: 'BSIT',
    adviserRole: 'Adviser',
    leader: 'Juan Dela Cruz',
    members: ['Maria Clara', 'Crisostomo Ibarra'],
    membersCount: 3,
    currentStage: 'Chapter 5 & System Polish',
    overallProgress: 90,
    turnitinScore: 12,
    repositoryUrl: 'https://github.com',
    titleStatus: 'Na-check at Aprubado',
    titleCheckedBy: 'Dr. Aris Santos',
    titleCheckedDate: 'Oct 05, 2026',
    adviserTitleRemarks: 'Inaprubahan ang Option 1. Tugma sa mga prayoridad na sakop ng Capstone.',
    proposedTitles: [
      { title: 'AI-Powered Crop Pest Detection Mobile App', isPrimary: true, selected: true },
      { title: 'Smart Agricultural Pest Identifier via Machine Learning', isPrimary: false, selected: false },
      { title: 'Mobile Pest Recognition Portal for Farmers', isPrimary: false, selected: false }
    ]
  },
  {
    id: 2,
    code: 'CG-2026-02',
    projectTitle: 'Barangay Health & Emergency Response Portal',
    category: 'Capstone 2',
    program: 'BSIT',
    adviserRole: 'Adviser',
    leader: 'Andres Bonifacio',
    members: ['Gregoria De Jesus', 'Emilio Jacinto'],
    membersCount: 3,
    currentStage: 'Chapter 4 Data Analysis',
    overallProgress: 75,
    turnitinScore: 18,
    repositoryUrl: 'https://github.com',
    titleStatus: 'Na-check at Aprubado',
    titleCheckedBy: 'Dr. Aris Santos',
    titleCheckedDate: 'Oct 08, 2026',
    adviserTitleRemarks: 'Approved. Siguraduhing may SMS notification integration.',
    proposedTitles: [
      { title: 'Barangay Health & Emergency Response Portal', isPrimary: true, selected: true },
      { title: 'Community Health Management System with SMS Alerts', isPrimary: false, selected: false }
    ]
  },
  {
    id: 3,
    code: 'TG-2026-01',
    projectTitle: 'Blockchain-Based Academic Degree Verification System',
    category: 'Thesis 1',
    program: 'BSCS',
    adviserRole: 'Lead Adviser',
    leader: 'Jose Rizal',
    members: ['Apolinario Mabini'],
    membersCount: 2,
    currentStage: 'Outline Proposal Defense',
    overallProgress: 45,
    turnitinScore: 24,
    repositoryUrl: 'https://github.com',
    titleStatus: 'Para sa Review',
    titleCheckedBy: '',
    titleCheckedDate: '',
    adviserTitleRemarks: 'Naka-queue para sa pagsusuri ng Tagapayo.',
    proposedTitles: [
      { title: 'Blockchain-Based Academic Degree Verification System', isPrimary: true, selected: true },
      { title: 'Decentralized Credentials Audit Ledger', isPrimary: false, selected: false },
      { title: 'Smart Contract Protocol for University Records', isPrimary: false, selected: false }
    ]
  },
  {
    id: 4,
    code: 'CG-2026-03',
    projectTitle: 'IoT Automated Smart Poultry Management System',
    category: 'Capstone 2',
    program: 'BSIT',
    adviserRole: 'Adviser',
    leader: 'Melchora Aquino',
    members: ['Juan Luna', 'Marcelo Del Pilar'],
    membersCount: 3,
    currentStage: 'Final Testing & User Acceptability',
    overallProgress: 85,
    turnitinScore: 14,
    repositoryUrl: 'https://github.com',
    titleStatus: 'Kailangang Baguhin',
    titleCheckedBy: 'Dr. Aris Santos',
    titleCheckedDate: 'Oct 12, 2026',
    adviserTitleRemarks: 'I-refine ang pamagat upang maging mas tiyak ang sakop sa IoT sensors.',
    proposedTitles: [
      { title: 'IoT Automated Smart Poultry Management System', isPrimary: true, selected: true },
      { title: 'Automated Microclimate Control for Poultry Farms', isPrimary: false, selected: false }
    ]
  }
];

const INIT_MANUSCRIPTS = [
  { id: 1, groupCode: 'CG-2026-01', chapterTitle: 'Chapter 4 & 5 Final Draft', fileName: 'CG-2026-01_Final.pdf', similarityScore: 12, submittedDate: 'Nov 01, 2026', status: 'Under Review', comments: '' },
  { id: 2, groupCode: 'CG-2026-02', chapterTitle: 'Chapter 1 to 3 Revisions', fileName: 'CG-2026-02_Ch1-3.pdf', similarityScore: 18, submittedDate: 'Nov 03, 2026', status: 'Under Review', comments: '' },
  { id: 3, groupCode: 'TG-2026-01', chapterTitle: 'Chapter 1 & 2 Outline', fileName: 'TG-2026-01_Outline.pdf', similarityScore: 24, submittedDate: 'Nov 04, 2026', status: 'Needs Revision', comments: 'Similarity index exceeds 20%' }
];

const INIT_CONSULTATIONS = [
  { id: 1, groupCode: 'CG-2026-01', topic: 'Algorithm Optimization & UI Feedback', notes: 'Need advice on ML model response time.', preferredDate: 'Nov 10, 2026', preferredTime: '02:00 PM', mode: 'Face-to-Face', status: 'Pending' },
  { id: 2, groupCode: 'TG-2026-01', topic: 'Blockchain Smart Contract Architecture', notes: 'Discussing Gas fee optimization in Solidity.', preferredDate: 'Nov 11, 2026', preferredTime: '10:30 AM', mode: 'Online (Zoom/Teams)', status: 'Approved' }
];

const INIT_ANNOUNCEMENTS = [
  { id: 1, target: 'Lahat ng Advisees', title: 'Final Defense Schedule & Requirements Announcement', body: 'All teams scheduled for final defense must submit 3 hardbound draft copies and Turnitin certificate.', date: 'Oct 28, 2026' }
];

const INIT_NOTIFICATIONS = [
  { id: 1, title: 'May Bagong Draft!', desc: 'Ipinasa ng Team Alpha ang Kabanata 4 & 5 Manuscript', time: '15 mins ago', icon: 'FaFileArrowUp', read: false },
  { id: 2, title: 'Hiling sa Konsultasyon', desc: 'Nag-request ang Group Beta ng F2F Mentoring Session', time: '2 hours ago', icon: 'FaCalendarCheck', read: false },
  { id: 3, title: 'Defense Schedule Notice', desc: 'Final Defense for Group Gamma set on Nov 12', time: 'Yesterday', icon: 'FaGavel', read: true }
];

const UPCOMING_DEFENSES = [
  { id: 1, groupCode: 'CG-2026-01', title: 'AI Crop Pest Detection', stage: 'Final Oral Defense', date: 'Nov 12, 2026', time: '02:00 PM', venue: 'AVR Room 2' },
  { id: 2, groupCode: 'CG-2026-02', title: 'Barangay Health Portal', stage: 'Pre-Oral Defense', date: 'Nov 14, 2026', time: '10:00 AM', venue: 'Lab 3' }
];

// ===================== MAIN APP =====================
const App = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupCategoryFilter, setGroupCategoryFilter] = useState('all');
  const [titleFilter, setTitleFilter] = useState('all');
  const [selectedGradingGroupCode, setSelectedGradingGroupCode] = useState('CG-2026-01');
  const [defenseStage, setDefenseStage] = useState('Final Oral Defense');
  const [rubricScores, setRubricScores] = useState({ criterion1: 22, criterion2: 26, criterion3: 23, criterion4: 18 });
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [modals, setModals] = useState({ announcement: false, reviewManuscript: false, reviewTitle: false, consultationSlot: false });
  const [activeManuscript, setActiveManuscript] = useState(null);
  const [activeTitleGroup, setActiveTitleGroup] = useState(null);
  const [newAnnouncement, setNewAnnouncement] = useState({ target: 'Lahat ng Advisees', title: '', body: '' });

  const [groups, setGroups] = useState(INIT_GROUPS);
  const [manuscripts, setManuscripts] = useState(INIT_MANUSCRIPTS);
  const [consultations, setConsultations] = useState(INIT_CONSULTATIONS);
  const [announcements, setAnnouncements] = useState(INIT_ANNOUNCEMENTS);
  const [notifications, setNotifications] = useState(INIT_NOTIFICATIONS);

  // Computed values
  const pendingManuscriptCount = useMemo(() => manuscripts.filter(m => m.status === 'Under Review').length, [manuscripts]);
  const pendingConsultationsCount = useMemo(() => consultations.filter(c => c.status === 'Pending').length, [consultations]);
  const upcomingDefensesCount = UPCOMING_DEFENSES.length;
  const readyForDefenseCount = useMemo(() => groups.filter(g => g.turnitinScore <= 20).length, [groups]);
  const approvedTitleCount = useMemo(() => groups.filter(g => g.titleStatus === 'Na-check at Aprubado').length, [groups]);
  const pendingTitleCount = useMemo(() => groups.filter(g => g.titleStatus === 'Para sa Review' || g.titleStatus === 'Kailangang Baguhin').length, [groups]);

  const filteredGroups = useMemo(() => {
    if (groupCategoryFilter === 'all') return groups;
    return groups.filter(g => g.category === groupCategoryFilter);
  }, [groups, groupCategoryFilter]);

  const filteredTitleGroups = useMemo(() => {
    if (titleFilter === 'all') return groups;
    return groups.filter(g => g.titleStatus === titleFilter);
  }, [groups, titleFilter]);

  const computedTotalScore = useMemo(() => {
    return (rubricScores.criterion1 || 0) + (rubricScores.criterion2 || 0) + (rubricScores.criterion3 || 0) + (rubricScores.criterion4 || 0);
  }, [rubricScores]);

  // Toast helper
  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  }, []);

  // Notification handlers
  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('Lahat ng abiso ay marked as read', 'info');
  }, [showToast]);

  // Consultation handlers
  const approveConsultation = useCallback((id) => {
    setConsultations(prev => prev.map(c => c.id === id ? { ...c, status: 'Approved' } : c));
    showToast(`In-approve ang konsultasyon`, 'success');
  }, [showToast]);

  const completeConsultation = useCallback((id) => {
    setConsultations(prev => prev.map(c => c.id === id ? { ...c, status: 'Completed' } : c));
    showToast(`Na-log bilang Naisagawa ang konsultasyon`, 'info');
  }, [showToast]);

  // Manuscript review handlers
  const openReviewModal = useCallback((item) => {
    setActiveManuscript({ ...item });
    setModals(prev => ({ ...prev, reviewManuscript: true }));
  }, []);

  const reviewManuscript = useCallback((group) => {
    const manuscript = manuscripts.find(m => m.groupCode === group.code) || {
      groupCode: group.code,
      chapterTitle: 'Manuscript Draft',
      fileName: `${group.code}_Draft.pdf`,
      similarityScore: group.turnitinScore,
      status: 'Under Review',
      comments: ''
    };
    openReviewModal(manuscript);
  }, [manuscripts, openReviewModal]);

  const saveManuscriptReview = useCallback(() => {
    if (!activeManuscript) return;
    const idx = manuscripts.findIndex(m => m.groupCode === activeManuscript.groupCode);
    if (idx !== -1) {
      const updated = [...manuscripts];
      updated[idx] = { ...activeManuscript };
      setManuscripts(updated);
    } else {
      setManuscripts(prev => [...prev, { ...activeManuscript }]);
    }
    setModals(prev => ({ ...prev, reviewManuscript: false }));
    showToast(`Nai-save ang puna para sa ${activeManuscript.groupCode}!`, 'success');
  }, [activeManuscript, manuscripts, showToast]);

  // Title review handlers
  const openTitleReviewModal = useCallback((group) => {
    setActiveTitleGroup(JSON.parse(JSON.stringify(group)));
    setModals(prev => ({ ...prev, reviewTitle: true }));
  }, []);

  const selectTitleVariant = useCallback((index) => {
    if (!activeTitleGroup) return;
    const updated = { ...activeTitleGroup };
    updated.proposedTitles = updated.proposedTitles.map((t, i) => ({ ...t, selected: i === index }));
    updated.projectTitle = updated.proposedTitles[index].title;
    setActiveTitleGroup(updated);
  }, [activeTitleGroup]);

  const saveTitleReview = useCallback(() => {
    if (!activeTitleGroup) return;
    const idx = groups.findIndex(g => g.id === activeTitleGroup.id);
    if (idx !== -1) {
      const updated = { ...activeTitleGroup, titleCheckedBy: 'Dr. Aris Santos', titleCheckedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) };
      const newGroups = [...groups];
      newGroups[idx] = updated;
      setGroups(newGroups);
    }
    setModals(prev => ({ ...prev, reviewTitle: false }));
    showToast(`Nai-save ang pagsusuri ng titulo para sa ${activeTitleGroup.code}!`, 'success');
  }, [activeTitleGroup, groups, showToast]);

  // Announcement handlers
  const saveAnnouncement = useCallback(() => {
    if (!newAnnouncement.title || !newAnnouncement.body) return;
    setAnnouncements(prev => [{
      id: Date.now(),
      target: newAnnouncement.target,
      title: newAnnouncement.title,
      body: newAnnouncement.body,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }, ...prev]);
    setNewAnnouncement({ target: 'Lahat ng Advisees', title: '', body: '' });
    setModals(prev => ({ ...prev, announcement: false }));
    showToast('Nai-post na ang advisory notice!', 'success');
  }, [newAnnouncement, showToast]);

  const deleteAnnouncement = useCallback((id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    showToast('Nabura ang advisory notice', 'info');
  }, [showToast]);

  const submitDefenseGrade = useCallback(() => {
    showToast(`Matagumpay na na-submit ang Oral Defense Grade (${computedTotalScore}/100) para sa ${selectedGradingGroupCode}!`, 'success');
  }, [computedTotalScore, selectedGradingGroupCode, showToast]);

  // Sidebar items
  const sidebarItems = [
    { id: 'overview', icon: FaChartPie, label: 'Pangunahing Pahina', sub: 'Main Overview' },
    { id: 'groups', icon: FaPeopleGroup, label: 'Mga Advisee Teams', sub: 'Advisee Teams', badge: groups.length },
    { id: 'titles', icon: FaHeading, label: 'Suri ng Titulo', sub: 'Title Proposal Tracker', badge: pendingTitleCount },
    { id: 'consultations', icon: FaComments, label: 'Mga Konsultasyon', sub: 'Consultations & Advising', badge: pendingConsultationsCount },
    { id: 'deliverables', icon: FaFileSignature, label: 'Kabanata & Turnitin', sub: 'Chapters & Plagiarism', badge: pendingManuscriptCount },
    { id: 'defenses', icon: FaGavel, label: 'Depensa at Scoring', sub: 'Defense & Rubrics' },
    { id: 'announcements', icon: FaBullhorn, label: 'Guidelines & Anunsyo', sub: 'Guidelines & Bulletins' },
    { id: 'analytics', icon: FaChartLine, label: 'Ulat & Analytics', sub: 'Reports & Status' }
  ];

  // Stats items
  const stats = [
    { label: 'Mga Advisee Teams', sub: 'Advisee Teams', value: groups.length, icon: FaUsersGear, color: 'purple' },
    { label: 'Status ng Titulo', sub: 'Title Check Status', value: `${approvedTitleCount}/${groups.length}`, badge: pendingTitleCount > 0 ? `${pendingTitleCount} Need Check` : 'All Checked', icon: FaHeading, color: 'blue', onClick: () => setActiveTab('titles') },
    { label: 'Kabanatang Para sa Review', value: pendingManuscriptCount, badge: 'Kailangan ng Puna', icon: FaFileCircleExclamation, color: 'rose' },
    { label: 'Hiling sa Konsultasyon', value: pendingConsultationsCount, badge: 'Pending Requests', icon: FaHandshake, color: 'amber' },
    { label: 'Ready for Defense', value: readyForDefenseCount, badge: 'Approved', icon: FaShieldCheck, color: 'emerald' }
  ];

  const rubricCriteria = [
    { label: '1. Novelty & Problem Formulation (25%)', desc: 'Linaw ng suliranin, kahalagahan sa lipunan, at kaangkupan ng solusyon. (Problem clarity, social impact, and novelty of proposed solution.)', key: 'criterion1', max: 25 },
    { label: '2. System Architecture & Methodology (30%)', desc: 'Kalinawan ng SDLC, database design, algorithms, at code structure. (SDLC clarity, database design, algorithms, and modular architecture.)', key: 'criterion2', max: 30 },
    { label: '3. Live System Demonstration & Functionality (25%)', desc: 'Bilis ng system, kawalan ng kritikal na bug, at UI/UX design. (System responsiveness, absence of critical bugs, and UI/UX usability.)', key: 'criterion3', max: 25 },
    { label: '4. Defense Oral Presentation & Q&A Response (20%)', desc: 'Mastery ng paksa ng bawat miyembro at husay sa pagsagot sa panel. (Individual mastery of topic and response to panel questions.)', key: 'criterion4', max: 20 }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-white text-sm ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-thesis-600'}`}>
          {toast.type === 'success' ? <FaCircleCheck /> : <FaInfoCircle />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-slate-300 hover:text-white focus:outline-none p-1">
              <FaBars className="text-xl" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-thesis-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <FaAward className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight tracking-wide text-white">
                  EduPortal <span className="text-thesis-500 text-xs px-2 py-0.5 rounded-full bg-thesis-500/20 ml-1">Capstone & Thesis Hub</span>
                </h1>
                <p className="text-xs text-slate-400">Portal ng Tagapayo at Juror <span className="text-slate-400/80 font-normal text-[11px] block sm:inline">(Advisor & Panelist Portal)</span></p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <FaSearch className="text-sm" />
              </span>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Maghanap ng Grupo, Proyekto, Kabanata / Search Group, Project, Chapter..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-thesis-500 focus:border-transparent transition" />
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-200">1st Semester, A.Y. 2026-2027</span>
              <span className="text-[11px] text-thesis-400 font-medium"><FaShieldHalved className="inline mr-1" />Final Defense Season</span>
            </div>

            <div className="relative">
              <button onClick={markAllRead} className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition">
                <FaBell className="text-lg" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
                )}
              </button>
            </div>

            <div className="flex items-center space-x-2 border-l border-slate-700 pl-3">
              <img className="w-9 h-9 rounded-full object-cover ring-2 ring-thesis-500"
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150"
                alt="Dr. Aris Santos" />
              <div className="hidden xl:block text-left">
                <p className="text-xs font-semibold text-white leading-none">Dr. Aris Santos, DIT</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Head Capstone & Thesis Adviser</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-thesis-50 text-thesis-600 rounded-lg">
                <FaUserGraduate className="text-lg" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-thesis-600 uppercase tracking-wider">Faculty Mentor ID</span>
                <p className="text-xs font-semibold text-slate-800">ADV-2026-9901</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {sidebarItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition text-left ${activeTab === item.id ? 'bg-thesis-50 text-thesis-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}>
                <div className="flex items-center space-x-3">
                  <item.icon className="w-5 text-center shrink-0" />
                  <div>
                    <span className="block leading-tight font-semibold">{item.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{item.sub}</span>
                  </div>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-thesis-100 text-thesis-700 rounded-full font-bold">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 m-3 bg-gradient-to-br from-slate-900 to-thesis-900 rounded-xl text-white shadow-lg">
            <div className="flex items-center space-x-2 text-xs font-semibold mb-1">
              <FaClockRotateLeft className="text-amber-300" />
              <span>Upcoming Final Defense</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">Team Alpha Defense: <strong>Nov 12, 2026 (02:00 PM)</strong> sa AVR 2.</p>
            <button onClick={() => setActiveTab('defenses')} className="mt-3 w-full py-1.5 bg-thesis-500 hover:bg-thesis-600 text-white font-semibold text-xs rounded-lg transition shadow-sm">
              Tingnan ang Rubrics
            </button>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="p-4 border-b flex items-center justify-between">
                <span className="font-bold text-slate-800">Menu ng Capstone Mentor</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-500 p-1"><FaXmark className="text-xl" /></button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto text-sm">
                {sidebarItems.map(item => (
                  <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center space-x-3">
                    <item.icon className="text-thesis-600" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          {/* ===== OVERVIEW TAB ===== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 text-thesis-300 text-xs font-medium border border-slate-700 mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Capstone & Thesis Mentoring Active • Syystem Online</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Magandang Araw, Dr. Santos! 👋 <span className="block text-sm font-normal text-slate-300 mt-0.5">(Good day, Dr. Santos!)</span></h2>
                    <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                      Hawak mo ang <strong className="text-white font-semibold">{groups.length}</strong> na Capstone/Thesis Teams. May <strong className="text-amber-300 font-semibold">{pendingManuscriptCount}</strong> na kabanata na kailangang i-review at <strong className="text-emerald-300 font-semibold">{upcomingDefensesCount}</strong> na nakatakdang depensa.
                      <span className="block text-xs text-slate-400 mt-0.5">(You are mentoring {groups.length} Capstone/Thesis Teams. You have {pendingManuscriptCount} manuscripts pending review and {upcomingDefensesCount} scheduled defenses.)</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setModals(prev => ({ ...prev, consultationSlot: true }))} className="px-4 py-2 bg-thesis-600 hover:bg-thesis-500 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-2 shadow-lg shadow-thesis-600/30">
                      <FaCalendarPlus /> <span>Magbukas ng Slot / Open Slot</span>
                    </button>
                    <button onClick={() => setModals(prev => ({ ...prev, announcement: true }))} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center space-x-2">
                      <FaPlus /> <span>Mag-post ng Advisory / Post Notice</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                  <div key={idx} className={`bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition ${stat.onClick ? 'cursor-pointer' : ''}`} onClick={stat.onClick}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{stat.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal uppercase">{stat.sub}</span>
                      </div>
                      <div className={`p-2.5 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl`}>
                        <stat.icon className="text-lg" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                      {stat.badge && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stat.badge.includes('Need') || stat.badge === 'Kailangan ng Puna' ? 'bg-amber-50 text-amber-700' : stat.badge === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} font-bold`}>
                          {stat.badge}
                        </span>
                      )}
                    </div>
                    {stat.label === 'Status ng Titulo' && <p className="text-[11px] text-slate-400 mt-1">Na-check at Na-aprubahang Titulo</p>}
                    {stat.label === 'Kabanatang Para sa Review' && <p className="text-[11px] text-slate-400 mt-1">Chapters 1 to 5 Submissions</p>}
                    {stat.label === 'Hiling sa Konsultasyon' && <p className="text-[11px] text-slate-400 mt-1">Online at Face-to-Face Logs</p>}
                    {stat.label === 'Ready for Defense' && <p className="text-[11px] text-slate-400 mt-1">Pumasa sa Similarity Check (&lt;20%)</p>}
                  </div>
                ))}
              </div>

              {/* Overview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Status at Yugto ng mga Advisee Projects</h3>
                      <p className="text-xs text-slate-500">Mabilis na pagtingin sa progreso ng bawat grupo.</p>
                    </div>
                    <button onClick={() => setActiveTab('groups')} className="text-xs font-semibold text-thesis-600 hover:text-thesis-700 flex items-center">
                      Tingnan ang Lahat <FaChevronRight className="text-[10px] ml-1" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {groups.slice(0, 4).map(group => (
                      <div key={group.id} className="p-4 rounded-xl border border-slate-200/70 hover:border-thesis-300 transition bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <div className="p-3 rounded-xl font-bold text-center min-w-[65px] text-xs shadow-sm bg-slate-900 text-white">
                            <div>{group.code}</div>
                            <div className="text-[9px] font-normal text-thesis-300">{group.category}</div>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-bold text-slate-900 text-sm">{group.projectTitle}</h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${group.turnitinScore <= 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                Turnitin: {group.turnitinScore}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">Pinuno: {group.leader} • {group.membersCount} Miyembro</p>
                            <div className="mt-1 flex items-center space-x-2 text-[11px]">
                              <span className="font-semibold text-slate-500">Titulo / Title Check:</span>
                              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${group.titleStatus === 'Na-check at Aprubado' ? 'bg-emerald-100 text-emerald-800' : group.titleStatus === 'Para sa Review' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                                {group.titleStatus === 'Na-check at Aprubado' && <FaCircleCheck className="inline mr-1" />}
                                {group.titleStatus === 'Para sa Review' && <FaClock className="inline mr-1" />}
                                {group.titleStatus === 'Kailangang Baguhin' && <FaCircleXmark className="inline mr-1" />}
                                {group.titleStatus}
                              </span>
                            </div>
                            <div className="w-full max-w-md mt-2 flex items-center space-x-2">
                              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-thesis-600 rounded-full transition-all duration-500" style={{ width: `${group.overallProgress}%` }}></div>
                              </div>
                              <span className="text-[11px] font-bold text-slate-700">{group.overallProgress}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                          <button onClick={() => reviewManuscript(group)} className="px-3 py-1.5 bg-thesis-600 hover:bg-thesis-700 text-white text-xs font-medium rounded-lg transition">
                            <FaMagnifyingGlassChart className="inline mr-1" /> Review Draft
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900 text-base"><FaGavel className="text-amber-500 inline mr-2" />Iskedyul ng Depensa</h3>
                      <span className="text-xs text-thesis-600 font-semibold">{upcomingDefensesCount} Scheduled</span>
                    </div>
                    <div className="space-y-3">
                      {UPCOMING_DEFENSES.map(def => (
                        <div key={def.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-100 text-purple-800">{def.stage}</span>
                            <span className="text-[11px] font-semibold text-slate-500">{def.date}</span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-xs mt-2">{def.groupCode}: {def.title}</h4>
                          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                            <span><FaLocationDot className="text-rose-500 inline mr-1" /> {def.venue}</span>
                            <span><FaClock className="inline mr-1" /> {def.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 bg-thesis-50 p-3 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        <p className="font-bold text-slate-800">Kailangan ng Score Matrix?</p>
                        <p className="text-slate-500 text-[11px]">Buksan ang Oral Defense Panel Grading Sheet.</p>
                      </div>
                      <button onClick={() => setActiveTab('defenses')} className="p-2 bg-thesis-600 text-white rounded-lg hover:bg-thesis-700 transition">
                        <FaPenNib />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== GROUPS TAB ===== */}
          {activeTab === 'groups' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Mga Hawak na Advisee Capstone & Thesis Teams <span className="block text-xs text-slate-500 font-normal">(Assigned Capstone & Thesis Advisee Teams)</span></h2>
                  <p className="text-xs text-slate-500">Listahan ng mga grupo, pamagat ng proyekto, at Turnitin similarity status. <span className="italic">(List of teams, project titles, and Turnitin similarity index.)</span></p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">Filter Category:</span>
                  <select value={groupCategoryFilter} onChange={(e) => setGroupCategoryFilter(e.target.value)} className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-thesis-500">
                    <option value="all">Lahat ng Kategorya / All Categories</option>
                    <option value="Capstone 2">Capstone 2</option>
                    <option value="Thesis 1">Thesis 1</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredGroups.map(group => (
                  <div key={group.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-thesis-500 text-white shadow-sm">{group.code}</span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-200">{group.category}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mt-3">{group.projectTitle}</h3>
                        <p className="text-xs text-slate-300 font-medium mt-1">{group.adviserRole} • Program: {group.program}</p>
                      </div>
                      <div className="p-5 space-y-3 text-xs border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-3 text-slate-600">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Pinuno (Leader)</span>
                            <span className="font-semibold text-slate-900">{group.leader}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Miyembro</span>
                            <span className="font-semibold text-slate-800">{group.members.join(', ')}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Kasalukuyang Yugto</span>
                            <span className="font-bold text-thesis-600">{group.currentStage}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Turnitin Index</span>
                            <span className={`font-extrabold ${group.turnitinScore <= 20 ? 'text-emerald-600' : 'text-rose-600'}`}>{group.turnitinScore}% Similarity</span>
                          </div>
                        </div>
                        <div className="pt-2">
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-500">Kabuuan ng Completion</span>
                            <span className="font-bold text-thesis-600">{group.overallProgress}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full">
                            <div className="h-full bg-thesis-600 rounded-full" style={{ width: `${group.overallProgress}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <a href={group.repositoryUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center">
                        <FaGithub className="text-sm mr-1.5" /> Git Repo Link
                      </a>
                      <div className="flex space-x-2">
                        <button onClick={() => openTitleReviewModal(group)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-sm flex items-center space-x-1">
                          <FaHeading className="text-xs" /> <span>Suriin ang Titulo</span>
                        </button>
                        <button onClick={() => reviewManuscript(group)} className="px-3 py-1.5 bg-thesis-600 hover:bg-thesis-700 text-white rounded-lg text-xs font-medium transition shadow-sm">
                          Suriin ang Draft
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== TITLES TAB ===== */}
          {activeTab === 'titles' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Pagsubaybay at Pagsusuri ng Panukalang Titulo <span className="block text-xs text-slate-500 font-normal">(Title Proposal Review & Tracking System)</span></h2>
                    <p className="text-xs text-slate-500">I-track at aprubahan ang mga ipinasang titulo ng bawat advisee group bago simulan ang Kabanata 1. <span className="italic">(Track & verify proposed titles submitted by advisee groups prior to Chapter 1.)</span></p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-semibold text-slate-600">Filter Status:</span>
                    <select value={titleFilter} onChange={(e) => setTitleFilter(e.target.value)} className="bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold p-2 text-slate-800">
                      <option value="all">Lahat ng Status / All</option>
                      <option value="Para sa Review">Para sa Review / Pending Check</option>
                      <option value="Na-check at Aprubado">Na-check at Aprubado / Approved</option>
                      <option value="Kailangang Baguhin">Kailangang Baguhin / Needs Revision</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {filteredTitleGroups.map(group => (
                    <div key={group.id} className={`p-5 rounded-2xl border transition bg-slate-50/60 flex flex-col md:flex-row md:items-start justify-between gap-4 ${group.titleStatus === 'Na-check at Aprubado' ? 'border-emerald-300 bg-emerald-50/20' : group.titleStatus === 'Para sa Review' ? 'border-amber-300 bg-amber-50/20' : 'border-rose-300 bg-rose-50/20'}`}>
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-slate-900 text-white">{group.code}</span>
                          <span className="text-xs font-semibold text-slate-600">{group.category} • {group.program}</span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${group.titleStatus === 'Na-check at Aprubado' ? 'bg-emerald-100 text-emerald-800' : group.titleStatus === 'Para sa Review' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                            {group.titleStatus === 'Na-check at Aprubado' && <FaCircleCheck className="inline mr-1" />}
                            {group.titleStatus === 'Para sa Review' && <FaClock className="inline mr-1" />}
                            {group.titleStatus === 'Kailangang Baguhin' && <FaTriangleExclamation className="inline mr-1" />}
                            {group.titleStatus}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">Pangunahing Na-aprubahang Titulo (Approved / Proposed Title)</span>
                          <h3 className="text-base font-bold text-slate-900 mt-0.5">{group.projectTitle}</h3>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                          <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">Mga Alternatibong Titulo (Alternative Title Choices):</span>
                          {group.proposedTitles.map((alt, idx) => (
                            <div key={idx} className={`flex items-center justify-between text-slate-600 pl-2 border-l-2 ${alt.selected ? 'border-emerald-500 font-semibold text-slate-900' : 'border-slate-300'}`}>
                              <span><strong>Option {idx+1}: </strong> {alt.title}</span>
                              {alt.selected && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded font-bold">Selected</span>}
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-slate-600">
                          <span className="font-bold text-slate-700"><FaCommentDots className="inline mr-1 text-thesis-600" />Puna ng Tagapayo (Adviser Feedback):</span>
                          <p className="italic text-slate-600 mt-0.5">{group.adviserTitleRemarks || 'Wala pang naitalang puna.'}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">Huling Suri: {group.titleCheckedDate || 'Di pa na-check'} ni {group.titleCheckedBy || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between gap-3 shrink-0">
                        <button onClick={() => openTitleReviewModal(group)} className="w-full sm:w-auto px-4 py-2 bg-thesis-600 hover:bg-thesis-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2">
                          <FaPenToSquare /> <span>Suriin / Baguhin Status</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== CONSULTATIONS TAB ===== */}
          {activeTab === 'consultations' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Talaan ng Konsultasyon at Advising Logs <span className="block text-xs text-slate-500 font-normal">(Consultation Requests & Advising Logs)</span></h2>
                    <p className="text-xs text-slate-500">I-manage ang mga appointment ng advisee teams at mag-log ng mga napagkasunduang aksyon. <span className="italic">(Manage appointments & log agreed action points.)</span></p>
                  </div>
                  <button onClick={() => setModals(prev => ({ ...prev, consultationSlot: true }))} className="px-4 py-2 bg-thesis-600 hover:bg-thesis-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2">
                    <FaPlus /> <span>Magbukas ng Slot / Open Slot</span>
                  </button>
                </div>
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3 rounded-l-lg">Grupo / Group Code</th>
                        <th className="p-3">Paksa / Topic Concern</th>
                        <th className="p-3">Petsa / Date & Time</th>
                        <th className="p-3">Mode</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center rounded-r-lg">Aksyon / Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {consultations.map(con => (
                        <tr key={con.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-extrabold text-thesis-700">{con.groupCode}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{con.topic}</div>
                            <div className="text-[11px] text-slate-500 font-normal">{con.notes}</div>
                          </td>
                          <td className="p-3 text-slate-700 font-medium">{con.preferredDate} @ {con.preferredTime}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${con.mode === 'Online (Zoom/Teams)' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                              {con.mode}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${con.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : con.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                              {con.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {con.status === 'Pending' && (
                              <button onClick={() => approveConsultation(con.id)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] transition">
                                I-approve
                              </button>
                            )}
                            {con.status === 'Approved' && (
                              <button onClick={() => completeConsultation(con.id)} className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-[11px] transition">
                                Mark Done
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== DELIVERABLES TAB ===== */}
          {activeTab === 'deliverables' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Mga Kabanata at Turnitin Plagiarism Reports</h2>
                    <p className="text-xs text-slate-500">I-review ang Kabanata 1-5, ilagay ang anotasyon, at i-check ang Similarity Index limit (&lt;20%).</p>
                  </div>
                </div>
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3 rounded-l-lg">Grupo</th>
                        <th className="p-3">Kabanata / Submission File</th>
                        <th className="p-3 text-center">Turnitin Similarity</th>
                        <th className="p-3">Petsa ng Pasa</th>
                        <th className="p-3 text-center">Status ng Review</th>
                        <th className="p-3 text-center rounded-r-lg">Aksyon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {manuscripts.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-extrabold text-slate-900">{item.groupCode}</td>
                          <td className="p-3 font-semibold text-slate-800">
                            <div>{item.chapterTitle}</div>
                            <a href="#" className="text-[10px] text-thesis-600 hover:underline"><FaFilePdf className="inline mr-1" />{item.fileName}</a>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${item.similarityScore <= 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {item.similarityScore}%
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{item.submittedDate}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${item.status === 'Approved for Defense' ? 'bg-emerald-100 text-emerald-800' : item.status === 'Needs Revision' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button onClick={() => openReviewModal(item)} className="px-3 py-1 bg-thesis-600 hover:bg-thesis-700 text-white rounded font-bold text-xs transition">
                              Mag-review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== DEFENSES TAB ===== */}
          {activeTab === 'defenses' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Oral Defense Panel Evaluation & Rubrics Sheet <span className="block text-xs text-slate-500 font-normal">(Official Panel Evaluation Criteria)</span></h2>
                <p className="text-xs text-slate-500 mb-6">Sagutan ang opisyal na pamantayan sa pagmamarka sa Proposal, Pre-Oral, o Final Capstone Defense. <span className="italic">(Grade teams based on official proposal, pre-oral, or final defense rubrics.)</span></p>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pumili ng Grupo / Select Defense Team</label>
                      <select value={selectedGradingGroupCode} onChange={(e) => setSelectedGradingGroupCode(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-thesis-500">
                        {groups.map(g => (
                          <option key={g.code} value={g.code}>{g.code} - {g.projectTitle}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Yugto ng Depensa / Defense Stage</label>
                      <select value={defenseStage} onChange={(e) => setDefenseStage(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-thesis-500">
                        <option value="Proposal Defense">Proposal Defense (Title & Outline)</option>
                        <option value="Pre-Oral Defense">Pre-Oral Defense (Chapters 1-3 + Demo)</option>
                        <option value="Final Oral Defense">Final Oral Defense (Chapters 1-5 + Full System)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Papel sa Panel / Panelist Role</label>
                      <input type="text" value="Panel Chairman / Lead Adviser" disabled className="w-full bg-slate-200 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-600" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Mga Pamantayan sa Pagmamarka / Rubric Criteria (100% Max)</h4>
                    {rubricCriteria.map(crit => (
                      <div key={crit.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-xl border border-slate-200 gap-2">
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{crit.label}</p>
                          <p className="text-[11px] text-slate-500">{crit.desc}</p>
                        </div>
                        <input type="number" value={rubricScores[crit.key]} onChange={(e) => setRubricScores(prev => ({ ...prev, [crit.key]: Number(e.target.value) }))} max={crit.max} min={0} className="w-20 bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-center font-bold text-slate-900 text-sm" />
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-200 gap-4">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block">Kabuuang Iskor / Total Score:</span>
                      <span className="text-2xl font-black text-thesis-700">{computedTotalScore} / 100</span>
                      <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${computedTotalScore >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {computedTotalScore >= 75 ? 'PASSED (Approved)' : 'RE-DEFENSE'}
                      </span>
                    </div>
                    <button onClick={submitDefenseGrade} className="px-6 py-2.5 bg-thesis-600 hover:bg-thesis-700 text-white font-bold text-xs rounded-xl shadow-lg transition">
                      I-submit ang Opisyal na Marka / Submit Official Grade
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== ANNOUNCEMENTS TAB ===== */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Advisory Guidelines & Template Hub</h2>
                  <p className="text-xs text-slate-500">Mag-post ng abiso ukol sa formatting, deadline ng kabanata, o mga probisyon sa depensa.</p>
                </div>
                <button onClick={() => setModals(prev => ({ ...prev, announcement: true }))} className="px-4 py-2 bg-thesis-600 hover:bg-thesis-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2">
                  <FaPlus /> <span>Bagong Advisory</span>
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {announcements.map(ann => (
                  <div key={ann.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[11px]">{ann.target}</span>
                        <span className="text-xs text-slate-400">{ann.date}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mt-3">{ann.title}</h3>
                      <p className="text-xs text-slate-600 mt-2 whitespace-pre-line leading-relaxed">{ann.body}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span><FaUserTie className="inline mr-1" /> Dr. Aris Santos</span>
                      <button onClick={() => deleteAnnouncement(ann.id)} className="text-rose-500 hover:text-rose-700 font-semibold"><FaTrash className="inline mr-1" /> Burahin</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== ANALYTICS TAB ===== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Mentoring & Defense Analytics</h2>
                <p className="text-xs text-slate-500 mb-6">Pagsusuri sa bilis ng pagpasa ng kabanata, plagiarism similarity trends, at defense outcomes.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 h-64 flex items-center justify-center">
                    <div className="text-center text-slate-500">
                      <p className="font-semibold">Turnitin Plagiarism Index Distribution</p>
                      <p className="text-sm">(Chart placeholder)</p>
                      <div className="flex justify-center space-x-4 mt-2">
                        <span><span className="inline-block w-3 h-3 bg-emerald-500 rounded-full mr-1"></span> 1-15% (60%)</span>
                        <span><span className="inline-block w-3 h-3 bg-amber-500 rounded-full mr-1"></span> 16-20% (25%)</span>
                        <span><span className="inline-block w-3 h-3 bg-rose-500 rounded-full mr-1"></span> &gt;20% (15%)</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 h-64 flex items-center justify-center">
                    <div className="text-center text-slate-500">
                      <p className="font-semibold">Oral Defense Results Breakdown</p>
                      <p className="text-sm">(Chart placeholder)</p>
                      <div className="flex justify-center space-x-4 mt-2">
                        <span><span className="inline-block w-3 h-3 bg-brand-500 rounded-full mr-1"></span> Passed (70%)</span>
                        <span><span className="inline-block w-3 h-3 bg-thesis-500 rounded-full mr-1"></span> Major Rev (20%)</span>
                        <span><span className="inline-block w-3 h-3 bg-rose-500 rounded-full mr-1"></span> Re-Defense (10%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ===== MODALS ===== */}

      {/* Review Manuscript Modal */}
      {modals.reviewManuscript && activeManuscript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Puna sa Kabanata (Review Manuscript)</h3>
              <button onClick={() => setModals(prev => ({ ...prev, reviewManuscript: false }))} className="text-slate-400 hover:text-slate-600"><FaXmark className="text-lg" /></button>
            </div>
            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{activeManuscript.groupCode}</span>
                  <span className="text-thesis-600">{activeManuscript.chapterTitle}</span>
                </div>
                <p className="text-slate-500 mt-1">File: {activeManuscript.fileName}</p>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status ng Review</label>
                <select value={activeManuscript.status} onChange={(e) => setActiveManuscript(prev => ({ ...prev, status: e.target.value }))} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-bold focus:ring-2 focus:ring-thesis-500 focus:outline-none">
                  <option value="Under Review">Under Review</option>
                  <option value="Approved for Defense">Approved for Defense</option>
                  <option value="Needs Revision">Needs Revision</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Puna at Komento sa Kabanata</label>
                <textarea value={activeManuscript.comments || ''} onChange={(e) => setActiveManuscript(prev => ({ ...prev, comments: e.target.value }))} rows={3} placeholder="Isulat ang mga kailangang ayusin o baguhin..." className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-thesis-500 focus:outline-none" />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button onClick={() => setModals(prev => ({ ...prev, reviewManuscript: false }))} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold">Kanselahin</button>
                <button onClick={saveManuscriptReview} className="px-4 py-2 bg-thesis-600 hover:bg-thesis-700 text-white rounded-xl font-bold shadow-md">I-save ang Puna</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Title Review Modal */}
      {modals.reviewTitle && activeTitleGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Suriin at Aprubahan ang Titulo <span className="block text-xs font-normal text-slate-500">(Adviser Title Check & Approval)</span></h3>
              <button onClick={() => setModals(prev => ({ ...prev, reviewTitle: false }))} className="text-slate-400 hover:text-slate-600"><FaXmark className="text-lg" /></button>
            </div>
            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-extrabold text-thesis-700 block">{activeTitleGroup.code} - {activeTitleGroup.leader}</span>
                <span className="text-slate-500 text-[11px]">Program: {activeTitleGroup.program} ({activeTitleGroup.category})</span>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pumili ng Inaprubahang Titulo (Select Approved Title Variant)</label>
                <div className="space-y-2">
                  {activeTitleGroup.proposedTitles.map((alt, idx) => (
                    <label key={idx} className={`flex items-start space-x-2 p-2.5 rounded-xl border border-slate-200 hover:border-thesis-400 cursor-pointer transition bg-white ${alt.selected ? 'ring-2 ring-thesis-500 bg-thesis-50/30' : ''}`}>
                      <input type="radio" name={`titleChoice_${activeTitleGroup.id}`} checked={alt.selected} onChange={() => selectTitleVariant(idx)} className="mt-0.5 text-thesis-600 focus:ring-thesis-500" />
                      <div className="text-xs">
                        <span className="font-bold text-slate-800">Option {idx+1}{alt.isPrimary ? ' (Primary Choice)' : ''}</span>
                        <p className="text-slate-600 mt-0.5">{alt.title}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status ng Pagsusuri ng Titulo (Title Check Status)</label>
                <select value={activeTitleGroup.titleStatus} onChange={(e) => setActiveTitleGroup(prev => ({ ...prev, titleStatus: e.target.value }))} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-bold focus:ring-2 focus:ring-thesis-500 focus:outline-none">
                  <option value="Para sa Review">Para sa Review (Pending Check)</option>
                  <option value="Na-check at Aprubado">Na-check at Aprubado (Checked & Approved)</option>
                  <option value="Kailangang Baguhin">Kailangang Baguhin (Needs Title Revision)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Puna at Komento ng Tagapayo (Adviser Feedback / Remarks)</label>
                <textarea value={activeTitleGroup.adviserTitleRemarks || ''} onChange={(e) => setActiveTitleGroup(prev => ({ ...prev, adviserTitleRemarks: e.target.value }))} rows={3} placeholder="Isulat dito ang komento o dahilan sa pagbagay/pag-apruba ng titulo..." className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-thesis-500 focus:outline-none" />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button onClick={() => setModals(prev => ({ ...prev, reviewTitle: false }))} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold">Kanselahin</button>
                <button onClick={saveTitleReview} className="px-4 py-2 bg-thesis-600 hover:bg-thesis-700 text-white rounded-xl font-bold shadow-md">I-save ang Suri / Save Title Check</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {modals.announcement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Gumawa ng Bagong Advisory Notice</h3>
              <button onClick={() => setModals(prev => ({ ...prev, announcement: false }))} className="text-slate-400 hover:text-slate-600"><FaXmark className="text-lg" /></button>
            </div>
            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Advisee Group</label>
                <select value={newAnnouncement.target} onChange={(e) => setNewAnnouncement(prev => ({ ...prev, target: e.target.value }))} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-thesis-500 focus:outline-none">
                  <option value="Lahat ng Advisees">Lahat ng Advisee Teams</option>
                  {groups.map(g => (
                    <option key={g.code} value={g.code}>{g.code} - {g.projectTitle}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pamagat ng Advisory</label>
                <input type="text" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))} placeholder="hal. Huling Araw ng Pagpasa ng Chapter 4 Draft" required className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-thesis-500 focus:outline-none" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mensahe at Instruksyon</label>
                <textarea value={newAnnouncement.body} onChange={(e) => setNewAnnouncement(prev => ({ ...prev, body: e.target.value }))} rows={4} placeholder="Isulat ang detalye at mga hakbang dito..." required className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-thesis-500 focus:outline-none" />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button onClick={() => setModals(prev => ({ ...prev, announcement: false }))} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold">Kanselahin</button>
                <button onClick={saveAnnouncement} className="px-4 py-2 bg-thesis-600 hover:bg-thesis-700 text-white rounded-xl font-bold shadow-md">I-post ang Advisory</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;