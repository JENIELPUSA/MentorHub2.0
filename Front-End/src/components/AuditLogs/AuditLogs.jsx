import React, { useState, useMemo, useEffect } from 'react';
import {
    Search,
    Download,
    RotateCw,
    SearchX,
    Eye,
    X,
    CheckCircle
} from 'lucide-react';

const initialAuditLogs = [
    {
        id: "LOG-9821",
        timestamp: "2026-06-06 14:22:10",
        severity: "INFO",
        user: "Prof. Evelyn Santos",
        role: "Mentor",
        module: "Capstone Defense",
        action: "Approved Final Capstone Proposal for Group 4 (Smart Agri-Drone)",
        ip: "192.168.1.45",
        payload: '{\n  "groupId": "GRP-2026-04",\n  "defenseScore": 94.5,\n  "remarks": "Excellent integration of IoT and Machine Learning."\n}'
    },
    {
        id: "LOG-9820",
        timestamp: "2026-06-06 13:55:04",
        severity: "WARNING",
        user: "Mark Anthony Reyes",
        role: "Student",
        module: "Authentication",
        action: "Multiple failed password attempts detected",
        ip: "202.128.44.12",
        payload: '{\n  "attemptCount": 3,\n  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",\n  "reason": "Invalid password"\n}'
    },
    {
        id: "LOG-9819",
        timestamp: "2026-06-06 12:10:45",
        severity: "INFO",
        user: "Dr. Ricardo Dalisay",
        role: "Department Chair",
        module: "Mentor Match",
        action: "Assigned Mentor Prof. Santos to Capstone Group 4",
        ip: "192.168.1.10",
        payload: '{\n  "mentorId": "MENTOR-012",\n  "capstoneGroupId": "GRP-2026-04"\n}'
    },
    {
        id: "LOG-9818",
        timestamp: "2026-06-06 10:04:30",
        severity: "CRITICAL",
        user: "System Daemon",
        role: "System",
        module: "Authentication",
        action: "Unauthorized API token access attempt on /api/v1/admin/export",
        ip: "45.33.32.156",
        payload: '{\n  "endpoint": "/api/v1/admin/export",\n  "tokenStatus": "EXPIRED",\n  "threatLevel": "HIGH"\n}'
    },
    {
        id: "LOG-9817",
        timestamp: "2026-06-06 09:45:12",
        severity: "INFO",
        user: "Sarah Jane Cruz",
        role: "Student",
        module: "Document Submission",
        action: "Uploaded Chapter 3: System Architecture & Methodology",
        ip: "122.54.12.89",
        payload: '{\n  "file": "Chapter3_Draft_v2.pdf",\n  "fileSizeBytes": 4194304,\n  "submissionId": "SUB-8832"\n}'
    },
    {
        id: "LOG-9816",
        timestamp: "2026-06-05 16:30:00",
        severity: "INFO",
        user: "Admin System",
        role: "Administrator",
        module: "User Management",
        action: "Registered new academic cohort for SY 2026-2027",
        ip: "192.168.1.1",
        payload: '{\n  "cohort": "2026-2027",\n  "totalAccountsCreated": 120\n}'
    },
    {
        id: "LOG-9815",
        timestamp: "2026-06-05 15:14:22",
        severity: "WARNING",
        user: "Prof. Evelyn Santos",
        role: "Mentor",
        module: "Document Submission",
        action: "Flagged plagiarized content in Chapter 2 review",
        ip: "192.168.1.45",
        payload: '{\n  "similarityIndex": "34%",\n  "documentId": "DOC-4401"\n}'
    },
    {
        id: "LOG-9814",
        timestamp: "2026-06-05 11:20:05",
        severity: "INFO",
        user: "Juan Dela Cruz",
        role: "Student",
        module: "Mentor Match",
        action: "Submitted mentor preference selection form",
        ip: "122.54.19.102",
        payload: '{\n  "preferredMentor1": "Prof. Evelyn Santos",\n  "preferredMentor2": "Dr. Alan Turing"\n}'
    }
];

export default function AuditLogs() {
    const [logs, setLogs] = useState(initialAuditLogs);
    const [searchQuery, setSearchQuery] = useState("");
    const [moduleFilter, setModuleFilter] = useState("");
    const [severityFilter, setSeverityFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("all");

    const [selectedLog, setSelectedLog] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesQuery =
                log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.ip.includes(searchQuery) ||
                log.id.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesModule = moduleFilter === "" || log.module === moduleFilter;
            const matchesSeverity = severityFilter === "" || log.severity === severityFilter;

            // Note: Date filter is mostly conceptual in this mock, 
            // but included to show structure.

            return matchesQuery && matchesModule && matchesSeverity;
        });
    }, [logs, searchQuery, moduleFilter, severityFilter]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
            setLogs([...initialAuditLogs]);
        }, 600);
    };

    const handleExport = () => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const resetFilters = () => {
        setSearchQuery("");
        setModuleFilter("");
        setSeverityFilter("");
        setDateFilter("all");
    };

    const getBadgeClasses = (severity) => {
        switch (severity) {
            case 'INFO':
                return 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900';
            case 'WARNING':
                return 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-200 dark:border-amber-900';
            case 'CRITICAL':
                return 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-900';
            default:
                return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans antialiased flex flex-col">
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

                {/* Header Title & Action Buttons */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Activity Audit Trail</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor system events, user actions, and security logs across the Capstone MentorHub platform.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExport}
                            className="hidden sm:inline-flex items-center space-x-2 px-3.5 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export CSV</span>
                        </button>
                        <button
                            onClick={handleRefresh}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition active:scale-95"
                        >
                            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span>Refresh Feed</span>
                        </button>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Search Box */}
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search action, user, or IP..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                        </div>

                        {/* Module Filter */}
                        <div>
                            <select
                                value={moduleFilter}
                                onChange={(e) => setModuleFilter(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            >
                                <option value="">All Modules</option>
                                <option value="Authentication">Authentication</option>
                                <option value="Mentor Match">Mentor Match</option>
                                <option value="Capstone Defense">Capstone Defense</option>
                                <option value="Document Submission">Document Submission</option>
                                <option value="User Management">User Management</option>
                            </select>
                        </div>

                        {/* Severity Filter */}
                        <div>
                            <select
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            >
                                <option value="">All Severities</option>
                                <option value="INFO">Info</option>
                                <option value="WARNING">Warning</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>

                        {/* Date Range Filter */}
                        <div>
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="week">Past 7 Days</option>
                            </select>
                        </div>
                    </div>

                    {/* Active filter chips & Reset */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50 text-xs text-slate-500">
                        <div className="flex items-center space-x-2">
                            <span>Showing <strong className="text-slate-800 dark:text-slate-200">{filteredLogs.length}</strong> of <strong className="text-slate-800 dark:text-slate-200">{logs.length}</strong> logs</span>
                        </div>
                        {(searchQuery || moduleFilter || severityFilter || dateFilter !== 'all') && (
                            <button onClick={resetFilters} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Data Table Container */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                                    <th className="py-3.5 px-4">Severity</th>
                                    <th className="py-3.5 px-4">Action Description</th>
                                    <th className="py-3.5 px-4">IP Address</th>
                                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map(log => (
                                        <tr
                                            key={log.id}
                                            onClick={() => setSelectedLog(log)}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition cursor-pointer"
                                        >
                                            <td className="py-3.5 px-4 sm:px-6 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                {log.timestamp}
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getBadgeClasses(log.severity)}`}>
                                                    {log.severity}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 max-w-sm truncate text-slate-700 dark:text-slate-300" title={log.action}>
                                                {log.action}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                {log.ip}
                                            </td>
                                            <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedLog(log);
                                                    }}
                                                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-500 transition"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="p-0 border-0">
                                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-full flex items-center justify-center mb-3">
                                                    <SearchX className="w-6 h-6" />
                                                </div>
                                                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No audit logs found</p>
                                                <p className="text-xs text-slate-500 mt-1">Try adjusting your filter or search query to find what you are looking for.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Page 1 of 1</span>
                        <div className="flex items-center space-x-2">
                            <button disabled className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 opacity-50 cursor-not-allowed">Previous</button>
                            <button disabled className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 opacity-50 cursor-not-allowed">Next</button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden transform transition-all">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center space-x-2">
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getBadgeClasses(selectedLog.severity)}`}>
                                    {selectedLog.severity}
                                </span>
                                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Log Entry: {selectedLog.id}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs text-slate-400 uppercase tracking-wider block">Timestamp</span>
                                    <p className="font-medium mt-0.5 text-slate-800 dark:text-slate-200">{selectedLog.timestamp}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 uppercase tracking-wider block">Module</span>
                                    <p className="font-medium mt-0.5 text-slate-800 dark:text-slate-200">{selectedLog.module}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 uppercase tracking-wider block">User & Role</span>
                                    <p className="font-medium mt-0.5 text-slate-800 dark:text-slate-200">{selectedLog.user} ({selectedLog.role})</p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 uppercase tracking-wider block">IP Address</span>
                                    <p className="font-medium mt-0.5 font-mono text-xs text-slate-800 dark:text-slate-200">{selectedLog.ip}</p>
                                </div>
                            </div>

                            <div>
                                <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Action Performed</span>
                                <p className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-medium text-slate-800 dark:text-slate-200">
                                    {selectedLog.action}
                                </p>
                            </div>

                            <div>
                                <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">System Payload / Metadata (JSON)</span>
                                <pre className="p-3.5 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                                    {selectedLog.payload}
                                </pre>
                            </div>
                        </div>

                        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {showToast && (
                <div className="fixed bottom-5 right-5 bg-slate-900 dark:bg-slate-700 text-white px-4 py-3 rounded-xl shadow-lg text-xs z-50 flex items-center space-x-2 transition animate-bounce">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Audit logs CSV downloaded successfully!</span>
                </div>
            )}
        </div>
    );
}