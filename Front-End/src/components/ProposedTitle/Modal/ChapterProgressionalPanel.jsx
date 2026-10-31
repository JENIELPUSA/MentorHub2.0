import { useState } from 'react';
import ProgressionHeader from './ProgressionalHeader';
import ChapterListItem from './ChapterListItem';
import DefenseGateBanner from './DefenseGateBanner';
import ConfirmActionModal from './ConfirmActionModal';

const ChapterProgressionPanel = ({ item, onProceed, onReject, isProcessing }) => {
    const [expandedChapter, setExpandedChapter] = useState(null);
    const [confirmChapter, setConfirmChapter] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [feedbackText, setFeedbackText] = useState('');
    // ============================================================
    // SEQUENTIAL CHAPTER CONSTANTS
    // ============================================================
    const SEQUENTIAL_CHAPTERS = [
        'Chapter 1',
        'Chapter 2',
        'Chapter 3',
        'Chapter 4',
        'Chapter 5',
        'Full Manuscript',
    ];

    // ============================================================
    // DEFENSE GATE HELPERS
    // ============================================================
    const getApprovalVal = (approvals, chapter) => {
        if (!approvals) return false;
        if (approvals instanceof Map) return approvals.get(chapter) === true;
        if (typeof approvals === 'object') return approvals[chapter] === true;
        return false;
    };

    const getRemainingChaptersForDefense = (item) => {
        if (!item) return SEQUENTIAL_CHAPTERS.length;
        const approvals = item.chapterProgressionApprovals || {};
        return SEQUENTIAL_CHAPTERS.filter((ch) => !getApprovalVal(approvals, ch)).length;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };



    const isFullyProceeded = (item) => {
        if (!item) return false;
        const approvals = item.chapterProgressionApprovals || {};
        return SEQUENTIAL_CHAPTERS.every((ch) => getApprovalVal(approvals, ch));
    };


    const getChapterStatus = (chapter, item) => {
        const tracking = (item?.titleUrlTracking || []).filter((t) => t.chapter === chapter);
        const completedChapters = item?.completedChapters || [];
        const approvals = item?.chapterProgressionApprovals || {};
        const progressionApprovedAt = item?.chapterProgressionApprovedAt || {};

        const isCompleted = completedChapters.includes(chapter) ||
            tracking.some((t) => t.isCompleted === true);

        const isProceeded = getApprovalVal(approvals, chapter);

        const hasSubmissions = tracking.length > 0;
        const latestEntry = tracking.length > 0
            ? [...tracking].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
            : null;

        const idx = SEQUENTIAL_CHAPTERS.indexOf(chapter);
        const isUnlocked = (() => {
            if (idx === 0) return true;
            const prevChapter = SEQUENTIAL_CHAPTERS[idx - 1];
            return getApprovalVal(approvals, prevChapter);
        })();

        let status = 'locked';
        if (isProceeded) status = 'proceeded';
        else if (isCompleted) status = 'completed';
        else if (hasSubmissions) status = 'submitted';
        else if (isUnlocked) status = 'unlocked';

        return {
            chapter,
            status,
            isCompleted,
            isProceeded,
            isUnlocked,
            hasSubmissions,
            latestEntry,
            submissions: tracking.length,
            approvals,
            progressionApprovedAt,
        };
    };


    const chapters = SEQUENTIAL_CHAPTERS.map((ch) => getChapterStatus(ch, item));
    const proceededCount = chapters.filter((c) => c.isProceeded).length;
    const totalCount = chapters.length;
    const fullManuscriptProceeded = isFullyProceeded(item);
    const remaining = getRemainingChaptersForDefense(item);
    const progressPercent = (proceededCount / totalCount) * 100;

    const handleProceedClick = (chapter) => {
        setConfirmChapter(chapter);
        setActionType('proceed');
        setFeedbackText('');
    };

    const handleRejectClick = (chapter) => {
        setConfirmChapter(chapter);
        setActionType('reject');
        setFeedbackText('');
    };



    const handleConfirm = async () => {
        if (!confirmChapter) return;
        if (actionType === 'proceed') {
            await onProceed(item._id, confirmChapter, feedbackText);
        } else if (actionType === 'reject') {
            await onReject(item._id, confirmChapter, feedbackText);
        }
        setConfirmChapter(null);
        setActionType(null);
        setFeedbackText('');
    };

    const handleCancel = () => {
        setConfirmChapter(null);
        setActionType(null);
        setFeedbackText('');
    };

    return (
        <div className="space-y-3">
            <ProgressionHeader
                fullManuscriptProceeded={fullManuscriptProceeded}
                proceededCount={proceededCount}
                totalCount={totalCount}
                progressPercent={progressPercent}
                remaining={remaining}
            />

            <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {chapters.map((ch) => (
                    <ChapterListItem
                        key={ch.chapter}
                        ch={ch}
                        isExpanded={expandedChapter === ch.chapter}
                        onToggle={() =>
                            setExpandedChapter(expandedChapter === ch.chapter ? null : ch.chapter)
                        }
                        onProceedClick={handleProceedClick}
                        onRejectClick={handleRejectClick}
                        isProcessing={isProcessing}
                        formatDate={formatDate}
                    />
                ))}
            </div>

            <DefenseGateBanner
                fullManuscriptProceeded={fullManuscriptProceeded}
                totalCount={totalCount}
            />

            <ConfirmActionModal
                confirmChapter={confirmChapter}
                actionType={actionType}
                feedbackText={feedbackText}
                setFeedbackText={setFeedbackText}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                isProcessing={isProcessing}
            />
        </div>
    );
};

export default ChapterProgressionPanel;