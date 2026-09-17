import React, { useState } from 'react';
import {
    Users,
    Search,
    Eye,
    CheckCircle2
} from 'lucide-react';

const ReferredUsersList = ({
    displayData,
    searchQuery,
    setSearchQuery,
    filteredUsers,
    formatDate,
    onViewUser
}) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Referred Users List
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Students who joined using referral code <strong>{displayData.group.referralCode}</strong>
                    </p>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search student name or email..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                            <th className="py-3 px-4">Student</th>
                            <th className="py-3 px-4">Username / Email</th>
                            <th className="py-3 px-4">Role</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Date Joined</th>
                            <th className="py-3 px-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-6 text-slate-400">
                                    No students found matching search filter.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user, index) => {
                                const userId = user.id || user._id || `temp-${index}`;
                                const firstName = user.first_name || '';
                                const lastName = user.last_name || '';
                                const middleName = user.middle_name || '';
                                const suffix = user.suffix || '';
                                const email = user.email || user.username || '';
                                const role = user.role || 'student';
                                const status = user.status || 'Active';
                                const createdAt = user.createdAt || '';
                                const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName} ${suffix}`.trim();

                                return (
                                    <tr key={userId} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                                                {firstName ? firstName[0] : '?'}{lastName ? lastName[0] : '?'}
                                            </div>
                                            <div>
                                                <div>{fullName || 'Unnamed User'}</div>
                                                <div className="text-[10px] text-slate-400 font-normal">ID: {userId.substring(0, 8)}...</div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                                            <div>{email}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">
                                                {role}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {formatDate(createdAt)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                onClick={() => onViewUser({ ...user, id: userId })}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Showing <strong>{filteredUsers.length}</strong> referred student(s)</span>
                <span className="italic">Source: Database Query</span>
            </div>
        </div>
    );
};

export default ReferredUsersList;