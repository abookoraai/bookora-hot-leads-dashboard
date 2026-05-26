import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import "./App.css";
import bookoraLogo from "./assets/bookora-prospector-logo.png";

const sampleLeads = [
  {
    id: "sample-1",
    businessName: "Glow Aesthetics Med Spa",
    phone: "(305) 555-0198",
    website: "https://glowaesthetics.com",
    city: "Miami",
    county: "Miami-Dade",
    state: "FL",
    zipCode: "33101",
    googleRating: 4.7,
    reviewCount: 128,
    serviceType: "Med Spa",
    locationType: "Individual",
    manusNotes:
      "Strong review count, appointment-based services, and likely enough demand to benefit from better missed-call and follow-up automation.",
    mctbStatus: "No MCTB",
    status: "Decision Maker",
    callerNotes:
      "Spoke with front desk, then manager. Very interested in automating missed call text back. Booked demo for May 10 at 11:00 AM.",
    lastContacted: "May 8, 10:15 AM",
    followUpDate: "2026-05-10T11:00",
    source: "Google Maps",
    tags: ["Botox", "Laser", "Injectables"],
    activityHistory: [
      {
        id: "a1",
        action: "Called",
        note: "Spoke with front desk",
        timestamp: "May 8, 10:15 AM",
      },
      {
        id: "a2",
        action: "Decision Maker",
        note: "Spoke with manager",
        timestamp: "May 8, 10:18 AM",
      },
      {
        id: "a3",
        action: "Booked",
        note: "Demo booked for May 10 at 11:00 AM",
        timestamp: "May 8, 10:20 AM",
      },
    ],
  },
  {
    id: "sample-2",
    businessName: "Luxe Skin & Laser",
    phone: "(954) 555-0142",
    website: "https://luxeskinlaser.com",
    city: "Fort Lauderdale",
    county: "Broward",
    state: "FL",
    zipCode: "33301",
    googleRating: 4.6,
    reviewCount: 93,
    serviceType: "Med Spa",
    locationType: "Individual",
    manusNotes:
      "Good local med spa prospect with strong appointment-driven services and likely lead volume.",
    mctbStatus: "No MCTB",
    status: "Booked",
    callerNotes: "Manager asked for a quick demo tomorrow.",
    lastContacted: "May 8, 11:02 AM",
    followUpDate: "",
    source: "Google Maps",
    tags: ["Laser", "Facials"],
    activityHistory: [],
  },
  {
    id: "sample-3",
    businessName: "Bella Med Spa",
    phone: "(561) 555-0211",
    website: "https://bellamedspa.com",
    city: "Boca Raton",
    county: "Palm Beach",
    state: "FL",
    zipCode: "33432",
    googleRating: 4.4,
    reviewCount: 76,
    serviceType: "Med Spa",
    locationType: "Individual",
    manusNotes: "Solid reviews. Needs verification for missed-call text back.",
    mctbStatus: "Unknown",
    status: "Called",
    callerNotes: "",
    lastContacted: "May 8, 9:42 AM",
    followUpDate: "",
    source: "Google Maps",
    tags: ["Botox"],
    activityHistory: [],
  },
  {
    id: "sample-4",
    businessName: "Rejuvenate Medical Spa",
    phone: "(786) 555-0387",
    website: "https://rejuvenatemedspa.com",
    city: "Miami",
    county: "Miami-Dade",
    state: "FL",
    zipCode: "33130",
    googleRating: 4.8,
    reviewCount: 156,
    serviceType: "Med Spa",
    locationType: "Individual",
    manusNotes: "High quality prospect but appears to have a missed-call text back.",
    mctbStatus: "Has MCTB",
    status: "Follow Up",
    callerNotes: "Ask about no-show and unbooked lead follow-up.",
    lastContacted: "May 7, 4:30 PM",
    followUpDate: "",
    source: "Google Maps",
    tags: ["Injectables"],
    activityHistory: [],
  },
  {
    id: "sample-5",
    businessName: "Skin Solutions MD",
    phone: "(954) 555-0177",
    website: "https://skinsolutionsmd.com",
    city: "Weston",
    county: "Broward",
    state: "FL",
    zipCode: "33326",
    googleRating: 4.5,
    reviewCount: 88,
    serviceType: "Med Spa",
    locationType: "Individual",
    manusNotes: "Good prospect. New lead.",
    mctbStatus: "No MCTB",
    status: "New",
    callerNotes: "",
    lastContacted: "",
    followUpDate: "",
    source: "Google Maps",
    tags: ["Facials"],
    activityHistory: [],
  },
  {
    id: "sample-6",
    businessName: "Aesthetic Body & Face",
    phone: "(305) 555-0220",
    website: "https://abfmedspa.com",
    city: "Coral Gables",
    county: "Miami-Dade",
    state: "FL",
    zipCode: "33134",
    googleRating: 4.3,
    reviewCount: 64,
    serviceType: "Med Spa",
    locationType: "Individual",
    manusNotes: "Needs retest. Call again after hours to confirm.",
    mctbStatus: "Needs Retest",
    status: "New",
    callerNotes: "",
    lastContacted: "",
    followUpDate: "",
    source: "Google Maps",
    tags: ["Body Contouring"],
    activityHistory: [],
  },
];

const emptyStats = {
  calls: 0,
  decisionMakers: 0,
  bookings: 0,
  followUps: 0,
  closes: 0,
  notes: 0,
};

const statusOptions = [
  "New",
  "Called",
  "Decision Maker",
  "Booked",
  "Follow Up",
  "Closed",
  "Not Interested",
  "No Answer",
  "Bad Number",
  "Skipped",
];

const mctbOptions = ["Unknown", "No MCTB", "Has MCTB", "Needs Retest"];

function readStoredJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeCsvLead(lead, index) {
  const get = (...keys) => {
    for (const key of keys) {
      if (lead[key] !== undefined && lead[key] !== null && lead[key] !== "") {
        return lead[key];
      }
    }
    return "";
  };

  const servicesOffered = get(
    "services_offered",
    "Services Offered",
    "servicesOffered",
    "serviceType",
    "Service Type",
    "Category"
  );

  const notes = get(
    "notes",
    "Notes",
    "manusNotes",
    "Manus Notes",
    "enrichment_notes",
    "Enrichment Notes"
  );

  return {
    id: get("id", "ID") || `${Date.now()}-${index}`,

    businessName: get(
      "business_name",
      "Business Name",
      "businessName",
      "business name",
      "name",
      "Name"
    ),

    phone: get(
      "phone",
      "Phone",
      "Phone Number",
      "phoneNumber",
      "phone_number"
    ),

    website: get("website", "Website", "url", "URL"),
    city: get("city", "City"),
    county: get("county", "County"),
    state: get("state", "State") || "FL",
    zipCode: get("zipCode", "Zip", "ZIP", "Zip Code", "zip_code"),

    googleRating:
      get("google_rating", "googleRating", "Google Rating", "rating", "Rating") || "0",

    reviewCount:
      get(
        "google_review_count",
        "reviewCount",
        "Review Count",
        "reviews",
        "Reviews"
      ) || "0",

    serviceType: servicesOffered || "Med Spa",
    locationType: get("locationType", "Location Type", "location_type") || "Individual",

    manusNotes: notes,
    callerNotes: get("callerNotes", "Caller Notes", "caller_notes") || "",

    mctbStatus:
      get("mctb_status", "mctbStatus", "MCTB Status") || "Unknown",

    status:
      get("lead_status", "status", "Lead Status", "Status") || "New",

    lastContacted:
      get("last_contacted", "lastContacted", "Last Contacted") || "",

    followUpDate:
      get("follow_up_date", "followUpDate", "Follow Up Date") || "",

    source: get("source", "Source") || "Google Maps",

    tags: String(get("tags", "Tags", "services_offered", "Services Offered") || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),

    activityHistory: [],
  };
}

function calculateLeadScore(lead) {
  let score = 0;

  const rating = parseFloat(lead.googleRating || 0);
  const reviews = parseInt(lead.reviewCount || 0);
  const serviceType = String(lead.serviceType || "").toLowerCase();
  const locationType = String(lead.locationType || "").toLowerCase();
  const mctbStatus = String(lead.mctbStatus || "").toLowerCase();
  const hasPhone = Boolean(lead.phone);
  const hasWebsite = Boolean(lead.website);

  if (mctbStatus === "no mctb") score += 30;
  else if (mctbStatus === "needs retest") score += 10;
  else if (mctbStatus === "has mctb") score -= 20;

  if (locationType === "individual") score += 20;
  else if (locationType === "chain") score -= 35;
  else score += 5;

  if (reviews >= 300) score += 25;
  else if (reviews >= 150) score += 20;
  else if (reviews >= 75) score += 15;
  else if (reviews >= 40) score += 10;
  else if (reviews >= 20) score += 5;

  if (rating >= 4.7) score += 15;
  else if (rating >= 4.4) score += 12;
  else if (rating >= 4.0) score += 6;

  if (
    serviceType.includes("med spa") ||
    serviceType.includes("aesthetic") ||
    serviceType.includes("botox") ||
    serviceType.includes("injectable") ||
    serviceType.includes("laser") ||
    serviceType.includes("facial") ||
    serviceType.includes("weight loss") ||
    serviceType.includes("body contouring")
  ) {
    score += 15;
  }

  if (hasPhone) score += 8;
  if (hasWebsite) score += 7;

  return Math.max(0, Math.min(score, 100));
}

function getLeadPriority(score) {
  if (score >= 80) return "Hot";
  if (score >= 60) return "Warm";
  if (score >= 40) return "Maybe";
  return "Skip";
}

function getMctbClass(status) {
  if (status === "No MCTB") return "noMctb";
  if (status === "Has MCTB") return "hasMctb";
  if (status === "Needs Retest") return "needsRetest";
  return "unknownMctb";
}

function getStatusClass(status) {
  if (status === "Booked") return "booked";
  if (status === "Closed") return "closed";
  if (status === "Follow Up") return "follow";
  if (status === "Decision Maker") return "decision";
  if (status === "Skipped" || status === "Not Interested") return "skipped";
  if (status === "Called") return "called";
  return "new";
}

function formatNow() {
  return new Date().toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFollowUpDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function getWeekRangeLabel(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const monday = new Date(current);
  monday.setDate(current.getDate() + mondayOffset);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startMonth = monday.toLocaleDateString([], { month: "short" });
  const endMonth = sunday.toLocaleDateString([], { month: "short" });
  const startDay = monday.getDate();
  const endDay = sunday.getDate();
  const year = sunday.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }

  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

function getDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatCalendarDate(value) {
  if (!value) return "No date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatCalendarTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function Stars({ rating }) {
  const rounded = Math.round(Number(rating || 0));
  return (
    <span className="stars" aria-label={`${rating} stars`}>
      {"★".repeat(Math.min(5, rounded))}
      {"☆".repeat(Math.max(0, 5 - rounded))}
    </span>
  );
}

function MetricCard({ label, value, goal, icon, tone, onClick, active }) {
  const percent = goal ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      className={`metricCard ${tone || ""} ${onClick ? "clickableMetric" : ""} ${active ? "activeMetric" : ""}`}
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      <div className="metricTop">
        <span>{icon}</span>
        <p>{label}</p>
      </div>
      <h3>
        {value}
        {goal ? <span> / {goal}</span> : null}
      </h3>
      {goal ? (
        <>
          <div className="progressTrack">
            <div className="progressBar" style={{ width: `${percent}%` }} />
          </div>
          <small>{percent}%</small>
        </>
      ) : (
        <small>—</small>
      )}
    </Tag>
  );
}

export default function App() {
  const [leads, setLeads] = useState(() =>
    readStoredJson("bookoraLeads", sampleLeads)
  );

  const [dailyStats, setDailyStats] = useState(() =>
    readStoredJson("bookoraDailyStats", {
      calls: 18,
      decisionMakers: 6,
      bookings: 1,
      followUps: 2,
      closes: 0,
      notes: 3,
    })
  );

  const [weeklyStats, setWeeklyStats] = useState(() =>
    readStoredJson("bookoraWeeklyStats", {
      calls: 118,
      decisionMakers: 0,
      bookings: 4,
      followUps: 0,
      closes: 1,
      notes: 0,
    })
  );

  const weekRangeLabel = getWeekRangeLabel();

  const [selectedLeadId, setSelectedLeadId] = useState(() => {
    const savedLeads = readStoredJson("bookoraLeads", sampleLeads);
    return savedLeads[0]?.id || sampleLeads[0].id;
  });

  const [activeView, setActiveView] = useState("Dashboard");
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem("bookoraThemeMode") || "dark");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(getDateKey());
  const [mctbFilter, setMctbFilter] = useState("All");
  const [leadStatusFilter, setLeadStatusFilter] = useState("All");
  const [activityFilter, setActivityFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [showScript, setShowScript] = useState(false);
  const [showPasteCsv, setShowPasteCsv] = useState(false);
  const [pastedCsv, setPastedCsv] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  useEffect(() => {
    localStorage.setItem("bookoraLeads", JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem("bookoraDailyStats", JSON.stringify(dailyStats));
  }, [dailyStats]);

  useEffect(() => {
    localStorage.setItem("bookoraWeeklyStats", JSON.stringify(weeklyStats));
  }, [weeklyStats]);

  useEffect(() => {
    localStorage.setItem("bookoraThemeMode", themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (!leads.find((lead) => lead.id === selectedLeadId)) {
      setSelectedLeadId(leads[0]?.id || "");
    }
  }, [leads, selectedLeadId]);

  function importLeadsFromCsvText(csvText) {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cleanedLeads = results.data
          .map((lead, index) => normalizeCsvLead(lead, index))
          .filter((lead) => lead.businessName && lead.phone);

        setLeads((currentLeads) => {
          const existingPhones = new Set(
            currentLeads.map((lead) => String(lead.phone).replace(/\D/g, ""))
          );

          const newLeadsOnly = cleanedLeads.filter((lead) => {
            const cleanPhone = String(lead.phone).replace(/\D/g, "");
            return !existingPhones.has(cleanPhone);
          });

          return [...currentLeads, ...newLeadsOnly];
        });
      },
    });
  }

  function handleCsvUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (uploadEvent) => {
      importLeadsFromCsvText(uploadEvent.target.result);
      event.target.value = "";
    };

    reader.readAsText(file);
  }

  function updateLead(id, field, value) {
    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        lead.id === id ? { ...lead, [field]: value } : lead
      )
    );
  }

  function addLeadHistory(id, action, note = "") {
    setLeads((currentLeads) =>
      currentLeads.map((lead) => {
        if (lead.id !== id) return lead;

        const activity = {
          id: `${Date.now()}-${Math.random()}`,
          action,
          note,
          timestamp: formatNow(),
        };

        return {
          ...lead,
          activityHistory: [activity, ...(lead.activityHistory || [])].slice(0, 8),
          lastContacted: action === "Called" ? activity.timestamp : lead.lastContacted,
        };
      })
    );
  }

  function increaseStats(field) {
    setDailyStats((current) => ({
      ...current,
      [field]: Number(current[field] || 0) + 1,
    }));

    setWeeklyStats((current) => ({
      ...current,
      [field]: Number(current[field] || 0) + 1,
    }));
  }

  function trackAction(id, action) {
    const actionMap = {
      Called: { stat: "calls", status: "Called", note: "Call attempt logged" },
      "Decision Maker": {
        stat: "decisionMakers",
        status: "Decision Maker",
        note: "Decision-maker conversation logged",
      },
      Booked: { stat: "bookings", status: "Booked", note: "Demo or follow-up booked" },
      "Follow Up": { stat: "followUps", status: "Follow Up", note: "Follow-up needed" },
      Closed: { stat: "closes", status: "Closed", note: "Client closed" },
      Skipped: { stat: null, status: "Skipped", note: "Lead skipped" },
    };

    const next = actionMap[action];
    if (!next) return;

    if (next.stat) increaseStats(next.stat);

    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        lead.id === id
          ? {
              ...lead,
              status: next.status,
              lastContacted: action === "Called" ? formatNow() : lead.lastContacted,
            }
          : lead
      )
    );

    addLeadHistory(id, action, next.note);
  }

  function updateCallerNotes(id, value) {
    updateLead(id, "callerNotes", value);
  }

  function saveCallerNote(id) {
    const lead = leads.find((item) => item.id === id);
    const note = String(lead?.callerNotes || "").trim();

    if (!note) {
      alert("Type a note before saving it to activity history.");
      return;
    }

    increaseStats("notes");
    addLeadHistory(id, "Note Saved", note);
  }

  function deleteLead(id) {
    setLeads((currentLeads) => currentLeads.filter((lead) => lead.id !== id));
  }

  function clearAllLeads() {
    const confirmed = window.confirm(
      "Are you sure you want to clear all leads from this dashboard?"
    );

    if (confirmed) setLeads([]);
  }

  function resetSampleLeads() {
    setLeads(sampleLeads);
    setSelectedLeadId(sampleLeads[0].id);
  }

  function resetToday() {
    const confirmed = window.confirm("Reset today's scoreboard to zero?");
    if (confirmed) setDailyStats(emptyStats);
  }

  function resetWeek() {
    const confirmed = window.confirm("Reset this week's scoreboard to zero?");
    if (confirmed) setWeeklyStats(emptyStats);
  }

  function clearFilters() {
    setMctbFilter("All");
    setLeadStatusFilter("All");
    setActivityFilter("All");
    setSearchTerm("");
    setCityFilter("");
    setRatingFilter("");
  }

  function showActivityLeads(type) {
    setActivityFilter(type);
    setMctbFilter("All");
    setLeadStatusFilter("All");
    setActiveView("Dashboard");
  }

  function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }

  function exportLeadsCsv() {
    const headers = [
      "Business Name",
      "Phone",
      "Website",
      "City",
      "State",
      "Google Rating",
      "Review Count",
      "MCTB Status",
      "Lead Status",
      "Last Contacted",
      "Follow Up Date",
      "Caller Notes",
    ];

    const rows = leads.map((lead) => [
      lead.businessName,
      lead.phone,
      lead.website,
      lead.city,
      lead.state,
      lead.googleRating,
      lead.reviewCount,
      lead.mctbStatus,
      lead.status,
      lead.lastContacted,
      lead.followUpDate,
      String(lead.callerNotes || "").replace(/\n/g, " "),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    downloadTextFile("bookora-leads-export.csv", csv);
  }

  function saveDailyReport() {
    const report = [
      ["Metric", "Today", "Weekly"],
      ["Calls", dailyStats.calls, weeklyStats.calls],
      ["Decision Makers", dailyStats.decisionMakers, weeklyStats.decisionMakers],
      ["Bookings", dailyStats.bookings, weeklyStats.bookings],
      ["Follow Ups", dailyStats.followUps, weeklyStats.followUps],
      ["Closes", dailyStats.closes, weeklyStats.closes],
      ["Notes", dailyStats.notes, weeklyStats.notes],
      [],
      ["Lead Summary", ""],
      ["Total Leads", summary.total],
      ["No MCTB", summary.noMctb],
      ["Has MCTB", summary.hasMctb],
      ["Unknown", summary.unknown],
      ["Needs Retest", summary.needsRetest],
      ["Booked", summary.booked],
      ["Closed", summary.closed],
    ];

    const csv = report
      .map((row) =>
        row
          .map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    downloadTextFile("bookora-daily-report.csv", csv);
  }

  const scoredLeads = useMemo(() => {
    return leads
      .map((lead) => {
        const score = calculateLeadScore(lead);
        const priority = getLeadPriority(score);

        return { ...lead, leadScore: score, priority };
      })
      .filter((lead) => {
        const matchesMctb =
          mctbFilter === "All" || String(lead.mctbStatus || "Unknown") === mctbFilter;

        const matchesLeadStatus =
          leadStatusFilter === "All" || String(lead.status || "New") === leadStatusFilter;

        const activityActions = (lead.activityHistory || []).map((activity) => activity.action);
        const matchesActivity =
          activityFilter === "All" ||
          (activityFilter === "Called" &&
            (String(lead.status || "") === "Called" ||
              Boolean(lead.lastContacted) ||
              activityActions.includes("Called"))) ||
          (activityFilter === "Decision Maker" &&
            (String(lead.status || "") === "Decision Maker" ||
              activityActions.includes("Decision Maker"))) ||
          (activityFilter === "Booked" &&
            (String(lead.status || "") === "Booked" || activityActions.includes("Booked"))) ||
          (activityFilter === "Follow Up" &&
            (String(lead.status || "") === "Follow Up" || activityActions.includes("Follow Up"))) ||
          (activityFilter === "Closed" &&
            (String(lead.status || "") === "Closed" || activityActions.includes("Closed"))) ||
          (activityFilter === "Notes" && Boolean(String(lead.callerNotes || "").trim()));

        const search = searchTerm.toLowerCase();

        const matchesSearch =
          String(lead.businessName || "").toLowerCase().includes(search) ||
          String(lead.serviceType || "").toLowerCase().includes(search) ||
          String(lead.phone || "").toLowerCase().includes(search) ||
          String(lead.city || "").toLowerCase().includes(search) ||
          String(lead.county || "").toLowerCase().includes(search);

        const matchesCity =
          !cityFilter ||
          String(lead.city || "").toLowerCase().includes(cityFilter.toLowerCase());

        const matchesRating =
          !ratingFilter || Number(lead.googleRating || 0) >= Number(ratingFilter);

        const isNotChain = String(lead.locationType || "").toLowerCase() !== "chain";

        return (
          matchesMctb &&
          matchesLeadStatus &&
          matchesActivity &&
          matchesSearch &&
          matchesCity &&
          matchesRating &&
          isNotChain
        );
      })
      .sort((a, b) => b.leadScore - a.leadScore);
  }, [leads, mctbFilter, leadStatusFilter, activityFilter, searchTerm, cityFilter, ratingFilter]);

  const selectedLead =
    leads.find((lead) => lead.id === selectedLeadId) || scoredLeads[0] || leads[0];

  const summary = useMemo(() => {
    return {
      total: leads.length,
      noMctb: leads.filter((lead) => lead.mctbStatus === "No MCTB").length,
      hasMctb: leads.filter((lead) => lead.mctbStatus === "Has MCTB").length,
      unknown: leads.filter((lead) => !lead.mctbStatus || lead.mctbStatus === "Unknown").length,
      needsRetest: leads.filter((lead) => lead.mctbStatus === "Needs Retest").length,
      booked: leads.filter((lead) => lead.status === "Booked").length,
      closed: leads.filter((lead) => lead.status === "Closed").length,
      followUp: leads.filter((lead) => lead.status === "Follow Up").length,
      skipped: leads.filter((lead) => lead.status === "Skipped").length,
    };
  }, [leads]);

  const followUpLeads = useMemo(() => {
    return leads
      .filter((lead) => Boolean(lead.followUpDate))
      .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));
  }, [leads]);

  const selectedDateFollowUps = useMemo(() => {
    return followUpLeads.filter((lead) => getDateKey(lead.followUpDate) === selectedCalendarDate);
  }, [followUpLeads, selectedCalendarDate]);

  const todayCallList = useMemo(() => {
    return leads
      .map((lead) => ({
        ...lead,
        leadScore: calculateLeadScore(lead),
      }))
      .filter((lead) => {
        const status = String(lead.status || "New");
        return (
          status !== "Closed" &&
          status !== "Skipped" &&
          status !== "Not Interested" &&
          status !== "Bad Number"
        );
      })
      .sort((a, b) => {
        const aNoMctb = a.mctbStatus === "No MCTB" ? 1 : 0;
        const bNoMctb = b.mctbStatus === "No MCTB" ? 1 : 0;

        if (aNoMctb !== bNoMctb) return bNoMctb - aNoMctb;

        const aFollowUpToday = getDateKey(a.followUpDate) === getDateKey() ? 1 : 0;
        const bFollowUpToday = getDateKey(b.followUpDate) === getDateKey() ? 1 : 0;

        if (aFollowUpToday !== bFollowUpToday) return bFollowUpToday - aFollowUpToday;

        return b.leadScore - a.leadScore;
      })
      .slice(0, 50);
  }, [leads]);

  const upcomingFollowUpDates = useMemo(() => {
    const dateMap = new Map();

    followUpLeads.forEach((lead) => {
      const key = getDateKey(lead.followUpDate);
      if (!key) return;
      dateMap.set(key, (dateMap.get(key) || 0) + 1);
    });

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(0, 14);
  }, [followUpLeads]);

  const reportMetrics = useMemo(() => {
    const calls = Number(weeklyStats.calls || 0);
    const decisionMakers = Number(weeklyStats.decisionMakers || 0);
    const bookings = Number(weeklyStats.bookings || 0);
    const closes = Number(weeklyStats.closes || 0);

    return {
      callProgress: Math.min(100, Math.round((calls / 250) * 100)),
      bookingProgress: Math.min(100, Math.round((bookings / 10) * 100)),
      closeProgress: Math.min(100, Math.round((closes / 2) * 100)),
      callsToBooking: bookings ? Math.round(calls / bookings) : 0,
      bookingToCloseRate: bookings ? Math.round((closes / bookings) * 100) : 0,
      decisionMakerRate: calls ? Math.round((decisionMakers / calls) * 100) : 0,
      closeRateFromCalls: calls ? ((closes / calls) * 100).toFixed(1) : "0.0",
      remainingCalls: Math.max(0, 250 - calls),
      remainingBookings: Math.max(0, 10 - bookings),
      remainingCloses: Math.max(0, 2 - closes),
    };
  }, [weeklyStats]);

  const hotNoMctbLeads = useMemo(() => {
    return leads
      .map((lead) => ({
        ...lead,
        leadScore: calculateLeadScore(lead),
      }))
      .filter((lead) => lead.mctbStatus === "No MCTB" && lead.status !== "Closed" && lead.status !== "Skipped")
      .sort((a, b) => b.leadScore - a.leadScore)
      .slice(0, 5);
  }, [leads]);

  const filterButtons = [
    {
      label: "All",
      count: summary.total,
      type: "all",
      onClick: () => {
        setMctbFilter("All");
        setLeadStatusFilter("All");
        setActivityFilter("All");
      },
      active: mctbFilter === "All" && leadStatusFilter === "All" && activityFilter === "All",
    },
    {
      label: "No MCTB",
      count: summary.noMctb,
      type: "noMctb",
      onClick: () => {
        setMctbFilter("No MCTB");
        setLeadStatusFilter("All");
        setActivityFilter("All");
      },
      active: mctbFilter === "No MCTB" && leadStatusFilter === "All" && activityFilter === "All",
    },
    {
      label: "Has MCTB",
      count: summary.hasMctb,
      type: "hasMctb",
      onClick: () => {
        setMctbFilter("Has MCTB");
        setLeadStatusFilter("All");
        setActivityFilter("All");
      },
      active: mctbFilter === "Has MCTB" && leadStatusFilter === "All" && activityFilter === "All",
    },
    {
      label: "Unknown",
      count: summary.unknown,
      type: "unknown",
      onClick: () => {
        setMctbFilter("Unknown");
        setLeadStatusFilter("All");
        setActivityFilter("All");
      },
      active: mctbFilter === "Unknown" && leadStatusFilter === "All" && activityFilter === "All",
    },
    {
      label: "Needs Retest",
      count: summary.needsRetest,
      type: "needsRetest",
      onClick: () => {
        setMctbFilter("Needs Retest");
        setLeadStatusFilter("All");
        setActivityFilter("All");
      },
      active: mctbFilter === "Needs Retest" && leadStatusFilter === "All" && activityFilter === "All",
    },
    {
      label: "Follow-Up",
      count: summary.followUp,
      type: "follow",
      onClick: () => {
        setLeadStatusFilter("Follow Up");
        setMctbFilter("All");
        setActivityFilter("All");
      },
      active: leadStatusFilter === "Follow Up" && mctbFilter === "All" && activityFilter === "All",
    },
    {
      label: "Booked",
      count: summary.booked,
      type: "booked",
      onClick: () => {
        setLeadStatusFilter("Booked");
        setMctbFilter("All");
        setActivityFilter("All");
      },
      active: leadStatusFilter === "Booked" && mctbFilter === "All" && activityFilter === "All",
    },
    {
      label: "Closed",
      count: summary.closed,
      type: "closed",
      onClick: () => {
        setLeadStatusFilter("Closed");
        setMctbFilter("All");
        setActivityFilter("All");
      },
      active: leadStatusFilter === "Closed" && mctbFilter === "All" && activityFilter === "All",
    },
    {
      label: "Skipped",
      count: summary.skipped,
      type: "skipped",
      onClick: () => {
        setLeadStatusFilter("Skipped");
        setMctbFilter("All");
        setActivityFilter("All");
      },
      active: leadStatusFilter === "Skipped" && mctbFilter === "All" && activityFilter === "All",
    },
  ];

  const leadsTabFilterButtons = filterButtons.filter((button) =>
    ["All", "No MCTB", "Has MCTB", "Unknown", "Follow-Up", "Booked", "Closed", "Skipped"].includes(button.label)
  );

  return (
    <div className={`appShell ${themeMode === "light" ? "lightMode" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <img src={bookoraLogo} alt="Bookora Prospector logo" className="brandLogo" />
          <div>
            <h1>Bookora</h1>
            <p>Prospector</p>
          </div>
        </div>

        <nav className="sideNav">
          {[
            ["Dashboard", "▣"],
            ["Leads", "☷"],
            ["Calendar", "▦"],
            ["Reports", "▥"],
            ["Settings", "⚙"],
          ].map(([item, icon]) => (
            <button
              key={item}
              className={activeView === item ? "active" : ""}
              onClick={() => {
                setActiveView(item);
                if (item === "Import CSV") setShowPasteCsv(true);
              }}
            >
              <span>{icon}</span>
              {item}
            </button>
          ))}
        </nav>

        <div className="quickActions">
          <h3>Quick Actions</h3>
          <label className="sideImport">
            ⇧ Import CSV
            <input type="file" accept=".csv" onChange={handleCsvUpload} />
          </label>
          <button onClick={resetToday}>↻ Reset Today</button>
          <button className="saveButton" onClick={saveDailyReport}>
            ⇩ Save Daily Report
          </button>
        </div>
      </aside>

      <main className="dashboard">
        <header className="topbar">
          <button className="hamburger" onClick={() => setShowMobileMenu(true)}>☰</button>
          <div>
            <p className="mobileBrand"><img src={bookoraLogo} alt="" /> Bookora <span>Prospector</span></p>
            <h2>{activeView === "Leads" ? "LEADS" : activeView === "Calendar" ? "CALENDAR" : activeView === "Reports" ? "REPORTS" : activeView === "Settings" ? "SETTINGS" : "DASHBOARD"}</h2>
            <p>{activeView === "Leads" ? "Search and filter your prospect list." : activeView === "Calendar" ? "Plan follow-ups and today's call list." : activeView === "Reports" ? "Review performance and next actions." : activeView === "Settings" ? "Manage dashboard preferences." : "Track your calls. Close more clients."}</p>
          </div>
          <div className="datePill">
            <span>May 8, 2026</span>
            <span>▣</span>
          </div>
        </header>

        {activeView !== "Leads" && activeView !== "Calendar" && activeView !== "Settings" && (
        <section className="scoreboardRow">
          <div className="scoreboardCard todayCard">
            <div className="scoreHeader">
              <h3>▣ TODAY'S SCOREBOARD</h3>
              <button onClick={resetToday}>Edit Goals</button>
            </div>
            <div className="metricGrid">
              <MetricCard label="Calls Made" value={dailyStats.calls} goal={50} icon="📞" tone="blue" onClick={() => showActivityLeads("Called")} active={activityFilter === "Called"} />
              <MetricCard label="Decision Maker Conversations" value={dailyStats.decisionMakers} icon="👤" tone="green" onClick={() => showActivityLeads("Decision Maker")} active={activityFilter === "Decision Maker"} />
              <MetricCard label="Bookings" value={dailyStats.bookings} goal={2} icon="📅" tone="purple" onClick={() => showActivityLeads("Booked")} active={activityFilter === "Booked"} />
              <MetricCard label="Follow-Ups" value={dailyStats.followUps} icon="⏰" tone="orange" onClick={() => showActivityLeads("Follow Up")} active={activityFilter === "Follow Up"} />
              <MetricCard label="Closes" value={dailyStats.closes} icon="🏆" tone="yellow" onClick={() => showActivityLeads("Closed")} active={activityFilter === "Closed"} />
              <MetricCard label="Notes" value={dailyStats.notes} icon="🧾" tone="cyan" onClick={() => showActivityLeads("Notes")} active={activityFilter === "Notes"} />
            </div>
          </div>

          <div className="scoreboardCard weeklyCard">
            <div className="scoreHeader">
              <h3>WEEKLY SCOREBOARD <span>({weekRangeLabel})</span></h3>
              <button onClick={resetWeek}>Reset</button>
            </div>
            <div className="metricGrid weeklyMetrics">
              <MetricCard label="Calls" value={weeklyStats.calls} goal={250} icon="📞" tone="blue" />
              <MetricCard label="Bookings" value={weeklyStats.bookings} goal={10} icon="📅" tone="purple" />
              <MetricCard label="Closes" value={weeklyStats.closes} goal={2} icon="🏆" tone="yellow" />
            </div>
          </div>
        </section>
        )}

        {activeView !== "Settings" && activeView !== "Reports" && activeView !== "Calendar" && (
        <section className={`filtersBar ${activeView === "Leads" ? "leadsOnlyFilters" : ""}`}>
          {(activeView === "Leads" ? leadsTabFilterButtons : filterButtons).map((button) => (
            <button
              key={button.label}
              className={`filterPill ${button.type} ${button.active ? "active" : ""}`}
              onClick={button.onClick}
            >
              {button.label} <span>{button.count}</span>
            </button>
          ))}
        </section>
        )}

        {activeView !== "Settings" && activeView !== "Reports" && activeView !== "Calendar" && (
        <section className={`searchRow ${activeView === "Leads" ? "leadsOnlySearch" : ""}`}>
          <div className="searchBox">
            <input
              type="text"
              placeholder="Search by business name, city, phone..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <span>⌕</span>
          </div>

          <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
            <option value="">Filter by City</option>
            {[...new Set(leads.map((lead) => lead.city).filter(Boolean))].sort().map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select value={leadStatusFilter} onChange={(event) => setLeadStatusFilter(event.target.value)}>
            <option value="All">Filter by Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)}>
            <option value="">Filter by Rating</option>
            <option value="4.8">4.8+</option>
            <option value="4.5">4.5+</option>
            <option value="4.0">4.0+</option>
          </select>

          <button className="clearButton" onClick={clearFilters}>☄ Clear Filters</button>
          <button className="clearButton exportButton" onClick={exportLeadsCsv}>⇩ Export CSV</button>
        </section>
        )}

        {activeView === "Calendar" && (
          <section className="calendarPanel">
            <div className="calendarHeader">
              <div>
                <p>Bookora Calendar</p>
                <h2>Follow-Ups & Today's 50 Calls</h2>
              </div>

              <input
                type="date"
                value={selectedCalendarDate}
                onChange={(event) => setSelectedCalendarDate(event.target.value)}
              />
            </div>

            <div className="calendarSummaryGrid">
              <div>
                <span>Selected Date</span>
                <strong>{formatCalendarDate(selectedCalendarDate)}</strong>
              </div>
              <div>
                <span>Follow-Ups</span>
                <strong>{selectedDateFollowUps.length}</strong>
              </div>
              <div>
                <span>Suggested Calls</span>
                <strong>{todayCallList.length} / 50</strong>
              </div>
            </div>

            <div className="calendarGrid">
              <div className="calendarBox">
                <div className="calendarBoxHeader">
                  <h3>Follow-Ups</h3>
                  <span>{formatCalendarDate(selectedCalendarDate)}</span>
                </div>

                {selectedDateFollowUps.length ? (
                  selectedDateFollowUps.map((lead) => (
                    <article key={lead.id} className="calendarLeadCard">
                      <div>
                        <h4>{lead.businessName}</h4>
                        <p>{lead.city}, {lead.state}</p>
                        <small>{formatCalendarTime(lead.followUpDate)}</small>
                      </div>

                      <div className="calendarLeadActions">
                        <span className={`tag ${getMctbClass(lead.mctbStatus)}`}>{lead.mctbStatus || "Unknown"}</span>
                        <a href={`tel:${String(lead.phone).replace(/\D/g, "")}`}>Call</a>
                        <button onClick={() => {
                          setSelectedLeadId(lead.id);
                          setShowMobileDetail(true);
                        }}>
                          Details
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="emptyCalendarState">
                    <h4>No follow-ups scheduled for this date.</h4>
                    <p>Open a lead, set a follow-up date, and it will show here.</p>
                  </div>
                )}

                <div className="upcomingDates">
                  <h4>Upcoming Follow-Up Dates</h4>
                  {upcomingFollowUpDates.length ? (
                    upcomingFollowUpDates.map(([date, count]) => (
                      <button
                        key={date}
                        className={selectedCalendarDate === date ? "active" : ""}
                        onClick={() => setSelectedCalendarDate(date)}
                      >
                        <span>{formatCalendarDate(date)}</span>
                        <strong>{count}</strong>
                      </button>
                    ))
                  ) : (
                    <p>No scheduled follow-ups yet.</p>
                  )}
                </div>
              </div>

              <div className="calendarBox">
                <div className="calendarBoxHeader">
                  <h3>Today's 50 Med Spas To Call</h3>
                  <span>No MCTB leads first</span>
                </div>

                <div className="callList">
                  {todayCallList.map((lead, index) => (
                    <article key={lead.id} className="callListItem">
                      <strong>{index + 1}</strong>

                      <div>
                        <h4>{lead.businessName}</h4>
                        <p>{lead.city}, {lead.state} • {lead.googleRating} ⭐ • {lead.reviewCount} reviews</p>
                        <div className="miniTagRow">
                          <span className={`tag ${getMctbClass(lead.mctbStatus)}`}>{lead.mctbStatus || "Unknown"}</span>
                          <span className={`tag ${getStatusClass(lead.status)}`}>{lead.status || "New"}</span>
                        </div>
                      </div>

                      <div className="callListActions">
                        <a href={`tel:${String(lead.phone).replace(/\D/g, "")}`} onClick={() => trackAction(lead.id, "Called")}>Call</a>
                        <button onClick={() => trackAction(lead.id, "Called")}>Log</button>
                        <button onClick={() => {
                          setSelectedLeadId(lead.id);
                          setShowMobileDetail(true);
                        }}>
                          Open
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeView === "Settings" && (
          <section className="settingsPanel">
            <div className="settingsHeader">
              <div>
                <p>Bookora Settings</p>
                <h2>Dashboard Preferences</h2>
              </div>
              <span>Saved automatically</span>
            </div>

            <div className="settingsGrid">
              <div className="settingsCard">
                <h3>Appearance</h3>
                <p>Switch between dark mode and light mode. Your choice will stay saved on this browser.</p>

                <div className="themeToggleGroup">
                  <button
                    className={themeMode === "dark" ? "selected" : ""}
                    onClick={() => setThemeMode("dark")}
                  >
                    🌙 Dark Mode
                  </button>
                  <button
                    className={themeMode === "light" ? "selected" : ""}
                    onClick={() => setThemeMode("light")}
                  >
                    ☀️ Light Mode
                  </button>
                </div>
              </div>

              <div className="settingsCard">
                <h3>Current Sales Goals</h3>
                <p>These are the operating targets this dashboard is built around.</p>

                <div className="settingsGoalList">
                  <div><span>Daily Calls</span><strong>50</strong></div>
                  <div><span>Daily Bookings</span><strong>1-2</strong></div>
                  <div><span>Weekly Calls</span><strong>250</strong></div>
                  <div><span>Weekly Bookings</span><strong>5-10</strong></div>
                  <div><span>Weekly Closes</span><strong>2</strong></div>
                  <div><span>Monthly Closes</span><strong>8</strong></div>
                </div>
              </div>

              <div className="settingsCard">
                <h3>Data Controls</h3>
                <p>Use these when you want to export your work, reset demo data, or clear the dashboard.</p>

                <div className="settingsActions">
                  <button onClick={exportLeadsCsv}>Export Leads CSV</button>
                  <button onClick={saveDailyReport}>Download Report CSV</button>
                  <button onClick={resetSampleLeads}>Reset Sample Leads</button>
                  <button className="dangerSetting" onClick={clearAllLeads}>Clear All Leads</button>
                </div>
              </div>

              <div className="settingsCard">
                <h3>Recommended Workflow</h3>
                <p>Use this dashboard in this order during your calling blocks.</p>

                <ol className="workflowList">
                  <li>Import enriched leads from Manus.</li>
                  <li>Filter by No MCTB first.</li>
                  <li>Call until you hit 50 attempts or 1-2 bookings.</li>
                  <li>Use notes and follow-up dates on every real conversation.</li>
                  <li>Check Reports at the end of the day.</li>
                </ol>
              </div>
            </div>
          </section>
        )}

        {activeView === "Reports" && (
          <section className="reportsPanel">
            <div className="reportsHeader">
              <div>
                <p>Bookora Performance Report</p>
                <h2>This Week's Sales Scoreboard</h2>
              </div>
              <div className="reportActions">
                <button onClick={saveDailyReport}>Download Report CSV</button>
                <button onClick={exportLeadsCsv}>Export Leads CSV</button>
              </div>
            </div>

            <div className="reportGoalGrid">
              <div className="reportGoalCard">
                <span>Weekly Calls</span>
                <strong>{weeklyStats.calls} / 250</strong>
                <div className="reportBar"><i style={{ width: `${reportMetrics.callProgress}%` }} /></div>
                <small>{reportMetrics.remainingCalls} calls left</small>
              </div>

              <div className="reportGoalCard">
                <span>Weekly Bookings</span>
                <strong>{weeklyStats.bookings} / 10</strong>
                <div className="reportBar"><i style={{ width: `${reportMetrics.bookingProgress}%` }} /></div>
                <small>{reportMetrics.remainingBookings} bookings left</small>
              </div>

              <div className="reportGoalCard">
                <span>Weekly Closes</span>
                <strong>{weeklyStats.closes} / 2</strong>
                <div className="reportBar"><i style={{ width: `${reportMetrics.closeProgress}%` }} /></div>
                <small>{reportMetrics.remainingCloses} closes left</small>
              </div>
            </div>

            <div className="conversionGrid">
              <div>
                <p>Calls per Booking</p>
                <strong>{reportMetrics.callsToBooking || "—"}</strong>
                <span>Target: 25-50 calls per booking</span>
              </div>

              <div>
                <p>Booking-to-Close Rate</p>
                <strong>{reportMetrics.bookingToCloseRate}%</strong>
                <span>Target: 20-40%</span>
              </div>

              <div>
                <p>Decision Maker Rate</p>
                <strong>{reportMetrics.decisionMakerRate}%</strong>
                <span>Higher means better targeting/script</span>
              </div>

              <div>
                <p>Close Rate From Calls</p>
                <strong>{reportMetrics.closeRateFromCalls}%</strong>
                <span>Cold-call efficiency</span>
              </div>
            </div>

            <div className="reportTwoColumn">
              <div className="reportBox">
                <h3>What To Focus On Next</h3>
                {weeklyStats.calls < 250 ? (
                  <p>You are still under the weekly call goal. Focus on getting the call volume up before changing the offer.</p>
                ) : weeklyStats.bookings < 10 ? (
                  <p>You hit call volume, but bookings are low. Tighten the opener and push harder for the 10-minute demo.</p>
                ) : weeklyStats.closes < 2 ? (
                  <p>You are booking enough demos, but closes are low. Improve demo structure, urgency, and offer clarity.</p>
                ) : (
                  <p>You are on pace. Keep calling, protect your follow-ups, and start thinking about scaling lead generation.</p>
                )}
              </div>

              <div className="reportBox">
                <h3>Top No-MCTB Leads To Call</h3>
                {hotNoMctbLeads.length ? (
                  hotNoMctbLeads.map((lead) => (
                    <button
                      key={lead.id}
                      className="reportLeadRow"
                      onClick={() => {
                        setSelectedLeadId(lead.id);
                        setActiveView("Dashboard");
                      }}
                    >
                      <span>
                        <strong>{lead.businessName}</strong>
                        <small>{lead.city}, {lead.state} • {lead.googleRating} ⭐ • {lead.reviewCount} reviews</small>
                      </span>
                      <em>{lead.leadScore}/100</em>
                    </button>
                  ))
                ) : (
                  <p>No No-MCTB leads available. Import more leads or retest unknown leads.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {activeView !== "Reports" && activeView !== "Settings" && activeView !== "Calendar" && activityFilter !== "All" && (
          <div className="activeActivityNotice">
            Showing leads for: <strong>{activityFilter}</strong>
            <button onClick={() => setActivityFilter("All")}>Clear</button>
          </div>
        )}

        {activeView !== "Reports" && activeView !== "Settings" && activeView !== "Calendar" && (
          <section className="desktopTableCard">
            <table className="leadsTable">
            <thead>
              <tr>
                <th><input type="checkbox" /></th>
                <th>Business Name</th>
                <th>Phone</th>
                <th>City, State</th>
                <th>Rating<br /><span>Reviews</span></th>
                <th>MCTB Status</th>
                <th>Lead Status</th>
                <th>Last Contacted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scoredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className={selectedLeadId === lead.id ? "selectedRow" : ""}
                  onClick={() => setSelectedLeadId(lead.id)}
                >
                  <td><input type="checkbox" onClick={(event) => event.stopPropagation()} /></td>
                  <td>
                    <strong>{lead.businessName}</strong>
                    <a href={lead.website} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                      {String(lead.website || "").replace("https://", "").replace("http://", "") || "No website"}
                    </a>
                  </td>
                  <td><a href={`tel:${String(lead.phone).replace(/\D/g, "")}`}>{lead.phone}</a></td>
                  <td>{lead.city}, {lead.state}</td>
                  <td>{lead.googleRating} <Stars rating={lead.googleRating} /><br /><span>({lead.reviewCount})</span></td>
                  <td><span className={`tag ${getMctbClass(lead.mctbStatus)}`}>{lead.mctbStatus || "Unknown"}</span></td>
                  <td><span className={`tag ${getStatusClass(lead.status)}`}>{lead.status || "New"}</span></td>
                  <td>{lead.lastContacted || "—"}</td>
                  <td>
                    <div className="tableActions">
                      <button onClick={(event) => { event.stopPropagation(); trackAction(lead.id, "Called"); }}>📞</button>
                      <button onClick={(event) => { event.stopPropagation(); trackAction(lead.id, "Decision Maker"); }}>👤</button>
                      <button onClick={(event) => { event.stopPropagation(); trackAction(lead.id, "Booked"); }}>📅</button>
                      <button onClick={(event) => { event.stopPropagation(); trackAction(lead.id, "Follow Up"); }}>⏰</button>
                      <button onClick={(event) => { event.stopPropagation(); setSelectedLeadId(lead.id); }}>•••</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="tableFooter">
            <span>Showing {scoredLeads.length} of {leads.length} leads</span>
            <div>
              <button>1</button>
              <button>2</button>
              <button>3</button>
              <button>4</button>
              <span>...</span>
              <button>24</button>
            </div>
          </div>
        </section>
        )}

        {activeView !== "Reports" && activeView !== "Settings" && activeView !== "Calendar" && (
        <section className="mobileLeadList">
          {scoredLeads.map((lead) => (
            <button
              key={lead.id}
              className="mobileLeadCard"
              onClick={() => {
                setSelectedLeadId(lead.id);
                setShowMobileDetail(true);
              }}
            >
              <div>
                <strong>{lead.businessName}</strong>
                <a href={`tel:${String(lead.phone).replace(/\D/g, "")}`}>{lead.phone}</a>
                <p>{lead.city}, {lead.state}</p>
                <p>{lead.googleRating} <Stars rating={lead.googleRating} /> <span>({lead.reviewCount})</span></p>
              </div>
              <div>
                <span className={`tag ${getMctbClass(lead.mctbStatus)}`}>{lead.mctbStatus || "Unknown"}</span>
                <span className={`tag ${getStatusClass(lead.status)}`}>{lead.status || "New"}</span>
                <span className="chevron">›</span>
              </div>
            </button>
          ))}
        </section>
        )}
      </main>

      {selectedLead && (
        <aside className="leadDrawer">
          <div className="drawerHeader">
            <button>‹ Back</button>
            <h3>Lead Details</h3>
            <button onClick={() => setSelectedLeadId("")}>⋮</button>
          </div>

          <div className="detailCard">
            <h2>{selectedLead.businessName}</h2>
            <a href={`tel:${String(selectedLead.phone).replace(/\D/g, "")}`}>📞 {selectedLead.phone}</a>
            <a href={selectedLead.website} target="_blank" rel="noreferrer">🌐 {String(selectedLead.website || "").replace("https://", "").replace("http://", "")}</a>
            <p>📍 {selectedLead.city}, {selectedLead.state}</p>
            <p className="ratingLine">{selectedLead.googleRating} <Stars rating={selectedLead.googleRating} /> <span>({selectedLead.reviewCount} reviews)</span></p>

            <div className="detailSelectRow">
              <label>MCTB Status</label>
              <select
                className={`selectTag ${getMctbClass(selectedLead.mctbStatus)}`}
                value={selectedLead.mctbStatus || "Unknown"}
                onChange={(event) => updateLead(selectedLead.id, "mctbStatus", event.target.value)}
              >
                {mctbOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="detailSelectRow">
              <label>Lead Status</label>
              <select
                className={`selectTag ${getStatusClass(selectedLead.status)}`}
                value={selectedLead.status || "New"}
                onChange={(event) => updateLead(selectedLead.id, "status", event.target.value)}
              >
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="drawerActionGrid">
            <button onClick={() => trackAction(selectedLead.id, "Called")}>📞<span>Called</span></button>
            <button onClick={() => trackAction(selectedLead.id, "Decision Maker")}>👤<span>Decision Maker</span></button>
            <button onClick={() => trackAction(selectedLead.id, "Booked")}>📅<span>Booked</span></button>
            <button onClick={() => trackAction(selectedLead.id, "Follow Up")}>⏰<span>Follow-Up</span></button>
            <button onClick={() => trackAction(selectedLead.id, "Closed")}>🏆<span>Closed</span></button>
            <button onClick={() => trackAction(selectedLead.id, "Skipped")}>⊗<span>Skip</span></button>
          </div>

          <div className="notesPanel">
            <div className="notesHeader">
              <h3>✎ NOTES</h3>
              <span>Edit</span>
            </div>
            <textarea
              value={selectedLead.callerNotes || ""}
              onChange={(event) => updateCallerNotes(selectedLead.id, event.target.value)}
              placeholder="Add call notes..."
            />

            <button className="saveNoteButton" onClick={() => saveCallerNote(selectedLead.id)}>
              Save Note to Activity History
            </button>

            <div className="infoRows">
              <div><span>Last Contacted</span><strong>{selectedLead.lastContacted || "—"}</strong></div>
              <div><span>Follow Up Date</span><strong>{formatFollowUpDate(selectedLead.followUpDate)}</strong></div>
              <div><span>Source</span><strong>{selectedLead.source || "Google Maps"}</strong></div>
              <div>
                <span>Tags</span>
                <strong className="tagList">
                  {(selectedLead.tags || []).length
                    ? selectedLead.tags.map((tag) => <em key={tag}>{tag}</em>)
                    : <em>Med Spa</em>}
                </strong>
              </div>
            </div>

            <label className="followDateLabel">
              Set Follow-Up Date
              <input
                type="datetime-local"
                value={selectedLead.followUpDate || ""}
                onChange={(event) => updateLead(selectedLead.id, "followUpDate", event.target.value)}
              />
            </label>

            <div className="drawerLinks singleLink">
              {selectedLead.website ? (
                <a href={selectedLead.website} target="_blank" rel="noreferrer">🌐 View Website</a>
              ) : (
                <span>No Website</span>
              )}
            </div>
          </div>

          <div className="activityPanel">
            <h3>ACTIVITY HISTORY</h3>
            {(selectedLead.activityHistory || []).length ? (
              selectedLead.activityHistory.map((activity) => (
                <div key={activity.id} className="timelineItem">
                  <div>{activity.action === "Called" ? "📞" : activity.action === "Booked" ? "📅" : activity.action === "Decision Maker" ? "👤" : "•"}</div>
                  <section>
                    <strong>{activity.action}</strong>
                    <span>{activity.timestamp}</span>
                    <p>{activity.note}</p>
                  </section>
                </div>
              ))
            ) : (
              <p className="emptyTimeline">No activity yet.</p>
            )}
          </div>

          <button className="removeButton" onClick={() => deleteLead(selectedLead.id)}>
            🗑 Remove from List
          </button>
        </aside>
      )}

      {showMobileMenu && (
        <div className="mobileMenuOverlay" onClick={() => setShowMobileMenu(false)}>
          <div className="mobileMenu" onClick={(event) => event.stopPropagation()}>
            <div className="mobileMenuHeader">
              <div className="mobileMenuBrand">
                <img src={bookoraLogo} alt="" />
                <div>
                  <h3>Bookora Prospector</h3>
                  <p>Menu</p>
                </div>
              </div>

              <button onClick={() => setShowMobileMenu(false)}>✕</button>
            </div>

            {[
              ["Dashboard", "▣"],
              ["Leads", "☷"],
              ["Calendar", "▦"],
              ["Reports", "▥"],
              ["Settings", "⚙"],
            ].map(([item, icon]) => (
              <button
                key={item}
                className={activeView === item ? "active" : ""}
                onClick={() => {
                  setActiveView(item);
                  setShowMobileMenu(false);
                }}
              >
                <span>{icon}</span>
                {item}
              </button>
            ))}

            <button
              className="mobileMenuImport"
              onClick={() => {
                setShowPasteCsv(true);
                setShowMobileMenu(false);
              }}
            >
              <span>＋</span>
              Import CSV
            </button>
          </div>
        </div>
      )}

      <nav className="bottomNav">
        {[
          ["Dashboard", "▣"],
          ["Leads", "☷"],
          ["Calendar", "▦"],
          ["Reports", "▥"],
          ["Settings", "⚙"],
        ].map(([item, icon]) => (
          <button
            key={item}
            className={activeView === item || (activeView === "Import CSV" && item === "Import") ? "active" : ""}
            onClick={() => {
              setActiveView(item);
            }}
          >
            <span>{icon}</span>
            {item}
          </button>
        ))}
      </nav>


      {showMobileDetail && selectedLead && (
        <section className="mobileDetailScreen">
          <div className="drawerHeader">
            <button onClick={() => setShowMobileDetail(false)}>‹ Back</button>
            <h3>Lead Details</h3>
            <button onClick={() => setShowMobileDetail(false)}>✕</button>
          </div>

          <div className="detailCard">
            <h2>{selectedLead.businessName}</h2>
            <a href={`tel:${String(selectedLead.phone).replace(/\D/g, "")}`}>📞 {selectedLead.phone}</a>
            <a href={selectedLead.website} target="_blank" rel="noreferrer">🌐 {String(selectedLead.website || "").replace("https://", "").replace("http://", "")}</a>
            <p>📍 {selectedLead.city}, {selectedLead.state}</p>
            <p className="ratingLine">{selectedLead.googleRating} <Stars rating={selectedLead.googleRating} /> <span>({selectedLead.reviewCount} reviews)</span></p>

            <div className="detailSelectRow">
              <label>MCTB Status</label>
              <select
                className={`selectTag ${getMctbClass(selectedLead.mctbStatus)}`}
                value={selectedLead.mctbStatus || "Unknown"}
                onChange={(event) => updateLead(selectedLead.id, "mctbStatus", event.target.value)}
              >
                {mctbOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="detailSelectRow">
              <label>Lead Status</label>
              <select
                className={`selectTag ${getStatusClass(selectedLead.status)}`}
                value={selectedLead.status || "New"}
                onChange={(event) => updateLead(selectedLead.id, "status", event.target.value)}
              >
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="drawerActionGrid">
            <button onClick={() => trackAction(selectedLead.id, "Called")}>📞<span>Called</span></button>
            <button onClick={() => trackAction(selectedLead.id, "Decision Maker")}>👤<span>Decision Maker</span></button>
            <button onClick={() => trackAction(selectedLead.id, "Booked")}>📅<span>Booked</span></button>
            <button onClick={() => trackAction(selectedLead.id, "Follow Up")}>⏰<span>Follow-Up</span></button>
            <button onClick={() => trackAction(selectedLead.id, "Closed")}>🏆<span>Closed</span></button>
            <button onClick={() => trackAction(selectedLead.id, "Skipped")}>⊗<span>Skip</span></button>
          </div>

          <div className="notesPanel">
            <div className="notesHeader">
              <h3>✎ NOTES</h3>
              <span>Edit</span>
            </div>
            <textarea
              value={selectedLead.callerNotes || ""}
              onChange={(event) => updateCallerNotes(selectedLead.id, event.target.value)}
              placeholder="Add call notes..."
            />

            <button className="saveNoteButton" onClick={() => saveCallerNote(selectedLead.id)}>
              Save Note to Activity History
            </button>

            <div className="infoRows">
              <div><span>Last Contacted</span><strong>{selectedLead.lastContacted || "—"}</strong></div>
              <div><span>Follow Up Date</span><strong>{formatFollowUpDate(selectedLead.followUpDate)}</strong></div>
              <div><span>Source</span><strong>{selectedLead.source || "Google Maps"}</strong></div>
            </div>

            <label className="followDateLabel">
              Set Follow-Up Date
              <input
                type="datetime-local"
                value={selectedLead.followUpDate || ""}
                onChange={(event) => updateLead(selectedLead.id, "followUpDate", event.target.value)}
              />
            </label>

            <div className="drawerLinks singleLink">
              {selectedLead.website ? (
                <a href={selectedLead.website} target="_blank" rel="noreferrer">🌐 View Website</a>
              ) : (
                <span>No Website</span>
              )}
            </div>
          </div>

          <div className="activityPanel">
            <h3>ACTIVITY HISTORY</h3>
            {(selectedLead.activityHistory || []).length ? (
              selectedLead.activityHistory.map((activity) => (
                <div key={activity.id} className="timelineItem">
                  <div>{activity.action === "Called" ? "📞" : activity.action === "Booked" ? "📅" : activity.action === "Decision Maker" ? "👤" : "•"}</div>
                  <section>
                    <strong>{activity.action}</strong>
                    <span>{activity.timestamp}</span>
                    <p>{activity.note}</p>
                  </section>
                </div>
              ))
            ) : (
              <p className="emptyTimeline">No activity yet.</p>
            )}
          </div>

          <button className="removeButton" onClick={() => {
            deleteLead(selectedLead.id);
            setShowMobileDetail(false);
          }}>
            🗑 Remove from List
          </button>
        </section>
      )}

      <button className="floatingAdd" onClick={() => setShowPasteCsv(true)}>+</button>

      {showPasteCsv && (
        <div className="modalOverlay">
          <div className="modal">
            <div className="modalHeader">
              <div>
                <p>Bookora CSV Import</p>
                <h2>Paste CSV</h2>
              </div>

              <button onClick={() => setShowPasteCsv(false)}>✕</button>
            </div>

            <div className="modalBody">
              <p>
                Paste the full CSV from Manus below. This accepts both camelCase
                headers like businessName/phone and normal headers like Business
                Name/Phone.
              </p>

              <textarea
                className="csvPasteBox"
                value={pastedCsv}
                onChange={(event) => setPastedCsv(event.target.value)}
                placeholder="Paste CSV here..."
              />

              <div className="modalActions">
                <button
                  className="primaryButton"
                  onClick={() => {
                    importLeadsFromCsvText(pastedCsv);
                    setPastedCsv("");
                    setShowPasteCsv(false);
                  }}
                >
                  Import Leads
                </button>

                <button onClick={() => setPastedCsv("")}>
                  Clear Text
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showScript && (
        <div className="modalOverlay">
          <div className="modal">
            <div className="modalHeader">
              <div>
                <p>Bookora Sales Script</p>
                <h2>Revenue Leak Call Script</h2>
              </div>

              <button onClick={() => setShowScript(false)}>✕</button>
            </div>

            <div className="modalBody scriptText">
              <h3>1. Opener</h3>
              <p>
                Hey, is this the person who handles new appointments and customer inquiries?
              </p>
              <p>
                Perfect — I’ll be quick. My name is Anthony with Bookora. We help med spas recover missed calls and book more appointments automatically with missed-call text back, AI receptionist support, reminders, and follow-up automations.
              </p>
              <p>
                Quick question — when someone calls and your team misses the call, do they automatically get a text back right away?
              </p>

              <h3>2. If they say no</h3>
              <p>
                Got it — that’s exactly where we usually find the biggest opportunity. Most people don’t leave voicemails anymore. They usually call the next med spa.
              </p>
              <p>
                I’d just like to show you in 10 minutes how it works and see if it would make sense. Would later today or tomorrow be better?
              </p>

              <h3>Best Close</h3>
              <p>Would later today or tomorrow be better for a quick 10-minute demo?</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}