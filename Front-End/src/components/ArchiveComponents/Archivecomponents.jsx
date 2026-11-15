import React, { useState, useMemo, useEffect, useContext, useCallback, useRef } from 'react';
import { ProposedTitleContext } from '../../contexts/ProposedTitleContext/ProposedTitleContext';
import PDFimage from "../../assets/cardbg.jpg";

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
    'bg-blue-900', 'bg-blue-800', 'bg-blue-700', 'bg-indigo-800',
    'bg-sky-800', 'bg-cyan-800', 'bg-blue-600', 'bg-indigo-700',
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
// PDF URL HELPER
// ============================================================
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
const API_URL = import.meta.env.VITE_API_URL || '';

const getPdfUrl = (raw) => {
    if (!raw) return null;
    const fileId =
        raw?.fileId || raw?.file?.public_id || raw?.pdfId ||
        raw?.pdfPublicId || raw?.titleUrlTracking?.fileId ||
        raw?.titleUrlTracking?.publicId;
    const directUrl =
        raw?.fileUrl || raw?.pdfUrl || raw?.file?.url ||
        raw?.titleUrlTracking?.url;
    if (directUrl) return directUrl;
    if (!fileId) return null;
    if (raw?.file?.resource_type === 'raw' || raw?.isCloudinary) {
        return `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${fileId}`;
    }
    return `${API_URL}/files/${fileId}/view`;
};

// ============================================================
// AVATAR
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
            } rounded-full flex items-center justify-center text-yellow-300 font-semibold tracking-wide select-none`}
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
                        } rounded-full bg-yellow-400 text-blue-950 font-bold flex items-center justify-center ring-2 ring-white`}
                    >
                        +{extra}
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================
// ⭐ PDF PREVIEW COMPONENT
// ============================================================
const PdfImage = ({ item }) => {
    const [imgError, setImgError] = useState(false);

    const base64Preview = item?.latestTracking?.preview;
    const isPdfFile = item?.latestTracking?.isPdf;
    const trackingUrl = item?.latestTracking?.url;

    let src = null;
    if (!imgError) {
        if (base64Preview) src = base64Preview;
        else if (trackingUrl && !isPdfFile) src = trackingUrl;
    }
    if (!src) src = PDFimage;

    return (
        <img
            src={src}
            alt={item?.title || 'PDF Preview'}
            className="w-full h-full object-cover object-top bg-blue-50"
            onError={() => setImgError(true)}
            loading="lazy"
        />
    );
};

// ============================================================
// ⭐ SKELETON CARD — reusable
// ============================================================
const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10 overflow-hidden animate-pulse">
        <div className="aspect-[3/4] w-full bg-blue-100" />
        <div className="p-3 space-y-2">
            <div className="h-3 w-16 bg-blue-100 rounded" />
            <div className="h-4 w-full bg-blue-100 rounded" />
            <div className="h-4 w-3/4 bg-blue-100 rounded" />
        </div>
    </div>
);

const SkeletonGrid = ({ count = 8 }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(count)].map((_, i) => (
            <SkeletonCard key={i} />
        ))}
    </div>
);

// ============================================================
// MAP BACKEND -> UI SHAPE
// ============================================================
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
        pdfUrl: getPdfUrl(item),
        latestTracking: item.latestTracking || null,
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
        GetArchivedTitles,
    } = useContext(ProposedTitleContext);

    const [searchInput, setSearchInput] = useState(archivedSearch);
    const [deptFilter, setDeptFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [tagFilter, setTagFilter] = useState('All');
    const [selectedProject, setSelectedProject] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    // ⭐ LOCAL LOADING
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    // ⭐ TRACK kung tapos na ang unang fetch (kahit empty)
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const hasFetchedRef = useRef(false);
    const lastFetchKeyRef = useRef('');

    // ============================================================
    // ⭐ INITIAL FETCH — safe kahit sync o async
    // ============================================================
    useEffect(() => {
        if (!GetArchivedTitles) {
            setIsInitialLoading(false);
            setHasLoadedOnce(true);
            return;
        }
        if (hasFetchedRef.current) return;

        hasFetchedRef.current = true;

        const key = `${archivedCurrentPage}|${archivedSearch}`;
        lastFetchKeyRef.current = key;

        setIsInitialLoading(true);

        let cancelled = false;

        const finishLoading = () => {
            if (cancelled) return;
            setIsInitialLoading(false);
            setHasLoadedOnce(true); // ⭐ tapos na ang unang fetch
        };

        try {
            const result = GetArchivedTitles(archivedCurrentPage, archivedSearch);

            if (result && typeof result.finally === 'function') {
                result.finally(finishLoading);
            } else if (result && typeof result.then === 'function') {
                result.then(finishLoading).catch(finishLoading);
            } else {
                finishLoading();
            }
        } catch (err) {
            console.error('GetArchivedTitles error:', err);
            finishLoading();
        }

        // ⭐ SAFETY TIMER — kung stuck, i-off after 5s
        const safetyTimer = setTimeout(finishLoading, 5000);

        return () => {
            cancelled = true;
            clearTimeout(safetyTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ============================================================
    // ⭐ REFETCH — kapag nagbago ang page o search
    // ============================================================
    useEffect(() => {
        if (!GetArchivedTitles) return;
        if (!hasFetchedRef.current) return;

        const key = `${archivedCurrentPage}|${archivedSearch}`;
        if (key === lastFetchKeyRef.current) return;

        lastFetchKeyRef.current = key;

        try {
            const result = GetArchivedTitles(archivedCurrentPage, archivedSearch);
            if (result && typeof result.catch === 'function') {
                result.catch((err) => console.error('Refetch error:', err));
            }
        } catch (err) {
            console.error('Refetch error:', err);
        }
    }, [archivedCurrentPage, archivedSearch, GetArchivedTitles]);

    // ============================================================
    // SYNC search input mula sa context
    // ============================================================
    useEffect(() => {
        setSearchInput(archivedSearch);
    }, [archivedSearch]);

    // ============================================================
    // DEBOUNCED SEARCH — 400ms bago i-set sa context
    // ============================================================
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

    // ============================================================
    // OPEN PDF
    // ============================================================
    const handleOpenInBrowser = async (project) => {
        const latestUrl = project?.latestTracking?.url;
        const pdfUrl = latestUrl || project?.pdfUrl;

        if (pdfUrl) {
            showToast('Opening document in browser...');
            const newTab = window.open(pdfUrl, '_blank', 'noopener,noreferrer');
            if (!newTab) {
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            return;
        }

        if (!project?.raw?._id || !GetFileFromCloudinary) {
            showToast('No PDF document available for this project.');
            return;
        }

        try {
            showToast('Opening document in browser...');
            const result = await GetFileFromCloudinary(project.raw._id);

            if (result instanceof Blob) {
                const blobUrl = URL.createObjectURL(
                    new Blob([result], { type: 'application/pdf' })
                );
                const newTab = window.open(blobUrl, '_blank');
                if (!newTab) {
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
            } else if (typeof result === 'string') {
                const newTab = window.open(result, '_blank', 'noopener,noreferrer');
                if (!newTab) {
                    const link = document.createElement('a');
                    link.href = result;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else if (result?.url) {
                const newTab = window.open(result.url, '_blank', 'noopener,noreferrer');
                if (!newTab) {
                    const link = document.createElement('a');
                    link.href = result.url;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else {
                showToast('Failed to open document.');
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to open document.');
        }
    };

    // ============================================================
    // ⭐ DECISION LOGIC — ITO ANG FIX
    // ============================================================
    // 1. Kung nag-loading pa (initial o context) → SKELETON
    // 2. Kung wala pang data at HINDI pa tapos ang unang fetch → SKELETON
    // 3. Kung may data → CARDS
    // 4. Kung wala pang data at tapos na ang fetch → "No Projects Found"

    const noDataYet = !archivedTitles || archivedTitles.length === 0;
    const isStillLoading = isInitialLoading || isLoading;
    const shouldShowSkeleton = isStillLoading || (noDataYet && !hasLoadedOnce);
    const shouldShowEmpty = !isStillLoading && hasLoadedOnce && noDataYet;

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-sky-50 text-slate-800 font-sans antialiased flex flex-col">
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-blue-900 p-6 rounded-2xl shadow-md border-b-4 border-yellow-400">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-800 p-2.5 rounded-lg text-yellow-300 shadow-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0.011.665M12 14L5.84 10.578C5.292 10.875 5 11.41 5 12v5a2 2 0 002 2h10a2 2 0 002-2v-5c0-.59-.292-1.125-.84-1.422L12 14z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white">Capstone Project Archive</h1>
                            <p className="text-xs text-blue-200 mt-0.5">Repository of completed thesis and capstone projects.</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="bg-white px-3.5 py-2 rounded-lg border border-blue-200 shadow-sm flex items-center space-x-2 border-l-4 border-l-yellow-400">
                            <span className="w-2 h-2 rounded-full bg-blue-900"></span>
                            <span className="text-xs text-slate-600 font-medium tracking-wide uppercase">
                                <span id="total-count" className="text-blue-900 font-bold">{totalArchivedTitles}</span> Archives
                            </span>
                        </div>
                    </div>
                </header>

                {/* Search + Filters */}
                <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10 space-y-3 border-t-4 border-t-yellow-400">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2 relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by title, keyword, author, or adviser..."
                                className="w-full pl-9 pr-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-slate-800 placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-white transition"
                            />
                        </div>
                        <div>
                            <select
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-white transition"
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
                                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-white transition"
                            >
                                <option value="">All Years</option>
                                <option value="2026">2026</option>
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs border-t border-blue-100 pt-3">
                        <span className="text-[11px] uppercase tracking-wider text-blue-900 font-bold whitespace-nowrap">Topics:</span>
                        {topics.map(topic => (
                            <button
                                key={topic}
                                onClick={() => setTagFilter(topic)}
                                className={`px-2.5 py-1 rounded-md font-medium transition whitespace-nowrap border ${
                                    tagFilter === topic
                                        ? 'bg-blue-900 text-yellow-300 border-blue-900'
                                        : 'bg-white text-blue-800 border-blue-200 hover:border-yellow-400 hover:bg-yellow-50'
                                }`}
                            >
                                {topic}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ⭐ DECISION: skeleton vs cards vs empty */}
                {shouldShowSkeleton ? (
                    <SkeletonGrid count={8} />
                ) : shouldShowEmpty ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-blue-200 p-8 space-y-3 border-t-4 border-t-blue-900 shadow-md shadow-blue-900/10">
                        <div className="w-12 h-12 bg-yellow-400 text-blue-900 rounded-lg flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
                        </div>
                        <h3 className="text-base font-bold text-blue-900">No Projects Found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">Try adjusting your search terms or clearing filters to see other archives.</p>
                        <button
                            onClick={handleResetFilters}
                            className="px-3.5 py-1.5 bg-blue-900 text-yellow-300 rounded-md text-xs font-bold hover:bg-blue-800 transition tracking-wide"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <>
                        {/* ⭐ CARDS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProjects.map(p => (
                                <div
                                    key={p.id}
                                    className="group relative bg-white rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10 hover:shadow-2xl hover:border-blue-900/40 transition-all duration-300 overflow-hidden cursor-pointer"
                                    onClick={() => setSelectedProject(p)}
                                >
                                    <div className="relative aspect-[3/4] overflow-hidden bg-blue-50">
                                        <PdfImage item={p} />

                                        {p.latestTracking?.chapter && (
                                            <div className="absolute top-2 left-2 bg-yellow-400 text-blue-950 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow z-10">
                                                {p.latestTracking.chapter}
                                            </div>
                                        )}

                                        <div className="absolute top-2 right-2 bg-blue-900/90 text-yellow-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow z-10">
                                            PDF
                                        </div>

                                        {/* HOVER OVERLAY */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/95 to-blue-950/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white">
                                            <div className="flex items-center gap-2 mb-2">
                                                {isValid(p.dept) && (
                                                    <span className="px-2 py-0.5 bg-yellow-400 text-blue-950 text-[10px] font-bold rounded uppercase tracking-wider">
                                                        {p.dept}
                                                    </span>
                                                )}
                                                {isValid(p.year) && (
                                                    <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded tracking-wider backdrop-blur-sm">
                                                        {p.year}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="font-bold text-white text-[15px] leading-snug line-clamp-3 mb-2">
                                                {p.title}
                                            </h3>

                                            {isValid(p.abstract) && (
                                                <p className="text-[11px] text-blue-100 line-clamp-3 leading-relaxed mb-3 border-l-2 border-yellow-400 pl-2">
                                                    {p.abstract}
                                                </p>
                                            )}

                                            {p.authorList.length > 0 && (
                                                <div className="flex items-center gap-2 mb-2">
                                                    <AvatarGroup names={p.authorList} max={3} size="sm" />
                                                    <span className="text-[11px] text-blue-100 truncate">
                                                        {p.authorList.length === 1
                                                            ? p.authorList[0]
                                                            : `${p.authorList[0]} +${p.authorList.length - 1}`}
                                                    </span>
                                                </div>
                                            )}

                                            {isValid(p.adviser) && (
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Avatar name={p.adviser} size="sm" ring={false} />
                                                    <div className="min-w-0">
                                                        <span className="text-[9px] text-blue-300 block uppercase tracking-wider">Adviser</span>
                                                        <span className="text-[11px] text-white truncate block">{p.adviser}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {p.latestTracking && (
                                                <div className="text-[10px] text-blue-200 pt-2 border-t border-white/10 flex items-center justify-between mb-3">
                                                    <span className="font-semibold text-yellow-300">
                                                        {p.latestTracking.chapter || '—'}
                                                    </span>
                                                    <span className="capitalize">
                                                        {p.latestTracking.action || ''}
                                                    </span>
                                                </div>
                                            )}

                                            {p.keywords.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {p.keywords.slice(0, 3).map(kw => (
                                                        <span key={kw} className="text-[9px] font-semibold tracking-wide bg-yellow-400/20 text-yellow-200 px-1.5 py-0.5 rounded border border-yellow-400/30">
                                                            #{kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenInBrowser(p);
                                                    }}
                                                    className="flex-1 px-3 py-2 bg-yellow-400 hover:bg-yellow-300 text-blue-950 text-[11px] font-bold rounded-md shadow-sm flex items-center justify-center gap-1.5 transition"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                    Open PDF
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedProject(p);
                                                    }}
                                                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-md backdrop-blur-sm flex items-center justify-center gap-1.5 transition"
                                                >
                                                    Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalArchivedTitles > 0 && (
                            <div className="bg-white rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10 px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t-4 border-t-yellow-400">
                                <div className="text-xs text-slate-500 tracking-wide">
                                    Page <span className="font-bold text-blue-900">{archivedCurrentPage}</span> of{' '}
                                    <span className="font-bold text-blue-900">{archivedTotalPages}</span>
                                    <span className="mx-2 text-blue-200">|</span>
                                    <span className="font-bold text-blue-900">{totalArchivedTitles}</span> total archived
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => goToPage(archivedCurrentPage - 1)}
                                        disabled={archivedCurrentPage === 1}
                                        className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition ${
                                            archivedCurrentPage === 1
                                                ? 'border-blue-100 text-blue-200 cursor-not-allowed'
                                                : 'border-blue-300 text-blue-900 hover:bg-yellow-100 hover:border-yellow-400'
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
                                                        ? 'bg-blue-900 text-yellow-300 shadow-sm'
                                                        : 'text-blue-900 hover:bg-yellow-100'
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
                                                ? 'border-blue-100 text-blue-200 cursor-not-allowed'
                                                : 'border-blue-300 text-blue-900 hover:bg-yellow-100 hover:border-yellow-400'
                                        }`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

            </main>

            {/* ⭐ MODAL */}
            {selectedProject && (
                <div
                    className="fixed inset-0 z-50 bg-blue-950/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedProject(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl border border-blue-200 border-t-4 border-t-yellow-400 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="group relative w-full h-[70vh] overflow-hidden bg-blue-50">
                            <PdfImage item={selectedProject} />

                            <div className="absolute top-3 left-3 bg-yellow-400 text-blue-950 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow z-10">
                                {selectedProject.latestTracking?.chapter || 'PDF'}
                            </div>
                            <div className="absolute top-3 right-3 bg-blue-900/90 text-yellow-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow z-10">
                                PDF
                            </div>

                            <button
                                onClick={() => setSelectedProject(null)}
                                className="absolute top-3 w-8 h-8 bg-white/90 hover:bg-yellow-400 text-blue-900 rounded-md flex items-center justify-center shadow z-20 transition"
                                style={{ right: '4.5rem' }}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* HOVER OVERLAY */}
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/95 to-blue-950/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 text-white overflow-y-auto">
                                <div className="flex items-center gap-2 mb-3">
                                    {isValid(selectedProject.dept) && (
                                        <span className="px-2.5 py-1 bg-yellow-400 text-blue-950 text-[11px] font-bold rounded uppercase tracking-wider">
                                            {selectedProject.dept}
                                        </span>
                                    )}
                                    {isValid(selectedProject.year) && (
                                        <span className="px-2.5 py-1 bg-white/20 text-white text-[11px] font-bold rounded tracking-wider backdrop-blur-sm">
                                            {selectedProject.year}
                                        </span>
                                    )}
                                </div>

                                <h2 className="font-bold text-white text-lg leading-snug mb-3">
                                    {selectedProject.title}
                                </h2>

                                {isValid(selectedProject.abstract) && (
                                    <div className="bg-white/5 backdrop-blur-sm p-3 rounded-md border-l-4 border-yellow-400 mb-3">
                                        <h4 className="text-[10px] font-bold text-yellow-300 mb-1 uppercase tracking-wider">Description</h4>
                                        <p className="text-[12px] text-blue-50 line-clamp-4 leading-relaxed">
                                            {selectedProject.abstract}
                                        </p>
                                    </div>
                                )}

                                {selectedProject.authorList.length > 0 && (
                                    <div className="mb-3">
                                        <span className="text-[10px] text-blue-300 block uppercase tracking-wider mb-1.5">Contributors</span>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {selectedProject.authorList.map((name, i) => (
                                                <div key={i} className="flex items-center gap-1.5">
                                                    <Avatar name={name} size="sm" ring={false} />
                                                    <span className="text-[11px] text-white">{name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    {isValid(selectedProject.adviser) && (
                                        <div className="flex items-center gap-2">
                                            <Avatar name={selectedProject.adviser} size="sm" ring={false} />
                                            <div className="min-w-0">
                                                <span className="text-[9px] text-blue-300 block uppercase tracking-wider">Adviser</span>
                                                <span className="text-[11px] text-white truncate block">{selectedProject.adviser}</span>
                                            </div>
                                        </div>
                                    )}
                                    {isValid(selectedProject.coAdviser) && (
                                        <div className="flex items-center gap-2">
                                            <Avatar name={selectedProject.coAdviser} size="sm" ring={false} />
                                            <div className="min-w-0">
                                                <span className="text-[9px] text-blue-300 block uppercase tracking-wider">Co-Adviser</span>
                                                <span className="text-[11px] text-white truncate block">{selectedProject.coAdviser}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {selectedProject.latestTracking && (
                                    <div className="bg-white/5 backdrop-blur-sm p-2.5 rounded-md mb-3 flex items-center justify-between">
                                        <div>
                                            <span className="text-[9px] text-blue-300 block uppercase tracking-wider">Latest Upload</span>
                                            <span className="text-[12px] text-white font-semibold">
                                                {selectedProject.latestTracking.chapter}
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-yellow-300 capitalize">
                                            {selectedProject.latestTracking.action}
                                        </span>
                                    </div>
                                )}

                                {selectedProject.keywords.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {selectedProject.keywords.map(kw => (
                                            <span key={kw} className="text-[10px] font-semibold tracking-wide bg-yellow-400/20 text-yellow-200 px-2 py-0.5 rounded border border-yellow-400/30">
                                                #{kw}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenInBrowser(selectedProject);
                                        }}
                                        className="flex-1 px-3 py-2 bg-yellow-400 hover:bg-yellow-300 text-blue-950 text-[12px] font-bold rounded-md shadow-sm flex items-center justify-center gap-1.5 transition"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Open PDF
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedProject(null);
                                        }}
                                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold rounded-md backdrop-blur-sm transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toastMessage && (
                <div className="fixed bottom-5 right-5 z-50 bg-blue-900 text-white px-4 py-2.5 rounded-md shadow-lg flex items-center space-x-2.5 border-l-4 border-l-yellow-400">
                    <svg className="w-4 h-4 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-xs font-semibold tracking-wide">{toastMessage}</span>
                </div>
            )}
        </div>
    );
}