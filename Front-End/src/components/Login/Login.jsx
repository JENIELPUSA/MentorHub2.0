import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { BookOpen, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
} from "framer-motion";
import logo from "@/assets/bipsulogo.png";
import LoadingIntro from "../ReusableFolder/loadingintro";
import LoginStatusModal from "./LogInStatusModal";
import ForgotPassword from "../Login/ForgotPassword";

/* ============================================================
   COLOR PALETTE
   ============================================================ */
const C = {
  primary: "#001649",
  primaryContainer: "#0f2a6b",
  onPrimary: "#ffffff",
  secondary: "#904d00",
  secondaryContainer: "#fe932c",
  secondaryFixed: "#ffdcc3",
  onSecondaryFixed: "#2f1500",
  tertiary: "#002013",
  tertiaryContainer: "#003724",
  tertiaryFixed: "#85f8c4",
  onTertiaryFixed: "#002114",
  surface: "#f8f9ff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#eff4ff",
  surfaceContainer: "#e5eeff",
  surfaceContainerHigh: "#dce9ff",
  surfaceContainerHighest: "#d3e4fe",
  surfaceTint: "#455b9c",
  onSurface: "#0b1c30",
  onSurfaceVariant: "#444650",
  outline: "#757681",
  outlineVariant: "#c5c6d2",
  inverseSurface: "#213145",
};

const LOGO_URL =
  "https://lh3.googleusercontent.com/aida/AEtjO1WE4Lbtt389D-ldX1-08Ewf9k0g1Fid1Hxdek-AuwruftNgNYVHxFGb8Iknzhj-nVZHYDNLSGAm-cwzvWgR8VsJKPEUuIgTQpkgiZ8jPXqh3cjtfv1oGc4fDTUCgpQRoM5fsyGhdh_nr8Ds0oarUydcECK4I5Y4hBLFltIHDE_DzFA5iopqmjTYYJQJI-feJIqFdlcZ-5Da0t4A4RbCNFkw4GUD-Of_6QXTCq90vMGQJ3no4MeeNFeI";

/* ============================================================
   STATIC DATA
   ============================================================ */
const THESES = [
  {
    id: 1,
    college: "ccs",
    collegeLabel: "CCS • Capstone 2024",
    badge: "Magna Cum Laude / Best Capstone 2024",
    badgeIcon: "star",
    badgeBg: C.tertiaryFixed,
    badgeColor: C.onTertiaryFixed,
    title:
      "IoT-Driven Mangrove Estuary Telemetry & Coastal Storm Surge Sensor Array for Biliran Island",
    authors: "Marc Kenneth Aldaba, Rhea Mae Navarro, Carlo S. Tan",
    advisor: "Dr. Aris V. Ramirez, PECE",
    ref: "Archival Ref: BiPSU-CCS-2024-081 • DOI: 10.5281/bipsu.2024.081",
    abstract:
      "This study engineered a low-cost, solar-powered LoRaWAN sensor network deployed across the Naval mangrove perimeter. The system provides real-time tidal depth telemetry, dissolved oxygen analytics, and automated SMS warnings to barangay DRRM councils with 99.2% transmission reliability during seasonal tropical storms.",
    pdf: "IoT-Driven Mangrove Estuary Telemetry (BiPSU-CCS-2024-081.pdf)",
  },
  {
    id: 2,
    college: "agri",
    collegeLabel: "Agri-Fisheries • 2024",
    badge: "DOST Regional Awardee",
    badgeIcon: "military_tech",
    badgeBg: C.secondaryFixed,
    badgeColor: C.onSecondaryFixed,
    title:
      "Deep Learning Identification of Red Tide Dinoflagellates via Affordable Mobile Microscope",
    authors: "L. D. Montano, Bianca F. Espina, Samuel T. Corpin",
    advisor: "Prof. Danilo S. Macariola, Ph.D.",
    ref: "Archival Ref: BiPSU-MAF-2024-019 • DOI: 10.5281/bipsu.2024.019",
    abstract:
      "Utilizes a 3D-printed smartphone microscopic coupler paired with a lightweight YOLOv8 neural network to identify harmful Pyrodinium bahamense cysts in Carigara Bay waters within 90 seconds, bypassing slow traditional laboratory centrifugal assays.",
    pdf: "Deep Learning Identification of Red Tide (BiPSU-MAF-2024-019.pdf)",
  },
  {
    id: 3,
    college: "cote",
    collegeLabel: "CoTE • Engineering 2024",
    badge: "Patent Pending (IPOPHL UM)",
    badgeIcon: "lock",
    badgeBg: C.surfaceTint,
    badgeColor: C.onPrimary,
    title:
      "Volcanic Soil Nutrient Telemetry & Autonomous Drip Fertigation for Biliran Abaca Plantations",
    authors: "Kevin J. Roble, Mary Ann Cañete, Justin P. Sabitsana",
    advisor: "Engr. Maria Luisa Corpin, M.Sc.",
    ref: "Archival Ref: BiPSU-ENG-2024-112 • Utility Model: UM-2024-50012",
    abstract:
      "Presents a specialized soil sensor array calibrated for Biliran volcanic loam soil. By correlating live nitrogen and potassium readings with programmed gravity micro-drip fertigation valves, test abaca yields increased by 31.4% with 40% reduced water waste.",
    pdf: "Volcanic Soil Nutrient Telemetry (BiPSU-ENG-2024-112.pdf)",
  },
  {
    id: 4,
    college: "coed",
    collegeLabel: "CoEd • Education 2024",
    badge: "Outstanding Dissertation 2024",
    badgeIcon: "grade",
    badgeBg: C.tertiaryFixed,
    badgeColor: C.onTertiaryFixed,
    title:
      "Pedagogical Waray-Waray Gamified STEM Learning Tools for Rural Elementary Schools",
    authors: "Joylyn D. Mendoza, Christine P. Velasco",
    advisor: "Dr. Elena Rosal-Velasco, Ed.D.",
    ref: "Archival Ref: BiPSU-ED-2024-044 • DepEd Biliran Endorsement",
    abstract:
      "Investigates mother-tongue mathematical cognition using localized Waray tablet applications across 8 primary schools in Biliran. Standardized pre/post assessment revealed a 28% increase in numeracy test retention over conventional bilingual texts.",
    pdf: "Waray-Waray Gamified STEM Tools (BiPSU-ED-2024-044.pdf)",
  },
];

const CATEGORY_PILLS = [
  { id: "all", label: "All Colleges" },
  { id: "ccs", label: "Computer Studies & IT" },
  { id: "cote", label: "Engineering" },
  { id: "coed", label: "Education" },
  { id: "cas", label: "Arts & Sciences" },
  { id: "agri", label: "Agriculture & Fisheries" },
];

const GALLERY_TABS = [
  "All Documentation",
  "Oral Presentations",
  "Prototype Demos",
  "Panel Evaluations",
  "Final Approvals",
];

const CORE_VALUES = [
  { letter: "B", word: "Brilliance" },
  { letter: "I", word: "Innovation" },
  { letter: "P", word: "Progress" },
  { letter: "S", word: "Service" },
  { letter: "U", word: "Unity" },
];

/* ============================================================
   FRAMER MOTION VARIANTS
   ============================================================ */
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -6,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const pillTap = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

// NEW: Blur-in reveal effect for section headings
const blurIn = {
  hidden: { opacity: 0, y: 30, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function BiPSUMentoringHub() {
  const [activeCollege, setActiveCollege] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGalleryTab, setActiveGalleryTab] = useState("All Documentation");
  const [modal, setModal] = useState({ open: false, title: "", body: "" });

  /* ---------- LOGIN LOGIC ---------- */
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [loginStatus, setLoginStatus] = useState({
    show: false,
    status: "success",
    message: "",
  });

  /* ---------- SCROLL PROGRESS ---------- */
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  /* ---------- HERO PARALLAX ---------- */
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Hero background image moves slower (parallax)
  const heroImageY = useTransform(heroScroll, [0, 1], ["0%", "30%"]);
  const heroImageScale = useTransform(heroScroll, [0, 1], [1.05, 1.2]);

  // Hero text/content fades + moves up slightly
  const heroContentY = useTransform(heroScroll, [0, 1], [0, -80]);
  const heroContentOpacity = useTransform(heroScroll, [0, 0.8], [1, 0]);

  // Decorative blobs parallax
  const blobRightY = useTransform(heroScroll, [0, 1], [0, 150]);
  const blobLeftY = useTransform(heroScroll, [0, 1], [0, -100]);

  /* ---------- BACK TO TOP BUTTON ---------- */
  const [showBackToTop, setShowBackToTop] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setShowBackToTop(latest > 0.25);
  });

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleInput = useCallback((event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    console.log("📤 LOGIN PAYLOAD:", values);

    const response = await login(values.email, values.password);

    if (response?.success) {
      setLoginStatus({
        show: true,
        status: "success",
        message: "Login successful!",
      });
      setIsLoading(false);
    } else {
      setIsLoading(false);
      setLoginStatus({
        show: true,
        status: "error",
        message:
          response?.message || "Login failed. Please check your credentials.",
      });
    }
  };

  const handleModalClose = () => {
    setLoginStatus((prev) => ({ ...prev, show: false }));
    if (loginStatus.status === "success") {
      navigate("/dashboard");
    }
  };

  const filteredTheses = THESES.filter((t) => {
    const matchesCollege = activeCollege === "all" || t.college === activeCollege;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      `${t.title} ${t.authors} ${t.advisor} ${t.collegeLabel} ${t.ref}`
        .toLowerCase()
        .includes(q);
    return matchesCollege && matchesSearch;
  });

  const scrollToRepository = () =>
    document.getElementById("archived-titles")?.scrollIntoView({ behavior: "smooth" });

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  /* ---------- Shared style helpers ---------- */
  const fontBody = "'Public Sans', sans-serif";
  const fontSerif = "'Source Serif 4', serif";
  const iconFont = {
    fontFamily: "'Material Symbols Outlined'",
    fontWeight: "normal",
    fontStyle: "normal",
    fontSize: "24px",
    lineHeight: "1",
    letterSpacing: "normal",
    textTransform: "none",
    display: "inline-block",
    whiteSpace: "nowrap",
    wordWrap: "normal",
    direction: "ltr",
    WebkitFontFeatureSettings: "'liga'",
    WebkitFontSmoothing: "antialiased",
    fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
  };

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <>
      {/* ===================== SCROLL PROGRESS BAR (TOP) ===================== */}
      <motion.div
        style={{
          scaleX,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: `linear-gradient(to right, ${C.secondaryContainer}, ${C.secondary}, ${C.primary})`,
          transformOrigin: "0%",
          zIndex: 999,
          boxShadow: "0 2px 8px rgba(0,22,73,0.3)",
        }}
      />

      {/* ===================== BACK TO TOP FLOATING BUTTON ===================== */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            key="back-to-top"
            initial={{ opacity: 0, scale: 0.5, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 40 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            whileHover={{ scale: 1.1, y: -4 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            aria-label="Back to top"
            style={{
              position: "fixed",
              bottom: "1.75rem",
              right: "1.75rem",
              width: "3rem",
              height: "3rem",
              borderRadius: "9999px",
              background: `linear-gradient(135deg, ${C.primary}, ${C.primaryContainer})`,
              color: C.onPrimary,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 28px -8px rgba(0,22,73,0.5)",
              zIndex: 80,
            }}
          >
            <span style={{ ...iconFont, fontSize: "1.25rem" }}>arrow_upward</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ===================== FULL-SCREEN LOADING OVERLAY ===================== */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(6px)",
            }}
          >
            <LoadingIntro />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== LOGIN STATUS MODAL ===================== */}
      <LoginStatusModal
        isOpen={loginStatus.show}
        onClose={handleModalClose}
        status={loginStatus.status}
        customMessage={loginStatus.message}
      />

      {/* ===================== FORGOT PASSWORD POPUP MODAL ===================== */}
      <AnimatePresence>
        {showForgotPassword && (
          <motion.div
            key="forgot-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) =>
              e.target === e.currentTarget && setShowForgotPassword(false)
            }
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 90,
              background: "rgba(11, 28, 48, 0.6)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "rgba(255,255,255,0.98)",
                backdropFilter: "blur(16px)",
                borderRadius: "1.25rem",
                width: "100%",
                maxWidth: "28rem",
                boxShadow: "0 25px 50px -12px rgba(0,22,73,0.45)",
                border: `1px solid ${C.surfaceContainerHigh}`,
                position: "relative",
                overflow: "hidden",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "0.375rem",
                  background: `linear-gradient(to right, ${C.primary}, ${C.secondary}, ${C.primary})`,
                  zIndex: 2,
                }}
              />

              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                aria-label="Close"
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  background: "none",
                  border: "none",
                  color: C.outline,
                  cursor: "pointer",
                  padding: "0.25rem",
                  borderRadius: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  zIndex: 3,
                }}
              >
                <span style={iconFont}>close</span>
              </button>

              <div
                style={{
                  padding: "1.75rem 1.75rem 0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  paddingTop: "2.25rem",
                }}
              >
                <div
                  style={{
                    width: "4rem",
                    height: "4rem",
                    borderRadius: "1rem",
                    background: C.surfaceContainerLowest,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 20px -6px rgba(0,22,73,0.25)",
                    border: `1px solid ${C.surfaceContainerHigh}`,
                    marginBottom: "0.875rem",
                  }}
                >
                  <img
                    src={logo}
                    alt="BiPSU Logo"
                    style={{ width: "3rem", height: "3rem", objectFit: "contain" }}
                  />
                </div>
                <h3
                  style={{
                    fontFamily: fontSerif,
                    fontSize: "1.375rem",
                    fontWeight: 700,
                    color: C.primary,
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  Reset Your Password
                </h3>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: C.onSurfaceVariant,
                    marginTop: "0.375rem",
                    marginBottom: 0,
                  }}
                >
                  Enter your registered BiPSU email and we'll send you a reset link.
                </p>
              </div>

              <div style={{ padding: "1.5rem 1.75rem 1.75rem" }}>
                <ForgotPassword
                  show={showForgotPassword}
                  onClose={() => setShowForgotPassword(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          background: C.surface,
          fontFamily: fontBody,
          color: C.onSurface,
          WebkitFontSmoothing: "antialiased",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {/* ===================== HEADER (with scroll-driven shrink) ===================== */}
        <motion.header
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: `1px solid ${C.surfaceContainerHigh}99`,
            boxShadow: "0 2px 12px rgba(15,42,107,0.05)",
          }}
        >
          <div
            style={{
              maxWidth: "80rem",
              margin: "0 auto",
              padding: "0 1rem",
              height: "5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <motion.a
              href="#"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}
            >
              <img
                alt="BiPSU Mentoring Hub Logo"
                style={{ height: "2.75rem", width: "auto", objectFit: "contain" }}
                src={logo}
              />
            </motion.a>

            <nav
              className="bipsu-nav"
              style={{ display: "none", alignItems: "center", gap: "0.5rem" }}
            >
              {[
                { href: "#hero", label: "Home", active: true },
                { href: "#vision-mission", label: "Vision & Mission" },
                { href: "#archived-titles", label: "Archived Titles" },
                { href: "#advisors", label: "Faculty Advisors" },
                { href: "#defense-gallery", label: "Defense Gallery" },
              ].map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.5rem",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    color: l.active ? C.primary : C.onSurfaceVariant,
                    background: l.active ? C.surfaceContainerLow : "transparent",
                  }}
                >
                  {l.label}
                </motion.a>
              ))}
            </nav>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <a
                href="#archived-titles"
                className="bipsu-quickfind"
                style={{
                  display: "none",
                  alignItems: "center",
                  gap: "0.25rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: C.secondary,
                  textDecoration: "none",
                }}
              >
                <span style={iconFont}>search</span>
                <span>Quick Find</span>
              </a>
              <motion.a
                href="#hero"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: C.primary,
                  color: C.onPrimary,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  padding: "0.625rem 1.25rem",
                  borderRadius: "0.5rem",
                  textDecoration: "none",
                }}
              >
                <span style={iconFont}>lock_open</span>
                <span>Access Portal</span>
              </motion.a>
            </div>
          </div>
        </motion.header>

        {/* ===================== HERO WITH PARALLAX ===================== */}
        <section
          id="hero"
          ref={heroRef}
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "6rem 0",
            borderBottom: `1px solid ${C.surfaceContainer}`,
            minHeight: "700px",
          }}
        >
          {/* Background image with parallax */}
          <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
            <motion.img
              initial={{ scale: 1.15, opacity: 0 }}
              animate={{ scale: 1.05, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{
                width: "100%",
                height: "120%",
                objectFit: "cover",
                objectPosition: "center",
                y: heroImageY,
                scale: heroImageScale,
              }}
              alt="BiPSU Modern University Campus Grounds"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAz8rsy7Ls6YZndO9ZhuNAPrcCf_6tNk3p3LZQfq5HSYAnQoUKrzFc5-0WT_56by7Q0rnI3cjX5xeWmG7Wbs5bJGdYltjmK3fkt-s_EkWRg2D_zQ09ZiXsfBgQ4yu9TwfkoyIX74YbtnfZ9dTYKtXkrUnWGAuOxCh2WlWKf9kEy_pz0pOzCVCCTEyMg_G7ghrS4CxdZeo1xxsrUOzBgC4WzKoknTdgkShBHeYezQy8JqKxN1_jSAYI"
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(to right, ${C.primary}f2, ${C.primary}d9, #0b1c30bf)`,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(to top, #001649e6, transparent, ${C.primary}66)`,
                backdropFilter: "blur(1.5px)",
              }}
            />
          </div>

          {/* Decorative blobs with parallax */}
          <motion.div
            style={{
              position: "absolute",
              right: "-5rem",
              top: "-5rem",
              width: "24rem",
              height: "24rem",
              borderRadius: "9999px",
              background: `${C.secondaryContainer}33`,
              filter: "blur(64px)",
              pointerEvents: "none",
              zIndex: 0,
              y: blobRightY,
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            style={{
              position: "absolute",
              left: "-5rem",
              bottom: "2.5rem",
              width: "20rem",
              height: "20rem",
              borderRadius: "9999px",
              background: `${C.surfaceContainerHighest}33`,
              filter: "blur(64px)",
              pointerEvents: "none",
              zIndex: 0,
              y: blobLeftY,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />

          <div
            style={{
              maxWidth: "80rem",
              margin: "0 auto",
              padding: "0 1rem",
              position: "relative",
              zIndex: 10,
            }}
          >
            <div
              className="bipsu-hero-grid"
              style={{ display: "grid", gridTemplateColumns: "1fr", gap: "3rem", alignItems: "center" }}
            >
              {/* LEFT — with scroll fade-out */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                  y: heroContentY,
                  opacity: heroContentOpacity,
                }}
              >
                <motion.div
                  variants={fadeUp}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    padding: "0.375rem 0.875rem",
                    borderRadius: "9999px",
                    width: "fit-content",
                  }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      width: "0.625rem",
                      height: "0.625rem",
                      borderRadius: "9999px",
                      background: C.secondaryContainer,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "white",
                      textTransform: "uppercase",
                      letterSpacing: "0.025em",
                    }}
                  >
                    Official Academic Clearance &amp; Research Portal
                  </span>
                </motion.div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <motion.h1
                    variants={fadeUp}
                    style={{
                      fontFamily: fontSerif,
                      fontSize: "3rem",
                      fontWeight: 700,
                      color: "white",
                      letterSpacing: "-0.025em",
                      lineHeight: 1.18,
                      margin: 0,
                      textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    }}
                  >
                    Biliran Province State University Capstone &amp; Thesis Mentoring Portal
                  </motion.h1>
                  <motion.p
                    variants={fadeUp}
                    style={{
                      fontFamily: fontBody,
                      fontSize: "1.125rem",
                      color: C.surfaceContainerHigh,
                      maxWidth: "42rem",
                      lineHeight: 1.625,
                      margin: 0,
                    }}
                  >
                    Guiding undergraduate and graduate scholars through faculty mentorship,
                    rigorous research standards, and institutional thesis archival across
                    Biliran and Eastern Visayas.
                  </motion.p>
                </div>

                <motion.div
                  variants={fadeUp}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "1rem",
                    paddingTop: "0.25rem",
                  }}
                >
                  <motion.a
                    href="#archived-titles"
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      background: C.secondary,
                      color: "white",
                      padding: "0.75rem 1.25rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                  >
                    <span style={iconFont}>local_library</span>
                    <span>Explore Archived Titles</span>
                  </motion.a>
                </motion.div>

                <motion.div
                  variants={fadeUp}
                  style={{
                    marginTop: "1rem",
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.4)",
                    padding: "0.625rem",
                    borderRadius: "0.75rem",
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.625rem",
                      padding: "0.5rem 0.75rem",
                      flex: 1,
                      color: C.onSurfaceVariant,
                    }}
                  >
                    <span style={{ ...iconFont, color: C.secondary, fontSize: "1.25rem" }}>
                      search
                    </span>
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search titles, keywords, authors, or topics..."
                      type="text"
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        fontSize: "0.875rem",
                        color: C.onSurface,
                        outline: "none",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <select
                      value={activeCollege}
                      onChange={(e) => setActiveCollege(e.target.value)}
                      style={{
                        background: C.surfaceContainerLow,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: C.primary,
                        padding: "0.625rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="all">All Colleges</option>
                      <option value="ccs">Computer Studies (CCS)</option>
                      <option value="cote">Engineering (CoTE)</option>
                      <option value="coed">Education (CoEd)</option>
                      <option value="cas">Arts &amp; Sciences (CAS)</option>
                      <option value="agri">Agri-Fisheries</option>
                    </select>
                    <motion.button
                      onClick={scrollToRepository}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        background: C.primary,
                        color: C.onPrimary,
                        padding: "0.625rem 1rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Filter
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>

              {/* RIGHT — Login Card */}
              <div>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  style={{
                    background: "rgba(255,255,255,0.98)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.6)",
                    borderRadius: "1.25rem",
                    padding: 0,
                    boxShadow: "0 25px 50px -12px rgba(0,22,73,0.35)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "0.375rem",
                      background: `linear-gradient(to right, ${C.primary}, ${C.secondary}, ${C.primary})`,
                      transformOrigin: "left",
                    }}
                  />

                  <div style={{ padding: "2rem" }}>
                    <motion.div
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.2 }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        paddingTop: "0.75rem",
                        paddingBottom: "1.5rem",
                        borderBottom: `1px dashed ${C.surfaceContainerHigh}`,
                        marginBottom: "1.5rem",
                      }}
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 150 }}
                        style={{
                          width: "5rem",
                          height: "5rem",
                          borderRadius: "1rem",
                          background: C.surfaceContainerLowest,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 8px 20px -6px rgba(0,22,73,0.25)",
                          border: `1px solid ${C.surfaceContainerHigh}`,
                          marginBottom: "0.875rem",
                        }}
                      >
                        <img
                          src={logo}
                          alt="BiPSU Logo"
                          style={{
                            width: "3.75rem",
                            height: "3.75rem",
                            objectFit: "contain",
                          }}
                        />
                      </motion.div>

                      <h3
                        style={{
                          fontFamily: fontSerif,
                          fontSize: "1.5rem",
                          fontWeight: 700,
                          color: C.primary,
                          lineHeight: 1.2,
                          margin: 0,
                        }}
                      >
                        BiPSU Mentoring Hub
                      </h3>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: C.onSurfaceVariant,
                          marginTop: "0.25rem",
                          margin: 0,
                        }}
                      >
                        Research &amp; Manuscript Archiving
                      </p>

                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                        style={{
                          marginTop: "0.875rem",
                          background: C.tertiaryFixed,
                          color: C.onTertiaryFixed,
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.375rem",
                        }}
                      >
                        <ShieldCheck size={12} />
                        <span>Secure Institutional SSO</span>
                      </motion.span>
                    </motion.div>

                    <motion.form
                      variants={itemVariants}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      onSubmit={handleLoginSubmit}
                      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.4 }}
                      >
                        <label
                          htmlFor="login-email"
                          style={{
                            display: "block",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: C.primary,
                            marginBottom: "0.375rem",
                          }}
                        >
                          Email Address
                        </label>
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                          <Mail
                            size={18}
                            style={{
                              position: "absolute",
                              left: "0.75rem",
                              color: C.outline,
                              pointerEvents: "none",
                            }}
                          />
                          <input
                            type="email"
                            id="login-email"
                            name="email"
                            value={values.email}
                            onChange={handleInput}
                            disabled={isLoading}
                            placeholder="mentorhub123@gmail.com"
                            required
                            style={{
                              width: "100%",
                              background: C.surfaceContainerLow,
                              border: `1px solid ${C.surfaceContainerHigh}`,
                              borderRadius: "0.5rem",
                              paddingLeft: "2.5rem",
                              paddingRight: "0.75rem",
                              paddingTop: "0.7rem",
                              paddingBottom: "0.7rem",
                              fontSize: "0.8125rem",
                              color: C.onSurface,
                              outline: "none",
                              opacity: isLoading ? 0.5 : 1,
                            }}
                          />
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45, duration: 0.4 }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "0.375rem",
                          }}
                        >
                          <label
                            htmlFor="login-password"
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: C.primary,
                            }}
                          >
                            Password
                          </label>
                          <motion.button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                              color: C.secondary,
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              textDecoration: "none",
                            }}
                          >
                            Forgot password?
                          </motion.button>
                        </div>
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                          <Lock
                            size={18}
                            style={{
                              position: "absolute",
                              left: "0.75rem",
                              color: C.outline,
                              pointerEvents: "none",
                            }}
                          />
                          <input
                            type={showPassword ? "text" : "password"}
                            id="login-password"
                            name="password"
                            value={values.password}
                            onChange={handleInput}
                            disabled={isLoading}
                            placeholder="••••••••"
                            required
                            style={{
                              width: "100%",
                              background: C.surfaceContainerLow,
                              border: `1px solid ${C.surfaceContainerHigh}`,
                              borderRadius: "0.5rem",
                              paddingLeft: "2.5rem",
                              paddingRight: "2.5rem",
                              paddingTop: "0.7rem",
                              paddingBottom: "0.7rem",
                              fontSize: "0.8125rem",
                              color: C.onSurface,
                              outline: "none",
                              opacity: isLoading ? 0.5 : 1,
                            }}
                          />
                          <motion.button
                            type="button"
                            onClick={toggleShowPassword}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                              position: "absolute",
                              right: "0.75rem",
                              color: C.outline,
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <AnimatePresence mode="wait" initial={false}>
                              {showPassword ? (
                                <motion.span
                                  key="eye-off"
                                  initial={{ opacity: 0, rotate: -90 }}
                                  animate={{ opacity: 1, rotate: 0 }}
                                  exit={{ opacity: 0, rotate: 90 }}
                                  transition={{ duration: 0.2 }}
                                  style={{ display: "flex" }}
                                >
                                  <EyeOff size={18} />
                                </motion.span>
                              ) : (
                                <motion.span
                                  key="eye"
                                  initial={{ opacity: 0, rotate: 90 }}
                                  animate={{ opacity: 1, rotate: 0 }}
                                  exit={{ opacity: 0, rotate: -90 }}
                                  transition={{ duration: 0.2 }}
                                  style={{ display: "flex" }}
                                >
                                  <Eye size={18} />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        </div>
                      </motion.div>

                      <motion.button
                        type="submit"
                        disabled={isLoading}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55, duration: 0.4 }}
                        whileHover={!isLoading ? { scale: 1.02, y: -2 } : {}}
                        whileTap={!isLoading ? { scale: 0.98 } : {}}
                        style={{
                          width: "100%",
                          background: isLoading
                            ? C.primaryContainer
                            : `linear-gradient(135deg, ${C.primary}, ${C.primaryContainer})`,
                          color: C.onPrimary,
                          padding: "0.85rem 1rem",
                          borderRadius: "0.625rem",
                          fontSize: "0.8125rem",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          boxShadow: "0 8px 16px -6px rgba(0,22,73,0.4)",
                          border: "none",
                          cursor: isLoading ? "not-allowed" : "pointer",
                          marginTop: "0.5rem",
                          letterSpacing: "0.025em",
                          opacity: isLoading ? 0.9 : 1,
                        }}
                      >
                        {isLoading ? "Signing in..." : "Log In"}
                        {!isLoading && (
                          <motion.span
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            style={{ display: "flex" }}
                          >
                            <ArrowRight size={16} />
                          </motion.span>
                        )}
                      </motion.button>
                    </motion.form>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7, duration: 0.5 }}
                      style={{
                        paddingTop: "1rem",
                        marginTop: "1.25rem",
                        borderTop: `1px solid ${C.surfaceContainer}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.625rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          gap: "0.375rem",
                        }}
                      >
                        <span style={{ color: C.onSurfaceVariant }}>First time here?</span>
                        <motion.a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            alert(
                              "Please activate your student research portal account using your BiPSU Registrar credentials."
                            );
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={{
                            fontWeight: 600,
                            color: C.secondary,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <span>Activate account</span>
                          <span style={{ ...iconFont, fontSize: "0.75rem" }}>north_east</span>
                        </motion.a>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.375rem",
                          fontSize: "0.6875rem",
                          color: C.outline,
                          paddingTop: "0.25rem",
                        }}
                      >
                        <ShieldCheck size={13} style={{ color: C.tertiaryContainer }} />
                        <span>ORDI &amp; ISO 9001 256-Bit SSL Encrypted</span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Scroll hint at bottom of hero */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: [0, 1, 0.6, 1], y: [0, 8, 0, 8] }}
            transition={{ delay: 1.5, duration: 3, repeat: Infinity }}
            style={{
              position: "absolute",
              bottom: "1.5rem",
              left: "50%",
              transform: "translateX(-50%)",
              color: "rgba(255,255,255,0.7)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.25rem",
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Scroll to explore
            </span>
            <span style={{ ...iconFont, fontSize: "1.25rem" }}>keyboard_arrow_down</span>
          </motion.div>
        </section>

        {/* ===================== VISION & MISSION ===================== */}
        <motion.section
          id="vision-mission"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={staggerContainer}
          style={{
            padding: "4rem 0",
            background: C.surfaceContainerLowest,
            borderBottom: `1px solid ${C.surfaceContainer}`,
          }}
        >
          <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem" }}>
            <motion.div
              variants={blurIn}
              style={{ textAlign: "center", maxWidth: "48rem", margin: "0 auto 3rem" }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  color: C.secondary,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.5rem",
                }}
              >
                <span style={iconFont}>explore</span>
                <span>Institutional Mandate</span>
              </div>
              <h2
                style={{
                  fontFamily: fontSerif,
                  fontSize: "2.25rem",
                  fontWeight: 700,
                  color: C.primary,
                  margin: 0,
                }}
              >
                Official BiPSU Vision &amp; Mission
              </h2>
              <p
                style={{
                  color: C.onSurfaceVariant,
                  fontSize: "1rem",
                  marginTop: "0.5rem",
                }}
              >
                Anchoring academic scholarship, graduate research, and capstone excellence
                upon the foundational pillars of Biliran Province State University.
              </p>
            </motion.div>

            <div
              className="bipsu-vm-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "2rem",
                marginBottom: "2.5rem",
              }}
            >
              {/* Vision */}
              <motion.div
                variants={fadeLeft}
                whileHover={cardHover.hover}
                initial="rest"
                animate="rest"
                style={{
                  position: "relative",
                  background: `linear-gradient(135deg, ${C.surfaceContainerLow}, ${C.surface}, ${C.surfaceContainerLowest})`,
                  borderRadius: "1rem",
                  border: `2px solid ${C.surfaceContainerHigh}cc`,
                  padding: "2rem",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    ...iconFont,
                    position: "absolute",
                    right: "-1.5rem",
                    bottom: "-1.5rem",
                    fontSize: "8rem",
                    color: `${C.primary}0d`,
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                >
                  visibility
                </span>
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem" }}>
                      <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        style={{
                          width: "3rem",
                          height: "3rem",
                          borderRadius: "0.75rem",
                          background: C.primary,
                          color: C.secondaryFixed,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span style={iconFont}>visibility</span>
                      </motion.div>
                      <div>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            color: C.secondary,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            display: "block",
                          }}
                        >
                          University Horizon
                        </span>
                        <h3
                          style={{
                            fontFamily: fontSerif,
                            fontSize: "1.5rem",
                            fontWeight: 700,
                            color: C.primary,
                            margin: 0,
                          }}
                        >
                          Our Vision
                        </h3>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        background: `${C.primary}1a`,
                        color: C.primary,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      BiPSU 2030
                    </span>
                  </div>
                  <blockquote
                    style={{
                      fontFamily: fontSerif,
                      fontSize: "1.5rem",
                      fontWeight: 600,
                      color: C.primary,
                      lineHeight: 1.625,
                      paddingLeft: "1rem",
                      borderLeft: `4px solid ${C.secondary}`,
                      margin: "1.5rem 0",
                    }}
                  >
                    "A state university leading in research and innovation for human and
                    societal development."
                  </blockquote>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: C.onSurfaceVariant,
                      lineHeight: 1.625,
                      margin: 0,
                    }}
                  >
                    Positioning BiPSU as an epicenter of sustainable island technologies,
                    marine stewardship, and resilient regional problem-solving throughout the
                    Philippine archipelago and beyond.
                  </p>
                </div>
                <div
                  style={{
                    paddingTop: "1.5rem",
                    marginTop: "1.5rem",
                    borderTop: `1px solid ${C.surfaceContainer}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: C.primary,
                  }}
                >
                  <span style={{ ...iconFont, color: C.secondary, fontSize: "1rem" }}>
                    auto_awesome
                  </span>
                  <span>Leading Island Innovation &amp; Technological Discovery</span>
                </div>
              </motion.div>

              {/* Mission */}
              <motion.div
                variants={fadeRight}
                whileHover={cardHover.hover}
                initial="rest"
                animate="rest"
                style={{
                  position: "relative",
                  background: `linear-gradient(135deg, ${C.surfaceContainerLow}, ${C.surface}, ${C.surfaceContainerLowest})`,
                  borderRadius: "1rem",
                  border: `2px solid ${C.surfaceContainerHigh}cc`,
                  padding: "2rem",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    ...iconFont,
                    position: "absolute",
                    right: "-1.5rem",
                    bottom: "-1.5rem",
                    fontSize: "8rem",
                    color: `${C.secondary}0d`,
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                >
                  menu_book
                </span>
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem" }}>
                      <motion.div
                        whileHover={{ rotate: -10, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        style={{
                          width: "3rem",
                          height: "3rem",
                          borderRadius: "0.75rem",
                          background: C.secondary,
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span style={iconFont}>menu_book</span>
                      </motion.div>
                      <div>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            color: C.primary,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            display: "block",
                          }}
                        >
                          Scholarly Mandate
                        </span>
                        <h3
                          style={{
                            fontFamily: fontSerif,
                            fontSize: "1.5rem",
                            fontWeight: 700,
                            color: C.primary,
                            margin: 0,
                          }}
                        >
                          Our Mission
                        </h3>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        background: C.secondaryFixed,
                        color: C.onSecondaryFixed,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Advancement
                    </span>
                  </div>
                  <blockquote
                    style={{
                      fontFamily: fontSerif,
                      fontSize: "1.125rem",
                      fontWeight: 600,
                      color: C.primary,
                      lineHeight: 1.625,
                      paddingLeft: "1rem",
                      borderLeft: `4px solid ${C.primary}`,
                      margin: "1.5rem 0",
                    }}
                  >
                    "Biliran Province State University shall advance research, produce
                    globally competitive professionals, generate and diffuse relevant
                    knowledge and technologies, and engage in meaningful partnerships for
                    inclusive and sustainable community development."
                  </blockquote>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: C.onSurfaceVariant,
                      lineHeight: 1.625,
                      margin: 0,
                    }}
                  >
                    Operationalized through disciplined thesis committees, ethics clearances,
                    and proactive tech transfer to ensure research produces real societal
                    impact.
                  </p>
                </div>
                <div
                  style={{
                    paddingTop: "1.5rem",
                    marginTop: "1.5rem",
                    borderTop: `1px solid ${C.surfaceContainer}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: C.secondary,
                  }}
                >
                  <span style={{ ...iconFont, color: C.primary, fontSize: "1rem" }}>school</span>
                  <span>Human Capital, Applied Science, &amp; Global Competence</span>
                </div>
              </motion.div>
            </div>

            {/* Core Values */}
            <motion.div
              variants={fadeUp}
              style={{
                background: `${C.surfaceContainerLow}b3`,
                borderRadius: "0.75rem",
                padding: "1.25rem",
                border: `1px solid ${C.surfaceContainerHigh}`,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: C.primary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  style={{ ...iconFont, color: C.secondary, display: "inline-block" }}
                >
                  workspace_premium
                </motion.span>
                <span>BiPSU Core Values:</span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                {CORE_VALUES.map((v, i) => (
                  <motion.span
                    key={v.letter}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    whileHover={{ scale: 1.1, y: -3 }}
                    style={{
                      padding: "0.375rem 0.875rem",
                      borderRadius: "0.5rem",
                      background: C.surfaceContainerLowest,
                      border: `1px solid ${C.surfaceContainerHigh}`,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: C.primary,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      cursor: "default",
                    }}
                  >
                    <strong style={{ color: C.secondary, fontWeight: 700 }}>{v.letter}</strong>
                    {v.word.slice(1)}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* ===================== DEFENSE GALLERY ===================== */}
        <motion.section
          id="defense-gallery"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
          style={{
            padding: "5rem 0",
            background: `${C.surfaceContainerLow}99`,
            borderBottom: `1px solid ${C.surfaceContainer}`,
          }}
        >
          <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem" }}>
            <motion.div
              variants={blurIn}
              style={{ textAlign: "center", maxWidth: "48rem", margin: "0 auto 2.5rem" }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  color: C.secondary,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.5rem",
                  background: C.surfaceContainerLowest,
                  padding: "0.375rem 0.875rem",
                  borderRadius: "9999px",
                  border: `1px solid ${C.surfaceContainerHigh}`,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                <span style={iconFont}>photo_camera</span>
                <span>Academic Deliberation &amp; Milestone Records</span>
              </div>
              <h2
                style={{
                  fontFamily: fontSerif,
                  fontSize: "2.25rem",
                  fontWeight: 700,
                  color: C.primary,
                  letterSpacing: "-0.025em",
                  margin: 0,
                }}
              >
                BiPSU Capstone &amp; Thesis Defense Documentation
              </h2>
              <p
                style={{
                  color: C.onSurfaceVariant,
                  fontSize: "1rem",
                  marginTop: "0.75rem",
                  lineHeight: 1.625,
                }}
              >
                Visual documentation of title defense hearings, colloquium presentations,
                prototype demonstrations, and oral panel deliberations across Biliran
                Province State University colleges.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                overflowX: "auto",
                paddingBottom: "0.75rem",
                marginBottom: "2.5rem",
              }}
            >
              {GALLERY_TABS.map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveGalleryTab(tab)}
                  whileHover={pillTap.hover}
                  whileTap={pillTap.tap}
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    border:
                      activeGalleryTab === tab
                        ? "none"
                        : `1px solid ${C.surfaceContainerHigh}`,
                    cursor: "pointer",
                    flexShrink: 0,
                    background:
                      activeGalleryTab === tab ? C.primary : C.surfaceContainerLowest,
                    color: activeGalleryTab === tab ? C.onPrimary : C.onSurface,
                    boxShadow:
                      activeGalleryTab === tab ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {activeGalleryTab === tab && (
                    <motion.span
                      layoutId="gallery-tab-bg"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: C.primary,
                        borderRadius: "0.5rem",
                        zIndex: -1,
                      }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span style={{ position: "relative", zIndex: 1 }}>{tab}</span>
                </motion.button>
              ))}
            </motion.div>

            <div
              className="bipsu-defense-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "1.5rem",
                marginBottom: "3rem",
              }}
            >
              <motion.div
                variants={scaleIn}
                whileHover={cardHover.hover}
                initial="rest"
                animate="rest"
                style={{
                  background: C.surfaceContainerLowest,
                  borderRadius: "1rem",
                  border: `1px solid ${C.surfaceContainerHigh}`,
                  overflow: "hidden",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    height: "24rem",
                    width: "100%",
                    overflow: "hidden",
                    background: C.surfaceContainer,
                  }}
                >
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    alt="Undergraduate Title Defense and Prototype Deliberations"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                    }}
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBc3W6q_Ahr_Djchq315PfkHFUv_1yWvGns8sbBVIh13T_q4twWvaYiSWmaxPqOUAFQZl16wGQ5oVwqHqT81P1TcpvYto45d6xbCR8m-nw-OgyAcN6rzbQkHWDhYHhB8RWrsCO7H7fIFRLOAgcyUapR_9-VtKcJNEkDg1rs_cK3QgJAFYSty5IkkPi_qQY_DJApjvKsX2w9kEvXZ5muec1kRUxcv8Lfp54U0AZJdpvDfStjsTKfXE8"
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(to top, #001649e6, ${C.primary}4d, transparent)`,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "1rem",
                      left: "1rem",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <motion.span
                      animate={{ opacity: [1, 0.85, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      style={{
                        background: C.secondary,
                        color: "white",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <span style={{ ...iconFont, fontSize: "0.75rem" }}>record_voice_over</span>
                      <span>Panel Review in Progress</span>
                    </motion.span>
                    <span
                      style={{
                        background: "rgba(255,255,255,0.95)",
                        backdropFilter: "blur(12px)",
                        color: C.primary,
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        padding: "0.25rem 0.625rem",
                        borderRadius: "9999px",
                      }}
                    >
                      Cycle 2024-2025
                    </span>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "1rem",
                      left: "1rem",
                      right: "1rem",
                      color: "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        color: C.secondaryFixed,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span style={{ ...iconFont, fontSize: "0.875rem" }}>apartment</span>
                      <span>Naval Main Campus Conference Hall</span>
                    </div>
                    <h3
                      style={{
                        fontFamily: fontSerif,
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "white",
                        lineHeight: 1.25,
                        margin: 0,
                      }}
                    >
                      Undergraduate Title Defense &amp; Prototype Deliberations (Naval Campus)
                    </h3>
                  </div>
                </div>
                <div
                  style={{
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    flex: 1,
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: C.onSurfaceVariant,
                      lineHeight: 1.625,
                      marginBottom: "1rem",
                      marginTop: 0,
                    }}
                  >
                    Scholars defending their IoT &amp; applied engineering capstones with live
                    operational hardware before accredited faculty evaluators, panel chairs,
                    and ORDI observers.
                  </p>
                  <div
                    style={{
                      paddingTop: "1rem",
                      borderTop: `1px solid ${C.surfaceContainer}`,
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: C.primary,
                      }}
                    >
                      <span style={{ ...iconFont, color: C.secondary, fontSize: "1rem" }}>
                        verified
                      </span>
                      <span>School of Technology &amp; Engineering Panel</span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 500,
                        color: C.outline,
                        background: C.surfaceContainerLow,
                        padding: "0.25rem 0.625rem",
                        borderRadius: "0.25rem",
                      }}
                    >
                      Session Ref: BiPSU-DEF-2024-C12
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
              >
                {[
                  {
                    img: "https://lh3.googleusercontent.com/aida/AEtjO1VArIWFpVGoPXkCoksnEo--AgnMjvMQWktrrIRZGsDU2h66KyNv_GQHJ8XaUQdwNPqhI7c4LcmbK2_lxDAit8tIW3SoUOG0mF4wiNFKCEtBjU_ySk3t4jUQ1_3tQ6aYlXvFERDeqRr1baCqYw2IYlWeAYohXMealm11mjmx6uphONXfZ1hUaA96R40wzAAtRSSgY_gnQXTTKZBPPOHURU03wAMhx4cgq8ygXVC6QoJvJUQuOm423Tss4g",
                    badge: "Proposal Colloquium",
                    badgeBg: C.primary,
                    badgeColor: C.onPrimary,
                    eyebrowIcon: "event",
                    eyebrow: "Mid-Term Milestone • Q1 2025",
                    title: "Colloquium Exhibition & Research Pitch",
                    desc: "Cross-college poster defense presentations scrutinizing methodology, ethical clearance criteria, and societal relevance.",
                    footer: "Dean & Ethics Comm. Review",
                    footerIcon: "check",
                    footerColor: C.primary,
                  },
                  {
                    img: "https://lh3.googleusercontent.com/aida/AEtjO1VYfHThGxfKlUQtlWe9wZNxY9eY9iOb9gvy_c1oP99fyTHGY7DiSVnjfxLzZy6njiR8VHPnMBAKXRzDWT2Q5rnFo2VccJE7NvjX9Dn9qs4jxNliMmbqUSumANCH9ek98r5KLd6j5bOWV-Meqz26R06hocxetPWoPq2mrd1gMleu1X0AVYKcH2ru5iUxtFUKrO5hDPq86zcMWBKFidYFVckbWMA849ImdVXmkW_XCJG7OtlZcrwlY9AR",
                    badge: "Pre-Oral Defense",
                    badgeBg: C.tertiaryContainer,
                    badgeColor: "white",
                    eyebrowIcon: "precision_manufacturing",
                    eyebrow: "Fabrication Lab • Naval Campus",
                    title: "Hardware & Computational Demonstrations",
                    desc: "Real-world benchmark stress testing, sensor verification, and software telemetry live audits under faculty technical committees.",
                    footer: "Live Test Bench Passed",
                    footerIcon: "task_alt",
                    footerColor: C.tertiaryContainer,
                  },
                  {
                    img: "https://lh3.googleusercontent.com/aida/AEtjO1Vsi_cfcFFnwkdqBjiI4rkgEDYIUtb8Hbzct_oSunXklB7jHqVCbPImztmsItycKLUe5oidyTGo8zWO9gYIN_4_03NnTrmorDYysp2pUrDzQeRtqX7meQxrwgquEl4esXF9UwUJsw1LxHmz8j1WcMgqF8Y2CFp-Kh1VPOnt0yqZF_tb9gRS4h95i_iSxO1hQxvsmJWm6_mDKl9bByjg5fDKdFBT4GsX1MwS4XXrQrUw3FfQA4o_Zh-OoA",
                    badge: "Final Defense Sign-Off",
                    badgeBg: C.surfaceTint,
                    badgeColor: C.onPrimary,
                    eyebrowIcon: "menu_book",
                    eyebrow: "BiPSU Learning Resource Center",
                    title: "Archival Literature & Oral Defense Sign-Off",
                    desc: "Final revision concordance verification, Turnitin clearance checks, and signature certifications for institutional archiving.",
                    footer: "KTTO Registry Cleared",
                    footerIcon: "verified",
                    footerColor: C.secondary,
                  },
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    variants={fadeRight}
                    whileHover={cardHover.hover}
                    initial="rest"
                    animate="rest"
                    style={{
                      background: C.surfaceContainerLowest,
                      borderRadius: "1rem",
                      border: `1px solid ${C.surfaceContainerHigh}`,
                      overflow: "hidden",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <div
                      style={{
                        width: "12rem",
                        flexShrink: 0,
                        position: "relative",
                        overflow: "hidden",
                        background: C.surfaceContainer,
                      }}
                    >
                      <motion.img
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        alt={card.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        src={card.img}
                      />
                      <span
                        style={{
                          position: "absolute",
                          top: "0.5rem",
                          left: "0.5rem",
                          background: card.badgeBg,
                          color: card.badgeColor,
                          fontSize: "0.625rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          padding: "0.125rem 0.5rem",
                          borderRadius: "0.25rem",
                        }}
                      >
                        {card.badge}
                      </span>
                    </div>
                    <div
                      style={{
                        padding: "1.25rem",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        flex: 1,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "0.6875rem",
                            color: C.secondary,
                            fontWeight: 600,
                            marginBottom: "0.25rem",
                          }}
                        >
                          <span style={{ ...iconFont, fontSize: "0.75rem" }}>
                            {card.eyebrowIcon}
                          </span>
                          <span>{card.eyebrow}</span>
                        </div>
                        <h4
                          style={{
                            fontFamily: fontSerif,
                            fontSize: "1rem",
                            fontWeight: 700,
                            color: C.primary,
                            lineHeight: 1.375,
                            marginBottom: "0.375rem",
                            marginTop: 0,
                          }}
                        >
                          {card.title}
                        </h4>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: C.onSurfaceVariant,
                            lineHeight: 1.625,
                            margin: 0,
                          }}
                        >
                          {card.desc}
                        </p>
                      </div>
                      <div
                        style={{
                          marginTop: "0.75rem",
                          paddingTop: "0.625rem",
                          borderTop: `1px solid ${C.surfaceContainer}`,
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: card.footerColor,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <span>{card.footer}</span>
                        <span style={{ ...iconFont, fontSize: "0.75rem" }}>
                          {card.footerIcon}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Metrics Bar */}
            <motion.div
              variants={fadeUp}
              className="bipsu-metrics-grid"
              style={{
                background: C.surfaceContainerLowest,
                borderRadius: "1rem",
                padding: "1.5rem",
                border: `1px solid ${C.surfaceContainerHigh}`,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "1.5rem",
              }}
            >
              {[
                { icon: "groups", bg: C.primary, color: C.secondaryFixed, title: "100% Peer-Reviewed", desc: "Defense Panels & External Chairs" },
                { icon: "psychology_alt", bg: C.secondary, color: "white", title: "Oral & Demo Rigor", desc: "Live Hardware & Code Verifications" },
                { icon: "fact_check", bg: C.tertiaryContainer, color: "white", title: "ISO 9001:2015 Evaluator", desc: "Standardized Scoring Rubrics" },
                { icon: "shield_with_heart", bg: C.surfaceTint, color: C.onPrimary, title: "DOST & UREC Clearance", desc: "Institutional Ethics & Patent Protocol" },
              ].map((m, i) => (
                <motion.div
                  key={m.title}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ x: 6 }}
                  style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}
                >
                  <motion.div
                    whileHover={{ rotate: 8, scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    style={{
                      width: "2.75rem",
                      height: "2.75rem",
                      borderRadius: "0.75rem",
                      background: m.bg,
                      color: m.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ ...iconFont, fontSize: "1.25rem" }}>{m.icon}</span>
                  </motion.div>
                  <div>
                    <h4
                      style={{
                        fontWeight: 700,
                        color: C.primary,
                        fontSize: "0.875rem",
                        margin: 0,
                      }}
                    >
                      {m.title}
                    </h4>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: C.onSurfaceVariant,
                        margin: 0,
                      }}
                    >
                      {m.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* ===================== ARCHIVED TITLES ===================== */}
        <motion.section
          id="archived-titles"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={staggerContainer}
          style={{ padding: "5rem 0", background: C.surface }}
        >
          <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem" }}>
            <motion.div
              variants={blurIn}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    color: C.secondary,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.25rem",
                  }}
                >
                  <span style={iconFont}>menu_book</span>
                  <span>Institutional Archive</span>
                </div>
                <h2
                  style={{
                    fontFamily: fontSerif,
                    fontSize: "2.25rem",
                    fontWeight: 700,
                    color: C.primary,
                    margin: 0,
                  }}
                >
                  Archived Capstone &amp; Thesis Repository
                </h2>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: C.onSurfaceVariant,
                    marginTop: "0.25rem",
                    maxWidth: "42rem",
                  }}
                >
                  Browse cleared, defended, and accredited scholarly outputs from BiPSU's
                  constituent colleges.
                </p>
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  background: C.surfaceContainerLow,
                  padding: "0.375rem 0.75rem",
                  borderRadius: "0.5rem",
                  color: C.onSurfaceVariant,
                }}
              >
                Showing{" "}
                <span style={{ fontWeight: 700, color: C.primary }}>
                  {filteredTheses.length}
                </span>{" "}
                Cleared Theses
              </span>
            </motion.div>

            <motion.div
              variants={fadeUp}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                overflowX: "auto",
                paddingBottom: "0.75rem",
                marginBottom: "2rem",
              }}
            >
              {CATEGORY_PILLS.map((p) => (
                <motion.button
                  key={p.id}
                  onClick={() => setActiveCollege(p.id)}
                  whileHover={pillTap.hover}
                  whileTap={pillTap.tap}
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    cursor: "pointer",
                    flexShrink: 0,
                    background: activeCollege === p.id ? C.primary : C.surfaceContainerLow,
                    color: activeCollege === p.id ? C.onPrimary : C.onSurface,
                    boxShadow:
                      activeCollege === p.id ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {activeCollege === p.id && (
                    <motion.span
                      layoutId="category-pill-bg"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: C.primary,
                        borderRadius: "0.5rem",
                        zIndex: -1,
                      }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span style={{ position: "relative", zIndex: 1 }}>{p.label}</span>
                </motion.button>
              ))}
            </motion.div>

            <motion.div
              layout
              className="bipsu-repo-grid"
              style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}
            >
              <AnimatePresence mode="popLayout">
                {filteredTheses.map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    whileHover={cardHover.hover}
                    style={{
                      background: C.surfaceContainerLowest,
                      borderRadius: "0.75rem",
                      border: `1px solid ${C.surfaceContainerHigh}`,
                      padding: "1.5rem",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.5rem",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <span
                          style={{
                            background: C.surfaceContainerHighest,
                            color: C.primary,
                            fontWeight: 700,
                            fontSize: "0.6875rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            padding: "0.25rem 0.625rem",
                            borderRadius: "0.25rem",
                          }}
                        >
                          {t.collegeLabel}
                        </span>
                        <span
                          style={{
                            background: t.badgeBg,
                            color: t.badgeColor,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            padding: "0.125rem 0.625rem",
                            borderRadius: "0.25rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <span style={{ ...iconFont, fontSize: "0.75rem" }}>{t.badgeIcon}</span>
                          {t.badge}
                        </span>
                      </div>
                      <h3
                        style={{
                          fontFamily: fontSerif,
                          fontSize: "1.125rem",
                          fontWeight: 700,
                          color: C.primary,
                          lineHeight: 1.375,
                          marginBottom: "0.5rem",
                        }}
                      >
                        {t.title}
                      </h3>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: C.onSurfaceVariant,
                          margin: "1rem 0",
                          background: `${C.surfaceContainerLow}99`,
                          padding: "0.75rem",
                          borderRadius: "0.5rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.375rem",
                        }}
                      >
                        <p style={{ margin: 0 }}>
                          <span style={{ fontWeight: 600, color: C.onSurface }}>
                            Authors / Researchers:
                          </span>{" "}
                          {t.authors}
                        </p>
                        <p style={{ margin: 0 }}>
                          <span style={{ fontWeight: 600, color: C.onSurface }}>
                            Faculty Mentor / Advisor:
                          </span>{" "}
                          {t.advisor}
                        </p>
                        <p style={{ color: C.outline, fontSize: "0.6875rem", margin: 0 }}>
                          {t.ref}
                        </p>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: "1rem",
                        borderTop: `1px solid ${C.surfaceContainer}`,
                        gap: "0.5rem",
                      }}
                    >
                      <motion.button
                        onClick={() => setModal({ open: true, title: t.title, body: t.abstract })}
                        whileHover={{ scale: 1.05, x: 2 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: C.primary,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: 0,
                        }}
                      >
                        <span style={{ ...iconFont, fontSize: "0.875rem" }}>visibility</span>
                        <span>View Abstract</span>
                      </motion.button>
                      <motion.button
                        onClick={() =>
                          alert(
                            `Accessing verified BiPSU Mentoring Hub Institutional Repository...\nPreparing download for: ${t.pdf}`
                          )
                        }
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          background: C.surfaceContainer,
                          color: C.primary,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "0.5rem 0.875rem",
                          borderRadius: "0.5rem",
                          border: "none",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <span style={{ ...iconFont, fontSize: "0.875rem" }}>download</span>
                        <span>Download PDF</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredTheses.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    textAlign: "center",
                    padding: "4rem 0",
                    color: C.onSurfaceVariant,
                    fontSize: "0.875rem",
                    gridColumn: "1 / -1",
                  }}
                >
                  No theses match your current filter or search.
                </motion.div>
              )}
            </motion.div>

            {/* Pagination */}
            <motion.div
              variants={fadeUp}
              style={{
                marginTop: "2.5rem",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                paddingTop: "1.5rem",
                borderTop: `1px solid ${C.surfaceContainer}`,
              }}
            >
              <span style={{ fontSize: "0.75rem", color: C.onSurfaceVariant }}>
                Showing Page 1 of 12 • Total 480 Cleared Theses
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  style={{
                    padding: "0.375rem 0.75rem",
                    border: `1px solid ${C.surfaceContainerHigh}`,
                    borderRadius: "0.25rem",
                    fontSize: "0.75rem",
                    color: C.outline,
                    background: "none",
                    cursor: "not-allowed",
                    opacity: 0.6,
                  }}
                >
                  Previous
                </button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    padding: "0.375rem 0.75rem",
                    background: C.primary,
                    color: C.onPrimary,
                    borderRadius: "0.25rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  1
                </motion.button>
                {["2", "3"].map((n) => (
                  <motion.button
                    key={n}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      padding: "0.375rem 0.75rem",
                      fontSize: "0.75rem",
                      color: C.onSurface,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {n}
                  </motion.button>
                ))}
                <motion.button
                  whileHover={{ scale: 1.05, x: 2 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: "0.375rem 0.75rem",
                    border: `1px solid ${C.surfaceContainerHigh}`,
                    borderRadius: "0.25rem",
                    fontSize: "0.75rem",
                    color: C.primary,
                    fontWeight: 600,
                    background: "none",
                    cursor: "pointer",
                  }}
                >
                  Next
                </motion.button>
                <motion.a
                  href="#archived-titles"
                  whileHover={{ x: 4 }}
                  style={{
                    marginLeft: "0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: C.secondary,
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  View All Archived Works →
                </motion.a>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* ===================== MODAL ===================== */}
        <AnimatePresence>
          {modal.open && (
            <motion.div
              key="abstract-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) =>
                e.target === e.currentTarget &&
                setModal({ open: false, title: "", body: "" })
              }
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 50,
                background: "rgba(33,49,69,0.6)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 30 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: C.surfaceContainerLowest,
                  maxWidth: "36rem",
                  width: "100%",
                  borderRadius: "1rem",
                  padding: "1.75rem",
                  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                  border: `1px solid ${C.surfaceContainerHigh}`,
                  position: "relative",
                }}
              >
                <motion.button
                  onClick={() => setModal({ open: false, title: "", body: "" })}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    position: "absolute",
                    top: "1.25rem",
                    right: "1.25rem",
                    color: C.outline,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.25rem",
                    borderRadius: "0.5rem",
                  }}
                >
                  <span style={iconFont}>close</span>
                </motion.button>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: C.secondary,
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ ...iconFont, fontSize: "0.875rem" }}>article</span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Executive Abstract
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: fontSerif,
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: C.primary,
                    marginBottom: "0.75rem",
                    lineHeight: 1.375,
                    marginTop: 0,
                  }}
                >
                  {modal.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: C.onSurfaceVariant,
                    lineHeight: 1.625,
                    marginBottom: "1.5rem",
                    background: C.surfaceContainerLow,
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    margin: "0 0 1.5rem 0",
                  }}
                >
                  {modal.body}
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <motion.button
                    onClick={() => setModal({ open: false, title: "", body: "" })}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: "0.5rem 1rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: C.onSurfaceVariant,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      alert("Downloading authenticated PDF repository bundle...");
                      setModal({ open: false, title: "", body: "" });
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: C.primary,
                      color: C.onPrimary,
                      padding: "0.5rem 1rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                    }}
                  >
                    <span style={{ ...iconFont, fontSize: "0.875rem" }}>file_download</span>
                    <span>Download Certified Copy</span>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===================== FOOTER ===================== */}
        <motion.footer
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            marginTop: "auto",
            background: C.primary,
            color: C.onPrimary,
            borderTop: `1px solid ${C.primaryContainer}`,
          }}
        >
          <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "4rem 1rem" }}>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bipsu-footer-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "3rem",
                paddingBottom: "3rem",
                borderBottom: "1px solid rgba(229,238,255,0.2)",
              }}
            >
              <motion.div
                variants={fadeUp}
                style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  style={{
                    background: C.surfaceContainerLowest,
                    display: "inline-block",
                    padding: "0.5rem",
                    borderRadius: "0.75rem",
                    width: "fit-content",
                  }}
                >
                  <img
                    alt="BiPSU Logo"
                    style={{ height: "2.5rem", width: "auto", objectFit: "contain" }}
                    src={logo}
                  />
                </motion.div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: C.surfaceContainer,
                    lineHeight: 1.625,
                    maxWidth: "24rem",
                    margin: 0,
                  }}
                >
                  Biliran Province State University Mentoring Hub is the institutional
                  capstone and thesis lifecycle registry, supporting undergraduate, graduate,
                  and doctoral scholarship.
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.75rem",
                    color: C.secondaryFixed,
                  }}
                >
                  <span style={{ ...iconFont, fontSize: "0.875rem" }}>verified</span>
                  <span>ISO 9001:2015 Institutional Compliance</span>
                </div>
              </motion.div>

              <motion.div
                variants={fadeUp}
                style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
              >
                <h4
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: C.secondaryFixed,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    margin: 0,
                  }}
                >
                  Institutional Address
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    fontSize: "0.75rem",
                    color: C.surfaceContainer,
                  }}
                >
                  <p style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", margin: 0 }}>
                    <span
                      style={{
                        ...iconFont,
                        color: C.secondaryFixed,
                        fontSize: "1rem",
                        flexShrink: 0,
                        marginTop: "0.125rem",
                      }}
                    >
                      location_on
                    </span>
                    <span>
                      Biliran Province State University (BiPSU Main Campus)
                      <br />
                      P.I. Garcia Street, Naval, Biliran 6560, Philippines
                    </span>
                  </p>
                  <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                    <span
                      style={{
                        ...iconFont,
                        color: C.secondaryFixed,
                        fontSize: "1rem",
                        flexShrink: 0,
                      }}
                    >
                      call
                    </span>
                    <span>(053) 500-9045 / Trunkline 108</span>
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={fadeUp}
                style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
              >
                <h4
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: C.secondaryFixed,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    margin: 0,
                  }}
                >
                  Research Office
                </h4>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    fontSize: "0.75rem",
                    color: C.surfaceContainer,
                  }}
                >
                  <li>
                    <motion.a
                      href="mailto:research.innovation@bipsu.edu.ph"
                      whileHover={{ x: 4 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        color: "inherit",
                        textDecoration: "none",
                      }}
                    >
                      <span style={{ ...iconFont, color: C.secondaryFixed, fontSize: "1rem" }}>
                        mail
                      </span>
                      <span>research.innovation@bipsu.edu.ph</span>
                    </motion.a>
                  </li>
                  <li>
                    <motion.a
                      href="mailto:ordi@bipsu.edu.ph"
                      whileHover={{ x: 4 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        color: "inherit",
                        textDecoration: "none",
                      }}
                    >
                      <span style={{ ...iconFont, color: C.secondaryFixed, fontSize: "1rem" }}>
                        alternate_email
                      </span>
                      <span>ordi@bipsu.edu.ph</span>
                    </motion.a>
                  </li>
                  <li>
                    <motion.a
                      href="#archived-titles"
                      whileHover={{ x: 4 }}
                      style={{ color: "inherit", textDecoration: "none", display: "block" }}
                    >
                      KTTO Intellectual Property Office
                    </motion.a>
                  </li>
                </ul>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              style={{
                paddingTop: "1.5rem",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                fontSize: "0.75rem",
                color: "rgba(229,238,255,0.7)",
              }}
            >
              <p style={{ margin: 0 }}>
                © 2025 Biliran Province State University. All Rights Reserved. BiPSU
                Mentoring Hub Portal.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                {["Academic Freedom", "Data Privacy", "Research Manual"].map((link) => (
                  <motion.a
                    key={link}
                    href="#"
                    whileHover={{ y: -2, color: C.secondaryFixed }}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    {link}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.footer>
      </motion.div>
    </>
  );
}