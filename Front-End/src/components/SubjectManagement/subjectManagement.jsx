// SubjectManagement.jsx - Optimized with single back button (Solid Blue & Yellow per Card)
// + Create Semester dropdown (Semester + Year From/To) => "SY-2026-2027 (1st Semester)"
// + Read-only confirmation modal (title is NOT editable)
import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
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
    ExternalLink,
    ChevronDown
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
    default: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-600', solid: 'bg-blue-900' },
};

// ==================== SEMESTER OPTIONS ====================
const SEMESTER_OPTIONS = ['1st Semester', '2nd Semester'];

// ==================== YEAR OPTIONS ====================
const getYearOptions = (count = 15) => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: count }, (_, i) => currentYear - i);
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

    // ==================== SEMESTER DROPDOWN STATE ====================
    const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);
    const [selectedSemester, setSelectedSemester] = useState('');
    const [yearFrom, setYearFrom] = useState('');
    const [yearTo, setYearTo] = useState('');
    const semesterDropdownRef = useRef(null);

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

    const getFormatTypeColor = (type) => {
        return FORMAT_TYPE_COLORS[type] || FORMAT_TYPE_COLORS.default;
    };

    const getFormatIcon = (type) => {
        const icons = {
            Thesis: GraduationCap,
            Capstone: LayoutTemplate,
            Research: AlignLeft,
            Dissertation: BookMarked,
        };
        return icons[type] || ScrollText;
    };

    // ==================== CLOSE DROPDOWN ON OUTSIDE CLICK ====================
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                isSemesterDropdownOpen &&
                semesterDropdownRef.current &&
                !semesterDropdownRef.current.contains(e.target)
            ) {
                setIsSemesterDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSemesterDropdownOpen]);

    // ==================== BUILD FILTER PARAMS ====================
    const buildFetchParams = useCallback((overrides = {}) => {
        const params = {
            page: overrides.page ?? currentPage,
            limit: overrides.limit ?? itemsPerPage,
        };
        if (searchTerm) params.search = searchTerm;
        if (dateFilter !== 'All') params.dateRange = dateFilter;
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
        const formatRef = subject.formatID || null;
        const formatId = typeof formatRef === 'string'
            ? formatRef
            : formatRef?._id || formatRef?.id || null;

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
            formatRef: formatRef,
            formatId: formatId,
            formatDetails: formatDetails,
            formatTitle: formatDetails?.titleFormat || 'No format assigned',
            formatType: formatDetails?.type || null,
            formatDescription: formatDetails?.description || '',
            formatFileUrl: formatDetails?.fileUrl || null,
            createdAt: subject.createdAt ? new Date(subject.createdAt) : null,
            updatedAt: subject.updatedAt ? new Date(subject.updatedAt) : null,
            formattedCreatedAt: subject.createdAt ? new Date(subject.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            }) : 'N/A',
            formattedUpdatedAt: subject.updatedAt ? new Date(subject.updatedAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
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
                if (updated) setSelectedSubject(mapSubjectToDisplay(updated));
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
                if (selectedSubject && selectedSubject.id === id) setSelectedSubject(null);
                await fetchFilteredSubjects();
            } catch (error) {
                showNotification(`❌ Failed to delete subject: ${error.message}`, true);
            } finally {
                setIsLocalLoading(false);
            }
        }
    };

    // ==================== SEMESTER CREATE HANDLERS ====================
    const buildSemesterTitle = (semester, from, to) => {
        if (!semester || !from || !to) return '';
        return `SY-${from}-${to} (${semester})`;
    };

    const resetSemesterForm = () => {
        setSelectedSemester('');
        setYearFrom('');
        setYearTo('');
        setIsSemesterDropdownOpen(false);
    };

    const handleYearFromChange = (value) => {
        setYearFrom(value);
        if (value && !yearTo) setYearTo(String(parseInt(value) + 1));
        if (value && yearTo && parseInt(yearTo) <= parseInt(value)) {
            setYearTo(String(parseInt(value) + 1));
        }
    };

    const handleOpenCreateSemesterModal = () => {
        if (!selectedSemester || !yearFrom || !yearTo) {
            showNotification('Please select semester, year from, and year to.', true);
            return;
        }
        if (parseInt(yearTo) <= parseInt(yearFrom)) {
            showNotification('Year To must be greater than Year From.', true);
            return;
        }
        const title = buildSemesterTitle(selectedSemester, yearFrom, yearTo);
        setFormData({ title });
        resetSemesterForm();
        setIsAddModalOpen(true);
    };

    const handleCreateSemesterDirect = async () => {
        if (!selectedSemester || !yearFrom || !yearTo) {
            showNotification('Please select semester, year from, and year to.', true);
            return;
        }
        if (parseInt(yearTo) <= parseInt(yearFrom)) {
            showNotification('Year To must be greater than Year From.', true);
            return;
        }
        const title = buildSemesterTitle(selectedSemester, yearFrom, yearTo);
        resetSemesterForm();
        await handleAddSubject(title);
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
            await updateSubject(assignFormatSubject.id, { formatID: assignSelectedFormatId });
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
        if (editingId) handleUpdateSubject(editingId, formData.title.trim());
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

    const handleViewModeChange = (mode) => setViewMode(mode);

    // ==================== FILTER HANDLERS ====================
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        const params = buildFetchParams({ page: 1, search: value });
        if (!value) delete params.search;
        fetchSubjects(params);
    };

    const handleDateFilterChange = (e) => {
        const value = e.target.value;
        setDateFilter(value);
        const params = buildFetchParams({ page: 1 });
        if (value === 'All') delete params.dateRange;
        else params.dateRange = value;
        fetchSubjects(params);
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setDateFilter('All');
        fetchSubjects({ page: 1, limit: itemsPerPage });
    };

    // ==================== PAGINATION HANDLERS ====================
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchSubjects(buildFetchParams({ page: newPage }));
        }
    };

    const handleItemsPerPageChange = (e) => {
        const newLimit = parseInt(e.target.value);
        setItemsPerPage(newLimit);
        fetchSubjects(buildFetchParams({ page: 1, limit: newLimit }));
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
            <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-sky-50 text-blue-900 p-4 md:p-8 font-sans">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Toast */}
                    {toastMessage && (
                        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 text-white text-xs font-medium rounded-xl shadow-2xl animate-slide-in ${toastMessage.isError ? 'bg-red-600' : 'bg-blue-900'}`}>
                            <CheckCircle2 className={`w-4 h-4 ${toastMessage.isError ? 'text-red-200' : 'text-yellow-300'}`} />
                            <span>{toastMessage.msg}</span>
                        </div>
                    )}

                    {/* Header */}
                    <header className="bg-white rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10 p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={goBackToList}
                                    className="p-2 bg-blue-50 hover:bg-yellow-100 rounded-xl transition text-blue-700 hover:text-blue-900 border border-blue-200"
                                    title="Back to Subjects List"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="p-3 bg-blue-900 text-yellow-300 rounded-xl shadow-sm">
                                    <BookOpen className="w-7 h-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-blue-950 tracking-tight">
                                        {selectedSubject.title}
                                    </h1>
                                    <p className="text-sm text-blue-600">
                                        {viewMode === 'groups' ? 'Managing Groups' : `Subject Details • Created ${selectedSubject.formattedCreatedAt}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {viewMode === 'sections' && (
                                    <>
                                        <button
                                            onClick={() => openEditModal(selectedSubject)}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-semibold text-sm rounded-xl transition shadow-sm"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit Subject
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSubject(selectedSubject.id)}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-semibold text-sm rounded-xl transition"
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-blue-200 relative max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={() => { setIsEditModalOpen(false); setEditingId(null); resetForm(); }}
                                className="absolute top-4 right-4 p-2 text-blue-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3 border-b-2 border-yellow-400 pb-3 mb-4">
                                <span className="p-2 bg-blue-900 text-yellow-300 rounded-xl shadow-sm">
                                    <Edit className="w-5 h-5" />
                                </span>
                                <div>
                                    <h3 className="text-lg font-bold text-blue-950">Edit Subject</h3>
                                    <p className="text-xs text-blue-600">Update the subject title.</p>
                                </div>
                            </div>
                            <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
                                <div>
                                    <label className="block font-semibold text-blue-800 mb-1.5">Subject Title *</label>
                                    <textarea
                                        required
                                        rows={3}
                                        placeholder="e.g. Advanced Web Systems & Technologies"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 placeholder:text-blue-400 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-white resize-y min-h-[80px]"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-3 border-t border-blue-100">
                                    <button
                                        type="button"
                                        onClick={() => { setIsEditModalOpen(false); setEditingId(null); resetForm(); }}
                                        className="px-4 py-2 font-medium text-blue-800 hover:bg-blue-100 rounded-xl transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-5 py-2 font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-xl shadow-sm transition disabled:opacity-50"
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
        <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-sky-50 text-blue-900 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Toast */}
                {toastMessage && (
                    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 text-white text-xs font-medium rounded-xl shadow-2xl animate-slide-in ${toastMessage.isError ? 'bg-red-600' : 'bg-blue-900'}`}>
                        <CheckCircle2 className={`w-4 h-4 ${toastMessage.isError ? 'text-red-200' : 'text-yellow-300'}`} />
                        <span>{toastMessage.msg}</span>
                    </div>
                )}

                {/* Header */}
                <header className="bg-white rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-900 text-yellow-300 rounded-xl shadow-sm">
                                <GraduationCap className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-blue-950 tracking-tight">
                                    My Course
                                </h1>
                                <p className="text-sm text-blue-600">
                                    {totalCount > 0 ? (
                                        <span>
                                            {totalCount} subject{totalCount > 1 ? 's' : ''} •
                                            <span className="ml-1 text-blue-900 font-semibold">
                                                {endItem - startItem + 1} displayed
                                            </span>
                                        </span>
                                    ) : (
                                        'No subjects yet'
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Create Semester Dropdown */}
                        <div className="relative" ref={semesterDropdownRef}>
                            <button
                                onClick={() => setIsSemesterDropdownOpen(!isSemesterDropdownOpen)}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-950 active:bg-black text-white font-semibold text-sm rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4 stroke-[3]" />
                                <span>Create Semester</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isSemesterDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isSemesterDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-blue-200 shadow-xl z-40 p-4 space-y-3 animate-fadeIn">
                                    <div className="flex items-center gap-2 pb-2 border-b border-blue-100">
                                        <div className="p-1.5 bg-blue-900 text-yellow-300 rounded-lg">
                                            <GraduationCap className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-blue-950">Create Semester</p>
                                            <p className="text-[10px] text-blue-600">Pumili ng semester at school year</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-blue-800 mb-1.5">Semester</label>
                                        <select
                                            value={selectedSemester}
                                            onChange={(e) => setSelectedSemester(e.target.value)}
                                            className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                        >
                                            <option value="">Select Semester</option>
                                            {SEMESTER_OPTIONS.map((sem) => (
                                                <option key={sem} value={sem}>{sem}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-semibold text-blue-800 mb-1.5">Year From</label>
                                            <select
                                                value={yearFrom}
                                                onChange={(e) => handleYearFromChange(e.target.value)}
                                                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                            >
                                                <option value="">From</option>
                                                {getYearOptions(15).map((year) => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-blue-800 mb-1.5">Year To</label>
                                            <select
                                                value={yearTo}
                                                onChange={(e) => setYearTo(e.target.value)}
                                                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                            >
                                                <option value="">To</option>
                                                {getYearOptions(15).map((year) => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {yearFrom && yearTo && parseInt(yearTo) <= parseInt(yearFrom) && (
                                        <p className="text-[10px] text-red-600 font-medium">
                                            ⚠️ Year To must be greater than Year From.
                                        </p>
                                    )}

                                    {selectedSemester && yearFrom && yearTo && parseInt(yearTo) > parseInt(yearFrom) && (
                                        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                                            <p className="text-[10px] text-blue-600 font-medium">Preview:</p>
                                            <p className="text-xs font-bold text-blue-900 break-all">
                                                {buildSemesterTitle(selectedSemester, yearFrom, yearTo)}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2 pt-2 border-t border-blue-100">
                                        <button
                                            type="button"
                                            onClick={resetSemesterForm}
                                            className="px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 rounded-lg transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            disabled={
                                                !selectedSemester || !yearFrom || !yearTo ||
                                                parseInt(yearTo) <= parseInt(yearFrom) || isLoading
                                            }
                                            onClick={handleOpenCreateSemesterModal}
                                            className="px-3 py-1.5 text-xs font-semibold text-blue-950 bg-yellow-400 hover:bg-yellow-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Create
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="relative md:col-span-2">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
                            <input
                                type="text"
                                placeholder="Search subjects..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full pl-10 pr-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900 placeholder:text-blue-400 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-white transition"
                            />
                        </div>
                        <div>
                            <select
                                value={dateFilter}
                                onChange={handleDateFilterChange}
                                className="w-full px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm font-medium text-blue-900 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
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
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-semibold text-sm rounded-xl transition shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reset
                        </button>
                    </div>
                </div>

                {/* Subject Cards */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 text-blue-900 animate-spin" />
                            <span className="text-sm text-blue-600">Loading subjects...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        {subjectList.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {subjectList.map((subject, index) => {
                                    const formatType = subject.formatType;
                                    const typeColors = getFormatTypeColor(formatType);
                                    const FormatIcon = getFormatIcon(formatType);

                                    return (
                                        <div
                                            key={subject.id}
                                            className="group bg-white rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10 hover:shadow-lg hover:shadow-blue-900/20 transition-all duration-200 overflow-hidden cursor-pointer border-t-4 border-t-yellow-400"
                                            onClick={() => openViewPage(subject)}
                                        >
                                            {/* Card Body */}
                                            <div className="p-4 space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-yellow-300 font-bold text-sm shrink-0 shadow-sm">
                                                        {getInitials(subject.title)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-blue-950 font-bold text-sm leading-tight line-clamp-2">
                                                            {subject.title}
                                                        </h3>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-1.5 text-blue-500">
                                                        <User className="w-3.5 h-3.5" />
                                                        <span>Created by</span>
                                                    </div>
                                                    <span className="font-medium text-blue-800">
                                                        {subject.createdByName}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-1.5 text-blue-500">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span>Created</span>
                                                    </div>
                                                    <span className="text-blue-600">
                                                        {subject.formattedCreatedAt}
                                                    </span>
                                                </div>
                                                {subject.sections && subject.sections.length > 0 && (
                                                    <div className="flex items-center gap-1.5 text-xs text-blue-600 pt-1">
                                                        <FileText className="w-3.5 h-3.5" />
                                                        <span>{subject.sections.length} section{subject.sections.length > 1 ? 's' : ''}</span>
                                                    </div>
                                                )}

                                                {/* Assign Format */}
                                                <div
                                                    onClick={(e) => openAssignFormatModal(subject, e)}
                                                    className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-all group/assign"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-blue-900 rounded-lg shadow-sm">
                                                                <FileCog className="w-3.5 h-3.5 text-yellow-300" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-blue-900">
                                                                    Assign Format
                                                                </p>
                                                                <p className="text-[10px] text-blue-600">
                                                                    Manuscript format
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <ChevronRight className="w-3.5 h-3.5 text-blue-700 group-hover/assign:translate-x-0.5 transition-transform" />
                                                        </div>
                                                    </div>

                                                    <div className="mt-2 pt-2 border-t border-blue-200">
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
                                                                <span className="text-[10px] text-blue-400 italic">
                                                                    No format assigned — click to assign
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2 pt-2 border-t border-blue-100">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openViewPage(subject); }}
                                                        className="flex-1 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-50 rounded-lg transition"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={(e) => openEditModal(subject, e)}
                                                        className="flex-1 py-1.5 text-xs font-semibold text-yellow-700 hover:bg-yellow-50 rounded-lg transition"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject.id); }}
                                                        className="flex-1 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
                            <div className="bg-white rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10 py-16 text-center">
                                <div className="w-20 h-20 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FolderOpen className="w-10 h-10 text-blue-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-blue-900">No subjects found</h3>
                                <p className="text-sm text-blue-500 mt-1">
                                    {searchTerm || dateFilter !== 'All'
                                        ? 'Try adjusting your filters'
                                        : 'Click "Create Semester" to get started'}
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Pagination */}
                {totalCount > 0 && (
                    <div className="bg-white rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10 p-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-blue-600">
                            <div className="flex items-center gap-3">
                                <span>
                                    Showing <span className="font-bold text-blue-950">{startItem}</span> to{' '}
                                    <span className="font-bold text-blue-950">{endItem}</span> of{' '}
                                    <span className="font-bold text-blue-950">{totalCount}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                    <label className="text-blue-600">Show:</label>
                                    <select
                                        value={itemsPerPage}
                                        onChange={handleItemsPerPageChange}
                                        className="px-2 py-1 bg-white border border-blue-200 rounded-lg text-sm font-medium text-blue-900 outline-none focus:ring-2 focus:ring-yellow-400"
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
                                    className="p-2 bg-white border border-blue-300 text-blue-900 rounded-lg hover:bg-yellow-100 hover:border-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="font-semibold text-blue-950 px-3">
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
                    </div>
                )}
            </div>

            {/* Assign Format Modal */}
            {isAssignFormatModalOpen && assignFormatSubject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-blue-200 relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={closeAssignFormatModal}
                            className="absolute top-4 right-4 p-2 text-blue-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 border-b-2 border-yellow-400 pb-3 mb-4">
                            <span className="p-2 bg-blue-900 text-yellow-300 rounded-xl shadow-sm">
                                <FileCog className="w-5 h-5" />
                            </span>
                            <div>
                                <h3 className="text-lg font-bold text-blue-950">Assign Manuscript Format</h3>
                                <p className="text-xs text-blue-600">
                                    Pumili ng format para sa "{assignFormatSubject.title}"
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleAssignFormatSubmit} className="space-y-4 text-sm">
                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-blue-900" />
                                    <span className="font-semibold text-blue-900">{assignFormatSubject.title}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                                    <input
                                        type="text"
                                        placeholder="Search formats..."
                                        value={assignFormatSearchTerm}
                                        onChange={(e) => setAssignFormatSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 placeholder:text-blue-400 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                    />
                                </div>
                                <select
                                    value={assignFormatTypeFilter}
                                    onChange={(e) => setAssignFormatTypeFilter(e.target.value)}
                                    className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-medium text-blue-900 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                >
                                    {formatTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type === 'All' ? 'All Types' : type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-semibold text-blue-800 mb-2">
                                    Pumili ng Manuscript Format *
                                    <span className="ml-2 text-xs font-normal text-blue-500">
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
                                                                ? `${typeColors.border} ${typeColors.bg} ring-2 ring-offset-1 ring-yellow-400`
                                                                : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="assignFormatID"
                                                            value={format._id}
                                                            checked={isSelected}
                                                            onChange={(e) => setAssignSelectedFormatId(e.target.value)}
                                                            className="mt-0.5 w-4 h-4 text-blue-900 focus:ring-yellow-400"
                                                        />
                                                        <div className={`p-1.5 ${typeColors.solid} rounded-lg shrink-0`}>
                                                            <FormatIcon className="w-3.5 h-3.5 text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-semibold text-blue-950 text-xs">
                                                                    {format.titleFormat}
                                                                </span>
                                                                {format.type && (
                                                                    <span className={`text-[9px] font-medium ${typeColors.bg} ${typeColors.text} px-1.5 py-0.5 rounded-full`}>
                                                                        {format.type}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {format.description && (
                                                                <p className="text-[10px] text-blue-600 mt-0.5 leading-tight line-clamp-2">
                                                                    {format.description}
                                                                </p>
                                                            )}
                                                            {format.fileUrl && (
                                                                <a
                                                                    href={format.fileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="inline-flex items-center gap-1 text-[10px] text-blue-800 hover:text-blue-950 mt-1 font-semibold"
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
                                        <div className="py-8 text-center bg-blue-50 rounded-xl border border-blue-200">
                                            <Search className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                                            <p className="text-xs text-blue-600">
                                                Walang format na tumutugma sa iyong search.
                                            </p>
                                        </div>
                                    )
                                ) : (
                                    <div className="py-8 text-center bg-blue-50 rounded-xl border border-blue-200">
                                        <FileCog className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                                        <p className="text-xs text-blue-600">
                                            Walang available na format. Mag-upload muna ng format.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {assignFormatSubject.formatDetails && (
                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                                    <p className="text-xs text-blue-800">
                                        <span className="font-semibold">Kasalukuyang format:</span>{' '}
                                        {assignFormatSubject.formatTitle}
                                        {assignFormatSubject.formatType && (
                                            <span className="ml-1">({assignFormatSubject.formatType})</span>
                                        )}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-3 border-t border-blue-100">
                                <button
                                    type="button"
                                    onClick={closeAssignFormatModal}
                                    className="px-4 py-2 font-medium text-blue-800 hover:bg-blue-100 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || !assignSelectedFormatId}
                                    className="flex items-center gap-2 px-5 py-2 font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Add Modal — Confirmation Only */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-blue-200 relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => { setIsAddModalOpen(false); resetForm(); }}
                            className="absolute top-4 right-4 p-2 text-blue-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3 border-b-2 border-yellow-400 pb-3 mb-4">
                            <span className="p-2 bg-blue-900 text-yellow-300 rounded-xl shadow-sm">
                                <GraduationCap className="w-5 h-5" />
                            </span>
                            <div>
                                <h3 className="text-lg font-bold text-blue-950">Create New Semester</h3>
                                <p className="text-xs text-blue-600">Review and confirm the semester title.</p>
                            </div>
                        </div>
                        <form onSubmit={handleAddSubmit} className="space-y-4 text-sm">
                            <div>
                                <label className="block font-semibold text-blue-800 mb-1.5">Subject / Semester Title *</label>
                                <div className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-300 rounded-xl">
                                    <p className="text-base font-bold text-blue-900 break-all">
                                        {formData.title}
                                    </p>
                                </div>
                                <p className="mt-1.5 text-[11px] text-blue-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                    Auto-generated mula sa napiling semester at school year. Hindi na ito maaaring i-edit.
                                </p>
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t border-blue-100">
                                <button
                                    type="button"
                                    onClick={() => { setIsAddModalOpen(false); resetForm(); }}
                                    className="px-4 py-2 font-medium text-blue-800 hover:bg-blue-100 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center gap-2 px-5 py-2 font-semibold text-blue-950 bg-yellow-400 hover:bg-yellow-300 rounded-xl shadow-sm transition disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Confirm & Create
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}