import React, { useState, useContext } from 'react';
import {
    Users,
    FileText,
    CheckCircle2,
    Clock,
    ShieldCheck,
    BarChart3,
    PieChart as PieChartIcon,
    Layers,
    UserCheck,
    Search,
    ExternalLink,
    Loader2,
    ChevronLeft,
    ChevronRight,
    X,
    User,
    Mail,
    BookOpen,
    UserCog,
    Check,
    XCircle,
    AlertCircle
} from 'lucide-react';

import { AuthContext } from '../../contexts/AuthContext';
import { StatisticalContext } from '../../contexts/StatisticalContext/StatisticalContext';

export default function AdCoAdviserDashboard() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const { role } = useContext(AuthContext);
    const { dashboardData, isLoading } = useContext(StatisticalContext);

    // Helper function para i-format ang role
    const formatRole = (role) => {
        if (!role) return '';
        return role
            .toLowerCase()
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('-');
    };

    // Handle view group details
    const handleViewGroup = (group) => {
        setSelectedGroup(group);
        setIsModalOpen(true);
    };

    // Close modal
    const closeModal = () => {
        if (isProcessing) return;
        setIsModalOpen(false);
        setSelectedGroup(null);
    };

    // Handle Approve
    const handleApprove = async (groupId) => {
        setIsProcessing(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Update the group status in the local data
            // In real implementation, this will be an API call
            alert(`✅ Group ${selectedGroup?.groupName} has been approved!`);
            
            // Close modal after successful approval
            closeModal();
        } catch (error) {
            console.error('Error approving group:', error);
            alert('Failed to approve group. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle Reject
    const handleReject = async (groupId) => {
        setIsProcessing(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Update the group status in the local data
            // In real implementation, this will be an API call
            alert(`❌ Group ${selectedGroup?.groupName} has been rejected.`);
            
            // Close modal after successful rejection
            closeModal();
        } catch (error) {
            console.error('Error rejecting group:', error);
            alert('Failed to reject group. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Loading state
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

    // Check if data exists
    if (!dashboardData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-600 font-medium">No data available</p>
                </div>
            </div>
        );
    }

    const { 
        cards, 
        graphs, 
        groups, 
        isAdviser, 
        isCoAdviser, 
        userId,
        status,
        message
    } = dashboardData;

    // Filter groups based on search term
    const filteredGroups = groups?.filter(g =>
        g.groupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.referralCode?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    // PAGINATION LOGIC - Front-end only
    const totalItems = filteredGroups.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Ensure current page is valid
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);
    
    // Get current items for display
    const indexOfLastItem = validCurrentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentGroups = filteredGroups.slice(indexOfFirstItem, indexOfLastItem);

    // Change page
    const goToPage = (pageNumber) => {
        setCurrentPage(Math.min(Math.max(1, pageNumber), totalPages || 1));
    };

    // Handle items per page change
    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1); // Reset to first page
    };

    const renderPieSlices = (trend) => {
        const total = trend.total || 1;
        const slices = [
            { label: 'Approved', count: trend.approved || 0, color: '#1E3A8A' },
            { label: 'Pending', count: trend.pending || 0, color: '#FBBF24' },
            { label: 'Other', count: (trend.rejected || 0) + (trend.revision || 0), color: '#93C5FD' }
        ].filter(s => s.count > 0);

        if (slices.length === 0) return null;

        let cumulativeAngle = 0;
        const radius = 40;
        const center = 50;

        return (
            <svg viewBox="0 0 100 100" className="w-28 h-28 transform -rotate-90 drop-shadow-sm flex-shrink-0">
                {slices.map((slice, index) => {
                    const percentage = slice.count / total;
                    const angle = percentage * 360;
                    const x1 = center + radius * Math.cos((Math.PI * cumulativeAngle) / 180);
                    const y1 = center + radius * Math.sin((Math.PI * cumulativeAngle) / 180);

                    cumulativeAngle += angle;

                    const x2 = center + radius * Math.cos((Math.PI * cumulativeAngle) / 180);
                    const y2 = center + radius * Math.sin((Math.PI * cumulativeAngle) / 180);

                    const largeArcFlag = angle > 180 ? 1 : 0;

                    const pathData = slices.length === 1
                        ? `M ${center} ${center} m -${radius} 0 a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 -${radius * 2} 0`
                        : `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                    return (
                        <path
                            key={index}
                            d={pathData}
                            fill={slice.color}
                            className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                        >
                            <title>{`${slice.label}: ${slice.count} (${Math.round(percentage * 100)}%)`}</title>
                        </path>
                    );
                })}
                <circle cx={center} cy={center} r="20" className="fill-white" />
            </svg>
        );
    };

    // Group Details Modal Component - Simplified Version
    const GroupDetailsModal = ({ group, onClose }) => {
        if (!group) return null;

        // Mock data for members and subject instructor
        const members = [
            { id: 1, name: 'Juan Dela Cruz', email: 'juan.delacruz@bipsu.edu.ph', role: 'Student' },
            { id: 2, name: 'Maria Santos', email: 'maria.santos@bipsu.edu.ph', role: 'Student' },
            { id: 3, name: 'Pedro Reyes', email: 'pedro.reyes@bipsu.edu.ph', role: 'Student' },
            { id: 4, name: 'Ana Garcia', email: 'ana.garcia@bipsu.edu.ph', role: 'Student' },
        ];

        const subjectInstructor = {
            name: 'Dr. Jose Rizal',
            email: 'jose.rizal@bipsu.edu.ph',
            department: 'College of Education'
        };

        const currentStatus = group.adviserStatus || 'Pending';
        const isApproved = currentStatus.toLowerCase() === 'approved';
        const isRejected = currentStatus.toLowerCase() === 'rejected';

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">{group.groupName}</h2>
                            <p className="text-sm text-gray-500">
                                Code: <span className="font-mono">{group.referralCode}</span> • {group.studentCount} members
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="p-1.5 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
                        {/* Members List */}
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <UserCheck className="w-4 h-4" />
                                Members ({members.length})
                            </h3>
                            <div className="space-y-1.5">
                                {members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold">
                                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
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

                        {/* Subject Instructor */}
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <UserCog className="w-4 h-4" />
                                Subject Instructor
                            </h3>
                            <div className="p-3 bg-gray-50 rounded border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-yellow-400 text-blue-900 flex items-center justify-center text-sm font-bold">
                                        {subjectInstructor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{subjectInstructor.name}</p>
                                        <p className="text-xs text-gray-500">{subjectInstructor.email}</p>
                                        <p className="text-xs text-gray-500">{subjectInstructor.department}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
                            <div>
                                <span className="text-sm text-gray-600">Status</span>
                                <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    isApproved ? 'bg-green-100 text-green-800' :
                                    isRejected ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {currentStatus}
                                </span>
                            </div>
                            <div className="flex gap-1.5">
                                {group.isAdviser && (
                                    <span className="px-2 py-0.5 bg-blue-900 text-yellow-400 text-xs font-bold rounded">
                                        Adviser
                                    </span>
                                )}
                                {group.isCoAdviser && (
                                    <span className="px-2 py-0.5 bg-yellow-400 text-blue-950 text-xs font-bold rounded">
                                        Co-Adviser
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer - Action Buttons */}
                    <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => handleApprove(group.groupId)}
                            disabled={isProcessing || isApproved}
                            className={`px-4 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                                isApproved
                                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {isApproved ? 'Approved' : 'Approve'}
                        </button>
                        <button
                            onClick={() => handleReject(group.groupId)}
                            disabled={isProcessing || isRejected}
                            className={`px-4 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                                isRejected
                                    ? 'bg-red-100 text-red-700 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            {isRejected ? 'Rejected' : 'Reject'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header & Status Banner */}
                <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-3 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-full uppercase tracking-wider border border-blue-200">
                                {status || 'Active'}
                            </span>
                            <span className="text-slate-400 text-sm">• ID: {userId?.substring(0, 10) || 'N/A'}...</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-blue-900 tracking-tight">
                            BiPSU {formatRole(role)} Dashboard
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">{message || 'Adviser / Co-Adviser Dashboard'}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {isAdviser && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 text-yellow-400 rounded-xl text-sm font-bold shadow-sm">
                                <ShieldCheck className="w-4 h-4 text-yellow-400" /> Adviser
                            </span>
                        )}
                        {isCoAdviser && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 text-blue-900 rounded-xl text-sm font-bold shadow-sm">
                                <UserCheck className="w-4 h-4 text-blue-900" /> Co-Adviser
                            </span>
                        )}
                    </div>
                </header>

                {/* Quick Stats Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-200 transition-all">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Titles</span>
                            <FileText className="w-5 h-5 text-blue-900" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-950">{cards?.totalTitles || 0}</div>
                            <div className="text-xs text-slate-500 mt-1">Total submitted</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-200 transition-all">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Groups</span>
                            <Layers className="w-5 h-5 text-blue-800" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-950">{cards?.totalGroups || 0}</div>
                            <div className="text-xs text-slate-500 mt-1">Active teams</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-200 transition-all">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Users</span>
                            <Users className="w-5 h-5 text-blue-700" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-950">{cards?.totalUsers || 0}</div>
                            <div className="text-xs text-slate-500 mt-1">Associated users</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-200 transition-all">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Students</span>
                            <UserCheck className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-950">{cards?.totalStudents || 0}</div>
                            <div className="text-xs text-slate-500 mt-1">Enrolled students</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-200 transition-all">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Remarks</span>
                            <CheckCircle2 className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-950">{cards?.withRemarks || 0}</div>
                            <div className="text-xs text-slate-500 mt-1">With feedback</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-200 transition-all">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">No Remarks</span>
                            <Clock className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-950">{cards?.withoutRemarks || 0}</div>
                            <div className="text-xs text-slate-500 mt-1">Pending feedback</div>
                        </div>
                    </div>
                </div>

                {/* Analytics & Graphs Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Status Breakdown with BiPSU Theme Colors */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-blue-950 flex items-center gap-2 mb-4">
                                <BarChart3 className="w-5 h-5 text-blue-900" /> Status Breakdown
                            </h3>

                            <div className="space-y-4 my-2">
                                {graphs?.statusBreakdown?.map((item, idx) => {
                                    // Map status to BiPSU theme colors
                                    const statusColors = {
                                        'Approved': { bar: '#1E3A8A', text: 'text-blue-900', bg: 'bg-blue-50' },
                                        'approved': { bar: '#1E3A8A', text: 'text-blue-900', bg: 'bg-blue-50' },
                                        'Pending': { bar: '#FBBF24', text: 'text-yellow-700', bg: 'bg-yellow-50' },
                                        'pending': { bar: '#FBBF24', text: 'text-yellow-700', bg: 'bg-yellow-50' },
                                        'Rejected': { bar: '#EF4444', text: 'text-red-700', bg: 'bg-red-50' },
                                        'rejected': { bar: '#EF4444', text: 'text-red-700', bg: 'bg-red-50' },
                                        'Revision': { bar: '#F59E0B', text: 'text-amber-700', bg: 'bg-amber-50' },
                                        'revision': { bar: '#F59E0B', text: 'text-amber-700', bg: 'bg-amber-50' },
                                    };

                                    const colors = statusColors[item.status] || { 
                                        bar: item.color || '#6B7280', 
                                        text: 'text-gray-700', 
                                        bg: 'bg-gray-50' 
                                    };

                                    return (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className={`font-medium ${colors.text}`}>
                                                    {item.status}
                                                </span>
                                                <span className="text-slate-600 font-bold">
                                                    {item.count} ({item.percentage}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500 shadow-sm"
                                                    style={{ 
                                                        width: `${item.percentage}%`, 
                                                        backgroundColor: colors.bar 
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 flex justify-between items-center">
                            <span>Total titles tracked</span>
                            <span className="font-semibold text-blue-900">{cards?.totalTitles || 0} items</span>
                        </div>
                    </div>

                    {/* Monthly Trends */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 lg:col-span-2 flex flex-col justify-between">
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-blue-950 flex items-center gap-2">
                                        <PieChartIcon className="w-5 h-5 text-blue-900" /> Monthly Trends
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Scroll horizontally to view all active months</p>
                                </div>
                                <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 bg-blue-50/60 px-3.5 py-2 rounded-xl border border-blue-100">
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-900 rounded-full"></span> Approved</span>
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-yellow-400 rounded-full border border-yellow-500"></span> Pending</span>
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-300 rounded-full"></span> Other</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto pb-3 pt-1">
                                <div className="flex gap-4 min-w-max">
                                    {graphs?.monthlyTrends?.map((trend, idx) => (
                                        <div key={idx} className="w-72 p-4 rounded-2xl bg-gradient-to-b from-blue-50/40 to-white border border-blue-100/80 flex items-center gap-4 shadow-sm flex-shrink-0 hover:shadow-md transition-all">
                                            <div className="relative flex-shrink-0 flex items-center justify-center">
                                                {renderPieSlices(trend)}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                    <span className="text-xs font-extrabold text-blue-950">{trend.total}</span>
                                                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Total</span>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 flex-grow">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-extrabold text-blue-950 text-sm">{trend.month}</h4>
                                                </div>
                                                <div className="space-y-1 text-xs text-slate-600">
                                                    <div className="flex justify-between items-center">
                                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-900"></span> Appr.</span>
                                                        <span className="font-bold text-blue-950">{trend.approved || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 border border-yellow-500"></span> Pend.</span>
                                                        <span className="font-bold text-blue-950">{trend.pending || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-300"></span> Other</span>
                                                        <span className="font-bold text-blue-950">{(trend.rejected || 0) + (trend.revision || 0)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 flex justify-between items-center">
                            <span>Showing {graphs?.monthlyTrends?.length || 0} months breakdown</span>
                            <span className="font-bold text-blue-900">Horizontally Scrollable</span>
                        </div>
                    </div>

                </div>

                {/* Groups Management Section with Front-end Pagination */}
                <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
                    <div className="p-6 border-b border-blue-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-blue-950">Assigned Groups</h3>
                            <p className="text-slate-500 text-sm mt-0.5">Manage groups where you are assigned as adviser or co-adviser.</p>
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
                                    <th className="py-4 px-6">Students</th>
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
                                                        {group.groupName?.substring(0, 2).toUpperCase() || 'NA'}
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
                                                {group.studentCount} {group.studentCount === 1 ? 'student' : 'students'}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {group.isAdviser && (
                                                        <span className="px-2.5 py-0.5 bg-blue-900 text-yellow-400 text-xs font-bold rounded-md shadow-xs">
                                                            Adviser
                                                        </span>
                                                    )}
                                                    {group.isCoAdviser && (
                                                        <span className="px-2.5 py-0.5 bg-yellow-400 text-blue-950 text-xs font-bold rounded-md shadow-xs">
                                                            Co-Adviser
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex gap-2 items-center text-xs">
                                                    <span className={`capitalize px-2.5 py-1 rounded-lg border font-semibold ${
                                                        group.adviserStatus?.toLowerCase() === 'approved' 
                                                            ? 'bg-green-50 text-green-800 border-green-200'
                                                            : group.adviserStatus?.toLowerCase() === 'rejected'
                                                            ? 'bg-red-50 text-red-800 border-red-200'
                                                            : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                                                    }`}>
                                                        Adviser: {group.adviserStatus}
                                                    </span>
                                                    <span className={`capitalize px-2.5 py-1 rounded-lg border font-semibold ${
                                                        group.coadviserStatus?.toLowerCase() === 'approved' 
                                                            ? 'bg-green-50 text-green-800 border-green-200'
                                                            : group.coadviserStatus?.toLowerCase() === 'rejected'
                                                            ? 'bg-red-50 text-red-800 border-red-200'
                                                            : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                                                    }`}>
                                                        Co: {group.coadviserStatus}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => handleViewGroup(group)}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-yellow-400 font-bold text-xs rounded-xl transition-all shadow-sm"
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

                    {/* Front-end Pagination Controls */}
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
                                    className={`p-2 rounded-lg border transition-all ${
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
                                        if (totalPages <= 5) {
                                            pageNumber = i + 1;
                                        } else if (validCurrentPage <= 3) {
                                            pageNumber = i + 1;
                                        } else if (validCurrentPage >= totalPages - 2) {
                                            pageNumber = totalPages - 4 + i;
                                        } else {
                                            pageNumber = validCurrentPage - 2 + i;
                                        }
                                        
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => goToPage(pageNumber)}
                                                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
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
                                    className={`p-2 rounded-lg border transition-all ${
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

            {/* Group Details Modal */}
            <GroupDetailsModal 
                group={selectedGroup} 
                onClose={closeModal} 
            />
        </div>
    );
}