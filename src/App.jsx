import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import "./App.css";

const sampleLeads = [
  {
  id: "sample-1",
  businessName: "Glow Med Spa",
    phone: "(407) 555-0188",
    website: "https://example.com",
    googleRating: 4.8,
    reviewCount: 243,
    hasMctb: "No",
    websiteQuality: "Average",
    onlineBooking: "Weak",
    serviceType: "Med Spa",
    afterHoursResponse: "No text back",
    manusNotes:
      "High review count, appointment-based, no obvious missed-call text back.",
    status: "New",
  },
  {
  id: "sample-2",
  businessName: "Elite Auto Care",
    phone: "(407) 555-0144",
    website: "https://example.com",
    googleRating: 4.6,
    reviewCount: 128,
    hasMctb: "Unknown",
    websiteQuality: "Bad",
    onlineBooking: "None",
    serviceType: "Auto Service",
    afterHoursResponse: "No answer",
    manusNotes: "Auto repair shop with weak website and no clear online booking.",
    status: "New",
  },
  {
  id: "sample-3",
  businessName: "Smile Studio Dental",
    phone: "(407) 555-0199",
    website: "https://example.com",
    googleRating: 4.3,
    reviewCount: 61,
    hasMctb: "Yes",
    websiteQuality: "Good",
    onlineBooking: "Strong",
    serviceType: "Dental",
    afterHoursResponse: "Answered",
    manusNotes:
      "Decent business, but already has strong booking and response systems.",
    status: "New",
  },
];

function calculateLeadScore(lead) {
  let score = 0;

  const rating = parseFloat(lead.googleRating || 0);
  const reviews = parseInt(lead.reviewCount || 0);
  const hasMctb = String(lead.hasMctb || "").toLowerCase();
  const websiteQuality = String(lead.websiteQuality || "").toLowerCase();
  const onlineBooking = String(lead.onlineBooking || "").toLowerCase();
  const afterHours = String(lead.afterHoursResponse || "").toLowerCase();
  const serviceType = String(lead.serviceType || "").toLowerCase();

  if (hasMctb === "no") score += 25;
  if (hasMctb === "unknown") score += 5;

  if (reviews >= 200) score += 20;
  else if (reviews >= 100) score += 15;
  else if (reviews >= 50) score += 10;

  if (rating >= 4.7) score += 15;
  else if (rating >= 4.4) score += 10;
  else if (rating >= 4.0) score += 5;

  if (websiteQuality === "bad") score += 15;
  else if (websiteQuality === "average") score += 8;

  if (onlineBooking === "none") score += 15;
  else if (onlineBooking === "weak") score += 10;

  if (afterHours.includes("no text")) score += 20;
  else if (afterHours.includes("no answer")) score += 12;

  if (serviceType.includes("med spa")) score += 10;
  if (serviceType.includes("auto")) score += 8;
  if (serviceType.includes("dental")) score += 8;

  return Math.min(score, 100);
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

export default function App() {
  const [leads, setLeads] = useState(() => {
  const savedLeads = localStorage.getItem("bookoraLeads");

  if (savedLeads) {
    return JSON.parse(savedLeads);
  }

  return sampleLeads;
});

const [priorityFilter, setPriorityFilter] = useState("All");
const [searchTerm, setSearchTerm] = useState("");
const [theme, setTheme] = useState("light");
const [showScript, setShowScript] = useState(false);

const [showPasteCsv, setShowPasteCsv] = useState(false);
const [pastedCsv, setPastedCsv] = useState("");

useEffect(() => {
  localStorage.setItem("bookoraLeads", JSON.stringify(leads));
}, [leads]);

function importLeadsFromCsvText(csvText) {
  Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const cleanedLeads = results.data
        .filter((lead) => lead.businessName && lead.phone)
        .map((lead, index) => ({
          id: lead.id || `${Date.now()}-${index}`,
          businessName: lead.businessName || "",
          phone: lead.phone || "",
          website: lead.website || "",
          googleRating: lead.googleRating || "0",
          reviewCount: lead.reviewCount || "0",
          hasMctb: lead.hasMctb || "Unknown",
          websiteQuality: lead.websiteQuality || "Average",
          onlineBooking: lead.onlineBooking || "Unknown",
          serviceType: lead.serviceType || "Other",
          afterHoursResponse: lead.afterHoursResponse || "Unknown",
          manusNotes: lead.manusNotes || "",
          callerNotes: lead.callerNotes || "",
          status: lead.status || "New",
        }));

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

function deleteLead(id) {
  setLeads((currentLeads) => currentLeads.filter((lead) => lead.id !== id));
}

function clearAllLeads() {
  const confirmed = window.confirm(
    "Are you sure you want to clear all leads from this dashboard?"
  );

  if (confirmed) {
    setLeads([]);
  }
}

function resetSampleLeads() {
  setLeads(sampleLeads);
}

  const scoredLeads = useMemo(() => {
    return leads
      .map((lead) => {
        const score = calculateLeadScore(lead);
        const priority = getLeadPriority(score);

        return {
          ...lead,
          leadScore: score,
          priority,
        };
      })
      .filter((lead) => {
        const matchesPriority =
          priorityFilter === "All" || lead.priority === priorityFilter;

        const search = searchTerm.toLowerCase();

        const matchesSearch =
          lead.businessName.toLowerCase().includes(search) ||
          lead.serviceType.toLowerCase().includes(search) ||
          lead.phone.toLowerCase().includes(search);

        return matchesPriority && matchesSearch;
      })
      .sort((a, b) => b.leadScore - a.leadScore);
  }, [leads, priorityFilter, searchTerm]);

  const summary = useMemo(() => {
    const scored = leads.map((lead) => getLeadPriority(calculateLeadScore(lead)));

    return {
      hot: scored.filter((item) => item === "Hot").length,
      warm: scored.filter((item) => item === "Warm").length,
      maybe: scored.filter((item) => item === "Maybe").length,
      total: leads.length,
    };
  }, [leads]);

  return (
    <div className={`app ${theme}`}>
      <header className="hero">
        <div>
          <p className="eyebrow">Bookora</p>
          <h1>Hot Lead Dashboard</h1>
          <p className="subtitle">
            Prioritize the businesses most likely to need missed-call text back,
            AI receptionist, appointment reminders, and lead follow-up.
          </p>
        </div>

        <div className="heroActions">
  <button
    className="themeToggle"
    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
  >
    {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
  </button>

  <div className="heroCard">
    <p>Call First</p>
    <h2>{summary.hot > 0 ? "Hot Leads" : "Warm Leads"}</h2>
  </div>
</div>
      </header>

      <section className="summaryGrid">
        <div className="summaryCard">
          <p>Hot Leads</p>
          <h3>{summary.hot}</h3>
        </div>

        <div className="summaryCard">
          <p>Warm Leads</p>
          <h3>{summary.warm}</h3>
        </div>

        <div className="summaryCard">
          <p>Maybe</p>
          <h3>{summary.maybe}</h3>
        </div>

        <div className="summaryCard">
          <p>Total Leads</p>
          <h3>{summary.total}</h3>
        </div>
      </section>

      <section className="controls">
  <input
    type="text"
    placeholder="Search business, phone, or niche..."
    value={searchTerm}
    onChange={(event) => setSearchTerm(event.target.value)}
  />

  <label className="uploadButton">
  Upload Manus CSV
  <input type="file" accept=".csv" onChange={handleCsvUpload} />
</label>

<button className="pasteButton" onClick={() => setShowPasteCsv(true)}>
  Paste CSV
</button>

  <button className="scriptButton" onClick={() => setShowScript(true)}>
    View Call Script
  </button>

  <div className="filterButtons">
          {["All", "Hot", "Warm", "Maybe", "Skip"].map((priority) => (
            <button
              key={priority}
              onClick={() => setPriorityFilter(priority)}
              className={priorityFilter === priority ? "active" : ""}
            >
              {priority}
            </button>
          ))}
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
                <p className="serviceType">{lead.serviceType}</p>
              </div>

              <div className={`badge ${getPriorityClass(lead.priority)}`}>
                {lead.priority}
              </div>
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
                <span>Has MCTB:</span> {lead.hasMctb}
              </p>
              <p>
                <span>Website Quality:</span> {lead.websiteQuality}
              </p>
              <p>
                <span>Online Booking:</span> {lead.onlineBooking}
              </p>
              <p>
                <span>After Hours:</span> {lead.afterHoursResponse}
              </p>
              <p>
                <span>Status:</span> {lead.status}
              </p>
            </div>

            <div className="notes">
              <p className="smallLabel">Manus Notes</p>
              <p>{lead.manusNotes}</p>
            </div>

            <div className="leadEditor">
  <label>
    Status
    <select
      value={lead.status}
      onChange={(event) => updateLead(lead.id, "status", event.target.value)}
    >
      <option>New</option>
      <option>Contacted</option>
      <option>Follow Up</option>
      <option>Demo Set</option>
      <option>Not Interested</option>
      <option>Closed</option>
      <option>No Answer</option>
      <option>Bad Number</option>
    </select>
  </label>

  <label>
    Caller Notes
    <textarea
      value={lead.callerNotes || ""}
      onChange={(event) =>
        updateLead(lead.id, "callerNotes", event.target.value)
      }
      placeholder="Add notes from your call..."
    />
  </label>

  <button className="deleteLeadButton" onClick={() => deleteLead(lead.id)}>
    Delete Lead
  </button>
</div>

            <div className="actions">
              <a
  href={`tel:${String(lead.phone).replace(/\D/g, "")}`}
  className="callButton"
>
  Call Now
</a>

              <a
                href={lead.website}
                target="_blank"
                rel="noreferrer"
                className="siteButton"
              >
                View Website
              </a>
            </div>
          </article>
        ))}
            </main>

            {showPasteCsv && (
  <div className="scriptOverlay">
    <div className="scriptModal">
      <div className="scriptHeader">
        <div>
          <p className="eyebrow darkEyebrow">Bookora CSV Import</p>
          <h2>Paste Manus CSV</h2>
        </div>

        <button
          className="closeScript"
          onClick={() => setShowPasteCsv(false)}
        >
          ✕
        </button>
      </div>

      <div className="scriptSection">
        <p>
          Paste the full CSV from Manus below. Make sure the first row includes
          the correct headers like businessName, phone, website, googleRating,
          reviewCount, and so on.
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

              <button
                className="closeScript"
                onClick={() => setShowScript(false)}
              >
                ✕
              </button>
            </div>

            <div className="scriptSection">
              <h3>1. Opener</h3>
              <p>
                Hey, is this the person who handles new appointments and
                customer inquiries?
              </p>
              <p>
                Perfect — I’ll be quick. My name is Anthony with Bookora. We
                help local businesses recover missed calls and book more
                appointments automatically using missed-call text back, AI
                receptionist support, reminders, and follow-up automations.
              </p>
              <p>
                Quick question — when someone calls and your team misses the
                call, do they automatically get a text back right away?
              </p>
            </div>

            <div className="scriptSection">
              <h3>2. If they say no</h3>
              <p>
                Got it — that’s exactly where we usually find the biggest
                opportunity.
              </p>
              <p>
                Most people don’t leave voicemails anymore. They usually call
                the next business. So even a few missed calls per week can turn
                into lost appointments.
              </p>
              <p>
                What we do is simple: if a call is missed, the system texts them
                immediately, helps capture what they need, and can push them
                toward booking or getting a callback.
              </p>
              <p>
                I’d just like to show you in 10 minutes how it works and see if
                it would make sense for your business. Would later today or
                tomorrow be better?
              </p>
            </div>

            <div className="scriptSection">
              <h3>3. If they already have missed-call text back</h3>
              <p>Perfect, that’s actually good.</p>
              <p>
                Are you also following up automatically with people who don’t
                book, no-show, or don’t respond after the first message?
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
              <p>Do you have 10 minutes today or tomorrow?</p>
            </div>

            <div className="scriptSection">
              <h3>5. If they say send information</h3>
              <p>Absolutely, I can send it over.</p>
              <p>
                Just so I send the right thing — are you more interested in
                missed-call text back, AI receptionist, appointment reminders,
                or follow-up for old leads?
              </p>
              <p>
                Perfect. I’ll send that over. And honestly, it makes more sense
                if I show you the workflow live for 10 minutes so you can see
                how it would apply to your business.
              </p>
              <p>What’s better, later today or tomorrow?</p>
            </div>

            <div className="scriptSection">
              <h3>6. If they say not interested</h3>
              <p>No problem at all.</p>
              <p>
                Before I let you go — are you currently happy with how every
                missed call, no-show, and unbooked lead gets followed up with?
              </p>
              <p>
                That’s really the only thing I wanted to show you. It’s not a
                full marketing overhaul — it’s just plugging the leaks from
                people who already reached out.
              </p>
              <p>Would a quick 10-minute look be unreasonable?</p>
            </div>

            <div className="scriptSection closeBox">
              <h3>Best Close</h3>
              <p>
                Would later today or tomorrow be better for a quick 10-minute
                demo?
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}