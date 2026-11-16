import React, { useState, useEffect } from 'react';
import { X, UserPlus, Pencil, Loader2, Eye, EyeOff } from 'lucide-react';

// Roles that support switching (match backend enum)
const SWITCHABLE_ROLES = ['panelist', 'adviser'];

const roleMapToBackend = {
    'Student': 'student',
    'Subject Instructor': 'subject_instructor',
    'Panelist': 'panelist',
    'Adviser': 'adviser',
    'Admin': 'admin',
};

const EMPTY_FORM = {
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    role: 'Student',
    selectedrole: [],
    department: '',
    status: 'Active',
    password: '',
    confirmPassword: '',
};

export default function AddUserModal({
    isOpen,
    onClose,
    departments,
    onSubmit,
    isSaving,
    isEditMode = false,
    initialData = null,
}) {
    const [formData, setFormData] = useState(EMPTY_FORM);

    // 👁️ Show/hide password toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // ✅ Prefill when in edit mode
    useEffect(() => {
        if (isOpen && isEditMode && initialData) {
            setFormData({
                firstName: initialData.firstName || '',
                middleName: initialData.middleName || '',
                lastName: initialData.lastName || '',
                suffix: initialData.suffix || '',
                email: initialData.email || '',
                role: initialData.role || 'Student',
                selectedrole: initialData.multipleroleRaw || [],
                department: initialData.departmentId || '',
                status: initialData.status || 'Active',
                password: '',
                confirmPassword: '',
            });
        } else if (isOpen && !isEditMode) {
            setFormData(EMPTY_FORM);
        }
        // 🔄 Reset password visibility tuwing mag-open/close
        setShowPassword(false);
        setShowConfirmPassword(false);
    }, [isOpen, isEditMode, initialData]);

    if (!isOpen) return null;

    const resetForm = () => {
        setFormData(EMPTY_FORM);
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const handleClose = () => {
        if (isSaving) return;
        resetForm();
        onClose();
    };

    const toggleSelectedRole = (roleKey) => {
        setFormData((prev) => {
            const exists = prev.selectedrole.includes(roleKey);
            const next = exists
                ? prev.selectedrole.filter((r) => r !== roleKey)
                : [...prev.selectedrole, roleKey];
            return { ...prev, selectedrole: next };
        });
    };

    const handleRoleChange = (displayRole) => {
        const backendRole = roleMapToBackend[displayRole] || 'student';
        setFormData((prev) => {
            if (!SWITCHABLE_ROLES.includes(backendRole)) {
                return { ...prev, role: displayRole, selectedrole: [] };
            }
            const next = new Set(prev.selectedrole.filter((r) => SWITCHABLE_ROLES.includes(r)));
            next.add(backendRole);
            return { ...prev, role: displayRole, selectedrole: [...next] };
        });
    };

    const currentBackendRole = roleMapToBackend[formData.role] || 'student';
    const showSwitchOptions = SWITCHABLE_ROLES.includes(currentBackendRole);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSaving) return;

        // Basic validation — email required only on Add mode
        if (
            !formData.firstName ||
            !formData.lastName ||
            !formData.department ||
            (!isEditMode && !formData.email) // ✅ email required lang sa Add
        ) {
            onSubmit({ success: false, error: 'Please fill in all required fields.' }, formData);
            return;
        }

        // Password validation only required on Add mode
        if (!isEditMode) {
            if (!formData.password || formData.password.length < 8) {
                onSubmit({ success: false, error: 'Password must be at least 8 characters long.' }, formData);
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                onSubmit({ success: false, error: 'Passwords do not match.' }, formData);
                return;
            }
        } else if (formData.password || formData.confirmPassword) {
            if (formData.password.length < 8) {
                onSubmit({ success: false, error: 'Password must be at least 8 characters long.' }, formData);
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                onSubmit({ success: false, error: 'Passwords do not match.' }, formData);
                return;
            }
        }

        const username = formData.email.split('@')[0];
        const backendRole = roleMapToBackend[formData.role] || 'student';

        let selectedrole = [];
        if (SWITCHABLE_ROLES.includes(backendRole)) {
            const set = new Set(formData.selectedrole.filter((r) => SWITCHABLE_ROLES.includes(r)));
            set.add(backendRole);
            selectedrole = [...set];
        }

        const payload = {
            username: username,
            first_name: formData.firstName,
            middle_name: formData.middleName || '',
            last_name: formData.lastName,
            suffix: formData.suffix || '',
            email: formData.email,
            role: backendRole,
            selectedrole,
            statusAccount: formData.status === 'Active' ? 'approved' : 'pending',
            isVerified: false,
            isActive: formData.status === 'Active',
            gender: '',
            laboratoryId: '',
            department: formData.department,
            status: formData.status,
        };

        if (!isEditMode) {
            payload.password = formData.password;
            payload.confirmPassword = formData.confirmPassword;
        } else if (formData.password) {
            payload.password = formData.password;
            payload.confirmPassword = formData.confirmPassword;
        }

        const result = await onSubmit(payload, formData);
        if (result?.success) {
            resetForm();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-blue-200 relative max-h-[90vh] overflow-y-auto">

                <button
                    onClick={handleClose}
                    disabled={isSaving}
                    className="absolute top-4 right-4 p-2 text-blue-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header changes based on mode */}
                <div className="flex items-center gap-3 border-b-2 border-yellow-400 pb-3 mb-4">
                    <span className="p-2 bg-blue-900 text-yellow-300 rounded-xl shadow-sm">
                        {isEditMode ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    </span>
                    <div>
                        <h3 className="text-lg font-bold text-blue-950">
                            {isEditMode ? 'Update User' : 'Add New User'}
                        </h3>
                        <p className="text-xs text-blue-600">
                            {isEditMode
                                ? 'Update the details for this account.'
                                : 'Fill in details to add a new account.'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-blue-800 mb-1">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                disabled={isSaving}
                                placeholder="e.g. Juan"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 placeholder:text-blue-400 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-blue-800 mb-1">Middle Name</label>
                            <input
                                type="text"
                                disabled={isSaving}
                                placeholder="e.g. Santos"
                                value={formData.middleName}
                                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 placeholder:text-blue-400 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                            <label className="block font-semibold text-blue-800 mb-1">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                disabled={isSaving}
                                placeholder="e.g. dela Cruz"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 placeholder:text-blue-400 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-blue-800 mb-1">Suffix</label>
                            <select
                                disabled={isSaving}
                                value={formData.suffix}
                                onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed"
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

                    {/* ✅ Email — readOnly (hindi disabled) sa Edit para makita pa rin */}
                    <div>
                        <label className="block font-semibold text-blue-800 mb-1">
                            Email Address{' '}
                            {!isEditMode && <span className="text-red-500">*</span>}
                            {isEditMode && (
                                <span className="ml-2 text-[10px] font-normal italic text-blue-500">
                                    (cannot be changed)
                                </span>
                            )}
                        </label>
                        <input
                            type="email"
                            required={!isEditMode}
                            readOnly={isEditMode}
                            disabled={isSaving}
                            placeholder="juan@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-xl text-blue-900 placeholder:text-blue-400 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition ${
                                isEditMode
                                    ? 'bg-blue-100 border-blue-200 cursor-not-allowed opacity-70'
                                    : 'bg-blue-50 border-blue-200 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed'
                            }`}
                        />
                    </div>

                    {/* Password fields only on Add mode */}
                    {!isEditMode && (
                        <>
                            {/* 🔑 Password with show/hide */}
                            <div>
                                <label className="block font-semibold text-blue-800 mb-1">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        disabled={isSaving}
                                        placeholder="Minimum 8 characters"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-3 py-2 pr-10 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 placeholder:text-blue-400 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowPassword((v) => !v)}
                                        disabled={isSaving}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute inset-y-0 right-0 flex items-center px-3 text-blue-500 hover:text-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {/* ✅ TAMA: EyeOff kapag nakatago, Eye kapag nakikita */}
                                        {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* 🔑 Confirm Password with show/hide */}
                            <div>
                                <label className="block font-semibold text-blue-800 mb-1">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        disabled={isSaving}
                                        placeholder="Re-enter password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full px-3 py-2 pr-10 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 placeholder:text-blue-400 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                        disabled={isSaving}
                                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                        className="absolute inset-y-0 right-0 flex items-center px-3 text-blue-500 hover:text-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {/* ✅ TAMA: EyeOff kapag nakatago, Eye kapag nakikita */}
                                        {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-blue-800 mb-1">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <select
                                disabled={isSaving}
                                value={formData.role}
                                onChange={(e) => handleRoleChange(e.target.value)}
                                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 font-medium text-blue-900 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <option value="Student">Student</option>
                                <option value="Subject Instructor">Subject Instructor</option>
                                <option value="Panelist">Panelist</option>
                                <option value="Adviser">Adviser</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>

                        <div>
                            <label className="block font-semibold text-blue-800 mb-1">
                                Department <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                disabled={isSaving}
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed"
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

                    {/* Switchable Roles — only for panelist / adviser */}
                    {showSwitchOptions && (
                        <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-xl">
                            <label className="block font-semibold text-blue-900 mb-1">
                                Allow Switching To
                            </label>
                            <p className="text-[11px] text-blue-600 mb-2">
                                Select which roles this user can switch between. The current role is always included.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {['panelist', 'adviser'].map((r) => {
                                    const isPrimary = currentBackendRole === r;
                                    const checked = formData.selectedrole.includes(r) || isPrimary;
                                    return (
                                        <label
                                            key={r}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                                                checked
                                                    ? 'bg-blue-900 text-white border-blue-900'
                                                    : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-50'
                                            } ${isPrimary || isSaving ? 'opacity-90 cursor-not-allowed' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                disabled={isPrimary || isSaving}
                                                onChange={() => toggleSelectedRole(r)}
                                                className="accent-yellow-400"
                                            />
                                            <span className="capitalize">{r}</span>
                                            {isPrimary && (
                                                <span className="text-[10px] italic">(current)</span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block font-semibold text-blue-800 mb-1">Account Status</label>
                        <div className="flex gap-4 pt-1">
                            <label className={`flex items-center gap-2 cursor-pointer font-medium text-blue-800 ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                <input
                                    type="radio"
                                    name="status"
                                    value="Active"
                                    disabled={isSaving}
                                    checked={formData.status === 'Active'}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="text-blue-900 focus:ring-yellow-400"
                                />
                                <span>Active</span>
                            </label>
                            <label className={`flex items-center gap-2 cursor-pointer font-medium text-blue-800 ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                <input
                                    type="radio"
                                    name="status"
                                    value="Inactive"
                                    disabled={isSaving}
                                    checked={formData.status === 'Inactive'}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="text-blue-900 focus:ring-yellow-400"
                                />
                                <span>Inactive</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-blue-100">
                        <button
                            type="button"
                            disabled={isSaving}
                            onClick={handleClose}
                            className="px-4 py-2 font-medium text-blue-800 hover:bg-blue-100 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-5 py-2 font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-xl shadow-md transition disabled:opacity-60 disabled:cursor-wait"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {isEditMode ? 'Updating...' : 'Saving...'}
                                </>
                            ) : (
                                isEditMode ? 'Update User' : 'Save User'
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}