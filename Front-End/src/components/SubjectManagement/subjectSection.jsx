// SubjectSections.jsx — Professional UI + Instant setSections Update
// ✅ FIX: Idinagdag ang onGroupsViewChange call para i-hide ang header sa SubjectManagement
import React, { useContext, useEffect, useState } from 'react';
import {
    Search,
    Plus,
    Trash2,
    MoreVertical,
    X,
    Check,
    BookOpen,
    Calendar,
    ChevronRight,
    Users,
    GraduationCap,
    Loader2,
    Edit2,
    AlertCircle,
    Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { SectionContext } from '../../contexts/SectionContext/SectionContext';
import GroupDashboard from './GroupComponents';

// ==================== PROFESSIONAL CARD PALETTE ====================
const CARD_COLORS = [
    { banner: 'bg-gradient-to-br from-indigo-500 to-indigo-600', accent: 'bg-indigo-600',    light: 'bg-indigo-50',  text: 'text-indigo-700',  ring: 'ring-indigo-500/20' },
    { banner: 'bg-gradient-to-br from-emerald-500 to-emerald-600', accent: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-500/20' },
    { banner: 'bg-gradient-to-br from-violet-500 to-violet-600', accent: 'bg-violet-600',   light: 'bg-violet-50',  text: 'text-violet-700',  ring: 'ring-violet-500/20' },
    { banner: 'bg-gradient-to-br from-amber-500 to-amber-600', accent: 'bg-amber-600',      light: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-500/20' },
    { banner: 'bg-gradient-to-br from-rose-500 to-rose-600', accent: 'bg-rose-600',         light: 'bg-rose-50',    text: 'text-rose-700',    ring: 'ring-rose-500/20' },
    { banner: 'bg-gradient-to-br from-sky-500 to-sky-600', accent: 'bg-sky-600',            light: 'bg-sky-50',     text: 'text-sky-700',     ring: 'ring-sky-500/20' },
    { banner: 'bg-gradient-to-br from-teal-500 to-teal-600', accent: 'bg-teal-600',         light: 'bg-teal-50',    text: 'text-teal-700',    ring: 'ring-teal-500/20' },
    { banner: 'bg-gradient-to-br from-orange-500 to-orange-600', accent: 'bg-orange-600',   light: 'bg-orange-50',  text: 'text-orange-700',  ring: 'ring-orange-500/20' },
];

const SubjectSections = ({
    sections = [],
    onAddSection,
    onDeleteSection,
    subjectId,
    onEditSection,
    onSectionCreated,
    onSectionUpdated,
    onSectionDeleted,
    onSectionClick,
    navigateToGroups,
    onViewModeChange,
    onGroupsViewChange, // ✅ FIX: Idinagdag sa destructured props
}) => {
    const navigate = useNavigate();

    // ==================== STATES ====================
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dailyLoading, setDailyLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);

    const [viewMode, setViewMode] = useState('sections');
    const [selectedSectionForGroups, setSelectedSectionForGroups] = useState(null);

    const {
        createSection,
        sectionsData,
        setSections,
        updateSection,
        deleteSection,
        fetchSections,
        loading
    } = useContext(SectionContext);

    // ==================== NOTIFY PARENT ====================
    useEffect(() => {
        if (onViewModeChange) onViewModeChange(viewMode);
        // ✅ FIX: I-notify ang parent kapag nagbago ang viewMode (hide/show header)
        if (onGroupsViewChange) onGroupsViewChange(viewMode === 'groups');
    }, [viewMode, onViewModeChange, onGroupsViewChange]);

    // ==================== CLOSE MENU ON OUTSIDE CLICK ====================
    useEffect(() => {
        const handleClick = () => setOpenMenuId(null);
        if (openMenuId) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [openMenuId]);

    // ==================== CLOSE MODAL ON ESCAPE ====================
    useEffect(() => {
        if (!isAddModalOpen) return;
        const handleEscape = (e) => {
            if (e.key === 'Escape' && !isSubmitting) closeAddModal();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isAddModalOpen, isSubmitting]);

    // ==================== VIEW GROUPS ====================
    const handleViewGroups = (section) => {
        if (editingId === section.id) return;
        setSelectedSectionForGroups(section);
        setViewMode('groups');
        // ✅ FIX: I-hide agad ang header kapag pumasok sa Groups
        if (onGroupsViewChange) onGroupsViewChange(true);
    };

    const handleBackToSections = () => {
        setViewMode('sections');
        setSelectedSectionForGroups(null);
        // ✅ FIX: Ipakita ulit ang header kapag bumalik sa Sections
        if (onGroupsViewChange) onGroupsViewChange(false);
    };

    // ==================== SECTION CLICK ====================
    const handleSectionClick = (section) => {
        if (editingId === section.id) return;

        if (onSectionClick) {
            onSectionClick(section);
            return;
        }

        if (navigateToGroups) {
            if (typeof navigateToGroups === 'string') {
                navigate(`${navigateToGroups}/${section.id || section._id}`);
            } else if (typeof navigateToGroups === 'function') {
                navigateToGroups(section);
            }
            return;
        }

        handleViewGroups(section);
    };

    // ==================== EFFECTS ====================
    useEffect(() => {
        setDailyLoading(true);
        const timer = setTimeout(() => setDailyLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (subjectId) fetchSections({ subjectId });
    }, [subjectId, fetchSections]);

    // ==================== MAP SECTIONS ====================
    const mapSectionsToDisplay = (data) => {
        if (!data || !Array.isArray(data)) return [];
        return data.map(section => ({
            id: section._id || section.id,
            title: section.name || section.title || 'Untitled Class',
            name: section.name || section.title,
            subjectId: section.subjectId?._id || section.subjectId || '',
            subjectName: section.subjectId?.title || section.subjectId?.name || '',
            createdAt: section.createdAt || new Date().toISOString(),
            updatedAt: section.updatedAt || new Date().toISOString(),
            rawData: section
        }));
    };

    let displaySections = [];
    if (sections && sections.length > 0) {
        displaySections = sections;
    } else if (sectionsData && Array.isArray(sectionsData) && sectionsData.length > 0) {
        displaySections = mapSectionsToDisplay(sectionsData);
    }

    const filteredSections = displaySections.filter(section => {
        if (!section) return false;
        const title = section.title || section.name || '';
        return typeof title === 'string' && title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // ==================== MODAL HANDLERS ====================
    const openAddModal = () => {
        if (!subjectId || isSubmitting) return;
        setIsAddModalOpen(true);
        setNewSectionTitle('');
        setError('');
    };

    const closeAddModal = () => {
        if (isSubmitting) return;
        setIsAddModalOpen(false);
        setNewSectionTitle('');
        setError('');
    };

    // ==================== ADD SECTION — INSTANT setSections ====================
    const handleAddSection = async (e) => {
        if (e) e.preventDefault();

        if (!newSectionTitle.trim()) {
            setError('Class name is required');
            return;
        }
        if (!subjectId) {
            setError('Subject ID is required. Please select a subject first.');
            return;
        }

        try {
            setIsSubmitting(true);
            setError('');

            const result = await createSection({
                name: newSectionTitle.trim(),
                subjectId
            });

            if (result.success) {
                const newSection = result.data || result.section || result.newSection;
                if (newSection && setSections) {
                    setSections(prev => {
                        const existing = Array.isArray(prev) ? prev : [];
                        return [newSection, ...existing];
                    });
                } else {
                    await fetchSections({ subjectId });
                }

                setNewSectionTitle('');
                setIsAddModalOpen(false);
                setError('');
                if (onSectionCreated) onSectionCreated(newSection);
                if (onAddSection) onAddSection(newSection);
            } else {
                setError(result.message || result.error || 'Failed to create class');
            }
        } catch (err) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==================== UPDATE SECTION — INSTANT setSections ====================
    const handleEditClick = (section) => {
        setEditingId(section.id);
        setEditTitle(section.title || section.name || '');
        setError('');
        setOpenMenuId(null);
    };

    const handleEditSave = async (id) => {
        if (!editTitle.trim()) {
            setError('Class name is required');
            return;
        }
        try {
            setIsSubmitting(true);
            setError('');
            const result = await updateSection(id, { name: editTitle.trim() });

            if (result.success) {
                if (setSections) {
                    setSections(prev => {
                        const existing = Array.isArray(prev) ? prev : [];
                        return existing.map(s => {
                            const sid = s._id || s.id;
                            if (sid === id) {
                                return { ...s, name: editTitle.trim(), title: editTitle.trim() };
                            }
                            return s;
                        });
                    });
                } else {
                    await fetchSections({ subjectId });
                }

                setEditingId(null);
                setEditTitle('');
                setError('');
                if (onSectionUpdated) onSectionUpdated(result.data);
                if (onEditSection) onEditSection(id, editTitle.trim());
            } else {
                setError(result.message || result.error || 'Failed to update class');
            }
        } catch (err) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditTitle('');
        setError('');
    };

    // ==================== DELETE SECTION — INSTANT setSections ====================
    const handleDeleteSection = async (id) => {
        const sectionToDelete = displaySections.find(s => s.id === id);
        const sectionName = sectionToDelete?.title || sectionToDelete?.name || 'this class';

        if (!window.confirm(`Are you sure you want to delete "${sectionName}"?`)) return;

        try {
            setIsSubmitting(true);
            setError('');
            const result = await deleteSection(id);

            if (result.success) {
                if (setSections) {
                    setSections(prev => {
                        const existing = Array.isArray(prev) ? prev : [];
                        return existing.filter(s => (s._id || s.id) !== id);
                    });
                } else {
                    await fetchSections({ subjectId });
                }

                setError('');
                if (onSectionDeleted) onSectionDeleted(id);
                if (onDeleteSection) onDeleteSection(id);
            } else {
                setError(result.message || result.error || 'Failed to delete class');
            }
        } catch (err) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
            setOpenMenuId(null);
        }
    };

    // ==================== BUTTON HANDLERS ====================
    const handleEditButtonClick = (e, section) => { e.stopPropagation(); handleEditClick(section); };
    const handleDeleteButtonClick = (e, id) => { e.stopPropagation(); handleDeleteSection(id); };
    const handleViewGroupsButtonClick = (e, section) => { e.stopPropagation(); handleViewGroups(section); };
    const handleMenuToggle = (e, id) => { e.stopPropagation(); setOpenMenuId(openMenuId === id ? null : id); };

    const handleEditKeyDown = (e, id) => {
        if (e.key === 'Enter') handleEditSave(id);
        if (e.key === 'Escape') handleEditCancel();
    };

    const getSubjectName = (section) => {
        if (section.subjectName) return section.subjectName;
        if (section.subjectId?.title) return section.subjectId.title;
        if (section.subjectId?.name) return section.subjectId.name;
        return '';
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // ==================== VIEW GROUPS ====================
    if (viewMode === 'groups' && selectedSectionForGroups) {
        return (
            <div className="w-full">
                <GroupDashboard
                    isOpen={true}
                    section={selectedSectionForGroups}
                    onClose={handleBackToSections}
                    onSectionChange={() => {}}
                    isViewingGroups={true}
                    onBackToSections={handleBackToSections}
                    selectedSectionForGroups={selectedSectionForGroups}
                    groupsData={[]}
                    isLoadingGroupsData={false}
                />
            </div>
        );
    }

    // ==================== LOADING ====================
    if (dailyLoading || (loading && displaySections.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                    <GraduationCap className="w-5 h-5 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm text-slate-500 font-medium">Loading classes...</p>
            </div>
        );
    }

    // ==================== MAIN VIEW ====================
    return (
        <div className="w-full">
            {/* ==================== HEADER ==================== */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-md opacity-20 rounded-xl" />
                        <div className="relative p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                            <GraduationCap className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Classes</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {displaySections.length} class{displaySections.length !== 1 ? 'es' : ''} in this subject
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search classes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={openAddModal}
                        disabled={!subjectId || isSubmitting}
                        className={`group flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl shadow-lg transition-all duration-200 ${
                            !subjectId || isSubmitting
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-indigo-500/25 active:scale-[0.98]'
                        }`}
                    >
                        <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
                        Create Class
                    </button>
                </div>
            </div>

            {/* ==================== ERROR ==================== */}
            {error && !isAddModalOpen && (
                <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* ==================== EMPTY STATE ==================== */}
            {displaySections.length === 0 && !searchTerm && !loading && (
                <div className="relative text-center py-20 px-4 border border-slate-200 rounded-2xl bg-gradient-to-br from-slate-50 to-white overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-100/40 rounded-full -mr-24 -mt-24 blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-100/40 rounded-full -ml-24 -mb-24 blur-2xl" />
                    <div className="relative">
                        <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <BookOpen className="w-8 h-8 text-indigo-500" />
                        </div>
                        <h4 className="text-base font-bold text-slate-800">No classes yet</h4>
                        <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                            Create your first class to organize student submissions, modules, or research assignments.
                        </p>
                        <button
                            onClick={openAddModal}
                            disabled={!subjectId || isSubmitting}
                            className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition ${
                                !subjectId || isSubmitting
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25'
                            }`}
                        >
                            <Plus className="w-4 h-4" />
                            Create Class
                        </button>
                    </div>
                </div>
            )}

            {/* ==================== NO SEARCH RESULTS ==================== */}
            {displaySections.length > 0 && filteredSections.length === 0 && searchTerm && (
                <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="w-7 h-7 text-slate-400" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-700">No matching classes found</h4>
                    <p className="text-xs text-slate-500 mt-1">
                        No results for <span className="font-semibold text-slate-700">"{searchTerm}"</span>
                    </p>
                    <button
                        onClick={() => setSearchTerm('')}
                        className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                        Clear search
                    </button>
                </div>
            )}

            {/* ==================== CLASS CARDS ==================== */}
            {filteredSections.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredSections.map((section, index) => {
                        const isEditing = editingId === section.id;
                        const color = CARD_COLORS[index % CARD_COLORS.length];
                        const isMenuOpen = openMenuId === section.id;

                        return (
                            <div
                                key={section.id || index}
                                onClick={() => handleSectionClick(section)}
                                className={`group relative bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
                                    !isEditing
                                        ? 'border-slate-200 cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-slate-300'
                                        : 'border-transparent ring-2 ring-indigo-500 shadow-lg'
                                }`}
                            >
                                {/* COLORED BANNER */}
                                <div className={`relative h-24 ${color.banner} p-4 flex flex-col justify-between`}>
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10" />
                                    <div className="absolute bottom-0 right-16 w-14 h-14 bg-white/[0.07] rounded-full -mb-6" />

                                    <div className="relative flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={(e) => { setEditTitle(e.target.value); if (error) setError(''); }}
                                                    onKeyDown={(e) => handleEditKeyDown(e, section.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full px-2.5 py-1.5 bg-white text-slate-800 text-sm font-bold rounded-lg outline-none focus:ring-2 focus:ring-white/60 shadow-sm"
                                                    autoFocus
                                                    disabled={isSubmitting}
                                                />
                                            ) : (
                                                <h3 className="text-white font-bold text-[15px] leading-snug line-clamp-2 drop-shadow-sm">
                                                    {section.title || section.name || 'Untitled Class'}
                                                </h3>
                                            )}
                                            {getSubjectName(section) && !isEditing && (
                                                <p className="text-white/85 text-[11px] mt-1 truncate font-medium">
                                                    {getSubjectName(section)}
                                                </p>
                                            )}
                                        </div>

                                        {!isEditing && (
                                            <div className="relative shrink-0">
                                                <button
                                                    onClick={(e) => handleMenuToggle(e, section.id)}
                                                    className="p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition text-white opacity-0 group-hover:opacity-100"
                                                    title="Menu"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {isMenuOpen && (
                                                    <div
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-30 animate-[fadeIn_0.15s_ease-out]"
                                                    >
                                                        <button
                                                            onClick={(e) => handleEditButtonClick(e, section)}
                                                            disabled={isSubmitting}
                                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                                            Edit class
                                                        </button>
                                                        <div className="h-px bg-slate-100 my-1" />
                                                        <button
                                                            onClick={(e) => handleDeleteButtonClick(e, section.id)}
                                                            disabled={isSubmitting}
                                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            Delete class
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* CARD BODY */}
                                <div className="p-4">
                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditSave(section.id); }}
                                                disabled={isSubmitting}
                                                className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            >
                                                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                Save
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditCancel(); }}
                                                disabled={isSubmitting}
                                                className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2.5 mb-3">
                                                <div className={`w-9 h-9 rounded-xl ${color.banner} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm`}>
                                                    {getInitials(section.title || section.name)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Class</p>
                                                    <p className="text-xs text-slate-700 font-medium truncate mt-0.5">
                                                        {getSubjectName(section) || 'Subject'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>
                                                        {section.createdAt ? new Date(section.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric'
                                                        }) : 'N/A'}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) => handleViewGroupsButtonClick(e, section)}
                                                    className={`group/btn flex items-center gap-1 text-[11px] font-bold ${color.text} hover:underline transition`}
                                                >
                                                    <Users className="w-3 h-3" />
                                                    Groups
                                                    <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ==================== FOOTER STATS ==================== */}
            {displaySections.length > 0 && (
                <div className="mt-6 flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>
                        Showing <strong className="text-slate-800 font-bold">{filteredSections.length}</strong> of{' '}
                        <strong className="text-slate-800 font-bold">{displaySections.length}</strong> class{displaySections.length !== 1 ? 'es' : ''}
                    </span>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
                        >
                            Reset filter
                        </button>
                    )}
                </div>
            )}

            {/* ==================== CREATE CLASS MODAL ==================== */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 relative overflow-hidden animate-[slideUp_0.25s_ease-out]">
                        <div className="relative bg-gradient-to-r from-indigo-50 via-white to-sky-50 px-6 py-4 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Create New Class</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Add a new class to this subject</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeAddModal}
                                    disabled={isSubmitting}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition disabled:opacity-50"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleAddSection} className="p-6 space-y-4">
                            <div>
                                <label className="block font-semibold text-xs text-slate-600 mb-1.5 uppercase tracking-wider">
                                    Class Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. BSIT 3A - Web Development"
                                    value={newSectionTitle}
                                    onChange={(e) => { setNewSectionTitle(e.target.value); if (error) setError(''); }}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition"
                                    autoFocus
                                    disabled={isSubmitting}
                                />
                                {!subjectId && (
                                    <p className="mt-2 text-xs text-amber-600 flex items-center gap-1.5">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        Please select a subject first
                                    </p>
                                )}
                            </div>

                            {error && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span className="flex-1">{error}</span>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={closeAddModal}
                                    disabled={isSubmitting}
                                    className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !subjectId || !newSectionTitle.trim()}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" />Creating...</>
                                    ) : (
                                        <><Check className="w-4 h-4" />Create Class</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(12px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default SubjectSections;