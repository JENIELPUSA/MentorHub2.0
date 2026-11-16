import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import {
    Users,
    Search,
    Plus,
    Eye,
    ChevronLeft,
    ChevronRight,
    X,
    CheckCircle2,
    Pencil,
    KeyRound,
    Copy,
    Check,
} from 'lucide-react';

import { DepartmentContext } from '../../contexts/DepartmentContext/DepartmentContext';
import { UserDisplayContext } from '../../contexts/UserManagementContext/UserManagementContext';
import { StudentContext } from '../../contexts/StudentContext/StudentContext';
import AddUserModal from './AddUserModal';

export default function UserManagement() {
    const {
        useraccount,
        isLoading: contextLoading,
        pagination,
        fetchUsersWithLogin,
    } = useContext(StudentContext);
    const { AddUser, UpdateUser } = useContext(UserDisplayContext);
    const { departments } = useContext(DepartmentContext);

    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [departmentFilter, setDepartmentFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [isLocalLoading, setIsLocalLoading] = useState(true);

    const [viewUser, setViewUser] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [editingUser, setEditingUser] = useState(null);

    // ── Password view state (admin-only) ──
    const [viewPasswordUser, setViewPasswordUser] = useState(null);
    const [copied, setCopied] = useState(false);

    // ── Toast auto-dismiss with cleanup ──
    const toastTimerRef = useRef(null);
    const showNotification = useCallback((msg, isError = false) => {
        setToastMessage({ msg, isError });
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToastMessage(null), 3000);
    }, []);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, []);

    // ── Map useraccount data to display format ──
    const mapUserAccountToDisplay = (account) => {
        if (!account) return null;

        const departmentData = account.department || {};

        const fullName = [
            account.first_name,
            account.middle_name,
            account.last_name,
            account.suffix,
        ].filter(Boolean).join(' ');

        const roleMap = {
            'student': 'Student',
            'subject_instructor': 'Subject Instructor',
            'panelist': 'Panelist',
            'adviser': 'Adviser',
            'admin': 'Admin',
        };

        const statusMap = {
            'approved': 'Active',
            'pending': 'Pending',
            'rejected': 'Inactive',
            'suspended': 'Inactive',
            'Active': 'Active',
            'Inactive': 'Inactive',
        };

        const rawRole = account.role || 'student';
        const displayRole = roleMap[rawRole.toLowerCase()] || rawRole || 'Student';

        const rawStatus = account.status || account.statusAccount || 'Active';
        const displayStatus = statusMap[rawStatus] || 'Active';

        const username = account.username || account.login?.username || account.email || '';

        const avatarUrl = account.avatar?.url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'User')}&background=1e3a8a&color=facc15`;

        const multipleroleRaw = Array.isArray(account.multiplerole)
            ? account.multiplerole
            : [];
        const multiplerole = multipleroleRaw.map((r) => roleMap[r] || r);

        return {
            id: account._id,
            firstName: account.first_name || '',
            middleName: account.middle_name || '',
            lastName: account.last_name || '',
            suffix: account.suffix || '',
            name: fullName || 'Unnamed User',
            email: account.email || '',
            username: username,
            phone: account.contactNumber || '',
            role: displayRole,
            department: departmentData.departmentName || 'No Department',
            departmentId: departmentData._id || account.departmentId || '',
            status: displayStatus,
            avatar: avatarUrl,
            dateAdded: account.createdAt ? new Date(account.createdAt).toISOString().split('T')[0] : 'N/A',
            rawData: account,
            isActive: account.isActive !== undefined ? account.isActive : true,
            isVerified: account.isVerified || false,
            statusAccount: account.statusAccount || account.status || 'pending',
            roleBackend: rawRole.toLowerCase(),
            multiplerole,
            multipleroleRaw,

            // ⬇️ plaintext password from DisplayAllData
            actualpassword: account.actualpassword || null,
        };
    };

    useEffect(() => {
        setIsLocalLoading(true);
        if (useraccount && Array.isArray(useraccount)) {
            const mappedUsers = useraccount
                .map((account) => mapUserAccountToDisplay(account))
                .filter(Boolean);
            setUsers(mappedUsers);
        } else {
            setUsers([]);
        }
        setIsLocalLoading(false);
    }, [useraccount]);

    const buildFilterParams = useCallback(() => {
        const params = {
            page: currentPage,
            limit: itemsPerPage,
        };

        if (searchTerm) params.search = searchTerm;

        const roleMapToBackend = {
            'Student': 'student',
            'Subject Instructor': 'subject_instructor',
            'Panelist': 'panelist',
            'Adviser': 'adviser',
            'Admin': 'admin',
        };

        if (roleFilter !== 'All') {
            params.role = roleMapToBackend[roleFilter] || roleFilter.toLowerCase();
        }

        if (departmentFilter !== 'All') {
            const selectedDept = departments.find((dept) => dept.departmentName === departmentFilter);
            if (selectedDept) params.departmentId = selectedDept._id;
        }

        if (statusFilter !== 'All') {
            if (statusFilter === 'Active') params.statusAccount = 'approved';
            else if (statusFilter === 'Pending') params.statusAccount = 'pending';
            else if (statusFilter === 'Inactive') params.statusAccount = 'rejected';
        }

        return params;
    }, [currentPage, itemsPerPage, searchTerm, roleFilter, departmentFilter, statusFilter, departments]);

    useEffect(() => {
        const params = buildFilterParams();
        fetchUsersWithLogin(params);
    }, [currentPage, itemsPerPage, searchTerm, roleFilter, departmentFilter, statusFilter, fetchUsersWithLogin, buildFilterParams]);

    // ── Add / Update submit ──
    const handleAddUserSubmit = async (payload, formData) => {
        if (!payload || payload.success === false) {
            showNotification(`${payload?.error || 'Please check the form.'}`, true);
            return { success: false };
        }

        const fullName = [
            formData.firstName,
            formData.middleName,
            formData.lastName,
            formData.suffix,
        ].filter(Boolean).join(' ');

        setIsSaving(true);
        try {
            const result = editingUser
                ? await UpdateUser(editingUser.id, payload)
                : await AddUser(payload);

            if (result.success) {
                showNotification(
                    editingUser
                        ? `Successfully updated ${fullName}!`
                        : `Successfully added ${fullName}!`
                );
                setIsAddModalOpen(false);
                setEditingUser(null);
                const params = buildFilterParams();
                fetchUsersWithLogin(params);
                return { success: true };
            } else {
                showNotification(
                    `Failed to ${editingUser ? 'update' : 'add'} user: ${result.error || 'Unknown error'}`,
                    true
                );
                return { success: false };
            }
        } catch (error) {
            console.error(`Error ${editingUser ? 'updating' : 'adding'} user:`, error);
            showNotification(
                `Failed to ${editingUser ? 'update' : 'add'} user: ${error.message || 'Unknown error'}`,
                true
            );
            return { success: false };
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setIsAddModalOpen(true);
    };

    // ── View password — direkta na sa user object ──
    const handleViewPassword = (user) => {
        setViewPasswordUser(user);
        setCopied(false);
    };

    const closePasswordModal = () => {
        setViewPasswordUser(null);
        setCopied(false);
    };

    const handleCopyPassword = async () => {
        if (!viewPasswordUser?.actualpassword) return;
        try {
            await navigator.clipboard.writeText(viewPasswordUser.actualpassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const totalPages = pagination?.totalPages || 1;
    const totalCount = pagination?.totalCount || 0;

    const getRoleBadge = (role) => {
        switch (role) {
            case 'Student':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Subject Instructor':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Panelist':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Adviser':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Admin':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-blue-50 text-blue-700 border-blue-200';
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleItemsPerPageChange = (e) => {
        const newLimit = parseInt(e.target.value);
        setItemsPerPage(newLimit);
        setCurrentPage(1);
    };

    const isLoading = contextLoading || isLocalLoading;

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-sky-50 text-blue-900 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Bar */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-900 text-yellow-300 rounded-xl shadow-sm">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold text-blue-950 tracking-tight">User Directory</h1>
                                <p className="text-xs text-blue-600 mt-0.5">
                                    Manage academic user accounts, roles, and status
                                    {totalCount > 0 && (
                                        <span className="ml-2 text-blue-900 font-semibold">
                                            ({totalCount} total users)
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setEditingUser(null);
                            setIsAddModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-950 active:bg-black text-white font-semibold text-sm rounded-xl shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Add User</span>
                    </button>
                </header>

                {/* Toast Notification */}
                {toastMessage && (
                    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 text-white text-xs font-medium rounded-xl shadow-2xl animate-bounce ${toastMessage.isError ? 'bg-red-600' : 'bg-blue-900'}`}>
                        <CheckCircle2 className={`w-4 h-4 ${toastMessage.isError ? 'text-red-200' : 'text-yellow-300'}`} />
                        <span>{toastMessage.msg}</span>
                    </div>
                )}

                {/* Search & Filter Bar */}
                <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

                        <div className="relative md:col-span-1">
                            <Search className="w-4 h-4 absolute left-3.5 top-3 text-blue-400" />
                            <input
                                type="text"
                                placeholder="Search name, email, username..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 placeholder:text-blue-400 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-white transition"
                            />
                        </div>

                        <div>
                            <select
                                value={roleFilter}
                                onChange={(e) => {
                                    setRoleFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-medium text-blue-900 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                            >
                                <option value="All">All Roles</option>
                                <option value="Student">Student</option>
                                <option value="Subject Instructor">Subject Instructor</option>
                                <option value="Panelist">Panelist</option>
                                <option value="Adviser">Adviser</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={departmentFilter}
                                onChange={(e) => {
                                    setDepartmentFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-medium text-blue-900 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                            >
                                <option value="All">All Departments</option>
                                {departments.map((dept) => (
                                    <option key={dept._id} value={dept.departmentName}>
                                        {dept.departmentName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-medium text-blue-900 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Pending">Pending</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>

                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-900 rounded-full animate-spin"></div>
                                <span className="text-sm text-blue-600">Loading users...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-blue-100 border-b-2 border-yellow-400 text-[11px] uppercase tracking-wider text-blue-950 font-bold">
                                            <th className="py-3.5 px-4">User</th>
                                            <th className="py-3.5 px-4">Username</th>
                                            <th className="py-3.5 px-4">Role</th>
                                            <th className="py-3.5 px-4">Department</th>
                                            <th className="py-3.5 px-4">Status</th>
                                            <th className="py-3.5 px-4">Date Added</th>
                                            <th className="py-3.5 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-blue-100 text-xs">
                                        {users.length > 0 ? (
                                            users.map((user) => (
                                                <tr key={user.id} className="odd:bg-white even:bg-blue-50/60 hover:bg-yellow-50 transition">
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={user.avatar}
                                                                alt={user.name}
                                                                className="w-9 h-9 rounded-full object-cover border border-blue-200"
                                                                onError={(e) => {
                                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=1e3a8a&color=facc15`;
                                                                }}
                                                            />
                                                            <div>
                                                                <div className="font-bold text-blue-950">{user.name}</div>
                                                                <div className="text-[11px] text-blue-500">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className="font-mono text-xs text-blue-800 bg-blue-50 border border-blue-200 px-2 py-1 rounded">
                                                            {user.username || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${getRoleBadge(user.role)}`}>
                                                                {user.role}
                                                            </span>
                                                            {user.multiplerole.length > 1 && (
                                                                <span className="text-[10px] text-blue-500 italic">
                                                                    can switch: {user.multiplerole.filter((r) => r !== user.role).join(', ')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 font-medium text-blue-800">
                                                        {user.department}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${user.status === 'Active'
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : user.status === 'Pending'
                                                                    ? 'bg-amber-50 text-amber-700'
                                                                    : 'bg-blue-100 text-blue-500'
                                                            }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active'
                                                                    ? 'bg-emerald-500'
                                                                    : user.status === 'Pending'
                                                                        ? 'bg-amber-500'
                                                                        : 'bg-blue-400'
                                                                }`}></span>
                                                            {user.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-blue-600">
                                                        {user.dateAdded}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => setViewUser(user)}
                                                                className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-yellow-100 rounded-lg transition"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>

                                                            <button
                                                                onClick={() => handleEditUser(user)}
                                                                className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-yellow-100 rounded-lg transition"
                                                                title="Edit User"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>

                                                            {/* View Password — direkta na sa data */}
                                                            <button
                                                                onClick={() => handleViewPassword(user)}
                                                                className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-yellow-100 rounded-lg transition"
                                                                title="View Password (admin only)"
                                                            >
                                                                <KeyRound className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="py-8 text-center text-blue-500">
                                                    {searchTerm || roleFilter !== 'All' || departmentFilter !== 'All' || statusFilter !== 'All'
                                                        ? 'No users found matching your filters.'
                                                        : 'No users available.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-blue-50 border-t border-blue-100 text-xs text-blue-600">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div>
                                        Showing <span className="font-bold text-blue-950">
                                            {totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                                        </span> to <span className="font-bold text-blue-950">
                                            {Math.min(currentPage * itemsPerPage, totalCount)}
                                        </span> of <span className="font-bold text-blue-950">{totalCount}</span> users
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <label className="text-blue-600">Items per page:</label>
                                        <select
                                            value={itemsPerPage}
                                            onChange={handleItemsPerPageChange}
                                            className="px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs font-medium text-blue-900 outline-none focus:ring-2 focus:ring-yellow-400"
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={currentPage === 1 || isLoading}
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        className="p-2 bg-white border border-blue-300 text-blue-900 rounded-lg hover:bg-yellow-100 hover:border-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    <span className="font-semibold text-blue-950 px-2">
                                        Page {currentPage} of {totalPages}
                                    </span>

                                    <button
                                        disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        className="p-2 bg-white border border-blue-300 text-blue-900 rounded-lg hover:bg-yellow-100 hover:border-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

            </div>

            {/* Add/Edit User Modal */}
            <AddUserModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingUser(null);
                }}
                departments={departments}
                onSubmit={handleAddUserSubmit}
                isSaving={isSaving}
                isEditMode={!!editingUser}
                initialData={editingUser}
            />

            {/* View User Modal */}
            {viewUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-blue-200 relative text-center">

                        <button
                            onClick={() => setViewUser(null)}
                            className="absolute top-4 right-4 p-2 text-blue-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <img
                            src={viewUser.avatar}
                            alt={viewUser.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-yellow-400 mx-auto shadow-md mb-3"
                            onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(viewUser.name || 'User')}&background=1e3a8a&color=facc15`;
                            }}
                        />

                        <h3 className="text-base font-bold text-blue-950">{viewUser.name}</h3>
                        <p className="text-xs text-blue-500">{viewUser.email}</p>

                        <div className="mt-4 pt-4 border-t border-blue-100 space-y-2 text-left text-xs">
                            <div className="flex justify-between py-1">
                                <span className="text-blue-500 font-medium">Username:</span>
                                <span className="font-semibold text-blue-900 font-mono">{viewUser.username || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-1 items-center">
                                <span className="text-blue-500 font-medium">Password:</span>
                                <span className="font-semibold text-blue-900 font-mono">
                                    {viewUser.actualpassword || 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-blue-500 font-medium">Role:</span>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getRoleBadge(viewUser.role)}`}>
                                    {viewUser.role}
                                </span>
                            </div>
                            <div className="flex justify-between py-1 items-start">
                                <span className="text-blue-500 font-medium">Switchable Roles:</span>
                                <span className="font-semibold text-blue-900 text-right">
                                    {viewUser.multiplerole?.length
                                        ? viewUser.multiplerole.join(', ')
                                        : 'None'}
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-blue-500 font-medium">Department:</span>
                                <span className="font-semibold text-blue-900">{viewUser.department}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-blue-500 font-medium">Phone:</span>
                                <span className="font-semibold text-blue-900">{viewUser.phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-blue-500 font-medium">Status:</span>
                                <span className={`font-semibold ${viewUser.status === 'Active' ? 'text-emerald-600' :
                                        viewUser.status === 'Pending' ? 'text-amber-600' : 'text-blue-500'
                                    }`}>
                                    {viewUser.status}
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-blue-500 font-medium">Verified:</span>
                                <span className={`font-semibold ${viewUser.isVerified ? 'text-emerald-600' : 'text-blue-400'}`}>
                                    {viewUser.isVerified ? 'Yes' : 'No'}
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-blue-500 font-medium">Date Added:</span>
                                <span className="font-semibold text-blue-900">{viewUser.dateAdded}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setViewUser(null)}
                            className="mt-5 w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-900 font-semibold rounded-xl text-xs transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* View Password Modal — direkta na sa data */}
            {viewPasswordUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-blue-200 relative">

                        <button
                            onClick={closePasswordModal}
                            className="absolute top-4 right-4 p-2 text-blue-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-yellow-100 text-blue-900 rounded-lg">
                                <KeyRound className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-blue-950">User Password</h3>
                                <p className="text-xs text-blue-500 font-mono">{viewPasswordUser.username}</p>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                            {viewPasswordUser.actualpassword ? (
                                <div className="flex items-center justify-between gap-2">
                                    <code className="font-mono text-sm text-blue-900 break-all select-all">
                                        {viewPasswordUser.actualpassword}
                                    </code>
                                    <button
                                        onClick={handleCopyPassword}
                                        className="shrink-0 p-2 bg-white border border-blue-200 hover:bg-yellow-100 rounded-lg transition"
                                        title="Copy password"
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-blue-700" />
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="text-xs text-blue-500 italic">
                                    No password available for this user.
                                </div>
                            )}
                        </div>

                        <p className="text-[11px] text-blue-500 italic mb-4">
                            ⚠️ This is a plaintext password. Handle with care.
                        </p>

                        <button
                            onClick={closePasswordModal}
                            className="w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-900 font-semibold rounded-xl text-xs transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}