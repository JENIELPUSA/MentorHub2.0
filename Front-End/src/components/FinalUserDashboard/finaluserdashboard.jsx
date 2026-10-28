import React, { useState } from "react";

const AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuANUNfdyiDCvyVibrqJMP9m2zHZnzBvf0IDyAUemsEo4HKmc8SNIskg4iONGqVcmUq3bUwlVmhMZJdERzymsgUg66dnbDmRp8sGfUYPD64UAbWefGx_0oJKFbmiQKqQ2QgeKzD3uAnLaECfU88DQD8F5Ea0fAZQIpL1jsabCIQ3RnSf3byNXRYhsob9-XWX1fhQr7yGqpMojenwKCE96mbKuR4OLY84TtKpQluqeC_OJQtdssMOxyQcXw";
const LOGO = "https://lh3.googleusercontent.com/aida/AEtjO1UtUWLNppFRoJJd7DuEgHRBFk4wySKduYClZ-HnvjssWPjMerqUdWV9f9l284q3TRo3ajUoQatDayrSt9TyZlucz4q-Du6dOe_kXgdcP72Pj2rGSY6hVqJDaJ1CH82fK7GgFzeoRCQmiIhBd_FsRlw8P-TmMtKJmOK51tG2ik7Ertuec93W5-I8zKVw974dUUW_-u30eCvPqdq9DVU_1bIzXGj8ow5y8w4qeP_-4HXm8rry2BowlolEFzof";
const ADVISER = "https://lh3.googleusercontent.com/aida-public/AB6AXuAB4_AXVMqRv22Ouln-ixUuTAhHlcPF5yxYQKbtYwCrOBnBIH0RT6iO3PcAYbmiz-Bqdy9S--TMeZEbhrk_lYQT17DcsC34Wl0Hhy7Ll_Ws3iiZFEvWNNvnQhdWEYy1ONt3xDwP2JtIvSnYfQ91CUEFYD_MxVhNBOYf_-cxeqD3pc7_GgiI8UQYqdu0_NX6cN9EZ6T6MvCpExzl28O6TKNVMQNZwhyEHgywPVad3J3JCwT6f_ctqh_Veg";
const COADVISER = "https://lh3.googleusercontent.com/aida-public/AB6AXuC7hA-jxAtRWr-t5jAM0WqJaO11RkaUEUWzj4IhZtUbl-AOUtBJCdk_otFIjTkhWnrDdw_QJsFjBEw70xi8s93KIZbFm7-PwX-f0jdcK4mW9AFgENe1IklxrlwZ1S25F8KvNFNrUQISvjjRnp3D1YAuAQR7mvxuQVjKhMwY-GtbKnmw_tt5agHyNHMaFvCpxs16cyrrQHnAXs2iwwUHJpcBihdaaNyBgswdUKzHeK1OpLQ16RV5SRXUjA";

// ✅ MEMBERS — group member data with avatar + initials fallback
const GROUP_MEMBERS = [
  {
    id: "2021-04892",
    name: "Sarah Jenkins",
    role: "Lead Researcher",
    program: "BS Computer Science",
    avatar: AVATAR,
    color: "bg-blue-900",
    online: true,
  },
  {
    id: "2021-04893",
    name: "Miguel Tan",
    role: "Hardware Engineer",
    program: "BS Computer Engineering",
    avatar: null,
    color: "bg-emerald-600",
    online: true,
  },
  {
    id: "2021-04894",
    name: "Aisha Bautista",
    role: "Data Analyst",
    program: "BS Data Science",
    avatar: null,
    color: "bg-amber-600",
    online: false,
  },
  {
    id: "2021-04895",
    name: "Kenji Villanueva",
    role: "Documentation Lead",
    program: "BS Information Systems",
    avatar: null,
    color: "bg-purple-600",
    online: true,
  },
];

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

// ✅ MEMBERS — reusable avatar component (image or initials)
function MemberAvatar({ member, size = "w-8 h-8", ring = true, showStatus = false }) {
  return (
    <div className="relative shrink-0">
      {member.avatar ? (
        <img
          src={member.avatar}
          alt={member.name}
          className={`${size} rounded-full object-cover ${ring ? "ring-2 ring-white" : ""}`}
        />
      ) : (
        <div
          className={`${size} ${member.color} text-white rounded-full flex items-center justify-center text-[11px] font-bold ${ring ? "ring-2 ring-white" : ""}`}
          title={member.name}
        >
          {initials(member.name)}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
            member.online ? "bg-emerald-500" : "bg-slate-300"
          }`}
        />
      )}
    </div>
  );
}

// ✅ MEMBERS — stacked avatar row with +N overflow
function MemberStack({ members, max = 4, size = "w-8 h-8" }) {
  const shown = members.slice(0, max);
  const overflow = members.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((m) => (
          <MemberAvatar key={m.id} member={m} size={size} />
        ))}
      </div>
      {overflow > 0 && (
        <div
          className={`${size} -ml-2 rounded-full bg-slate-200 text-slate-700 ring-2 ring-white flex items-center justify-center text-[11px] font-bold`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

const NAV = [
  ["dashboard","Dashboard","dashboard"], ["my-project","My Project","book_2"],
  ["my-group-members","My Group Members","groups"], ["my-mentors","My Mentors","school"],
  ["manuscript-upload","Manuscript Upload","cloud_upload"], ["document-tracking","Document Tracking","schedule"],
  ["my-documents","My Documents","folder_open"], ["mentor-feedback","Mentor Feedback","rate_review"],
  ["notifications","Notifications","notifications"], ["my-profile","My Profile","account_circle"],
];

const STATS = [
  { icon:"book_2", label:"My Project", value:"1 Active", sub:"Group AgriTech Alpha", tag:"CAP-01", tagClass:"text-xs text-slate-400" },
  { icon:"groups", label:"Group Members", value:"4 Active", sub:"Consent forms submitted", tag:"100% Signed", tagClass:"px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold", avatars:true }, // ✅ MEMBERS
  { icon:"description", label:"Manuscripts", value:"14 Files", sub:"Across 4 Milestone phases", tag:"Archived", tagClass:"text-xs text-slate-400" },
  { icon:"hourglass_top", label:"Pending Review", value:"2 Under", sub:"Ch. 4 & Hardware specs", dot:true, labelClass:"text-blue-600 font-semibold" },
  { icon:"assignment_late", label:"For Revision", value:"1 Action", sub:"Lit Review citations check", tag:"Priority", tagClass:"px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-semibold", labelClass:"text-red-600 font-semibold", valueClass:"text-red-600" },
  { icon:"task_alt", label:"Approved", value:"11 Cleared", sub:"Plagiarism checked (4%)", tag:"Cleared", tagClass:"text-xs text-slate-400", valueClass:"text-blue-900" },
];

const MILESTONES = [
  { label:"Title Cleared", date:"Aug 2024", status:"done" },
  { label:"Ch 1-3 Proposal", date:"Nov 2024", status:"done" },
  { label:"Ethics Clearance", date:"Jan 2025", status:"done" },
  { label:"Ch 4 Under Review", date:"May 2025", status:"active" },
  { label:"Oral Defense", date:"June 2025", status:"pending" },
];

const ACTIVITIES = [
  { dot:"bg-blue-900", title:"Adviser Review Completed", time:"2 hours ago",
    body:(<><strong className="text-slate-900 font-medium">Dr. Aris Thorne</strong> left 4 comments and rubric scoring on <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-800 text-xs">Chapter 3 System Architecture v2.4</code>.</>),
    badge:{ text:"Approved with minor notes", style:"bg-blue-50 text-blue-900", dot:"bg-blue-900" },
    action:{ text:"Read Annotations", color:"text-blue-600" } },
  { dot:"bg-blue-500", title:"New Manuscript Submitted", time:"Yesterday at 4:15 PM",
    body:(<><strong className="text-slate-900 font-medium">Sarah Jenkins</strong> uploaded new telemetry datasets and graphs: <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-800 text-xs">Chapter 4 Initial Results & Telemetry Data.pdf</code> (18.4 MB).</>),
    badge:{ text:"Under Review", style:"bg-blue-50 text-blue-600", dot:"bg-blue-500" },
    action:{ text:"Routed to 2 Mentors", color:"text-slate-500" } },
  { dot:"bg-red-500", title:"Co-Adviser Revision Request", time:"2 days ago",
    body:(<><strong className="text-slate-900 font-medium">Prof. Elena Rostova</strong> requested micro-controller power dissipation benchmarks on <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-800 text-xs">Sensor Node Hardware Specs.docx</code>.</>),
    badge:{ text:"Revision Required", style:"bg-red-100 text-red-600", dot:"bg-red-500" },
    action:{ text:"Open Task Checkpoint", color:"text-red-600" } },
  { dot:"bg-blue-900", title:"Ethics Clearance Approved", time:"May 12, 2025",
    body:(<>Institutional Review Board cleared IoT field deployment protocol on municipal agricultural testbeds without objection.</>),
    badge:{ text:"IRB-REC-2025-091", style:"bg-blue-50 text-blue-900", dot:"bg-blue-900" } },
];

const DEADLINES = [
  { icon:"warning", iconColor:"text-red-600", when:"Due in 3 days • May 24, 2025",
    title:"Chapter 4 Final Draft & Code Repository",
    priority:"High Priority", priorityStyle:"bg-red-100 text-red-600",
    desc:(<>Complete sensor fusion accuracy metrics and push GitHub release tagged <code className="text-xs">v1.0-alpha</code>.</>),
    meta:{ icon:"person", text:"Assigned: Dr. Thorne" },
    btn:{ text:"Upload Draft", style:"bg-blue-600 text-white hover:bg-blue-900" } },
  { icon:"calendar_clock", iconColor:"text-blue-600", when:"Due in 12 days • June 2, 2025",
    title:"Oral Defense Slide Deck Submission",
    priority:"Medium", priorityStyle:"bg-blue-50 text-blue-600",
    desc:"Present 25-slide deck adhering to university faculty symposium presentation standards.",
    meta:{ icon:"group", text:"All 4 Group Members" },
    btn:{ text:"Slide Template", style:"bg-white text-slate-800 hover:bg-slate-50 shadow-sm" } },
  { icon:"security", iconColor:"text-slate-500", when:"Due in 16 days • June 6, 2025",
    title:"Comprehensive Plagiarism Clearance",
    priority:"Pending Run", priorityStyle:"bg-slate-200 text-slate-700",
    desc:"Automated institutional Turnitin validation must remain strictly beneath the 12% ceiling.",
    meta:{ icon:"rule", text:"Threshold: < 12%" },
    btn:{ text:"Check Similarity", style:"bg-white text-slate-800 hover:bg-slate-50 shadow-sm" } },
];

export default function App() {
  const [active, setActive] = useState("dashboard");

  return (
    <div className="bg-slate-50 text-slate-800 text-sm antialiased min-h-screen">

      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-sm z-50 flex flex-col justify-between">
        <div className="flex flex-col min-h-0 flex-1">
          <div className="h-16 px-6 flex items-center gap-2 bg-white">
            <img alt="Logo" className="h-8 w-auto object-contain" src={LOGO} />
            <div className="flex flex-col">
              <span className="text-base font-semibold text-blue-900 leading-tight">ThesisMentor</span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Academic Portal</span>
            </div>
          </div>
          <div className="overflow-y-auto px-2 py-2 flex-1">
            <nav className="flex flex-col gap-1">
              {NAV.map(([path, label, icon]) => (
                <a key={path} href="#" onClick={(e)=>{e.preventDefault();setActive(path);}}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    active === path
                      ? "bg-blue-900 text-white font-semibold shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}>
                  <span className="material-symbols-outlined text-[20px]">{icon}</span>
                  <span>{label}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>
        <div className="p-2 bg-slate-100 m-2 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <img alt="Profile" className="w-8 h-8 rounded-full object-cover" src={AVATAR} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-slate-900 font-semibold truncate">Sarah Jenkins</p>
              <p className="text-[11px] text-slate-500 truncate">Lead Researcher</p>
            </div>
            <button className="text-slate-500 hover:text-slate-800 p-1 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">ID: 2021-04892</span>
            <button className="text-red-600 hover:text-slate-700">
              <span className="material-symbols-outlined text-[16px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="pl-64">
        {/* HEADER */}
        <header className="fixed top-0 left-64 right-0 h-16 bg-white/80 backdrop-blur-xl shadow-sm z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-slate-900 p-1 rounded-lg">
              <span className="material-symbols-outlined text-[22px]">menu_open</span>
            </button>
            <nav className="hidden sm:flex items-center gap-1 text-[13px] text-slate-500">
              <span className="hover:text-slate-900 cursor-pointer">Portal</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="hover:text-slate-900 cursor-pointer">Capstone</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-blue-900 font-semibold">Overview</span>
            </nav>
          </div>
          <div className="flex-1 max-w-md mx-6 hidden md:block">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input className="w-full bg-slate-100 border-0 pl-10 pr-4 py-2 rounded-lg text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search manuscripts, feedback, or mentors... (Cmd+K)" type="text" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-1 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>A.Y. 2024-2025 • 2nd Sem</span>
            </div>
            {/* ✅ MEMBERS — member stack in header for quick access */}
            <div className="hidden md:flex items-center gap-1 pr-2 border-r border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold mr-1">Team:</span>
              <MemberStack members={GROUP_MEMBERS} max={3} size="w-7 h-7" />
            </div>
            <div className="flex items-center gap-1">
              <button className="relative p-1 rounded-lg text-slate-500 hover:bg-slate-100">
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                <span className="absolute top-0.5 right-0.5 flex items-center justify-center w-4 h-4 bg-red-600 text-white text-[9px] font-semibold rounded-full">3</span>
              </button>
              <button className="p-1 rounded-lg text-slate-500 hover:bg-slate-100">
                <span className="material-symbols-outlined text-[22px]">help_outline</span>
              </button>
            </div>
            <div className="relative flex items-center pl-1">
              <div className="relative">
                <img alt="Profile" className="w-8 h-8 rounded-full object-cover" src={AVATAR} />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white" />
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT — CENTERED */}
        <main className="pt-16 w-full min-h-screen bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 flex flex-col w-full pb-8">

            {/* WELCOME BANNER */}
            <div className="relative overflow-hidden bg-white rounded-xl p-6 shadow-sm mb-6 mt-4">
              <div className="absolute -right-16 -top-24 w-80 h-80 bg-blue-900/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex flex-col gap-1 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold uppercase tracking-wider">BS Computer Science • Senior Thesis IV</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      A.Y. 2024-2025 Final Track
                    </span>
                  </div>
                  <h1 className="text-2xl font-semibold text-blue-900 tracking-tight">Welcome back, Sarah Jenkins</h1>
                  <p className="text-sm text-slate-500">Your research project is on track for Final Oral Defense submission this term. 2 pending mentor critiques await clearance.</p>
                  <div className="mt-1 inline-flex flex-wrap items-center gap-2 p-1 pl-2 bg-slate-100 rounded-lg">
                    <span className="material-symbols-outlined text-[18px] text-blue-600">sensors</span>
                    <span className="text-[13px] font-medium text-slate-800 truncate max-w-xs md:max-w-md">IoT-Enabled Precision Agriculture Monitoring System</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-300 text-blue-900 text-[11px] font-semibold">78% Completed</span>
                  </div>
                </div>
                <div className="flex sm:flex-row flex-col items-stretch sm:items-center gap-2 shrink-0">
                  <button className="flex items-center justify-center gap-1 px-4 py-2 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-lg text-[13px] font-medium shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">rate_review</span>
                    View Feedback
                  </button>
                  <button className="flex items-center justify-center gap-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-900 rounded-lg text-[13px] font-medium shadow-md">
                    <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                    Submit Chapter 4
                  </button>
                </div>
              </div>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
              {STATS.map((s, i) => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between hover:-translate-y-0.5 transition-transform">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-blue-900 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                    </div>
                    {s.dot && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    {s.tag && <span className={s.tagClass}>{s.tag}</span>}
                  </div>
                  <div>
                    <p className={`text-[11px] font-semibold uppercase tracking-wider ${s.labelClass || "text-slate-500"}`}>{s.label}</p>
                    <p className={`text-2xl font-bold mt-0.5 ${s.valueClass || "text-slate-900"}`}>{s.value}</p>
                    <p className="text-xs text-slate-500 truncate mt-1">{s.sub}</p>
                    {/* ✅ MEMBERS — avatar stack inside Group Members card */}
                    {s.avatars && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <MemberStack members={GROUP_MEMBERS} max={4} size="w-7 h-7" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* PROJECT PROGRESS */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-blue-600 text-[11px] font-semibold uppercase tracking-wider mb-1">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    Official Research Registration • Spring 2025
                  </div>
                  <h2 className="text-xl font-semibold text-blue-900 tracking-tight">Autonomous Edge-AI Microclimate Optimization for Controlled Environment Agriculture</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-slate-500 text-xs">
                    <span className="flex items-center gap-1 font-medium text-slate-800">
                      <span className="material-symbols-outlined text-[16px]">corporate_fare</span>
                      AgriTech Innovation Team (Team ID #04)
                    </span>
                    <span>•</span>
                    <span>Department of Computer Science & Intelligent Systems</span>
                    <span>•</span>
                    <span className="text-blue-600 font-semibold">Final Phase Candidate</span>
                  </div>
                </div>

                {/* ✅ MEMBERS — Advisers + Member stack side by side */}
                <div className="flex flex-col gap-3 shrink-0 bg-slate-100 p-4 rounded-xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                      <img className="w-10 h-10 rounded-full object-cover shadow-sm" alt="Adviser" src={ADVISER} />
                      <div className="flex flex-col">
                        <span className="text-[11px] text-slate-500 uppercase font-semibold">Primary Adviser</span>
                        <span className="text-[13px] text-slate-900 font-semibold">Dr. Aris Thorne</span>
                        <span className="text-[11px] text-slate-500">PhD Artificial Intelligence</span>
                      </div>
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-slate-300" />
                    <div className="flex items-center gap-2">
                      <img className="w-10 h-10 rounded-full object-cover shadow-sm" alt="Co-Adviser" src={COADVISER} />
                      <div className="flex flex-col">
                        <span className="text-[11px] text-slate-500 uppercase font-semibold">Co-Adviser</span>
                        <span className="text-[13px] text-slate-900 font-semibold">Prof. Elena Rostova</span>
                        <span className="text-[11px] text-slate-500">MSc Embedded Systems</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-300/60">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-slate-500">groups</span>
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Team</span>
                    </div>
                    <MemberStack members={GROUP_MEMBERS} max={4} size="w-7 h-7" />
                  </div>
                </div>
              </div>

              {/* LIFECYCLE */}
              <div className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] text-slate-800 font-semibold">Thesis Progress Lifecycle</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold">Stage 4 of 5</span>
                  </div>
                  <span className="text-base text-blue-900 font-bold">78% Complete</span>
                </div>
                <div className="relative flex items-center justify-between w-full py-2">
                  <div className="absolute left-4 right-4 h-1 bg-slate-200 top-1/2 -translate-y-1/2 -z-0" />
                  <div className="absolute left-4 w-3/4 h-1 bg-blue-500 top-1/2 -translate-y-1/2 -z-0" />
                  {MILESTONES.map((m, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center">
                      {m.status === "done" && (
                        <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        </div>
                      )}
                      {m.status === "active" && (
                        <div className="relative w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                          <span className="w-3.5 h-3.5 rounded-full bg-blue-500 animate-ping absolute" />
                          <span className="w-3.5 h-3.5 rounded-full bg-blue-500 relative" />
                        </div>
                      )}
                      {m.status === "pending" && (
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[16px]">military_tech</span>
                        </div>
                      )}
                      <span className={`mt-1 text-[11px] font-semibold text-center ${m.status === "active" ? "text-blue-600" : m.status === "pending" ? "text-slate-500" : "text-slate-800"}`}>{m.label}</span>
                      <span className={`text-[11px] ${m.status === "active" ? "text-blue-600" : "text-slate-400"}`}>{m.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ✅ MEMBERS — FULL GROUP MEMBERS PANEL */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[22px] text-blue-900">groups</span>
                  <h3 className="text-base font-semibold text-slate-900">Research Group Members</h3>
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold">
                    {GROUP_MEMBERS.length} Members
                  </span>
                </div>
                <a className="text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-0.5" href="#">
                  <span>Manage Team</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {GROUP_MEMBERS.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <MemberAvatar member={m} size="w-12 h-12" showStatus />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-900 truncate">{m.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{m.role}</p>
                      <p className="text-[10px] text-slate-400 truncate">ID: {m.id}</p>
                    </div>
                    <button
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white transition-colors"
                      aria-label={`View ${m.name}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
              {/* DOUGHNUT */}
              <div className="lg:col-span-5 bg-white rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Document Status Breakdown</h3>
                    <p className="text-xs text-slate-500">Verification & clearance ratio</p>
                  </div>
                  <button className="p-1 rounded-lg text-slate-500 hover:bg-slate-100">
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
                  <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle className="text-slate-100" cx="60" cy="60" fill="none" r="48" stroke="currentColor" strokeWidth="14" />
                      <circle className="text-blue-900" cx="60" cy="60" fill="none" r="48" stroke="currentColor" strokeDasharray="236.7 301.6" strokeDashoffset="0" strokeWidth="14" />
                      <circle className="text-blue-400" cx="60" cy="60" fill="none" r="48" stroke="currentColor" strokeDasharray="43.1 301.6" strokeDashoffset="-236.7" strokeWidth="14" />
                      <circle className="text-red-500" cx="60" cy="60" fill="none" r="48" stroke="currentColor" strokeDasharray="21.8 301.6" strokeDashoffset="-279.8" strokeWidth="14" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl text-blue-900 font-bold leading-none">14</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Total Files</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    {[["bg-blue-900","Approved","11","(78%)","text-slate-900"],["bg-blue-400","Under Review","2","(14%)","text-slate-900"],["bg-red-500","For Revision","1","(7%)","text-red-600"]].map(([dot,label,val,pct,color], i) => (
                      <div key={i} className="flex items-center justify-between sm:justify-start gap-4 p-1 rounded-lg hover:bg-slate-50">
                        <div className="flex items-center gap-1">
                          <span className={`w-3 h-3 rounded-full ${dot}`} />
                          <span className="text-[13px] text-slate-800">{label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${color}`}>{val}</span>
                          <span className="text-[11px] text-slate-500">{pct}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-2 bg-slate-100 p-2 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-blue-900">policy</span>
                    Turnitin Plagiarism Score
                  </span>
                  <span className="text-xs text-blue-900 font-bold">4.2% (Permitted &lt;15%)</span>
                </div>
              </div>

              {/* BAR CHART */}
              <div className="lg:col-span-7 bg-white rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Submission Velocity & Milestones</h3>
                    <p className="text-xs text-slate-500">Planned targets vs actual manuscript iterations</p>
                  </div>
                  <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                    <button className="px-2 py-0.5 rounded text-slate-500 text-[11px] font-semibold hover:text-slate-800">This Week</button>
                    <button className="px-2 py-0.5 rounded bg-white text-blue-900 text-[11px] font-semibold shadow-sm">This Month</button>
                    <button className="px-2 py-0.5 rounded text-slate-500 text-[11px] font-semibold hover:text-slate-800">All Term</button>
                  </div>
                </div>
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[440px]">
                    <svg className="w-full h-48" viewBox="0 0 500 180">
                      <line stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.1" x1="40" x2="480" y1="20" y2="20" />
                      <line stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.1" x1="40" x2="480" y1="60" y2="60" />
                      <line stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.1" x1="40" x2="480" y1="100" y2="100" />
                      <line stroke="currentColor" strokeOpacity="0.2" x1="40" x2="480" y1="140" y2="140" />
                      <text className="text-[10px] fill-slate-500" textAnchor="end" x="30" y="24">6</text>
                      <text className="text-[10px] fill-slate-500" textAnchor="end" x="30" y="64">4</text>
                      <text className="text-[10px] fill-slate-500" textAnchor="end" x="30" y="104">2</text>
                      <text className="text-[10px] fill-slate-500" textAnchor="end" x="30" y="144">0</text>
                      <rect className="fill-slate-200" height="60" rx="3" width="16" x="70" y="80" />
                      <rect className="fill-blue-900" height="80" rx="3" width="16" x="90" y="60" />
                      <text className="text-[11px] font-medium fill-slate-800" textAnchor="middle" x="88" y="160">Ch. 1</text>
                      <rect className="fill-slate-200" height="80" rx="3" width="16" x="150" y="60" />
                      <rect className="fill-blue-900" height="100" rx="3" width="16" x="170" y="40" />
                      <text className="text-[11px] font-medium fill-slate-800" textAnchor="middle" x="168" y="160">Ch. 2</text>
                      <rect className="fill-slate-200" height="80" rx="3" width="16" x="230" y="60" />
                      <rect className="fill-blue-900" height="110" rx="3" width="16" x="250" y="30" />
                      <text className="text-[11px] font-medium fill-slate-800" textAnchor="middle" x="248" y="160">Ch. 3</text>
                      <rect className="fill-slate-200" height="80" rx="3" width="16" x="310" y="60" />
                      <rect className="fill-blue-400" height="70" rx="3" width="16" x="330" y="70" />
                      <text className="text-[11px] font-medium fill-slate-800" textAnchor="middle" x="328" y="160">Ch. 4</text>
                      <rect className="fill-slate-200" height="60" rx="3" width="16" x="390" y="80" />
                      <rect className="fill-blue-200" height="10" rx="3" width="16" x="410" y="130" />
                      <text className="text-[11px] font-medium fill-slate-800" textAnchor="middle" x="408" y="160">Ch. 5</text>
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 text-xs">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-slate-200" />
                      <span className="text-[11px] text-slate-500 font-semibold">Scheduled Target</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-blue-900" />
                      <span className="text-[11px] text-slate-500 font-semibold">Approved Drafts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-blue-400" />
                      <span className="text-[11px] text-slate-500 font-semibold">In Progress</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">Updated today 08:30 AM</span>
                </div>
              </div>
            </div>

            {/* BOTTOM ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* RECENT ACTIVITY */}
              <div className="lg:col-span-7 bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[22px] text-blue-900">history_edu</span>
                    <h3 className="text-base font-semibold text-slate-900">Recent Academic Activity</h3>
                  </div>
                  <a className="text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-0.5" href="#">
                    <span>View All Logs</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </a>
                </div>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {ACTIVITIES.map((a, i) => (
                    <div key={i} className="relative group">
                      <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                        <span className={`w-2.5 h-2.5 rounded-full ${a.dot}`} />
                      </div>
                      <div className="bg-slate-50 hover:bg-slate-100 p-2 rounded-lg transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                          <span className="text-[13px] text-slate-900 font-bold">{a.title}</span>
                          <span className="text-xs text-slate-500">{a.time}</span>
                        </div>
                        <p className="text-xs text-slate-500">{a.body}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${a.badge.style}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${a.badge.dot}`} />
                            {a.badge.text}
                          </span>
                          {a.action && <button className={`text-[11px] font-medium hover:underline ${a.action.color}`}>{a.action.text}</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DEADLINES */}
              <div className="lg:col-span-5 bg-white rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[22px] text-blue-900">event_upcoming</span>
                      <h3 className="text-base font-semibold text-slate-900">Upcoming Deadlines</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">3 Pending</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {DEADLINES.map((d, i) => (
                      <div key={i} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all">
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex flex-col">
                            <span className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1 ${d.iconColor}`}>
                              <span className="material-symbols-outlined text-[14px]">{d.icon}</span>
                              {d.when}
                            </span>
                            <h4 className="text-base font-semibold text-slate-900 mt-1">{d.title}</h4>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${d.priorityStyle}`}>{d.priority}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{d.desc}</p>
                        <div className="mt-2 pt-1 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-slate-500 text-xs">
                            <span className="material-symbols-outlined text-[16px]">{d.meta.icon}</span>
                            <span>{d.meta.text}</span>
                          </div>
                          <button className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${d.btn.style}`}>{d.btn.text}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 p-2 bg-slate-100 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[20px] shrink-0">info</span>
                  <p className="text-[11px] text-slate-500">
                    Need an extension or defense rescheduling? File an Academic Petition through the Dean's Office at least 7 days before panel convening.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}