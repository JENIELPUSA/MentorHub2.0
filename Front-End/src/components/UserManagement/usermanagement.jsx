import React, { useState, useMemo, useContext, useEffect, useCallback } from 'react';
import {
    Users,
    Search,
    Plus,
    Eye,
    Trash2,
    ChevronLeft,
    ChevronRight,
    X,
    UserPlus,
    CheckCircle2,
    Filter,
    GraduationCap,
    UserCheck,
    ShieldCheck,
    Briefcase
} from 'lucide-react';

import { DepartmentContext } from '../../contexts/DepartmentContext/DepartmentContext';
import { UserDisplayContext } from '../../contexts/UserManagementContext/UserManagementContext';
import { StudentContext } from '../../contexts/StudentContext/StudentContext';

export default function UserManagement() {
    const { 
        useraccount, 
        isLoading: contextLoading,
        pagination,
        filters,
        userdata,
        fetchUsersWithLogin,
        statistics 
    } = useContext(StudentContext);
    const { AddUser } = useContext(UserDisplayContext);
    const { departments } = useContext(DepartmentContext);

    console.log("useraccount", useraccount);
    
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

    console.log("useraccount", useraccount);

    // ✅ FIXED: Map useraccount data to display format
    const mapUserAccountToDisplay = (account) => {
        if (!account) return null;
        
        const departmentData = account.department || {};
        
        const fullName = [
            account.first_name,
            account.middle_name,
            account.last_name,
            account.suffix
        ].filter(Boolean).join(' ');
        
        // ✅ Role mapping
        const roleMap = {
            'student': 'Student',
            'subject_instructor': 'Subject Instructor',
            'panelist': 'Panelist',
            'adviser': 'Adviser',
            'admin': 'Admin'
        };
        
        // ✅ Status mapping
        const statusMap = {
            'approved': 'Active',
            'pending': 'Pending',
            'rejected': 'Inactive',
            'suspended': 'Inactive',
            'Active': 'Active',
            'Inactive': 'Inactive'
        };
        
        // ✅ Get role directly from account
        const rawRole = account.role || 'student';
        const displayRole = roleMap[rawRole.toLowerCase()] || rawRole || 'Student';
        
        // ✅ Get status directly from account
        const rawStatus = account.status || account.statusAccount || 'Active';
        const displayStatus = statusMap[rawStatus] || 'Active';
        
        // ✅ Get username directly from account
        const username = account.username || account.login?.username || account.email || '';
        
        const avatarUrl = account.avatar?.url || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'User')}&background=0284c7&color=fff`;
        
        return {
            id: account._id,
            firstName: account.first_name || '',
            middleName: account.middle_name || '',
            lastName: account.last_name || '',
            suffix: account.suffix || '',
            name: fullName || 'Unnamed User',
            email: account.email || '',
            username: username, // ✅ USERNAME
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
            roleBackend: rawRole.toLowerCase()
        };
    };

    // Process useraccount data when it changes
    useEffect(() => {
        setIsLocalLoading(true);
        if (useraccount && Array.isArray(useraccount)) {
            const mappedUsers = useraccount
                .map(account => mapUserAccountToDisplay(account))
                .filter(Boolean);
            setUsers(mappedUsers);
            
            // ✅ Log para makita ang mapped data
            console.log('✅ Mapped users:', mappedUsers);
        } else {
            setUsers([]);
        }
        setIsLocalLoading(false);
    }, [useraccount]);

    // Build filter params for backend
    const buildFilterParams = useCallback(() => {
        const params = {
            page: currentPage,
            limit: itemsPerPage,
        };

        if (searchTerm) {
            params.search = searchTerm;
        }

        const roleMapToBackend = {
            'Student': 'student',
            'Subject Instructor': 'subject_instructor',
            'Panelist': 'panelist',
            'Adviser': 'adviser',
            'Admin': 'admin'
        };

        if (roleFilter !== 'All') {
            params.role = roleMapToBackend[roleFilter] || roleFilter.toLowerCase();
        }

        if (departmentFilter !== 'All') {
            const selectedDept = departments.find(dept => dept.departmentName === departmentFilter);
            if (selectedDept) {
                params.departmentId = selectedDept._id;
            }
        }

        if (statusFilter !== 'All') {
            if (statusFilter === 'Active') {
                params.statusAccount = 'approved';
            } else if (statusFilter === 'Pending') {
                params.statusAccount = 'pending';
            } else if (statusFilter === 'Inactive') {
                params.statusAccount = 'rejected';
            }
        }

        return params;
    }, [currentPage, itemsPerPage, searchTerm, roleFilter, departmentFilter, statusFilter, departments]);

    // Fetch users from backend when filters change
    useEffect(() => {
        const params = buildFilterParams();
        fetchUsersWithLogin(params);
    }, [currentPage, itemsPerPage, searchTerm, roleFilter, departmentFilter, statusFilter, fetchUsersWithLogin, buildFilterParams]);

    const showNotification = (msg, isError = false) => {
        setToastMessage({ msg, isError });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const roleMapToBackend = {
        'Student': 'student',
        'Subject Instructor': 'subject_instructor',
        'Panelist': 'panelist',
        'Adviser': 'adviser',
        'Admin': 'admin'
    };

    const handleAddUserSubmit = async (e) => {
        e.preventDefault();

        if (!formData.firstName || !formData.lastName || !formData.email || !formData.department) {
            showNotification('Please fill in all required fields.', true);
            return;
        }

        if (!formData.password || formData.password.length < 8) {
            showNotification('Password must be at least 8 characters long.', true);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            showNotification('Passwords do not match.', true);
            return;
        }
        const fullName = [
            formData.firstName,
            formData.middleName,
            formData.lastName,
            formData.suffix
        ].filter(Boolean).join(' ');

        const username = formData.email.split('@')[0];

        const payload = {
            username: username,
            first_name: formData.firstName,
            middle_name: formData.middleName || '',
            last_name: formData.lastName,
            suffix: formData.suffix || '',
            email: formData.email,
            role: roleMapToBackend[formData.role] || 'student',
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            selectedrole: [roleMapToBackend[formData.role] || 'student'],
            statusAccount: formData.status === 'Active' ? 'approved' : 'pending',
            isVerified: false,
            isActive: formData.status === 'Active',
            gender: '',
            laboratoryId: '',
            department: formData.department,
            status: formData.status,
        };

        try {
            const result = await AddUser(payload);

            if (result.success) {
                showNotification(`✅ Successfully added ${fullName}!`);
                setIsAddModalOpen(false);
                setFormData({
                    firstName: '',
                    middleName: '',
                    lastName: '',
                    suffix: '',
                    email: '',
                    role: 'Student',
                    department: '',
                    status: 'Active',
                    password: '',
                    confirmPassword: ''
                });
                const params = buildFilterParams();
                fetchUsersWithLogin(params);
            } else {
                showNotification(`❌ Failed to add user: ${result.error || 'Unknown error'}`, true);
            }
        } catch (error) {
            console.error('Error adding user:', error);
            showNotification(`❌ Failed to add user: ${error.message || 'Unknown error'}`, true);
        }
    };

    const handleDeleteUser = async (id) => {
        const userToDelete = users.find(u => u.id === id);
        console.log('🗑️ Deleting user:', userToDelete);
        
        setUsers(users.filter(u => u.id !== id));
        if (viewUser && viewUser.id === id) setViewUser(null);
        showNotification(`Removed ${userToDelete?.name || 'user'}.`);
    };

    // Form State for Adding New User
    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        email: '',
        role: 'Student',
        department: '',
        status: 'Active',
        password: '',
        confirmPassword: ''
    });

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
                return 'bg-slate-100 text-slate-800 border-slate-200';
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
        <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Bar */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Directory</h1>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Manage academic user accounts, roles, and status
                                    {totalCount > 0 && (
                                        <span className="ml-2 text-sky-600 font-medium">
                                            ({totalCount} total users)
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Add User</span>
                    </button>
                </header>

                {/* Toast Notification */}
                {toastMessage && (
                    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 text-white text-xs font-medium rounded-xl shadow-2xl animate-bounce ${toastMessage.isError ? 'bg-red-600' : 'bg-slate-900'}`}>
                        <CheckCircle2 className={`w-4 h-4 ${toastMessage.isError ? 'text-red-200' : 'text-emerald-400'}`} />
                        <span>{toastMessage.msg}</span>
                    </div>
                )}

                {/* Search & Filter Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

                        <div className="relative md:col-span-1">
                            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search name, email, username..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                            />
                        </div>

                        <div>
                            <select
                                value={roleFilter}
                                onChange={(e) => {
                                    setRoleFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-sky-500"
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
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-sky-500"
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
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-sky-500"
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
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-3 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
                                <span className="text-sm text-slate-500">Loading users...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                                            <th className="py-3.5 px-4">User</th>
                                            <th className="py-3.5 px-4">Username</th> {/* ✅ ADDED USERNAME COLUMN */}
                                            <th className="py-3.5 px-4">Role</th>
                                            <th className="py-3.5 px-4">Department</th>
                                            <th className="py-3.5 px-4">Status</th>
                                            <th className="py-3.5 px-4">Date Added</th>
                                            <th className="py-3.5 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {users.length > 0 ? (
                                            users.map((user) => (
                                                <tr key={user.id} className="hover:bg-slate-50/60 transition">
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={user.avatar}
                                                                alt={user.name}
                                                                className="w-9 h-9 rounded-full object-cover border border-slate-200"
                                                                onError={(e) => {
                                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=0284c7&color=fff`;
                                                                }}
                                                            />
                                                            <div>
                                                                <div className="font-bold text-slate-900">{user.name}</div>
                                                                <div className="text-[11px] text-slate-400">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className="font-mono text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded">
                                                            {user.username || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${getRoleBadge(user.role)}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 font-medium text-slate-600">
                                                        {user.department}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                                            user.status === 'Active' 
                                                                ? 'bg-emerald-50 text-emerald-700' 
                                                                : user.status === 'Pending'
                                                                ? 'bg-amber-50 text-amber-700'
                                                                : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                                user.status === 'Active' 
                                                                    ? 'bg-emerald-500' 
                                                                    : user.status === 'Pending'
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-slate-400'
                                                            }`}></span>
                                                            {user.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-slate-500">
                                                        {user.dateAdded}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => setViewUser(user)}
                                                                className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                                title="Delete User"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="py-8 text-center text-slate-400">
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
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50/50 border-t border-slate-200 text-xs text-slate-500">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div>
                                        Showing <span className="font-bold text-slate-800">
                                            {totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                                        </span> to <span className="font-bold text-slate-800">
                                            {Math.min(currentPage * itemsPerPage, totalCount)}
                                        </span> of <span className="font-bold text-slate-800">{totalCount}</span> users
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <label className="text-slate-500">Items per page:</label>
                                        <select
                                            value={itemsPerPage}
                                            onChange={handleItemsPerPageChange}
                                            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-sky-500"
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
                                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    
                                    <span className="font-semibold text-slate-700 px-2">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    
                                    <button
                                        disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

            </div>

            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">

                        <button
                            onClick={() => {
                                setIsAddModalOpen(false);
                                setFormData({
                                    firstName: '',
                                    middleName: '',
                                    lastName: '',
                                    suffix: '',
                                    email: '',
                                    role: 'Student',
                                    department: '',
                                    status: 'Active',
                                    password: '',
                                    confirmPassword: ''
                                });
                            }}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                            <span className="p-2 bg-sky-100 text-sky-600 rounded-xl">
                                <UserPlus className="w-5 h-5" />
                            </span>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Add New User</h3>
                                <p className="text-xs text-slate-500">Fill in details to add a new account.</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddUserSubmit} className="space-y-4 text-xs">

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Juan"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Middle Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Santos"
                                        value={formData.middleName}
                                        onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                    <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. dela Cruz"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Suffix</label>
                                    <select
                                        value={formData.suffix}
                                        onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                                    >
                                        <option value="">None</option>
                                        <option value="Jr.">Jr.</option>
                                        <option value="Sr.">Sr.</option>
                                        <option value="III">III</option>
                                        <option value="IV">IV</option>
                                        <option value="V">V</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="juan@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Minimum 8 characters"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Confirm Password *</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Re-enter password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Role *</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800"
                                    >
                                        <option value="Student">Student</option>
                                        <option value="Subject Instructor">Subject Instructor</option>
                                        <option value="Panelist">Panelist</option>
                                        <option value="Adviser">Adviser</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map((dept) => (
                                            <option key={dept._id} value={dept._id}>
                                                {dept.departmentName} {dept.departmentCode && `(${dept.departmentCode})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                                <div className="flex gap-4 pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="Active"
                                            checked={formData.status === 'Active'}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="text-sky-600 focus:ring-sky-500"
                                        />
                                        <span>Active</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="Inactive"
                                            checked={formData.status === 'Inactive'}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="text-sky-600 focus:ring-sky-500"
                                        />
                                        <span>Inactive</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setFormData({
                                            firstName: '',
                                            middleName: '',
                                            lastName: '',
                                            suffix: '',
                                            email: '',
                                            role: 'Student',
                                            department: '',
                                            status: 'Active',
                                            password: '',
                                            confirmPassword: ''
                                        });
                                    }}
                                    className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md transition"
                                >
                                    Save User
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* View User Modal */}
            {viewUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative text-center">

                        <button
                            onClick={() => setViewUser(null)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <img
                            src={viewUser.avatar}
                            alt={viewUser.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-sky-500 mx-auto shadow-md mb-3"
                            onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(viewUser.name || 'User')}&background=0284c7&color=fff`;
                            }}
                        />

                        <h3 className="text-base font-bold text-slate-900">{viewUser.name}</h3>
                        <p className="text-xs text-slate-400">{viewUser.email}</p>

                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-left text-xs">
                            {/* ✅ USERNAME DISPLAYED */}
                            <div className="flex justify-between py-1">
                                <span className="text-slate-400 font-medium">Username:</span>
                                <span className="font-semibold text-slate-700 font-mono">{viewUser.username || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-400 font-medium">Role:</span>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getRoleBadge(viewUser.role)}`}>
                                    {viewUser.role}
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-400 font-medium">Department:</span>
                                <span className="font-semibold text-slate-700">{viewUser.department}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-400 font-medium">Phone:</span>
                                <span className="font-semibold text-slate-700">{viewUser.phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-400 font-medium">Status:</span>
                                <span className={`font-semibold ${
                                    viewUser.status === 'Active' ? 'text-emerald-600' : 
                                    viewUser.status === 'Pending' ? 'text-amber-600' : 'text-slate-500'
                                }`}>
                                    {viewUser.status}
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-400 font-medium">Verified:</span>
                                <span className={`font-semibold ${viewUser.isVerified ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {viewUser.isVerified ? 'Yes' : 'No'}
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-400 font-medium">Date Added:</span>
                                <span className="font-semibold text-slate-700">{viewUser.dateAdded}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setViewUser(null)}
                            className="mt-5 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}