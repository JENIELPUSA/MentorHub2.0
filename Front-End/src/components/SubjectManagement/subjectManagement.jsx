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
    ArrowLeft,
    FileCog,
    LayoutTemplate,
    AlignLeft,
    BookMarked,
    ScrollText,
    ExternalLink
} from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import { SubjectContext } from '../../contexts/SubjectContext/SubjectContext';
import SubjectSections from './subjectSection';
import { FormatContext } from '../../contexts/FormatContext/FormatContext';

// ==================== FORMAT TYPE COLORS ====================
const FORMAT_TYPE_COLORS = {
    Thesis: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', icon: 'text-green-600', solid: 'bg-green-600' },
    Capstone: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', icon: 'text-indigo-600', solid: 'bg-indigo-600' },
    Research: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-600', solid: 'bg-blue-600' },
    Dissertation: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', icon: 'text-purple-600', solid: 'bg-purple-600' },
    default: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', icon: 'text-gray-600', solid: 'bg-gray-600' },
};

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

    const { formats } = useContext(FormatContext)

    console.log("formats", formats)

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

    // ==================== ASSIGN FORMAT MODAL STATE ====================
    const [isAssignFormatModalOpen, setIsAssignFormatModalOpen] = useState(false);
    const [assignFormatSubject, setAssignFormatSubject] = useState(null);
    const [assignSelectedFormatId, setAssignSelectedFormatId] = useState(null);
    const [assignFormatSearchTerm, setAssignFormatSearchTerm] = useState('');
    const [assignFormatTypeFilter, setAssignFormatTypeFilter] = useState('All');

    console.log("subjectsData", subjectsData)

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

    // Helper para sa format type color
    const getFormatTypeColor = (type) => {
        return FORMAT_TYPE_COLORS[type] || FORMAT_TYPE_COLORS.default;
    };

    // Helper para sa format icon base sa type
    const getFormatIcon = (type) => {
        const icons = {
            Thesis: GraduationCap,
            Capstone: LayoutTemplate,
            Research: AlignLeft,
            Dissertation: BookMarked,
        };
        return icons[type] || ScrollText;
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

        // ==================== FORMAT INFO (formatID field) ====================
        const formatRef = subject.formatID || null;
        const formatId = typeof formatRef === 'string'
            ? formatRef
            : formatRef?._id || formatRef?.id || null;

        // Hanapin ang format details mula sa formats context
        const formatDetails = (typeof formatRef === 'object' && formatRef?._id)
            ? formatRef
            : (formatId && formats
                ? formats.find(f => f._id === formatId)
                : null);

        return {
            id: subject._id,
            title: subject.title,
            createdBy: creator?._id || subject.createdBy,
            createdByName: creator ? getFullName(creator) : 'Unknown User',
            createdByUsername: creator?.username || 'N/A',
            // Format fields
            formatRef: formatRef,
            formatId: formatId,
            formatDetails: formatDetails,
            formatTitle: formatDetails?.titleFormat || 'No format assigned',
            formatType: formatDetails?.type || null,
            formatDescription: formatDetails?.description || '',
            formatFileUrl: formatDetails?.fileUrl || null,
            // Dates
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

    // ==================== ASSIGN FORMAT OPERATIONS ====================
    const openAssignFormatModal = (subject, e) => {
        if (e) e.stopPropagation();
        setAssignFormatSubject(subject);
        setAssignSelectedFormatId(subject.formatId || null);
        setAssignFormatSearchTerm('');
        setAssignFormatTypeFilter('All');
        setIsAssignFormatModalOpen(true);
    };

    const closeAssignFormatModal = () => {
        setIsAssignFormatModalOpen(false);
        setAssignFormatSubject(null);
        setAssignSelectedFormatId(null);
        setAssignFormatSearchTerm('');
        setAssignFormatTypeFilter('All');
    };

    const handleAssignFormatSubmit = async (e) => {
        e.preventDefault();

        if (!assignSelectedFormatId) {
            showNotification('Please select a manuscript format.', true);
            return;
        }

        setIsLocalLoading(true);
        try {
            // Update the subject with the selected format ID (field name: formatID)
            await updateSubject(assignFormatSubject.id, {
                formatID: assignSelectedFormatId
            });

            const selectedFormatData = formats?.find(f => f._id === assignSelectedFormatId);
            showNotification(
                `✅ Format "${selectedFormatData?.titleFormat || 'Unknown'}" assigned to "${assignFormatSubject.title}"!`
            );
            closeAssignFormatModal();
            await fetchFilteredSubjects();
        } catch (error) {
            showNotification(`❌ Failed to assign format: ${error.message}`, true);
        } finally {
            setIsLocalLoading(false);
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

    const openEditModal = (subject, e) => {
        if (e) e.stopPropagation();
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

    // ==================== FILTERED FORMATS (for Assign Modal) ====================
    const formatTypes = formats
        ? ['All', ...new Set(formats.map(f => f.type).filter(Boolean))]
        : ['All'];

    const filteredAssignFormats = (formats || []).filter((format) => {
        const matchesSearch = assignFormatSearchTerm
            ? format.titleFormat?.toLowerCase().includes(assignFormatSearchTerm.toLowerCase()) ||
              format.description?.toLowerCase().includes(assignFormatSearchTerm.toLowerCase())
            : true;
        const matchesType = assignFormatTypeFilter === 'All' || format.type === assignFormatTypeFilter;
        return matchesSearch && matchesType;
    });

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
                                {subjectList.map((subject, index) => {
                                    // Format details mula sa mapped subject
                                    const formatType = subject.formatType;
                                    const typeColors = getFormatTypeColor(formatType);
                                    const FormatIcon = getFormatIcon(formatType);

                                    return (
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

                                                {/* ==================== ASSIGN FORMAT (CLICKABLE) ==================== */}
                                                <div
                                                    onClick={(e) => openAssignFormatModal(subject, e)}
                                                    className="mt-2 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl cursor-pointer hover:from-indigo-100 hover:to-purple-100 hover:border-indigo-300 transition-all group/assign"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-indigo-600 rounded-lg">
                                                                <FileCog className="w-3.5 h-3.5 text-white" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-indigo-800">
                                                                    Assign Format
                                                                </p>
                                                                <p className="text-[10px] text-indigo-600">
                                                                    Manuscript format
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <ChevronRight className="w-3.5 h-3.5 text-indigo-600 group-hover/assign:translate-x-0.5 transition-transform" />
                                                        </div>
                                                    </div>

                                                    {/* Current format display */}
                                                    <div className="mt-2 pt-2 border-t border-indigo-200">
                                                        {subject.formatDetails ? (
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <FormatIcon className={`w-3 h-3 ${typeColors.icon} shrink-0`} />
                                                                <span className={`text-[10px] font-semibold ${typeColors.text} truncate`}>
                                                                    {subject.formatTitle}
                                                                </span>
                                                                {subject.formatType && (
                                                                    <span className={`text-[9px] font-medium ${typeColors.bg} ${typeColors.text} px-1.5 py-0.5 rounded-full`}>
                                                                        {subject.formatType}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10px] text-gray-400 italic">
                                                                    No format assigned — click to assign
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

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
                                                        onClick={(e) => openEditModal(subject, e)}
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
                                    );
                                })}
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

            {/* ==================== ASSIGN FORMAT POPUP MODAL ==================== */}
            {isAssignFormatModalOpen && assignFormatSubject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={closeAssignFormatModal}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-4">
                            <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                <FileCog className="w-5 h-5" />
                            </span>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Assign Manuscript Format</h3>
                                <p className="text-xs text-gray-500">
                                    Pumili ng format para sa "{assignFormatSubject.title}"
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleAssignFormatSubmit} className="space-y-4 text-sm">
                            {/* Subject Info */}
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-blue-600" />
                                    <span className="font-semibold text-gray-700">{assignFormatSubject.title}</span>
                                </div>
                            </div>

                            {/* Search & Type Filter */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search formats..."
                                        value={assignFormatSearchTerm}
                                        onChange={(e) => setAssignFormatSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <select
                                    value={assignFormatTypeFilter}
                                    onChange={(e) => setAssignFormatTypeFilter(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {formatTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type === 'All' ? 'All Types' : type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Format Selection List */}
                            <div>
                                <label className="block font-semibold text-gray-700 mb-2">
                                    Pumili ng Manuscript Format *
                                    <span className="ml-2 text-xs font-normal text-gray-500">
                                        ({filteredAssignFormats.length} available)
                                    </span>
                                </label>

                                {formats && formats.length > 0 ? (
                                    filteredAssignFormats.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                                            {filteredAssignFormats.map((format) => {
                                                const typeColors = getFormatTypeColor(format.type);
                                                const FormatIcon = getFormatIcon(format.type);
                                                const isSelected = assignSelectedFormatId === format._id;

                                                return (
                                                    <label
                                                        key={format._id}
                                                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                                            isSelected
                                                                ? `${typeColors.border} ${typeColors.bg} ring-2 ring-offset-1 ring-indigo-400`
                                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="assignFormatID"
                                                            value={format._id}
                                                            checked={isSelected}
                                                            onChange={(e) => setAssignSelectedFormatId(e.target.value)}
                                                            className="mt-0.5 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <div className={`p-1.5 ${typeColors.solid} rounded-lg shrink-0`}>
                                                            <FormatIcon className="w-3.5 h-3.5 text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-semibold text-gray-800 text-xs">
                                                                    {format.titleFormat}
                                                                </span>
                                                                {format.type && (
                                                                    <span className={`text-[9px] font-medium ${typeColors.bg} ${typeColors.text} px-1.5 py-0.5 rounded-full`}>
                                                                        {format.type}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {format.description && (
                                                                <p className="text-[10px] text-gray-500 mt-0.5 leading-tight line-clamp-2">
                                                                    {format.description}
                                                                </p>
                                                            )}
                                                            {format.fileUrl && (
                                                                <a
                                                                    href={format.fileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 mt-1 font-medium"
                                                                >
                                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                                    View file
                                                                </a>
                                                            )}
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center bg-gray-50 rounded-xl border border-gray-200">
                                            <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-xs text-gray-500">
                                                Walang format na tumutugma sa iyong search.
                                            </p>
                                        </div>
                                    )
                                ) : (
                                    <div className="py-8 text-center bg-gray-50 rounded-xl border border-gray-200">
                                        <FileCog className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500">
                                            Walang available na format. Mag-upload muna ng format.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Current Format Info */}
                            {assignFormatSubject.formatDetails && (
                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-xs text-blue-700">
                                        <span className="font-semibold">Kasalukuyang format:</span>{' '}
                                        {assignFormatSubject.formatTitle}
                                        {assignFormatSubject.formatType && (
                                            <span className="ml-1">({assignFormatSubject.formatType})</span>
                                        )}
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeAssignFormatModal}
                                    className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || !assignSelectedFormatId}
                                    className="flex items-center gap-2 px-5 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Assigning...
                                        </>
                                    ) : (
                                        <>
                                            <FileCog className="w-4 h-4" />
                                            Assign Format
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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