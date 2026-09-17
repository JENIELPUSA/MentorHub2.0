// SubjectSections.jsx
import React, { useContext, useEffect, useState } from 'react';
import {
    Search,
    FileText,
    Plus,
    Trash2,
    Edit2,
    X,
    Check,
    Folder,
    Calendar,
    Layers,
    ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { SectionContext } from '../../contexts/SectionContext/SectionContext';
import GroupDashboard from './GroupComponents';

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
    // ============ NEW PROP FOR SUBJECT INFORMATION ============
    onViewModeChange // Callback to notify parent about view mode changes
}) => {
    const navigate = useNavigate();

    console.log("sections",sections)

    // ==================== EXISTING STATES ====================
    const [isAdding, setIsAdding] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [dailyLoading, setDailyLoading] = useState(true);

    // ==================== NEW STATE FOR GROUP DASHBOARD ====================
    const [viewMode, setViewMode] = useState('sections'); // 'sections' | 'groups'
    const [selectedSectionForGroups, setSelectedSectionForGroups] = useState(null);

    const {
        createSection,
        sectionsData,
        updateSection,
        deleteSection,
        fetchSections,
        loading
    } = useContext(SectionContext);

    console.log("sectionsData", sectionsData);

    // ==================== NOTIFY PARENT ABOUT VIEW MODE CHANGE ====================
    useEffect(() => {
        if (onViewModeChange) {
            onViewModeChange(viewMode);
        }
    }, [viewMode, onViewModeChange]);

    // ==================== HANDLE VIEW GROUPS ====================
    const handleViewGroups = (section) => {
        // Prevent if editing
        if (editingId === section.id) return;

        console.log("📂 [SubjectSections] Opening groups for section:", section.title || section.name);
        setSelectedSectionForGroups(section);
        setViewMode('groups');
    };

    // ==================== HANDLE BACK TO SECTIONS ====================
    const handleBackToSections = () => {
        console.log("⬅️ [SubjectSections] Going back to sections view");
        setViewMode('sections');
        setSelectedSectionForGroups(null);
    };

    // ==================== UPDATED NAVIGATION HANDLER ====================
    const handleSectionClick = (section) => {
        // Prevent navigation if editing
        if (editingId === section.id) return;

        // Use custom handler if provided
        if (onSectionClick) {
            onSectionClick(section);
            return;
        }

        // Check if navigateToGroups is provided
        if (navigateToGroups) {
            if (typeof navigateToGroups === 'string') {
                navigate(`${navigateToGroups}/${section.id || section._id}`);
            } else if (typeof navigateToGroups === 'function') {
                navigateToGroups(section);
            }
            return;
        }

        // Default: Show groups dashboard (replaces the sections view)
        handleViewGroups(section);
    };

    // ==================== EXISTING EFFECTS ====================
    useEffect(() => {
        setDailyLoading(true);
        const timer = setTimeout(() => {
            setDailyLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (subjectId) {
            fetchSections({ subjectId: subjectId });
        }
    }, [subjectId, fetchSections]);

    // ==================== MAP SECTIONS DATA ====================
    const mapSectionsToDisplay = (data) => {
        if (!data || !Array.isArray(data)) return [];

        return data.map(section => ({
            id: section._id || section.id,
            title: section.name || section.title || 'Untitled Section',
            name: section.name || section.title,
            subjectId: section.subjectId?._id || section.subjectId || '',
            subjectName: section.subjectId?.title || section.subjectId?.name || '',
            createdAt: section.createdAt || new Date().toISOString(),
            updatedAt: section.updatedAt || new Date().toISOString(),
            rawData: section
        }));
    };

    // ==================== GET DISPLAY SECTIONS ====================
    let displaySections = [];

    if (sections && sections.length > 0) {
        displaySections = sections;
    } else if (sectionsData && Array.isArray(sectionsData) && sectionsData.length > 0) {
        displaySections = mapSectionsToDisplay(sectionsData);
    } else {
        displaySections = [];
    }

    // ==================== FILTER SECTIONS ====================
    const filteredSections = displaySections.filter(section => {
        if (!section) return false;
        const title = section.title || section.name || '';
        return typeof title === 'string' && title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // ==================== HANDLE ADD SECTION ====================
    const handleAddSection = async () => {
        if (!newSectionTitle.trim()) {
            setError('Section name is required');
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
                subjectId: subjectId
            });

            if (result.success) {
                setNewSectionTitle('');
                setIsAdding(false);
                setError('');
                if (onSectionCreated) {
                    onSectionCreated(result.data);
                }

                if (onAddSection) {
                    onAddSection(result.data);
                }

                await fetchSections({ subjectId: subjectId });

                console.log('✅ Section created:', result.data);
            } else {
                const errorMsg = result.message || result.error || 'Failed to create section';
                setError(errorMsg);
                console.error('❌ Failed to create section:', errorMsg);
            }
        } catch (error) {
            console.error('❌ Error creating section:', error);
            setError(error.message || 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelAdd = () => {
        setIsAdding(false);
        setNewSectionTitle('');
        setError('');
    };

    // ==================== HANDLE UPDATE SECTION ====================
    const handleEditClick = (section) => {
        setEditingId(section.id);
        setEditTitle(section.title || section.name || '');
        setError('');
    };

    const handleEditSave = async (id) => {
        if (!editTitle.trim()) {
            setError('Section name is required');
            return;
        }

        try {
            setIsSubmitting(true);
            setError('');

            const result = await updateSection(id, {
                name: editTitle.trim()
            });

            if (result.success) {
                setEditingId(null);
                setEditTitle('');
                setError('');

                await fetchSections({ subjectId: subjectId });

                if (onSectionUpdated) {
                    onSectionUpdated(result.data);
                }

                if (onEditSection) {
                    onEditSection(id, editTitle.trim());
                }

                console.log('✅ Section updated:', result.data);
            } else {
                const errorMsg = result.message || result.error || 'Failed to update section';
                setError(errorMsg);
                console.error('❌ Failed to update section:', errorMsg);
            }
        } catch (error) {
            console.error('❌ Error updating section:', error);
            setError(error.message || 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditTitle('');
        setError('');
    };

    // ==================== HANDLE DELETE SECTION ====================
    const handleDeleteSection = async (id) => {
        const sectionToDelete = displaySections.find(s => s.id === id);
        const sectionName = sectionToDelete?.title || sectionToDelete?.name || 'this section';

        if (!window.confirm(`Are you sure you want to delete "${sectionName}"?`)) {
            return;
        }

        try {
            setIsSubmitting(true);
            setError('');

            const result = await deleteSection(id);

            if (result.success) {
                setError('');

                await fetchSections({ subjectId: subjectId });

                if (onSectionDeleted) {
                    onSectionDeleted(id);
                }

                if (onDeleteSection) {
                    onDeleteSection(id);
                }

                console.log('✅ Section deleted successfully');
            } else {
                const errorMsg = result.message || result.error || 'Failed to delete section';
                setError(errorMsg);
                console.error('❌ Failed to delete section:', errorMsg);
            }
        } catch (error) {
            console.error('❌ Error deleting section:', error);
            setError(error.message || 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==================== HANDLE EDIT BUTTON CLICK ====================
    const handleEditButtonClick = (e, section) => {
        e.stopPropagation();
        handleEditClick(section);
    };

    // ==================== HANDLE DELETE BUTTON CLICK ====================
    const handleDeleteButtonClick = (e, id) => {
        e.stopPropagation();
        handleDeleteSection(id);
    };

    // ==================== HANDLE VIEW GROUPS BUTTON CLICK ====================
    const handleViewGroupsButtonClick = (e, section) => {
        e.stopPropagation(); // Prevent card click
        handleViewGroups(section);
    };

    // ==================== KEYBOARD ACCESSIBILITY ====================
    const handleAddKeyDown = (e) => {
        if (e.key === 'Enter') handleAddSection();
        if (e.key === 'Escape') handleCancelAdd();
    };

    const handleEditKeyDown = (e, id) => {
        if (e.key === 'Enter') handleEditSave(id);
        if (e.key === 'Escape') handleEditCancel();
    };

    // ==================== GET SUBJECT NAME ====================
    const getSubjectName = (section) => {
        if (section.subjectName) return section.subjectName;
        if (section.subjectId?.title) return section.subjectId.title;
        if (section.subjectId?.name) return section.subjectId.name;
        return '';
    };

    // ==================== IF VIEWING GROUPS, SHOW GROUP DASHBOARD ONLY ====================
    // REMOVED the duplicate Back to Sections button - let GroupDashboard handle it
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

    // ==================== DAILY LOADING STATE ====================
    if (dailyLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
                <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-100 rounded-full animate-spin border-t-blue-600 border-r-blue-400"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg animate-pulse flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">📚</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <h3 className="text-sm font-semibold text-slate-700">Loading Sections</h3>
                            <p className="text-xs text-slate-400 mt-1">
                                Preparing your daily content...
                            </p>
                        </div>

                        <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"
                                style={{ width: '70%' }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==================== CONTEXT LOADING STATE ====================
    if (loading && displaySections.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
                <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-sm text-slate-500">Loading sections...</p>
                    </div>
                </div>
            </div>
        );
    }

    // ==================== SECTIONS VIEW ====================
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Daily Last Updated Badge */}
            <div className="px-6 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-blue-700">
                    <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span>Daily content loaded</span>
                </div>
                <span className="text-[10px] text-blue-400">
                    Updated: {new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </span>
            </div>

            {/* Header Bar */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Title Section */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
                            <Folder className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-800">Subject Sections</h3>
                            <p className="text-xs text-slate-500">
                                Manage academic sections and course modules ({displaySections.length} total)
                            </p>
                        </div>
                    </div>

                    {/* Action Tools */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-60">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search section name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                setIsAdding(!isAdding);
                                setError('');
                            }}
                            disabled={!subjectId || isSubmitting || loading}
                            className={`flex items-center justify-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-all shadow-sm ${!subjectId || isSubmitting || loading
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : isAdding
                                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                                }`}
                            title={!subjectId ? 'Please select a subject first' : ''}
                        >
                            {isAdding ? (
                                <>
                                    <X className="w-4 h-4" />
                                    Cancel
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    New Section
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-start gap-2">
                    <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                    <button
                        onClick={() => setError('')}
                        className="ml-auto text-rose-500 hover:text-rose-700"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Inline Add Section Card */}
            {isAdding && (
                <div className="m-6 p-4 bg-blue-50/50 border border-blue-200 rounded-xl transition-all">
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="flex-1 w-full">
                            <label className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1.5 block">
                                Section Name / Identifier
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. BSIT 3A - Web Development"
                                value={newSectionTitle}
                                onChange={(e) => {
                                    setNewSectionTitle(e.target.value);
                                    if (error) setError('');
                                }}
                                onKeyDown={handleAddKeyDown}
                                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                autoFocus
                                disabled={isSubmitting}
                            />
                            {!subjectId && (
                                <p className="mt-1 text-xs text-amber-600">
                                    ⚠️ Please select a subject before adding sections
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleAddSection}
                                disabled={isSubmitting || !subjectId}
                                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition shadow-sm flex items-center justify-center gap-1.5 ${isSubmitting || !subjectId
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Save Section
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleCancelAdd}
                                disabled={isSubmitting}
                                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-sm font-medium rounded-lg transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content View */}
            <div className="p-6">
                {/* Empty State: No Sections Exist */}
                {displaySections.length === 0 && !searchTerm && !loading && (
                    <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
                            <Layers className="w-6 h-6 text-slate-400" />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-700">No sections added yet</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Create your first section to organize student submissions, modules, or research assignments.
                        </p>
                        <button
                            onClick={() => setIsAdding(true)}
                            disabled={!subjectId || isSubmitting}
                            className={`mt-4 inline-flex items-center gap-1.5 text-xs font-semibold ${!subjectId || isSubmitting
                                ? 'text-slate-400 cursor-not-allowed'
                                : 'text-blue-600 hover:text-blue-700 hover:underline'
                                }`}
                            title={!subjectId ? 'Please select a subject first' : ''}
                        >
                            <Plus className="w-3.5 h-3.5" /> Create Section Now
                        </button>
                    </div>
                )}

                {/* Empty State: Search Not Found */}
                {displaySections.length > 0 && filteredSections.length === 0 && searchTerm && (
                    <div className="text-center py-12">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Search className="w-5 h-5 text-slate-400" />
                        </div>
                        <h4 className="text-sm font-medium text-slate-700">No matching sections found</h4>
                        <p className="text-xs text-slate-500 mt-1">
                            No results found for <span className="font-semibold text-slate-700">"{searchTerm}"</span>
                        </p>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-3 text-xs font-medium text-blue-600 hover:underline"
                        >
                            Clear search filter
                        </button>
                    </div>
                )}

                {/* Sections Grid View */}
                {filteredSections.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSections.map((section, index) => {
                            const isEditing = editingId === section.id;

                            return (
                                <div
                                    key={section.id || index}
                                    onClick={() => handleSectionClick(section)}
                                    className={`group relative bg-white border ${isEditing ? 'border-blue-400 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'} rounded-xl p-4 transition-all duration-200 flex flex-col justify-between ${!isEditing ? 'cursor-pointer hover:bg-blue-50/30' : ''}`}
                                >
                                    {/* Card Top Header */}
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                                Section #{index + 1}
                                            </span>

                                            {/* Action Menu */}
                                            {!isEditing && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => handleEditButtonClick(e, section)}
                                                        disabled={isSubmitting}
                                                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition disabled:opacity-50"
                                                        title="Edit section"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteButtonClick(e, section.id)}
                                                        disabled={isSubmitting}
                                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition disabled:opacity-50"
                                                        title="Delete section"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Section Title & Inline Editing */}
                                        {isEditing ? (
                                            <div className="space-y-2 mt-1">
                                                <input
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={(e) => {
                                                        setEditTitle(e.target.value);
                                                        if (error) setError('');
                                                    }}
                                                    onKeyDown={(e) => handleEditKeyDown(e, section.id)}
                                                    className="w-full px-2.5 py-1.5 bg-white border border-blue-500 rounded-md text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    autoFocus
                                                    disabled={isSubmitting}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditSave(section.id);
                                                        }}
                                                        disabled={isSubmitting}
                                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition flex items-center gap-1 disabled:opacity-50"
                                                    >
                                                        {isSubmitting ? (
                                                            <span className="animate-spin">⏳</span>
                                                        ) : (
                                                            <Check className="w-3 h-3" />
                                                        )}
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditCancel();
                                                        }}
                                                        disabled={isSubmitting}
                                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded transition disabled:opacity-50"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
                                                    {section.title || section.name || 'Untitled'}
                                                </h4>
                                                {getSubjectName(section) && (
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Subject: {getSubjectName(section)}
                                                    </p>
                                                )}
                                                {/* Navigation indicator - Now clickable */}
                                                <button
                                                    onClick={(e) => handleViewGroupsButtonClick(e, section)}
                                                    className="mt-2 flex items-center gap-1 text-blue-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                                                >
                                                    <span>View Groups</span>
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Bottom Meta Footer */}
                                    {!isEditing && (
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                <span>
                                                    {section.createdAt ? new Date(section.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    }) : 'N/A'}
                                                </span>
                                            </div>
                                            <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                                ID: {String(section.id || section._id || '').slice(-4)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Table/Grid Footer Stats */}
            {displaySections.length > 0 && (
                <div className="px-6 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                        Showing <strong className="text-slate-700">{filteredSections.length}</strong> of{' '}
                        <strong className="text-slate-700">{displaySections.length}</strong> section{displaySections.length !== 1 ? 's' : ''}
                    </span>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Reset Filter
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default SubjectSections;