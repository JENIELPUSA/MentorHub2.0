// RegionDrawLayer.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';

const RegionDrawLayer = ({ isDrawing, onRegionSelected, onCancelDrawing, scale }) => {
    const [start, setStart] = useState(null);
    const [current, setCurrent] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const layerRef = useRef(null);

    const getRelativePos = useCallback((e) => {
        const rect = layerRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }, []);

    const handleMouseDown = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getRelativePos(e);
        setStart(pos);
        setCurrent(pos);
        setIsDragging(true);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        setCurrent(getRelativePos(e));
    };

    const handleMouseUp = (e) => {
        if (!isDragging || !start || !current) return;

        const pos = getRelativePos(e);
        const finalPos = e.type === 'touchend' ? current : pos;

        const x = Math.min(start.x, finalPos.x);
        const y = Math.min(start.y, finalPos.y);
        const width = Math.abs(finalPos.x - start.x);
        const height = Math.abs(finalPos.y - start.y);

        if (width < 20 || height < 15) {
            setStart(null);
            setCurrent(null);
            setIsDragging(false);
            return;
        }

        onRegionSelected({
            x: x / scale,
            y: y / scale,
            width: width / scale,
            height: height / scale
        });

        setStart(null);
        setCurrent(null);
        setIsDragging(false);
    };

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape' && isDrawing) {
                setStart(null);
                setCurrent(null);
                setIsDragging(false);
                onCancelDrawing?.();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isDrawing, onCancelDrawing]);

    if (!isDrawing) return null;

    const rect = start && current ? {
        left: Math.min(start.x, current.x),
        top: Math.min(start.y, current.y),
        width: Math.abs(current.x - start.x),
        height: Math.abs(current.y - start.y)
    } : null;

    return (
        <div
            ref={layerRef}
            className="absolute inset-0"
            style={{ zIndex: 20, cursor: 'crosshair', touchAction: 'none' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
        >
            {!isDragging && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg shadow-lg pointer-events-none whitespace-nowrap">
                    Drag to draw region • ESC to cancel
                </div>
            )}

            {rect && (
                <div
                    className="absolute border-2 border-dashed border-blue-500 bg-blue-200/30 pointer-events-none"
                    style={{
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height
                    }}
                >
                    <div className="absolute -top-6 left-0 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded">
                        {Math.round(rect.width)} × {Math.round(rect.height)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegionDrawLayer;