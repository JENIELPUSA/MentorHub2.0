// SubjectManagement.jsx - Optimized with single back button (Solid Blue & Yellow per Card)
import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
    BookOpen,
    Search,
    Plus,
    Trash2,
    ChevronLeft,
    ChevronRight,
    X,
    CheckCircle2,
    Calendar,
    Edit,
    RefreshCw,
    User,
    Users,
    Loader2,
    FolderOpen,
    GraduationCap,
    FileText,
    ArrowLeft
} from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import { SubjectContext } from '../../contexts/SubjectContext/SubjectContext';
import SubjectSections from './subjectSection';

export default function SubjectManagement() {
    const { userId } = useContext(AuthContext);

    // ==================== CONTEXT ====================
    const {
        subjectsData,
        isLoading: contextLoading,
        fetchSubjects,
        createSubject,
        updateSubject,
        deleteSubject,
        totalCount,
        totalPages,
        currentPage,
        rowsPerPage,
    } = useContext(SubjectContext);

    // ==================== LOCAL STATE ====================
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('All');
    const [itemsPerPage, setItemsPerPage] = useState(6);
    const [isLocalLoading, setIsLocalLoading] = useState(false);

    const [selectedSubject, setSelectedSubject] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    const [formData, setFormData] = useState({ title: '' });
    const [editingId, setEditingId] = useState(null);

    console.log("subjectsData",subjectsData)

    // ==================== SECTION STATE ====================
    const [sections, setSections] = useState([]);

    // ==================== VIEW MODE STATE ====================
    const [viewMode, setViewMode] = useState('sections');

    // ==================== HELPERS ====================
    const getFullName = (user) => {
        if (!user) return 'Unknown User';
        if (typeof user === 'string') return 'Unknown User';
        return `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim() || user.username || 'Unknown User';
    };

    const showNotification = (msg, isError = false) => {
        setToastMessage({ msg, isError });
        setTimeout(() => setToastMessage(null), 3000);
    };

    // ==================== BUILD FILTER PARAMS ====================
    const buildFetchParams = useCallback((overrides = {}) => {
        const params = {
            page: overrides.page ?? currentPage,
            limit: overrides.limit ?? itemsPerPage,
        };

        if (searchTerm) {
            params.search = searchTerm;
        }

        if (dateFilter !== 'All') {
            params.dateRange = dateFilter;
        }

        return { ...params, ...overrides };
    }, [currentPage, itemsPerPage, searchTerm, dateFilter]);

    // ==================== FETCH DATA ====================
    const fetchFilteredSubjects = useCallback(async () => {
        setIsLocalLoading(true);
        try {
            const params = buildFetchParams();
            await fetchSubjects(params);
        } catch (error) {
            console.error('❌ [FETCH] Error:', error);
            showNotification(`Failed to load subjects: ${error.message}`, true);
        } finally {
            setIsLocalLoading(false);
        }
    }, [buildFetchParams, fetchSubjects]);

    useEffect(() => {
        fetchFilteredSubjects();
    }, [fetchFilteredSubjects]);

    // ==================== DATA MAPPING ====================
    const mapSubjectToDisplay = (subject) => {
        if (!subject) return null;

        const creator = subject.createdBy || null;
        const assignedUser = subject.userId || creator;

        return {
            id: subject._id,
            title: subject.title,
            createdBy: creator?._id || subject.createdBy,
            createdByName: creator ? getFullName(creator) : 'Unknown User',
            createdByUsername: creator?.username || 'N/A',
            userId: assignedUser?._id || subject.userId || subject.createdBy,
            userName: assignedUser ? getFullName(assignedUser) : 'Unknown User',
            userUsername: assignedUser?.username || 'N/A',
            createdAt: subject.createdAt ? new Date(subject.createdAt) : null,
            updatedAt: subject.updatedAt ? new Date(subject.updatedAt) : null,
            formattedCreatedAt: subject.createdAt ? new Date(subject.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }) : 'N/A',
            formattedUpdatedAt: subject.updatedAt ? new Date(subject.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }) : 'N/A',
            sections: subject.sections || [],
            rawData: subject
        };
    };

    // ==================== CRUD OPERATIONS ====================
    const handleAddSubject = async (title) => {
        setIsLocalLoading(true);
        try {
            await createSubject({ title });
            showNotification(`✅ Successfully added subject "${title}"!`);
            setIsAddModalOpen(false);
            resetForm();
            await fetchFilteredSubjects();
        } catch (error) {
            showNotification(`❌ Failed to add subject: ${error.message}`, true);
        } finally {
            setIsLocalLoading(false);
        }
    };

    const handleUpdateSubject = async (id, title) => {
        setIsLocalLoading(true);
        try {
            await updateSubject(id, { title });
            showNotification(`✅ Successfully updated subject "${title}"!`);
            setIsEditModalOpen(false);
            setEditingId(null);
            resetForm();
            await fetchFilteredSubjects();
            if (selectedSubject && selectedSubject.id === id) {
                const updated = subjectsData?.find(s => s._id === id);
                if (updated) {
                    setSelectedSubject(mapSubjectToDisplay(updated));
                }
            }
        } catch (error) {
            showNotification(`❌ Failed to update subject: ${error.message}`, true);
        } finally {
            setIsLocalLoading(false);
        }
    };

    const handleDeleteSubject = async (id) => {
        const subjectToDelete = subjectsData?.find(s => s._id === id);
        if (!subjectToDelete) return;

        if (window.confirm(`Are you sure you want to delete "${subjectToDelete.title}"?`)) {
            setIsLocalLoading(true);
            try {
                await deleteSubject(id);
                showNotification(`Removed "${subjectToDelete.title}" successfully.`);
                if (selectedSubject && selectedSubject.id === id) {
                    setSelectedSubject(null);
                }
                await fetchFilteredSubjects();
            } catch (error) {
                showNotification(`❌ Failed to delete subject: ${error.message}`, true);
            } finally {
                setIsLocalLoading(false);
            }
        }
    };

    // ==================== SECTION OPERATIONS ====================
    const handleAddSection = (title) => {
        const newSection = {
            id: `section-${Date.now()}`,
            title: title,
            createdAt: new Date().toISOString()
        };
        setSections([...sections, newSection]);
        showNotification(`✅ Section "${title}" added!`);
    };

    const handleDeleteSection = (sectionId) => {
        if (window.confirm('Are you sure you want to delete this section?')) {
            setSections(sections.filter(s => s.id !== sectionId));
            showNotification('Section removed.');
        }
    };

    // ==================== FORM HANDLERS ====================
    const resetForm = () => {
        setFormData({ title: '' });
        setEditingId(null);
    };

    const handleAddSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            showNotification('Please enter a subject title.', true);
            return;
        }
        handleAddSubject(formData.title.trim());
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            showNotification('Please enter a subject title.', true);
            return;
        }
        if (editingId) {
            handleUpdateSubject(editingId, formData.title.trim());
        }
    };

    const openEditModal = (subject) => {
        setEditingId(subject.id);
        setFormData({ title: subject.title });
        setIsEditModalOpen(true);
    };

    const openViewPage = (subject) => {
        setSelectedSubject(subject);
        setSections(subject.sections || []);
        setViewMode('sections');
    };

    const goBackToList = () => {
        setSelectedSubject(null);
        setSections([]);
        setViewMode('sections');
    };

    // ==================== VIEW MODE HANDLERS ====================
    const handleViewModeChange = (mode) => {
        setViewMode(mode);
    };

    // ==================== FILTER HANDLERS ====================
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        const params = buildFetchParams({ page: 1, search: value });
        if (!value) {
            delete params.search;
        }
        fetchSubjects(params);
    };

    const handleDateFilterChange = (e) => {
        const value = e.target.value;
        setDateFilter(value);
        const params = buildFetchParams({ page: 1 });
        if (value === 'All') {
            delete params.dateRange;
        } else {
            params.dateRange = value;
        }
        fetchSubjects(params);
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setDateFilter('All');
        const params = { page: 1, limit: itemsPerPage };
        fetchSubjects(params);
    };

    // ==================== PAGINATION HANDLERS ====================
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            const params = buildFetchParams({ page: newPage });
            fetchSubjects(params);
        }
    };

    const handleItemsPerPageChange = (e) => {
        const newLimit = parseInt(e.target.value);
        setItemsPerPage(newLimit);
        const params = buildFetchParams({ page: 1, limit: newLimit });
        fetchSubjects(params);
    };

    // ==================== RENDER DATA ====================
    const subjectList = subjectsData?.map(mapSubjectToDisplay).filter(Boolean) || [];
    const isLoading = contextLoading || isLocalLoading;

    const startItem = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalCount);

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // ================================================================
    // ==================== VIEW PAGE ====================
    // ================================================================
    if (selectedSubject) {
        return (
            <div className="min-h-screen bg-gray-50 text-slate-800 p-4 md:p-8 font-sans">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Toast Notification */}
                    {toastMessage && (
                        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 text-white text-xs font-medium rounded-xl shadow-2xl animate-slide-in ${toastMessage.isError ? 'bg-red-600' : 'bg-blue-700'}`}>
                            <CheckCircle2 className={`w-4 h-4 ${toastMessage.isError ? 'text-red-200' : 'text-yellow-300'}`} />
                            <span>{toastMessage.msg}</span>
                        </div>
                    )}

                    {/* Header with SINGLE Back Button */}
                    <header className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={goBackToList}
                                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition text-gray-600 hover:text-gray-900"
                                    title="Back to Subjects List"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <BookOpen className="w-7 h-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                        {selectedSubject.title}
                                    </h1>
                                    <p className="text-sm text-gray-500">
                                        {viewMode === 'groups' ? 'Managing Groups' : `Subject Details • Created ${selectedSubject.formattedCreatedAt}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {viewMode === 'sections' && (
                                    <>
                                        <button
                                            onClick={() => openEditModal(selectedSubject)}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-semibold text-sm rounded-xl transition"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit Subject
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSubject(selectedSubject.id)}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-sm rounded-xl transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </header>
                    <SubjectSections
                        sections={sections}
                        subjectId={selectedSubject.id}
                        onAddSection={handleAddSection}
                        onDeleteSection={handleDeleteSection}
                        onSectionCreated={(newSection) => {
                            setSections(prev => [...prev, newSection]);
                            showNotification(`✅ Section "${newSection.title}" added!`);
                        }}
                        onViewModeChange={handleViewModeChange}
                        viewMode={viewMode}
                    />
                </div>

                {/* Edit Modal */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setEditingId(null);
                                    resetForm();
                                }}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-4">
                                <span className="p-2 bg-yellow-100 text-yellow-600 rounded-xl">
                                    <Edit className="w-5 h-5" />
                                </span>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Edit Subject</h3>
                                    <p className="text-xs text-gray-500">Update the subject title.</p>
                                </div>
                            </div>
                            <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1.5">Subject Title *</label>
                                    <textarea
                                        required
                                        rows={3}
                                        placeholder="e.g. Advanced Web Systems & Technologies"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditModalOpen(false);
                                            setEditingId(null);
                                            resetForm();
                                        }}
                                        className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-5 py-2 font-semibold text-white bg-yellow-500 hover:bg-yellow-600 rounded-xl shadow-sm transition disabled:opacity-50"
                                    >
                                        {isLoading ? 'Updating...' : 'Update Subject'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ================================================================
    // ==================== MAIN LIST VIEW ====================
    // ================================================================
    return (
        <div className="min-h-screen bg-gray-50 text-slate-800 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Toast Notification */}
                {toastMessage && (
                    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 text-white text-xs font-medium rounded-xl shadow-2xl animate-slide-in ${toastMessage.isError ? 'bg-red-600' : 'bg-blue-700'}`}>
                        <CheckCircle2 className={`w-4 h-4 ${toastMessage.isError ? 'text-red-200' : 'text-yellow-300'}`} />
                        <span>{toastMessage.msg}</span>
                    </div>
                )}

                {/* Header */}
                <header className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <GraduationCap className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                    My Subjects
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {totalCount > 0 ? (
                                        <span>
                                            {totalCount} subject{totalCount > 1 ? 's' : ''} • 
                                            <span className="ml-1 text-blue-600 font-medium">
                                                {endItem - startItem + 1} displayed
                                            </span>
                                        </span>
                                    ) : (
                                        'No subjects yet'
                                    )}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>Create Subject</span>
                        </button>
                    </div>
                </header>

                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="relative md:col-span-2">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search subjects..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            />
                        </div>
                        <div>
                            <select
                                value={dateFilter}
                                onChange={handleDateFilterChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition"
                            >
                                <option value="All">All Time</option>
                                <option value="Today">Today</option>
                                <option value="This Week">This Week</option>
                                <option value="This Month">This Month</option>
                                <option value="This Year">This Year</option>
                            </select>
                        </div>
                        <button
                            onClick={handleResetFilters}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-xl transition"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reset
                        </button>
                    </div>
                </div>

                {/* Subject Cards */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-gray-200/80 shadow-sm">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                            <span className="text-sm text-gray-500">Loading subjects...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        {subjectList.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {subjectList.map((subject, index) => (
                                    <div
                                        key={subject.id}
                                        className="group bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer"
                                        onClick={() => openViewPage(subject)}
                                    >
                                        {/* SOLID Blue Header Strip */}
                                        <div className="h-2 bg-blue-600"></div>

                                        {/* Card Body - WHITE background */}
                                        <div className="p-4 space-y-3">
                                            {/* Title Row - SOLID Blue avatar */}
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                    {getInitials(subject.title)}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-gray-900 font-bold text-sm leading-tight line-clamp-2">
                                                        {subject.title}
                                                    </h3>
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <User className="w-3.5 h-3.5" />
                                                    <span>Created by</span>
                                                </div>
                                                <span className="font-medium text-gray-700">
                                                    {subject.createdByName}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <Users className="w-3.5 h-3.5" />
                                                    <span>Assigned to</span>
                                                </div>
                                                <span className="font-medium text-gray-700">
                                                    {subject.userName}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>Created</span>
                                                </div>
                                                <span className="text-gray-600">
                                                    {subject.formattedCreatedAt}
                                                </span>
                                            </div>
                                            {subject.sections && subject.sections.length > 0 && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1">
                                                    <FileText className="w-3.5 h-3.5" />
                                                    <span>{subject.sections.length} section{subject.sections.length > 1 ? 's' : ''}</span>
                                                </div>
                                            )}

                                            {/* Action Buttons - SOLID Blue & Yellow */}
                                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openViewPage(subject);
                                                    }}
                                                    className="flex-1 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditModal(subject);
                                                    }}
                                                    className="flex-1 py-1.5 text-xs font-medium text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteSubject(subject.id);
                                                    }}
                                                    className="flex-1 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm py-16 text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FolderOpen className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-700">No subjects found</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    {searchTerm || dateFilter !== 'All'
                                        ? 'Try adjusting your filters'
                                        : 'Click "Create Subject" to get started'}
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Pagination */}
                {totalCount > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
                            <div className="flex items-center gap-3">
                                <span>
                                    Showing <span className="font-bold text-gray-700">{startItem}</span> to{' '}
                                    <span className="font-bold text-gray-700">{endItem}</span> of{' '}
                                    <span className="font-bold text-gray-700">{totalCount}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                    <label className="text-gray-500">Show:</label>
                                    <select
                                        value={itemsPerPage}
                                        onChange={handleItemsPerPageChange}
                                        className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={6}>6</option>
                                        <option value={12}>12</option>
                                        <option value={24}>24</option>
                                        <option value={48}>48</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage === 1 || isLoading}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="font-semibold text-gray-700 px-3">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => {
                                setIsAddModalOpen(false);
                                resetForm();
                            }}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-4">
                            <span className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                <GraduationCap className="w-5 h-5" />
                            </span>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Create New Subject</h3>
                                <p className="text-xs text-gray-500">Enter the subject title below.</p>
                            </div>
                        </div>
                        <form onSubmit={handleAddSubmit} className="space-y-4 text-sm">
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1.5">Subject Title *</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="e.g. Advanced Web Systems & Technologies"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition disabled:opacity-50"
                                >
                                    {isLoading ? 'Creating...' : 'Create Subject'}
                                </button>
                            </div>
                        </form>
                        </div>
                </div>
            )}
        </div>
    );
}