import React, { useState, useEffect, useContext } from 'react';
import {UserDisplayContext} from "../../../contexts/UserManagementContext/UserManagementContext"

export default function AdviserCoAdviser({ isOpen, onClose }) {
    const { advisers, advisersLoading } = useContext(UserDisplayContext);
    const [currentFacultyData, setCurrentFacultyData] = useState({
        adviser: {
            first_name: '',
            last_name: '',
            role: 'adviser',
            username: ''
        },
        coadviser: {
            first_name: '',
            last_name: '',
            role: 'coadviser',
            username: ''
        }
    });

    // =========================================================
    // SET ADVISER / CO-ADVISER
    // =========================================================
    useEffect(() => {
        if (advisers && advisers.length > 0) {
            const adviser =
                advisers.find(a => a.role === 'adviser') || advisers[0];

            const coadviser =
                advisers.find(
                    a =>
                        a.role === 'coadviser' ||
                        a.role === 'panelist'
                ) ||
                (advisers.length > 1 ? advisers[1] : advisers[0]);

            setCurrentFacultyData({
                adviser: {
                    first_name: adviser?.first_name || '',
                    last_name: adviser?.last_name || '',
                    role: adviser?.role || 'adviser',
                    username:
                        adviser?.username ||
                        adviser?.email ||
                        ''
                },

                coadviser: {
                    first_name: coadviser?.first_name || '',
                    last_name: coadviser?.last_name || '',
                    role: coadviser?.role || 'coadviser',
                    username:
                        coadviser?.username ||
                        coadviser?.email ||
                        ''
                }
            });
        }
    }, [advisers]);

    // =========================================================
    // GET INITIALS
    // =========================================================
    const getInitials = (fname, lname) => {
        return `${fname ? fname.charAt(0) : ''}${lname ? lname.charAt(0) : ''
            }`.toUpperCase();
    };

    // =========================================================
    // HANDLE CLOSE (ESC key)
    // =========================================================
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // =========================================================
    // PREVENT BODY SCROLL
    // =========================================================
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // =========================================================
    // IF NOT OPEN, RETURN NULL
    // =========================================================
    if (!isOpen) return null;

    return (
        <>
            {/* =========================================================
                BACKDROP - TRANSPARENT
            ========================================================== */}
            <div
                className="fixed inset-0 z-40 transition-opacity duration-300"
                onClick={onClose}
            />

            {/* =========================================================
                MODAL - TRANSPARENT BACKGROUND
            ========================================================== */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="
                        relative
                        w-full
                        max-w-4xl
                        max-h-[90vh]
                        overflow-y-auto
                        rounded-2xl
                        shadow-2xl
                        p-6
                        sm:p-8
                        lg:p-10
                        transition-all
                        duration-300
                        scale-100
                        opacity-100
                        bg-white/95
                        backdrop-blur-md
                        border
                        border-white/30
                    "
                >
                    {/* =====================================================
                        CLOSE BUTTON
                    ====================================================== */}
                    <button
                        onClick={onClose}
                        className="
                            absolute
                            top-4
                            right-4
                            p-2
                            rounded-full
                            transition-colors
                            duration-200
                            cursor-pointer
                            hover:bg-slate-100
                            text-slate-400
                            hover:text-slate-600
                        "
                        title="Close"
                    >
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>

                    {/* =====================================================
                        MODAL HEADER
                    ====================================================== */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
                            <i className="fa-solid fa-users text-indigo-500 mr-2"></i>
                            Adviser & Co-Adviser
                        </h2>
                        <p className="text-sm mt-1 text-slate-500">
                            Faculty members supervising your research
                        </p>
                    </div>

                    {/* =====================================================
                        LOADING STATE
                    ====================================================== */}
                    {advisersLoading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-slate-600">
                                    Loading faculty members...
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* =====================================================
                            ADVISER / CO-ADVISER CARDS
                        ====================================================== */
                        <div className="w-full flex justify-center">
                            <div
                                className="
                                    w-full
                                    max-w-3xl
                                    grid
                                    grid-cols-1
                                    sm:grid-cols-2
                                    gap-6
                                    sm:gap-8
                                    lg:gap-12
                                    items-start
                                    justify-items-center
                                "
                            >
                                {/* =================================================
                                    ADVISER
                                ================================================== */}
                                <div className="w-full flex flex-col items-center text-center p-4 sm:p-6 rounded-xl bg-indigo-50/50 border border-indigo-200/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">

                                    {/* Avatar */}
                                    <div className="relative mb-3">

                                        <div
                                            className="
                                                w-20 h-20
                                                sm:w-24 sm:h-24
                                                lg:w-28 lg:h-28
                                                rounded-full
                                                bg-indigo-100
                                                text-indigo-600
                                                flex
                                                items-center
                                                justify-center
                                                font-extrabold
                                                text-2xl
                                                sm:text-3xl
                                                lg:text-4xl
                                                ring-4
                                                ring-white
                                                shadow-lg
                                                shadow-indigo-500/20
                                                transition-all
                                                duration-300
                                                hover:scale-105
                                            "
                                        >
                                            {getInitials(
                                                currentFacultyData.adviser.first_name,
                                                currentFacultyData.adviser.last_name
                                            ) || 'A'}
                                        </div>

                                        {/* Active Indicator */}
                                        <span
                                            className="
                                                absolute
                                                bottom-0
                                                right-0
                                                w-4 h-4
                                                rounded-full
                                                bg-emerald-500
                                                border-2
                                                border-white
                                                shadow-sm
                                            "
                                        ></span>

                                    </div>

                                    {/* Role */}
                                    <span
                                        className="
                                            inline-flex
                                            items-center
                                            px-3
                                            py-1
                                            rounded-full
                                            bg-indigo-200
                                            text-indigo-700
                                            text-[10px]
                                            font-bold
                                            uppercase
                                            tracking-wider
                                            mb-1.5
                                        "
                                    >
                                        <i className="fa-solid fa-star text-[8px] mr-1.5"></i>
                                        Main Adviser
                                    </span>

                                    {/* Name */}
                                    <h3
                                        className="
                                            w-full
                                            px-1
                                            text-sm
                                            sm:text-base
                                            lg:text-lg
                                            font-extrabold
                                            text-slate-800
                                            truncate
                                        "
                                        title={`${currentFacultyData.adviser.first_name} ${currentFacultyData.adviser.last_name}`}
                                    >
                                        {currentFacultyData.adviser.first_name ||
                                            '___'}{' '}
                                        {currentFacultyData.adviser.last_name ||
                                            '___'}
                                    </h3>

                                    {/* Email */}
                                    <p
                                        className="
                                            w-full
                                            px-1
                                            mt-0.5
                                            text-[10px]
                                            sm:text-xs
                                            text-slate-500
                                            truncate
                                        "
                                        title={
                                            currentFacultyData.adviser.username ||
                                            'No email'
                                        }
                                    >
                                        <i className="fa-solid fa-envelope text-[8px] mr-1 opacity-50"></i>
                                        {currentFacultyData.adviser.username ||
                                            'No email'}
                                    </p>

                                    {/* Status */}
                                    <div className="flex items-center gap-1.5 mt-2.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span className="text-[8px] sm:text-[10px] font-medium text-emerald-600">
                                            Active
                                        </span>
                                    </div>
                                </div>

                                {/* =================================================
                                    CO-ADVISER
                                ================================================== */}
                                <div className="w-full flex flex-col items-center text-center p-4 sm:p-6 rounded-xl bg-violet-50/50 border border-violet-200/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10">

                                    {/* Avatar */}
                                    <div className="relative mb-3">

                                        <div
                                            className="
                                                w-20 h-20
                                                sm:w-24 sm:h-24
                                                lg:w-28 lg:h-28
                                                rounded-full
                                                bg-violet-100
                                                text-violet-600
                                                flex
                                                items-center
                                                justify-center
                                                font-extrabold
                                                text-2xl
                                                sm:text-3xl
                                                lg:text-4xl
                                                ring-4
                                                ring-white
                                                shadow-lg
                                                shadow-violet-500/20
                                                transition-all
                                                duration-300
                                                hover:scale-105
                                            "
                                        >
                                            {getInitials(
                                                currentFacultyData.coadviser.first_name,
                                                currentFacultyData.coadviser.last_name
                                            ) || 'C'}
                                        </div>

                                        {/* Active Indicator */}
                                        <span
                                            className="
                                                absolute
                                                bottom-0
                                                right-0
                                                w-4 h-4
                                                rounded-full
                                                bg-emerald-500
                                                border-2
                                                border-white
                                                shadow-sm
                                            "
                                        ></span>

                                    </div>

                                    {/* Role */}
                                    <span
                                        className="
                                            inline-flex
                                            items-center
                                            px-3
                                            py-1
                                            rounded-full
                                            bg-violet-200
                                            text-violet-700
                                            text-[10px]
                                            font-bold
                                            uppercase
                                            tracking-wider
                                            mb-1.5
                                        "
                                    >
                                        <i className="fa-solid fa-user-plus text-[8px] mr-1.5"></i>
                                        Co-Adviser
                                    </span>

                                    {/* Name */}
                                    <h3
                                        className="
                                            w-full
                                            px-1
                                            text-sm
                                            sm:text-base
                                            lg:text-lg
                                            font-extrabold
                                            text-slate-800
                                            truncate
                                        "
                                        title={`${currentFacultyData.coadviser.first_name} ${currentFacultyData.coadviser.last_name}`}
                                    >
                                        {currentFacultyData.coadviser.first_name ||
                                            '___'}{' '}
                                        {currentFacultyData.coadviser.last_name ||
                                            '___'}
                                    </h3>

                                    {/* Email */}
                                    <p
                                        className="
                                            w-full
                                            px-1
                                            mt-0.5
                                            text-[10px]
                                            sm:text-xs
                                            text-slate-500
                                            truncate
                                        "
                                        title={
                                            currentFacultyData.coadviser.username ||
                                            'No email'
                                        }
                                    >
                                        <i className="fa-solid fa-envelope text-[8px] mr-1 opacity-50"></i>
                                        {currentFacultyData.coadviser.username ||
                                            'No email'}
                                    </p>

                                    {/* Status */}
                                    <div className="flex items-center gap-1.5 mt-2.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span className="text-[8px] sm:text-[10px] font-medium text-emerald-600">
                                            Active
                                        </span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* =====================================================
                        MODAL FOOTER
                    ====================================================== */}
                    <div className="mt-8 pt-4 border-t border-slate-200/50 flex justify-center">
                        <button
                            onClick={onClose}
                            className="
                                px-6
                                py-2.5
                                rounded-xl
                                font-semibold
                                text-sm
                                transition-all
                                duration-200
                                cursor-pointer
                                bg-slate-100
                                hover:bg-slate-200
                                text-slate-700
                            "
                        >
                            <i className="fa-solid fa-xmark mr-2"></i>
                            Close
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
}