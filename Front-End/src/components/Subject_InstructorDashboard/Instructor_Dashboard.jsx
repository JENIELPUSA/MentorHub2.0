import React, { useState, useContext, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Users, FileText, CheckCircle2, Clock, ShieldCheck,
  PieChart as PieChartIcon, Layers, UserCheck, Search, ExternalLink,
  Loader2, ChevronLeft, ChevronRight, X, BookMarked, UserCog,
  Check, XCircle, AlertCircle,
  Eye, EyeOff,
} from 'lucide-react';

import { AuthContext } from '../../contexts/AuthContext';
import { StatisticalContext } from '../../contexts/StatisticalContext/StatisticalContext';
import Calendar from './calendar';
import UploadDocuments from '../AdminDashboard/UploadDocuments';

// ============================================================
// CONSTANTS
// ============================================================
const CHART_COLORS = [
  '#1E3A8A', // Blue 900 (dark)
  '#FBBF24', // Yellow 400
  '#3B82F6', // Blue 500 (medium)
  '#FCD34D', // Yellow 300 (light)
  '#1E40AF', // Blue 800 (darker)
  '#F59E0B', // Amber 500
];

const STATUS_BADGE_VARIANTS = {
  approved: 'bg-green-50 text-green-800 border-green-200',
  rejected: 'bg-red-50 text-red-800 border-red-200',
  pending: 'bg-yellow-50 text-yellow-800 border-yellow-200',
};

// ============================================================
// UTILITIES
// ============================================================
const formatRole = (role) => {
  if (!role) return '';
  return role
    .toLowerCase()
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
};

const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'NA';

// ============================================================
// DONUT CHART COMPONENT
// ============================================================
const DonutChart = ({ data = [], size = 180, innerRadius = 48 }) => {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  if (total === 0) return null;

  const radius = size / 2;
  const center = radius;
  let cumulativeAngle = -Math.PI / 2;

  const slices = data.map((d) => {
    const angle = (d.value / total) * Math.PI * 2;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    const ix1 = center + innerRadius * Math.cos(endAngle);
    const iy1 = center + innerRadius * Math.sin(endAngle);
    const ix2 = center + innerRadius * Math.cos(startAngle);
    const iy2 = center + innerRadius * Math.sin(startAngle);

    const donutPath = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');

    return {
      path: donutPath,
      color: d.color,
      label: d.label,
      value: d.value,
      percent: ((d.value / total) * 100).toFixed(1),
    };
  });

  return (
    <div className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
        {slices.map((slice, i) => (
          <path
            key={i}
            d={slice.path}
            fill={slice.color}
            stroke="#ffffff"
            strokeWidth="2"
            className="transition-all duration-300 hover:opacity-90 cursor-pointer"
          >
            <title>{`${slice.label}: ${slice.value} (${slice.percent}%)`}</title>
          </path>
        ))}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-extrabold text-blue-950">{total}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
          Members
        </span>
      </div>
    </div>
  );
};

// ============================================================
// SHARED COMPONENTS
// ============================================================
const StatusBadge = ({ status, label }) => {
  const key = (status || 'pending').toLowerCase();
  const variant = STATUS_BADGE_VARIANTS[key] || STATUS_BADGE_VARIANTS.pending;
  return (
    <span className={`capitalize px-2.5 py-1 rounded-lg border font-semibold ${variant}`}>
      {label}: {status}
    </span>
  );
};

const StatCard = ({ label, value, sublabel, icon: Icon, iconColor }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-200 transition-all">
    <div className="flex items-center justify-between text-slate-400 mb-2">
      <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
    <div>
      <div className="text-2xl font-bold text-blue-950">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{sublabel}</div>
    </div>
  </div>
);

const ModalShell = ({ children, maxWidth = 'max-w-2xl', zIndex = 'z-50' }) => (
  <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 bg-black/50`}>
    <div className={`bg-white rounded-2xl shadow-2xl ${maxWidth} w-full max-h-[92vh] overflow-hidden flex flex-col`}>
      {children}
    </div>
  </div>
);

// ============================================================
// GROUP DETAILS MODAL
// ============================================================
const GroupDetailsModal = ({ group, onClose, onApprove, onReject, isProcessing }) => {
  if (!group) return null;

  const members = Array.from({ length: group.studentCount || 0 }, (_, i) => ({
    id: i + 1,
    name: `Student ${i + 1}`,
    email: `student${i + 1}@bipsu.edu.ph`,
    role: 'Student',
  }));

  const subjectInstructor = {
    name: 'Dr. Jose Rizal',
    email: 'jose.rizal@bipsu.edu.ph',
    department: 'College of Education',
  };

  const currentStatus = group.adviserStatus || 'Pending';
  const isApproved = currentStatus.toLowerCase() === 'approved';
  const isRejected = currentStatus.toLowerCase() === 'rejected';

  return (
    <ModalShell maxWidth="max-w-2xl">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{group.groupName}</h2>
          <p className="text-sm text-gray-500">
            Code: <span className="font-mono">{group.referralCode}</span> • {group.studentCount} members
          </p>
        </div>
        <button onClick={onClose} disabled={isProcessing} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <UserCheck className="w-4 h-4" /> Members ({members.length})
          </h3>
          <div className="space-y-1.5">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold">
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-800 rounded border border-blue-200">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <UserCog className="w-4 h-4" /> Subject Instructor
          </h3>
          <div className="p-3 bg-gray-50 rounded border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-400 text-blue-900 flex items-center justify-center text-sm font-bold">
                {getInitials(subjectInstructor.name)}
              </div>
              <div>
                <p className="font-medium text-gray-800">{subjectInstructor.name}</p>
                <p className="text-xs text-gray-500">{subjectInstructor.email}</p>
                <p className="text-xs text-gray-500">{subjectInstructor.department}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
          <div>
            <span className="text-sm text-gray-600">Status</span>
            <span
              className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isApproved
                  ? 'bg-green-100 text-green-800'
                  : isRejected
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {currentStatus}
            </span>
          </div>
          <div className="flex gap-1.5">
            {group.isAdviser && (
              <span className="px-2 py-0.5 bg-blue-900 text-yellow-400 text-xs font-bold rounded">Adviser</span>
            )}
            {group.isCoAdviser && (
              <span className="px-2 py-0.5 bg-yellow-400 text-blue-950 text-xs font-bold rounded">Co-Adviser</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50"
        >
          Close
        </button>
        <button
          onClick={() => onApprove(group.groupId)}
          disabled={isProcessing || isApproved}
          className={`px-4 py-2 rounded text-sm font-semibold flex items-center gap-1.5 ${
            isApproved ? 'bg-green-100 text-green-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {isApproved ? 'Approved' : 'Approve'}
        </button>
        <button
          onClick={() => onReject(group.groupId)}
          disabled={isProcessing || isRejected}
          className={`px-4 py-2 rounded text-sm font-semibold flex items-center gap-1.5 ${
            isRejected ? 'bg-red-100 text-red-700 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          {isRejected ? 'Rejected' : 'Reject'}
        </button>
      </div>
    </ModalShell>
  );
};

// ============================================================
// MAIN DASHBOARD
// ============================================================
export default function Instructor_Dashboard() {
  const { role } = useContext(AuthContext);
  const { isLoading, Adviserdata } = useContext(StatisticalContext);

  // ----- UI state -----
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  // ----- Derived data -----
  const adviserCards = Adviserdata?.cards || {};
  const adviserGraphs = Adviserdata?.graphs || {};
  const adviserUserId = Adviserdata?.userId || '';

  const cards = useMemo(
    () => ({
      totalGroups: adviserCards.totalGroups || 0,
      totalUsers: adviserCards.totalUsers || 0,
      totalSections: adviserCards.totalSections || 0,
      totalRevisions: adviserCards.totalRevisions || 0,
      totalSubjects: adviserCards.totalSubjects || 0,
      withoutRemarks: (adviserCards.totalSections || 0) - (adviserCards.totalRevisions || 0),
    }),
    [adviserCards]
  );

  const adviserGroups = useMemo(
    () =>
      (adviserGraphs.groupPieData || []).map((group) => ({
        groupId: group.groupId,
        groupName: group.groupName,
        referralCode: group.referralCode,
        studentCount: group.userCount,
        adviserStatus: 'Approved',
        coadviserStatus: 'Approved',
        isAdviser: true,
        isCoAdviser: false,
      })),
    [adviserGraphs.groupPieData]
  );

  const totalGroupUsers = useMemo(
    () => (adviserGraphs.groupPieData || []).reduce((sum, g) => sum + g.userCount, 0),
    [adviserGraphs.groupPieData]
  );

  const filteredGroups = useMemo(
    () =>
      adviserGroups.filter(
        (g) =>
          g.groupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          g.referralCode?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [adviserGroups, searchTerm]
  );

  // ----- Pagination -----
  const totalItems = filteredGroups.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const indexOfLastItem = validCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGroups = useMemo(
    () => filteredGroups.slice(indexOfFirstItem, indexOfLastItem),
    [filteredGroups, indexOfFirstItem, indexOfLastItem]
  );

  // ----- Handlers -----
  const handleViewGroup = useCallback((group) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (isProcessing) return;
    setIsModalOpen(false);
    setSelectedGroup(null);
  }, [isProcessing]);

  const handleApprove = useCallback(
    async (groupId) => {
      setIsProcessing(true);
      try {
        await new Promise((r) => setTimeout(r, 1200));
        window.alert(`✅ Group has been approved!`);
        closeModal();
      } catch (err) {
        console.error('Error approving group:', err);
        window.alert('Failed to approve group. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [closeModal]
  );

  const handleReject = useCallback(
    async (groupId) => {
      setIsProcessing(true);
      try {
        await new Promise((r) => setTimeout(r, 1200));
        window.alert(`❌ Group has been rejected.`);
        closeModal();
      } catch (err) {
        console.error('Error rejecting group:', err);
        window.alert('Failed to reject group. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [closeModal]
  );

  const goToPage = useCallback(
    (pageNumber) => {
      setCurrentPage(Math.min(Math.max(1, pageNumber), totalPages));
    },
    [totalPages]
  );

  const handleItemsPerPageChange = useCallback((e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  }, []);

  // ----- ESC key closes group modal -----
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isModalOpen) closeModal();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isModalOpen, closeModal]);

  // ============================================================
  // EARLY RETURNS
  // ============================================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-900 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!Adviserdata) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No adviser data available</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ---------- HEADER ---------- */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-full uppercase tracking-wider border border-blue-200">
                Active
              </span>
              <span className="text-slate-400 text-sm">
                • ID: {adviserUserId?.substring(0, 10) || 'N/A'}...
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-blue-900 tracking-tight">
              BiPSU {formatRole(role)} Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">Adviser / Co-Adviser Dashboard</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 text-yellow-400 rounded-xl text-sm font-bold shadow-sm">
              <ShieldCheck className="w-4 h-4 text-yellow-400" /> Adviser
            </span>
          </div>
        </header>

        {/* ---------- STATS ---------- */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Groups" value={cards.totalGroups} sublabel="Assigned groups" icon={Layers} iconColor="text-blue-800" />
          <StatCard label="Users" value={cards.totalUsers} sublabel="Associated users" icon={Users} iconColor="text-blue-700" />
          <StatCard label="Sections" value={cards.totalSections} sublabel="Total sections" icon={FileText} iconColor="text-blue-900" />
          <StatCard label="Subjects" value={cards.totalSubjects} sublabel="Total subjects" icon={BookMarked} iconColor="text-blue-600" />
          <StatCard label="Revisions" value={cards.totalRevisions} sublabel="With revisions" icon={CheckCircle2} iconColor="text-yellow-600" />
          <StatCard label="No Revision" value={cards.withoutRemarks} sublabel="Clean sections" icon={Clock} iconColor="text-yellow-500" />
        </div>

        {/* ---------- UPLOAD DOCUMENTS SECTION ---------- */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
          {/* Header with Show/Hide button */}
          <button
            type="button"
            onClick={() => setShowUpload((prev) => !prev)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors duration-200"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-900" />
              <span className="text-sm font-semibold text-blue-950">
                Upload Documents
              </span>
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                • Manage proposal attachments
              </span>
            </div>

            <span
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all duration-300 ${
                showUpload
                  ? 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {showUpload ? (
                <>
                  <EyeOff className="w-3 h-3" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  Show
                </>
              )}
            </span>
          </button>

          {/* Collapsible body */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              showUpload
                ? 'max-h-[2000px] opacity-100'
                : 'max-h-0 opacity-0 overflow-hidden'
            }`}
          >
            <div className="px-4 pb-4 pt-1 border-t border-slate-100">
              <UploadDocuments isLoading={isLoading} />
            </div>
          </div>
        </div>

        {/* ---------- ANALYTICS + CALENDAR ---------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Group Distribution — PIE / DONUT CHART */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 flex flex-col">
            <h3 className="text-lg font-bold text-blue-950 flex items-center gap-2 mb-4">
              <PieChartIcon className="w-5 h-5 text-blue-900" /> Group Distribution
            </h3>

            <div className="flex justify-center my-2">
              {(adviserGraphs.groupPieData || []).length > 0 ? (
                <DonutChart
                  data={(adviserGraphs.groupPieData || []).map((g, idx) => ({
                    label: g.groupName,
                    value: g.userCount,
                    color: CHART_COLORS[idx % CHART_COLORS.length],
                  }))}
                  size={180}
                  innerRadius={48}
                />
              ) : (
                <div className="text-center text-slate-400 text-xs py-12">
                  No group data available
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2 flex-1">
              {(adviserGraphs.groupPieData || []).map((group, idx) => {
                const percentage =
                  totalGroupUsers > 0 ? Math.round((group.userCount / totalGroupUsers) * 100) : 0;
                const color = CHART_COLORS[idx % CHART_COLORS.length];

                return (
                  <div key={group.groupId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-slate-700 truncate font-medium">{group.groupName}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-slate-900">{group.userCount}</span>
                      <span className="text-slate-400 text-[11px]">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 flex justify-between items-center">
              <span>Total groups tracked</span>
              <span className="font-semibold text-blue-900">{cards.totalGroups} groups</span>
            </div>
          </div>

          {/* CALENDAR */}
          <Calendar />
        </div>

        {/* ---------- GROUPS TABLE ---------- */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
          <div className="p-6 border-b border-blue-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-blue-950">Assigned Groups</h3>
              <p className="text-slate-500 text-sm mt-0.5">
                Manage groups where you are assigned as adviser or co-adviser.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search group or code..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 w-full sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-900/5 border-b border-blue-100 text-xs uppercase tracking-wider text-blue-950 font-bold">
                  <th className="py-4 px-6">Group Name</th>
                  <th className="py-4 px-6">Referral Code</th>
                  <th className="py-4 px-6">Members</th>
                  <th className="py-4 px-6">Role Assignment</th>
                  <th className="py-4 px-6">Statuses</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {currentGroups.length > 0 ? (
                  currentGroups.map((group) => (
                    <tr key={group.groupId} className="hover:bg-blue-50/25 transition-colors">
                      <td className="py-4 px-6 font-bold text-blue-950">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-900 text-yellow-400 flex items-center justify-center font-extrabold text-xs shadow-sm">
                            {getInitials(group.groupName)}
                          </div>
                          {group.groupName}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <code className="px-2 py-1 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg text-xs font-mono font-bold">
                          {group.referralCode}
                        </code>
                      </td>
                      <td className="py-4 px-6 text-slate-700 font-semibold">
                        {group.studentCount} {group.studentCount === 1 ? 'member' : 'members'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-1.5 flex-wrap">
                          {group.isAdviser && (
                            <span className="px-2.5 py-0.5 bg-blue-900 text-yellow-400 text-xs font-bold rounded-md">Adviser</span>
                          )}
                          {group.isCoAdviser && (
                            <span className="px-2.5 py-0.5 bg-yellow-400 text-blue-950 text-xs font-bold rounded-md">Co-Adviser</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2 items-center text-xs">
                          <StatusBadge status={group.adviserStatus} label="Adviser" />
                          <StatusBadge status={group.coadviserStatus} label="Co" />
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleViewGroup(group)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-yellow-400 font-bold text-xs rounded-xl shadow-sm"
                        >
                          View <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No groups found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredGroups.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="px-2 py-1 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>entries</span>
                <span className="hidden sm:inline ml-2">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} groups
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(validCurrentPage - 1)}
                  disabled={validCurrentPage === 1}
                  className={`p-2 rounded-lg border ${
                    validCurrentPage === 1
                      ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                      : 'border-slate-300 text-slate-700 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) pageNumber = i + 1;
                    else if (validCurrentPage <= 3) pageNumber = i + 1;
                    else if (validCurrentPage >= totalPages - 2) pageNumber = totalPages - 4 + i;
                    else pageNumber = validCurrentPage - 2 + i;

                    return (
                      <button
                        key={i}
                        onClick={() => goToPage(pageNumber)}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold ${
                          validCurrentPage === pageNumber
                            ? 'bg-blue-900 text-yellow-400 shadow-sm'
                            : 'text-slate-600 hover:bg-blue-50 hover:text-blue-900'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => goToPage(validCurrentPage + 1)}
                  disabled={validCurrentPage === totalPages || totalPages === 0}
                  className={`p-2 rounded-lg border ${
                    validCurrentPage === totalPages || totalPages === 0
                      ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                      : 'border-slate-300 text-slate-700 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------- GROUP DETAILS MODAL ---------- */}
      {isModalOpen && (
        <GroupDetailsModal
          group={selectedGroup}
          onClose={closeModal}
          onApprove={handleApprove}
          onReject={handleReject}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}