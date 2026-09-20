import React, { useState, useMemo, useEffect, useContext, useCallback } from 'react';
import { ProposedTitleContext } from '../../contexts/ProposedTitleContext/ProposedTitleContext';

// ============================================================
// HELPERS
// ============================================================
const isValid = (val) =>
    val !== null &&
    val !== undefined &&
    val !== '' &&
    val !== 'N/A' &&
    !(Array.isArray(val) && val.length === 0);

const getFullName = (u) => {
    if (!u) return '';
    if (u.full_name) return u.full_name;
    return [u.first_name, u.last_name].filter(Boolean).join(' ') || '';
};

const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getYear = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).getFullYear().toString();
};

const AVATAR_COLORS = [
    'bg-blue-900',
    'bg-blue-800',
    'bg-blue-700',
    'bg-indigo-800',
    'bg-sky-800',
    'bg-cyan-800',
    'bg-blue-600',
    'bg-indigo-700',
];

const getAvatarColor = (name) => {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// ============================================================
// AVATAR COMPONENTS
// ============================================================
const Avatar = ({ name, size = 'md', ring = true }) => {
    const sizeClasses = {
        sm: 'w-6 h-6 text-[10px]',
        md: 'w-8 h-8 text-[11px]',
        lg: 'w-10 h-10 text-xs',
    };
    return (
        <div
            title={name}
            className={`${sizeClasses[size]} ${getAvatarColor(name)} ${
                ring ? 'ring-2 ring-white' : ''
            } rounded-full flex items-center justify-center text-white font-semibold tracking-wide select-none`}
        >
            {getInitials(name)}
        </div>
    );
};

const AvatarGroup = ({ names = [], max = 3, size = 'md' }) => {
    const visible = names.slice(0, max);
    const extra = names.length - visible.length;
    return (
        <div className="flex items-center">
            <div className="flex -space-x-1.5">
                {visible.map((n, i) => (
                    <Avatar key={i} name={n} size={size} />
                ))}
                {extra > 0 && (
                    <div
                        className={`${
                            size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-[11px]'
                        } rounded-full bg-yellow-400 text-blue-900 font-bold flex items-center justify-center ring-2 ring-white`}
                    >
                        +{extra}
                    </div>
                )}
            </div>
        </div>
    );
};

// Map a back-end archived title -> the shape this UI expects
const mapArchivedToProject = (item) => {
    const group = item.groupInfo || {};
    const adviser = item.adviserInfo || null;
    const coadviser = item.coadviserInfo || null;

    let authorList = [];
    if (Array.isArray(item.members) && item.members.length > 0) {
        authorList = item.members.map(getFullName).filter(isValid);
    } else if (isValid(item.uploaderName)) {
        authorList = [item.uploaderName];
    }

    const authors = authorList.length > 0 ? authorList.join(', ') : '';

    const keywords =
        Array.isArray(item.keywords) && item.keywords.length > 0
            ? item.keywords
            : Array.isArray(item.titleUrlTracking?.tags)
            ? item.titleUrlTracking.tags
            : [];

    const adviserName = getFullName(adviser);
    const coAdviserName = getFullName(coadviser);

    return {
        id: item._id,
        title: item.title || 'Untitled',
        dept: isValid(group.sectionId?.name) ? group.sectionId.name : (group.department || ''),
        year: getYear(item.createdAt),
        authors,
        authorList,
        adviser: adviserName,
        adviserRaw: adviser,
        coAdviser: coAdviserName,
        coAdviserRaw: coadviser,
        tag: item.tag || (keywords[0] ?? ''),
        abstract: item.description || 'No abstract available.',
        keywords,
        downloads: item.downloads ?? 0,
        raw: item,
    };
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function Archivecomponents() {
    const {
        archivedTitles = [],
        totalArchivedTitles = 0,
        archivedTotalPages = 1,
        archivedCurrentPage = 1,
        setArchivedCurrentPage,
        archivedSearch = '',
        setArchivedSearch,
        isLoading = false,
        ResetArchivedFilters,
        GetFileFromCloudinary,
    } = useContext(ProposedTitleContext);

    const [searchInput, setSearchInput] = useState(archivedSearch);
    const [deptFilter, setDeptFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [tagFilter, setTagFilter] = useState('All');
    const [selectedProject, setSelectedProject] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        setSearchInput(archivedSearch);
    }, [archivedSearch]);

    useEffect(() => {
        const t = setTimeout(() => {
            if (searchInput !== archivedSearch) {
                setArchivedCurrentPage(1);
                setArchivedSearch(searchInput);
            }
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput, archivedSearch, setArchivedSearch, setArchivedCurrentPage]);

    const mappedProjects = useMemo(
        () => (archivedTitles || []).map(mapArchivedToProject),
        [archivedTitles]
    );

    const filteredProjects = useMemo(() => {
        return mappedProjects.filter((p) => {
            const matchesDept = deptFilter === '' || p.dept === deptFilter;
            const matchesYear = yearFilter === '' || p.year === yearFilter;
            const matchesTag = tagFilter === 'All' || p.tag === tagFilter;
            return matchesDept && matchesYear && matchesTag;
        });
    }, [mappedProjects, deptFilter, yearFilter, tagFilter]);

    const topics = useMemo(() => {
        const set = new Set(['All']);
        mappedProjects.forEach((p) => {
            if (isValid(p.tag)) set.add(p.tag);
            p.keywords.forEach((k) => {
                if (isValid(k)) set.add(k);
            });
        });
        return Array.from(set).slice(0, 8);
    }, [mappedProjects]);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    const handleResetFilters = () => {
        setDeptFilter('');
        setYearFilter('');
        setTagFilter('All');
        setSearchInput('');
        if (ResetArchivedFilters) ResetArchivedFilters();
    };

    const goToPage = useCallback(
        (page) => {
            const clamped = Math.min(Math.max(1, page), archivedTotalPages);
            setArchivedCurrentPage(clamped);
        },
        [archivedTotalPages, setArchivedCurrentPage]
    );

    const handleDownload = async (project) => {
        if (!project?.raw?._id || !GetFileFromCloudinary) return;
        setDownloading(true);
        showToast('Initiating document download...');
        try {
            await GetFileFromCloudinary(project.raw._id);
        } catch (err) {
            console.error(err);
            showToast('Failed to download document.');
        } finally {
            setDownloading(false);
            setSelectedProject(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 font-sans antialiased flex flex-col">
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b-2 border-blue-900/10">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-900 p-2.5 rounded-lg text-yellow-400 shadow-sm border-b-2 border-yellow-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0.011.665M12 14L5.84 10.578C5.292 10.875 5 11.41 5 12v5a2 2 0 002 2h10a2 2 0 002-2v-5c0-.59-.292-1.125-.84-1.422L12 14z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-blue-900">Capstone Project Archive</h1>
                            <p className="text-xs text-slate-500 mt-0.5">Repository of completed thesis and capstone projects.</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-2 border-l-4 border-l-yellow-400">
                            <span className="w-2 h-2 rounded-full bg-blue-900"></span>
                            <span className="text-xs text-slate-600 font-medium tracking-wide uppercase">
                                <span id="total-count" className="text-blue-900 font-bold">{totalArchivedTitles}</span> Archives
                            </span>
                        </div>
                    </div>
                </div>

                {/* Search + Filters */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3 border-t-2 border-t-blue-900">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2 relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-900">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by title, keyword, author, or adviser..."
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 focus:bg-white transition"
                            />
                        </div>
                        <div>
                            <select
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 focus:bg-white transition"
                            >
                                <option value="">All Departments</option>
                                <option value="BSIT">BS Information Technology</option>
                                <option value="BSCS">BS Computer Science</option>
                                <option value="BSIS">BS Information Systems</option>
                                <option value="BSECE">BS Electronics Engineering</option>
                            </select>
                        </div>
                        <div>
                            <select
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 focus:bg-white transition"
                            >
                                <option value="">All Years</option>
                                <option value="2026">2026</option>
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs border-t border-slate-100 pt-3">
                        <span className="text-[11px] uppercase tracking-wider text-blue-900 font-bold whitespace-nowrap">Topics:</span>
                        {topics.map(topic => (
                            <button
                                key={topic}
                                onClick={() => setTagFilter(topic)}
                                className={`px-2.5 py-1 rounded-md font-medium transition whitespace-nowrap border ${
                                    tagFilter === topic
                                        ? 'bg-blue-900 text-yellow-400 border-blue-900'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-900 hover:text-blue-900 hover:bg-yellow-50'
                                }`}
                            >
                                {topic}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4 animate-pulse">
                                <div className="flex justify-between">
                                    <div className="h-4 w-16 bg-slate-100 rounded" />
                                    <div className="h-4 w-12 bg-slate-100 rounded" />
                                </div>
                                <div className="h-4 w-full bg-slate-100 rounded" />
                                <div className="h-4 w-3/4 bg-slate-100 rounded" />
                                <div className="h-12 w-full bg-slate-50 rounded" />
                                <div className="h-14 w-full bg-slate-50 rounded" />
                            </div>
                        ))}
                    </div>
                ) : filteredProjects.length > 0 ? (
                    <>
                        {/* Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProjects.map(p => (
                                <div key={p.id} className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-900/40 transition-all duration-200 flex flex-col justify-between overflow-hidden group border-t-4 border-t-blue-900">
                                    <div className="p-5 space-y-3">
                                        {/* Dept + Year badges */}
                                        <div className="flex items-center justify-between">
                                            {isValid(p.dept) && (
                                                <span className="px-2 py-0.5 bg-blue-900 text-yellow-400 text-[10px] font-bold rounded uppercase tracking-wider">{p.dept}</span>
                                            )}
                                            {isValid(p.year) && (
                                                <span className="text-[10px] font-bold text-blue-900 tracking-wider bg-yellow-400 px-2 py-0.5 rounded">{p.year}</span>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h3 className="font-bold text-blue-900 group-hover:text-blue-700 transition line-clamp-2 text-[15px] leading-snug">{p.title}</h3>

                                        {/* Description — directly below title */}
                                        {isValid(p.abstract) && (
                                            <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed border-l-2 border-yellow-400 pl-2.5 italic">
                                                {p.abstract}
                                            </p>
                                        )}

                                        {/* Contributors */}
                                        {p.authorList.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <AvatarGroup names={p.authorList} max={3} size="sm" />
                                                <span className="text-xs text-slate-500 truncate">
                                                    {p.authorList.length === 1
                                                        ? p.authorList[0]
                                                        : `${p.authorList[0]} +${p.authorList.length - 1} more`}
                                                </span>
                                            </div>
                                        )}

                                        {/* Adviser / Co-Adviser */}
                                        {(isValid(p.adviser) || isValid(p.coAdviser)) && (
                                            <div className="bg-blue-50/50 px-3 py-2 rounded-md text-xs space-y-1.5 border border-blue-100">
                                                {isValid(p.adviser) && (
                                                    <div className="flex items-center gap-2">
                                                        <Avatar name={p.adviser} size="sm" />
                                                        <div className="min-w-0">
                                                            <p className="text-[9px] uppercase tracking-wider text-blue-900/60 font-bold leading-tight">Adviser</p>
                                                            <p className="text-slate-700 font-medium truncate text-[11px]">{p.adviser}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {isValid(p.coAdviser) && (
                                                    <div className="flex items-center gap-2">
                                                        <Avatar name={p.coAdviser} size="sm" />
                                                        <div className="min-w-0">
                                                            <p className="text-[9px] uppercase tracking-wider text-blue-900/60 font-bold leading-tight">Co-Adviser</p>
                                                            <p className="text-slate-700 font-medium truncate text-[11px]">{p.coAdviser}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Keywords */}
                                        {p.keywords.length > 0 && (
                                            <div className="flex flex-wrap gap-1 pt-0.5">
                                                {p.keywords.slice(0, 3).map(kw => (
                                                    <span key={kw} className="text-blue-900/70 text-[10px] font-semibold tracking-wide bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200">#{kw}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-5 py-3 bg-blue-50/40 border-t border-blue-100 flex items-center justify-between">
                                        <span className="text-[11px] text-slate-600 flex items-center">
                                            <svg className="w-3 h-3 text-blue-900 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            <span className="font-bold text-blue-900">{p.downloads}</span>
                                            <span className="ml-1 text-slate-500">downloads</span>
                                        </span>
                                        <button
                                            onClick={() => setSelectedProject(p)}
                                            className="text-[11px] font-bold text-blue-900 hover:text-blue-700 flex items-center tracking-wide uppercase group-hover:text-blue-700"
                                        >
                                            <span>View Details</span>
                                            <svg className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalArchivedTitles > 0 && (
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t-2 border-t-blue-900">
                                <div className="text-xs text-slate-500 tracking-wide">
                                    Page <span className="font-bold text-blue-900">{archivedCurrentPage}</span> of{' '}
                                    <span className="font-bold text-blue-900">{archivedTotalPages}</span>
                                    <span className="mx-2 text-slate-300">|</span>
                                    <span className="font-bold text-blue-900">{totalArchivedTitles}</span> total archived
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => goToPage(archivedCurrentPage - 1)}
                                        disabled={archivedCurrentPage === 1}
                                        className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition ${
                                            archivedCurrentPage === 1
                                                ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                                                : 'border-slate-200 text-blue-900 hover:bg-yellow-50 hover:border-blue-900'
                                        }`}
                                    >
                                        Previous
                                    </button>

                                    {Array.from({ length: Math.min(archivedTotalPages, 5) }, (_, i) => {
                                        let pageNumber;
                                        if (archivedTotalPages <= 5) pageNumber = i + 1;
                                        else if (archivedCurrentPage <= 3) pageNumber = i + 1;
                                        else if (archivedCurrentPage >= archivedTotalPages - 2)
                                            pageNumber = archivedTotalPages - 4 + i;
                                        else pageNumber = archivedCurrentPage - 2 + i;

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => goToPage(pageNumber)}
                                                className={`w-8 h-8 rounded-md text-xs font-bold transition ${
                                                    archivedCurrentPage === pageNumber
                                                        ? 'bg-blue-900 text-yellow-400 shadow-sm'
                                                        : 'text-slate-600 hover:bg-yellow-50 hover:text-blue-900'
                                                }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() => goToPage(archivedCurrentPage + 1)}
                                        disabled={archivedCurrentPage === archivedTotalPages}
                                        className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition ${
                                            archivedCurrentPage === archivedTotalPages
                                                ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                                                : 'border-slate-200 text-blue-900 hover:bg-yellow-50 hover:border-blue-900'
                                        }`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 bg-white rounded-lg border border-slate-200 p-8 space-y-3 border-t-2 border-t-blue-900">
                        <div className="w-12 h-12 bg-yellow-400 text-blue-900 rounded-lg flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
                        </div>
                        <h3 className="text-base font-bold text-blue-900">No Projects Found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">Try adjusting your search terms or clearing filters to see other archives.</p>
                        <button
                            onClick={handleResetFilters}
                            className="px-3.5 py-1.5 bg-blue-900 text-yellow-400 rounded-md text-xs font-bold hover:bg-blue-800 transition tracking-wide"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}

            </main>

            {/* Modal */}
            {selectedProject && (
                <div className="fixed inset-0 z-50 bg-blue-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 border-t-4 border-t-yellow-400">
                        <div className="p-6 space-y-5">
                            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                                <div>
                                    {(isValid(selectedProject.dept) || isValid(selectedProject.year)) && (
                                        <span className="inline-block px-2 py-0.5 bg-blue-900 text-yellow-400 text-[10px] font-bold rounded uppercase tracking-wider mb-2">
                                            {[selectedProject.dept, selectedProject.year].filter(isValid).join(' • ')}
                                        </span>
                                    )}
                                    <h3 className="text-lg font-bold text-blue-900 leading-snug">{selectedProject.title}</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedProject(null)}
                                    className="text-slate-400 hover:text-blue-900 p-1.5 rounded-md hover:bg-yellow-50 transition"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="space-y-4 text-sm">
                                {/* Description — directly below title in modal */}
                                {isValid(selectedProject.abstract) && (
                                    <div className="bg-blue-50/50 p-4 rounded-md border-l-4 border-l-yellow-400 border border-blue-100">
                                        <h4 className="text-[10px] font-bold text-blue-900 mb-2 uppercase tracking-wider">Description</h4>
                                        <p className="text-slate-700 leading-relaxed text-justify text-[13px]">{selectedProject.abstract}</p>
                                    </div>
                                )}

                                {selectedProject.authorList.length > 0 && (
                                    <div className="bg-blue-50/50 p-4 rounded-md border border-blue-100">
                                        <span className="text-[10px] font-bold text-blue-900/70 block mb-3 uppercase tracking-wider">Contributors</span>
                                        <div className="space-y-1.5">
                                            {selectedProject.authorList.map((name, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <Avatar name={name} size="md" ring={false} />
                                                    <span className="font-medium text-slate-800 text-[13px]">{name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-4 rounded-md border border-blue-100">
                                    {isValid(selectedProject.year) && (
                                        <div>
                                            <span className="text-[10px] font-bold text-blue-900/70 block mb-1 uppercase tracking-wider">Publication Year</span>
                                            <p className="font-semibold text-slate-800 text-[13px]">{selectedProject.year}</p>
                                        </div>
                                    )}
                                    {isValid(selectedProject.tag) && (
                                        <div>
                                            <span className="text-[10px] font-bold text-blue-900/70 block mb-1 uppercase tracking-wider">Category</span>
                                            <p className="font-semibold text-blue-900 text-[13px]">{selectedProject.tag}</p>
                                        </div>
                                    )}
                                    {isValid(selectedProject.adviser) && (
                                        <div className="flex items-center gap-2">
                                            <Avatar name={selectedProject.adviser} size="md" ring={false} />
                                            <div>
                                                <span className="text-[10px] font-bold text-blue-900/70 block uppercase tracking-wider">Adviser</span>
                                                <p className="font-medium text-slate-800 text-[13px]">{selectedProject.adviser}</p>
                                            </div>
                                        </div>
                                    )}
                                    {isValid(selectedProject.coAdviser) && (
                                        <div className="flex items-center gap-2">
                                            <Avatar name={selectedProject.coAdviser} size="md" ring={false} />
                                            <div>
                                                <span className="text-[10px] font-bold text-blue-900/70 block uppercase tracking-wider">Co-Adviser</span>
                                                <p className="font-medium text-slate-800 text-[13px]">{selectedProject.coAdviser}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {selectedProject.keywords.length > 0 && (
                                    <div>
                                        <h4 className="text-[11px] font-bold text-blue-900 mb-2 uppercase tracking-wider">Keywords</h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedProject.keywords.map(kw => (
                                                <span key={kw} className="bg-yellow-50 text-blue-900 text-[11px] px-2 py-0.5 rounded border border-yellow-200 font-semibold">#{kw}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-100 pt-4 flex items-center justify-end space-x-2">
                                <button
                                    onClick={() => setSelectedProject(null)}
                                    className="px-3.5 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-50 transition tracking-wide"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => handleDownload(selectedProject)}
                                    disabled={downloading}
                                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-yellow-400 text-xs font-bold rounded-md shadow-sm flex items-center space-x-2 transition disabled:opacity-60 tracking-wide border-b-2 border-yellow-400"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    <span>{downloading ? 'Downloading...' : 'Download Document (PDF)'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toastMessage && (
                <div className="fixed bottom-5 right-5 z-50 bg-blue-900 text-white px-4 py-2.5 rounded-md shadow-lg flex items-center space-x-2.5 border-l-4 border-l-yellow-400">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-xs font-semibold tracking-wide">{toastMessage}</span>
                </div>
            )}
        </div>
    );
}