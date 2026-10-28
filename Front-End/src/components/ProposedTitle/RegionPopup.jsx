// RegionPopup.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
    X, Loader2, AlertTriangle, Type, Move,
    AlignLeft, Image as ImageIcon, Palette,
    Ruler, Maximize, FileWarning
} from 'lucide-react';

// ⭐ Predefined annotation types (reuse from SelectionPopup)
const ANNOTATION_TYPES = [
    { id: 'wrong_margin', label: 'Wrong Margin', icon: Ruler, color: 'red' },
    { id: 'wrong_font', label: 'Wrong Font', icon: Type, color: 'purple' },
    { id: 'wrong_spacing', label: 'Wrong Spacing', icon: Move, color: 'orange' },
    { id: 'wrong_alignment', label: 'Wrong Alignment', icon: AlignLeft, color: 'blue' },
    { id: 'wrong_image', label: 'Image/Table', icon: ImageIcon, color: 'pink' },
    { id: 'wrong_color', label: 'Wrong Color', icon: Palette, color: 'green' },
    { id: 'wrong_size', label: 'Wrong Size', icon: Maximize, color: 'cyan' },
    { id: 'grammar', label: 'Grammar', icon: FileWarning, color: 'yellow' },
    { id: 'other', label: 'Other Issue', icon: AlertTriangle, color: 'slate' }
];

const getColorHex = (color) => {
    const map = {
        red: '#ef4444', purple: '#a855f7', orange: '#f97316',
        blue: '#3b82f6', pink: '#ec4899', green: '#22c55e',
        cyan: '#06b6d4', yellow: '#eab308', slate: '#64748b'
    };
    return map[color] || '#64748b';
};

const RegionPopup = ({ position, region, onSubmit, onCancel, isSubmitting }) => {
    const [selectedType, setSelectedType] = useState('wrong_margin');
    const [text, setText] = useState('');
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
        const typeConfig = ANNOTATION_TYPES.find(t => t.id === selectedType);
        onSubmit({
            text: text.trim(),
            annotationType: selectedType,
            color: typeConfig?.color || 'slate',
            label: typeConfig?.label || 'Comment'
        });
    };

    const popupStyle = {
        position: 'fixed',
        left: Math.min(Math.max(position.x, 10), window.innerWidth - 400),
        top: Math.min(Math.max(position.y, 10), window.innerHeight - 520),
        zIndex: 9999
    };

    return (
        <div ref={popupRef} style={popupStyle} className="w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-bold text-slate-700">Annotate Region</span>
                </div>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-3 space-y-3">
                <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Issue Type</p>
                    <div className="grid grid-cols-3 gap-1.5">
                        {ANNOTATION_TYPES.map((type) => {
                            const Icon = type.icon;
                            const isSelected = selectedType === type.id;
                            const colorHex = getColorHex(type.color);
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedType(type.id)}
                                    className="flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition"
                                    style={{
                                        borderColor: isSelected ? colorHex : '#e2e8f0',
                                        backgroundColor: isSelected ? `${colorHex}15` : '#ffffff'
                                    }}
                                >
                                    <Icon className="w-4 h-4" style={{ color: isSelected ? colorHex : '#94a3b8' }} />
                                    <span className="text-[9px] font-medium text-center leading-tight" style={{ color: isSelected ? colorHex : '#64748b' }}>
                                        {type.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Region (px)</p>
                    <p className="text-[11px] text-slate-600 font-mono">
                        x: {Math.round(region?.x || 0)} • y: {Math.round(region?.y || 0)} • w: {Math.round(region?.width || 0)} • h: {Math.round(region?.height || 0)}
                    </p>
                </div>

                <textarea
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={
                        selectedType === 'wrong_margin'
                            ? 'e.g. Margin should be 1 inch on all sides...'
                            : selectedType === 'wrong_font'
                                ? 'e.g. Font should be Times New Roman 12pt...'
                                : 'Describe the issue...'
                    }
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
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                    >
                        {isSubmitting ? <><Loader2 className="w-3 h-3 animate-spin" />Saving...</> : 'Add Annotation'}
                    </button>
                </div>

                <p className="text-[9px] text-slate-400 text-center">Ctrl+Enter to submit</p>
            </div>
        </div>
    );
};

export default RegionPopup;