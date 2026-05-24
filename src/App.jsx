import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import "./App.css";

const sampleLeads = [
  {
    id: "sample-1",
    businessName: "Glow Med Spa",
    phone: "(407) 555-0188",
    website: "https://example.com",
    city: "Orlando",
    county: "Orange",
    state: "FL",
    zipCode: "32801",
    googleRating: 4.8,
    reviewCount: 243,
    serviceType: "Med Spa",
    locationType: "Individual",
    manusNotes:
      "Established med spa with strong review count, appointment-based services, and likely enough volume to benefit from better lead follow-up.",
    mctbStatus: "Unknown",
    status: "New",
    callerNotes: "",
    lastContacted: "",
    followUpDate: "",
    activityHistory: [],
  },
  {
    id: "sample-2",
    businessName: "Luxe Aesthetics",
    phone: "(813) 555-0144",
    website: "https://example.com",
    city: "Tampa",
    county: "Hillsborough",
    state: "FL",
    zipCode: "33602",
    googleRating: 4.6,
    reviewCount: 128,
    serviceType: "Med Spa",
    locationType: "Individual",
    manusNotes:
      "Good local med spa prospect with enough reviews to suggest steady demand and appointment volume.",
    mctbStatus: "No MCTB",
    status: "New",
    callerNotes: "",
    lastContacted: "",
    followUpDate: "",
    activityHistory: [],
  },
  {
    id: "sample-3",
    businessName: "National Beauty Med Spa",
    phone: "(305) 555-0199",
    website: "https://example.com",
    city: "Miami",
    county: "Miami-Dade",
    state: "FL",
    zipCode: "33101",
    googleRating: 4.7,
    reviewCount: 800,
    serviceType: "Med Spa",
    locationType: "Chain",
    manusNotes:
      "Large multi-location brand. Skip for now because the current focus is individual locations.",
    mctbStatus: "Has MCTB",
    status: "New",
    callerNotes: "",
    lastContacted: "",
    followUpDate: "",
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

  return {
    id: get("id", "ID") || `${Date.now()}-${index}`,
    businessName: get("businessName", "Business Name", "business name", "name", "Name"),
    phone: get("phone", "Phone", "Phone Number", "phoneNumber"),
    website: get("website", "Website", "url", "URL"),
    city: get("city", "City"),
    county: get("county", "County"),
    state: get("state", "State") || "FL",
    zipCode: get("zipCode", "Zip", "ZIP", "Zip Code"),
    googleRating: get("googleRating", "Google Rating", "rating", "Rating") || "0",
    reviewCount: get("reviewCount", "Review Count", "reviews", "Reviews") || "0",
    serviceType: get("serviceType", "Service Type", "Category") || "Med Spa",
    locationType: get("locationType", "Location Type") || "Individual",
    manusNotes: get("manusNotes", "Manus Notes", "Notes", "notes"),
    callerNotes: get("callerNotes", "Caller Notes") || "",
    mctbStatus: get("mctbStatus", "MCTB Status") || "Unknown",
    status: get("status", "Lead Status", "Status") || "New",
    lastContacted: get("lastContacted", "Last Contacted") || "",
    followUpDate: get("followUpDate", "Follow Up Date") || "",
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

function getPriorityClass(priority) {
  if (priority === "Hot") return "hot";
  if (priority === "Warm") return "warm";
  if (priority === "Maybe") return "maybe";
  return "skip";
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

function MetricCard({ label, value, goal, icon, tone }) {
  const percent = goal ? Math.min(100, Math.round((value / goal) * 100)) : 0;

  return (
    <div className={`metricCard ${tone || ""}`}>
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
        <small>Track daily</small>
      )}
    </div>
  );
}

export default function App() {
  const [leads, setLeads] = useState(() =>
    readStoredJson("bookoraLeads", sampleLeads)
  );

  const [dailyStats, setDailyStats] = useState(() =>
    readStoredJson("bookoraDailyStats", emptyStats)
  );

  const [weeklyStats, setWeeklyStats] = useState(() =>
    readStoredJson("bookoraWeeklyStats", emptyStats)
  );

  const [priorityFilter, setPriorityFilter] = useState("All");
  const [mctbFilter, setMctbFilter] = useState("All");
  const [leadStatusFilter, setLeadStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("FL");
  const [minReviewsFilter, setMinReviewsFilter] = useState("50");
  const [showScript, setShowScript] = useState(false);
  const [showPasteCsv, setShowPasteCsv] = useState(false);
  const [pastedCsv, setPastedCsv] = useState("");

  useEffect(() => {
    localStorage.setItem("bookoraLeads", JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem("bookoraDailyStats", JSON.stringify(dailyStats));
  }, [dailyStats]);

  useEffect(() => {
    localStorage.setItem("bookoraWeeklyStats", JSON.stringify(weeklyStats));
  }, [weeklyStats]);

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
    const currentLead = leads.find((lead) => lead.id === id);
    const hadNoNotes = !String(currentLead?.callerNotes || "").trim();
    const hasNotesNow = String(value || "").trim();

    updateLead(id, "callerNotes", value);

    if (hadNoNotes && hasNotesNow) {
      increaseStats("notes");
      addLeadHistory(id, "Notes", "Caller notes added");
    }
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
  }

  function resetToday() {
    const confirmed = window.confirm("Reset today's scoreboard to zero?");
    if (confirmed) setDailyStats(emptyStats);
  }

  function resetWeek() {
    const confirmed = window.confirm("Reset this week's scoreboard to zero?");
    if (confirmed) setWeeklyStats(emptyStats);
  }

  const scoredLeads = useMemo(() => {
    return leads
      .map((lead) => {
        const score = calculateLeadScore(lead);
        const priority = getLeadPriority(score);

        return { ...lead, leadScore: score, priority };
      })
      .filter((lead) => {
        const matchesPriority =
          priorityFilter === "All" || lead.priority === priorityFilter;

        const matchesMctb =
          mctbFilter === "All" || String(lead.mctbStatus || "Unknown") === mctbFilter;

        const matchesLeadStatus =
          leadStatusFilter === "All" || String(lead.status || "New") === leadStatusFilter;

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

        const matchesCounty =
          !countyFilter ||
          String(lead.county || "").toLowerCase().includes(countyFilter.toLowerCase());

        const matchesState =
          !stateFilter ||
          String(lead.state || "").toLowerCase() === stateFilter.toLowerCase();

        const matchesMinReviews =
          !minReviewsFilter ||
          Number(lead.reviewCount || 0) >= Number(minReviewsFilter);

        const isIndividualLocation =
          String(lead.locationType || "").toLowerCase() !== "chain";

        return (
          matchesPriority &&
          matchesMctb &&
          matchesLeadStatus &&
          matchesSearch &&
          matchesCity &&
          matchesCounty &&
          matchesState &&
          matchesMinReviews &&
          isIndividualLocation
        );
      })
      .sort((a, b) => b.leadScore - a.leadScore);
  }, [
    leads,
    priorityFilter,
    mctbFilter,
    leadStatusFilter,
    searchTerm,
    cityFilter,
    countyFilter,
    stateFilter,
    minReviewsFilter,
  ]);

  const summary = useMemo(() => {
    const scored = leads.map((lead) => getLeadPriority(calculateLeadScore(lead)));

    return {
      hot: scored.filter((item) => item === "Hot").length,
      warm: scored.filter((item) => item === "Warm").length,
      maybe: scored.filter((item) => item === "Maybe").length,
      total: leads.length,
      noMctb: leads.filter((lead) => lead.mctbStatus === "No MCTB").length,
      hasMctb: leads.filter((lead) => lead.mctbStatus === "Has MCTB").length,
      unknown: leads.filter((lead) => !lead.mctbStatus || lead.mctbStatus === "Unknown").length,
      booked: leads.filter((lead) => lead.status === "Booked").length,
      closed: leads.filter((lead) => lead.status === "Closed").length,
      followUp: leads.filter((lead) => lead.status === "Follow Up").length,
    };
  }, [leads]);

  return (
    <div className="app dark">
      <header className="hero">
        <div>
          <p className="eyebrow">Bookora Prospector</p>
          <h1>Sales Dashboard</h1>
          <p className="subtitle">
            Qualify med spas by MCTB status, call the best prospects first, and
            track your daily path to 1-2 bookings per day.
          </p>
        </div>

        <div className="heroActions">
          <div className="heroCard">
            <p>Daily Target</p>
            <h2>50 Calls / 2 Bookings</h2>
          </div>
        </div>
      </header>

      <section className="scoreboardWrap">
        <div className="scoreboard">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">Today's Scoreboard</p>
              <h2>Daily Activity</h2>
            </div>
            <button className="ghostButton" onClick={resetToday}>
              Reset Today
            </button>
          </div>

          <div className="metricGrid todayGrid">
            <MetricCard label="Calls Made" value={dailyStats.calls} goal={50} icon="📞" tone="blue" />
            <MetricCard
              label="Decision Makers"
              value={dailyStats.decisionMakers}
              icon="👤"
              tone="green"
            />
            <MetricCard label="Bookings" value={dailyStats.bookings} goal={2} icon="📅" tone="purple" />
            <MetricCard label="Follow-Ups" value={dailyStats.followUps} icon="⏰" tone="orange" />
            <MetricCard label="Closes" value={dailyStats.closes} icon="🏆" tone="yellow" />
            <MetricCard label="Notes" value={dailyStats.notes} icon="📝" tone="cyan" />
          </div>
        </div>

        <div className="scoreboard">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">Weekly Scoreboard</p>
              <h2>250 Calls / 10 Bookings / 2 Closes</h2>
            </div>
            <button className="ghostButton" onClick={resetWeek}>
              Reset Week
            </button>
          </div>

          <div className="metricGrid weeklyGrid">
            <MetricCard label="Calls" value={weeklyStats.calls} goal={250} icon="📞" tone="blue" />
            <MetricCard label="Bookings" value={weeklyStats.bookings} goal={10} icon="📅" tone="purple" />
            <MetricCard label="Closes" value={weeklyStats.closes} goal={2} icon="🏆" tone="yellow" />
          </div>
        </div>
      </section>

      <section className="summaryGrid">
        <button className={`summaryCard summaryTotal ${priorityFilter === "All" ? "selected" : ""}`} onClick={() => setPriorityFilter("All")}>
          <p>Total Leads</p>
          <h3>{summary.total}</h3>
        </button>

        <button className={`summaryCard summaryHot ${priorityFilter === "Hot" ? "selected" : ""}`} onClick={() => setPriorityFilter("Hot")}>
          <p>Hot Leads</p>
          <h3>{summary.hot}</h3>
        </button>

        <button className={`summaryCard summaryNoMctb ${mctbFilter === "No MCTB" ? "selected" : ""}`} onClick={() => setMctbFilter(mctbFilter === "No MCTB" ? "All" : "No MCTB")}>
          <p>No MCTB</p>
          <h3>{summary.noMctb}</h3>
        </button>

        <button className={`summaryCard summaryBooked ${leadStatusFilter === "Booked" ? "selected" : ""}`} onClick={() => setLeadStatusFilter(leadStatusFilter === "Booked" ? "All" : "Booked")}>
          <p>Booked</p>
          <h3>{summary.booked}</h3>
        </button>
      </section>

      <section className="controls">
        <input
          type="text"
          placeholder="Search business, phone, city, or niche..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <input
          type="text"
          placeholder="Filter by city..."
          value={cityFilter}
          onChange={(event) => setCityFilter(event.target.value)}
        />

        <input
          type="text"
          placeholder="Filter by county..."
          value={countyFilter}
          onChange={(event) => setCountyFilter(event.target.value)}
        />

        <input
          type="text"
          placeholder="State..."
          value={stateFilter}
          onChange={(event) => setStateFilter(event.target.value)}
        />

        <input
          type="number"
          placeholder="Minimum reviews..."
          value={minReviewsFilter}
          onChange={(event) => setMinReviewsFilter(event.target.value)}
        />

        <label className="uploadButton">
          Upload CSV
          <input type="file" accept=".csv" onChange={handleCsvUpload} />
        </label>

        <button className="pasteButton" onClick={() => setShowPasteCsv(true)}>
          Paste CSV
        </button>

        <button className="scriptButton" onClick={() => setShowScript(true)}>
          View Call Script
        </button>

        <div className="filterPanel">
          <div>
            <p className="smallLabel">Priority</p>
            <div className="filterButtons">
              {["All", "Hot", "Warm", "Maybe", "Skip"].map((priority) => (
                <button
                  key={priority}
                  onClick={() => setPriorityFilter(priority)}
                  className={`${priorityFilter === priority ? "active" : ""} ${priority.toLowerCase()}Filter`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="smallLabel">MCTB Status</p>
            <div className="filterButtons">
              {["All", ...mctbOptions].map((status) => (
                <button
                  key={status}
                  onClick={() => setMctbFilter(status)}
                  className={`${mctbFilter === status ? "active" : ""} ${getMctbClass(status)}Filter`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="smallLabel">Lead Status</p>
            <div className="filterButtons">
              {["All", "New", "Called", "Decision Maker", "Booked", "Follow Up", "Closed", "Skipped"].map((status) => (
                <button
                  key={status}
                  onClick={() => setLeadStatusFilter(status)}
                  className={`${leadStatusFilter === status ? "active" : ""} statusFilter`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="dangerActions">
          <button onClick={clearAllLeads}>Clear Leads</button>
          <button onClick={resetSampleLeads}>Reset Samples</button>
        </div>
      </section>

      <main className="leadGrid">
        {scoredLeads.map((lead) => (
          <article key={lead.id || lead.phone} className="leadCard">
            <div className="leadTop">
              <div>
                <h2>{lead.businessName}</h2>
                <p className="serviceType">
                  {lead.serviceType} • {lead.city}, {lead.state}
                </p>
              </div>

              <div className={`badge ${getPriorityClass(lead.priority)}`}>
                {lead.priority}
              </div>
            </div>

            <div className="pillRow">
              <span className={`statusPill ${getMctbClass(lead.mctbStatus)}`}>
                {lead.mctbStatus || "Unknown"}
              </span>
              <span className={`statusPill ${getStatusClass(lead.status)}`}>
                {lead.status || "New"}
              </span>
            </div>

            <div className="scoreRow">
              <div>
                <p className="smallLabel">Lead Score</p>
                <strong>{lead.leadScore}/100</strong>
              </div>

              <div>
                <p className="smallLabel">Rating</p>
                <strong>
                  {lead.googleRating} ⭐ / {lead.reviewCount} reviews
                </strong>
              </div>
            </div>

            <div className="details">
              <p>
                <span>Phone:</span> {lead.phone}
              </p>
              <p>
                <span>Location:</span> {lead.city}, {lead.county}, {lead.state} {lead.zipCode}
              </p>
              <p>
                <span>Last Contacted:</span> {lead.lastContacted || "—"}
              </p>
            </div>

            <div className="leadEditor compactEditor">
              <label>
                MCTB Status
                <select
                  value={lead.mctbStatus || "Unknown"}
                  onChange={(event) => updateLead(lead.id, "mctbStatus", event.target.value)}
                >
                  {mctbOptions.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label>
                Lead Status
                <select
                  value={lead.status || "New"}
                  onChange={(event) => updateLead(lead.id, "status", event.target.value)}
                >
                  {statusOptions.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="quickActions">
              <button className="quickCall" onClick={() => trackAction(lead.id, "Called")}>
                📞 Called
              </button>
              <button className="quickDecision" onClick={() => trackAction(lead.id, "Decision Maker")}>
                👤 Decision Maker
              </button>
              <button className="quickBooked" onClick={() => trackAction(lead.id, "Booked")}>
                📅 Booked
              </button>
              <button className="quickFollow" onClick={() => trackAction(lead.id, "Follow Up")}>
                ⏰ Follow-Up
              </button>
              <button className="quickClosed" onClick={() => trackAction(lead.id, "Closed")}>
                🏆 Closed
              </button>
              <button className="quickSkip" onClick={() => trackAction(lead.id, "Skipped")}>
                ✕ Skip
              </button>
            </div>

            <div className="notes">
              <p className="smallLabel">Manus Notes</p>
              <p>{lead.manusNotes || "No Manus notes yet."}</p>
            </div>

            <div className="leadEditor">
              <label>
                Caller Notes
                <textarea
                  value={lead.callerNotes || ""}
                  onChange={(event) => updateCallerNotes(lead.id, event.target.value)}
                  placeholder="Example: spoke to front desk, manager handles marketing, call back Tuesday at 10 AM..."
                />
              </label>

              <label>
                Follow-Up Date
                <input
                  type="datetime-local"
                  value={lead.followUpDate || ""}
                  onChange={(event) => updateLead(lead.id, "followUpDate", event.target.value)}
                />
              </label>
            </div>

            {(lead.activityHistory || []).length > 0 && (
              <div className="activityBox">
                <p className="smallLabel">Activity History</p>
                {(lead.activityHistory || []).slice(0, 4).map((activity) => (
                  <div key={activity.id} className="activityItem">
                    <strong>{activity.action}</strong>
                    <span>{activity.timestamp}</span>
                    <p>{activity.note}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="actions">
              <a href={`tel:${String(lead.phone).replace(/\D/g, "")}`} className="callButton">
                Call Now
              </a>

              {lead.website ? (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noreferrer"
                  className="siteButton"
                >
                  View Website
                </a>
              ) : (
                <button className="siteButton disabledButton" type="button">
                  No Website
                </button>
              )}

              <button className="deleteLeadButton smallDelete" onClick={() => deleteLead(lead.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}

        {scoredLeads.length === 0 && (
          <div className="emptyState">
            <h2>No leads match your filters.</h2>
            <p>Clear your filters or import a new CSV to keep prospecting.</p>
          </div>
        )}
      </main>

      {showPasteCsv && (
        <div className="scriptOverlay">
          <div className="scriptModal">
            <div className="scriptHeader">
              <div>
                <p className="eyebrow darkEyebrow">Bookora CSV Import</p>
                <h2>Paste CSV</h2>
              </div>

              <button className="closeScript" onClick={() => setShowPasteCsv(false)}>
                ✕
              </button>
            </div>

            <div className="scriptSection">
              <p>
                Paste the full CSV from Manus below. This version accepts either
                camelCase headers like businessName/phone or normal headers like
                Business Name/Phone.
              </p>

              <textarea
                className="csvPasteBox"
                value={pastedCsv}
                onChange={(event) => setPastedCsv(event.target.value)}
                placeholder="Paste CSV here..."
              />

              <div className="csvPasteActions">
                <button
                  className="callButton"
                  onClick={() => {
                    importLeadsFromCsvText(pastedCsv);
                    setPastedCsv("");
                    setShowPasteCsv(false);
                  }}
                >
                  Import Leads
                </button>

                <button className="siteButton" onClick={() => setPastedCsv("")}>
                  Clear Text
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showScript && (
        <div className="scriptOverlay">
          <div className="scriptModal">
            <div className="scriptHeader">
              <div>
                <p className="eyebrow darkEyebrow">Bookora Sales Script</p>
                <h2>Revenue Leak Call Script</h2>
              </div>

              <button className="closeScript" onClick={() => setShowScript(false)}>
                ✕
              </button>
            </div>

            <div className="scriptSection">
              <h3>1. Opener</h3>
              <p>
                Hey, is this the person who handles new appointments and customer
                inquiries?
              </p>
              <p>
                Perfect — I’ll be quick. My name is Anthony with Bookora. We help
                med spas recover missed calls and book more appointments
                automatically with missed-call text back, AI receptionist support,
                reminders, and follow-up automations.
              </p>
              <p>
                Quick question — when someone calls and your team misses the call,
                do they automatically get a text back right away?
              </p>
            </div>

            <div className="scriptSection">
              <h3>2. If they say no</h3>
              <p>
                Got it — that’s exactly where we usually find the biggest
                opportunity.
              </p>
              <p>
                Most people don’t leave voicemails anymore. They usually call the
                next med spa. So even a few missed calls per week can turn into
                lost appointments.
              </p>
              <p>
                I’d just like to show you in 10 minutes how it works and see if it
                would make sense. Would later today or tomorrow be better?
              </p>
            </div>

            <div className="scriptSection">
              <h3>3. If they already have missed-call text back</h3>
              <p>Perfect, that’s actually good.</p>
              <p>
                Are you also following up automatically with people who don’t book,
                no-show, or don’t respond after the first message?
              </p>
              <p>
                That’s usually the next leak. A lot of businesses have the first
                text, but no real follow-up system after that.
              </p>
            </div>

            <div className="scriptSection">
              <h3>4. If they ask how much</h3>
              <p>
                It depends on how much automation you want, but most businesses
                start around a few hundred dollars per month.
              </p>
              <p>
                The better question is whether it can recover enough missed
                opportunities to pay for itself. That’s what I’d show you on the
                demo.
              </p>
            </div>

            <div className="scriptSection closeBox">
              <h3>Best Close</h3>
              <p>Would later today or tomorrow be better for a quick 10-minute demo?</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}