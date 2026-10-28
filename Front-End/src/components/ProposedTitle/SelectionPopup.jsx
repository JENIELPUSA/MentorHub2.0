// SelectionPopup.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
    MessageSquarePlus, X, Loader2,
    Ruler, Type, Move, AlignLeft, Image as ImageIcon,
    Palette, Maximize, FileWarning, AlertCircle, MessageSquare,
    ChevronDown, ChevronUp
} from 'lucide-react';

// ⭐ Shared annotation types
export const ANNOTATION_TYPES = [
    { id: 'text', label: 'General Comment', icon: MessageSquare, color: 'yellow' },
    { id: 'wrong_margin', label: 'Wrong Margin', icon: Ruler, color: 'red' },
    { id: 'wrong_font', label: 'Wrong Font', icon: Type, color: 'purple' },
    { id: 'wrong_spacing', label: 'Wrong Spacing', icon: Move, color: 'orange' },
    { id: 'wrong_alignment', label: 'Wrong Alignment', icon: AlignLeft, color: 'blue' },
    { id: 'wrong_image', label: 'Image/Table Issue', icon: ImageIcon, color: 'pink' },
    { id: 'wrong_color', label: 'Wrong Color', icon: Palette, color: 'green' },
    { id: 'wrong_size', label: 'Wrong Size', icon: Maximize, color: 'cyan' },
    { id: 'grammar', label: 'Grammar/Spelling', icon: FileWarning, color: 'yellow' },
    { id: 'other', label: 'Other Issue', icon: AlertCircle, color: 'slate' }
];

const getColorHex = (color) => {
    const map = {
        red: '#ef4444', purple: '#a855f7', orange: '#f97316',
        blue: '#3b82f6', pink: '#ec4899', green: '#22c55e',
        cyan: '#06b6d4', yellow: '#eab308', slate: '#64748b'
    };
    return map[color] || '#eab308';
};

const SelectionPopup = ({ position, selectedText, onSubmit, onCancel, isSubmitting }) => {
    const [text, setText] = useState('');
    const [annotationType, setAnnotationType] = useState('text');
    const [showTypes, setShowTypes] = useState(false);
    const popupRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                onCancel();
            }
        };
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 100);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onCancel]);

    const handleSubmit = () => {
        if (!text.trim()) return;
        const typeConfig = ANNOTATION_TYPES.find(t => t.id === annotationType);
        onSubmit({
            text: text.trim(),
            color: typeConfig?.color || 'yellow',
            annotationType: annotationType,
            annotationLabel: typeConfig?.label || 'Comment'
        });
    };

    const popupStyle = {
        position: 'fixed',
        left: Math.min(Math.max(position.x, 10), window.innerWidth - 360),
        top: Math.min(Math.max(position.y, 10), window.innerHeight - 500),
        zIndex: 9999
    };

    const currentType = ANNOTATION_TYPES.find(t => t.id === annotationType);
    const CurrentIcon = currentType?.icon || MessageSquare;
    const currentColorHex = getColorHex(currentType?.color);

    return (
        <div ref={popupRef} style={popupStyle} className="w-[340px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <MessageSquarePlus className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-700">Add Annotation</span>
                </div>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-3 space-y-3">
                {selectedText && (
                    <div
                        className="px-3 py-2 rounded border-l-4"
                        style={{
                            backgroundColor: `${currentColorHex}15`,
                            borderLeftColor: currentColorHex
                        }}
                    >
                        <p className="text-[10px] uppercase font-bold mb-1" style={{ color: currentColorHex }}>
                            Selected Text
                        </p>
                        <p className="text-xs text-slate-600 italic line-clamp-3">"{selectedText}"</p>
                    </div>
                )}

                {/* Type selector */}
                <div>
                    <button
                        type="button"
                        onClick={() => setShowTypes(!showTypes)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 border-2 rounded-lg transition"
                        style={{
                            borderColor: currentColorHex,
                            backgroundColor: `${currentColorHex}10`
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <CurrentIcon className="w-4 h-4" style={{ color: currentColorHex }} />
                            <span className="text-xs font-semibold" style={{ color: currentColorHex }}>
                                {currentType?.label}
                            </span>
                        </div>
                        {showTypes ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                    </button>

                    {showTypes && (
                        <div className="mt-1.5 max-h-56 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-inner">
                            {ANNOTATION_TYPES.map((type) => {
                                const Icon = type.icon;
                                const isSelected = annotationType === type.id;
                                const colorHex = getColorHex(type.color);
                                return (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => {
                                            setAnnotationType(type.id);
                                            setShowTypes(false);
                                            inputRef.current?.focus();
                                        }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition border-b border-slate-100 last:border-b-0 ${isSelected ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                                    >
                                        <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${colorHex}20` }}>
                                            <Icon className="w-3.5 h-3.5" style={{ color: colorHex }} />
                                        </div>
                                        <span className="text-xs font-semibold flex-1" style={{ color: isSelected ? colorHex : '#1e293b' }}>
                                            {type.label}
                                        </span>
                                        {isSelected && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorHex }} />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <textarea
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Describe the issue or type your comment..."
                    rows={3}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
                    }}
                />

                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!text.trim() || isSubmitting}
                        className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                        style={{ backgroundColor: currentColorHex }}
                    >
                        {isSubmitting ? <><Loader2 className="w-3 h-3 animate-spin" />Saving...</> : 'Add Annotation'}
                    </button>
                </div>

                <p className="text-[9px] text-slate-400 text-center">Tip: Ctrl+Enter to submit</p>
            </div>
        </div>
    );
};

export default SelectionPopup;