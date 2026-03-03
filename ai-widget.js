/* ============================================================
   SGI EUROPE - CONTENT FINDER (STRIP BAR UI)  ✅ COPY/PASTE READY
   - Full-width bottom strip (not a floating card)
   - Keeps same fields: Job title/role + Company website URL
   - Keeps features: progress bar + stage text + smooth % animation
   - Adds: results drawer (slides up) while the strip stays as the “control bar”
   - Calls backend:
       POST https://three33-ai.onrender.com/recommend
       body: { "job_title": "...", "website_url": "https://..." }
   ============================================================ */

console.log("✅ SGI Strip Widget Loaded");

(function () {
  const API_BASE = "https://three33-ai.onrender.com";

  // -----------------------------
  // Helpers
  // -----------------------------
  function escapeHtml(str) {
    return (str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeWebsiteUrl(raw) {
    let url = (raw || "").trim();
    if (!url) return "";
    if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;
    return url;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  // Smooth progress animator (percent + bar width)
  function createProgressAnimator({ onUpdate }) {
    let current = 0;
    let target = 0;
    let raf = null;
    let lastTs = 0;

    function step(ts) {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      // critically-damped-ish easing: move a % of the remaining distance
      const diff = target - current;
      const speed = 10; // larger = snappier
      current = current + diff * (1 - Math.exp(-speed * dt));

      // snap if very close
      if (Math.abs(diff) < 0.15) current = target;

      onUpdate(current);

      if (current !== target) raf = requestAnimationFrame(step);
      else raf = null;
    }

    function setTarget(p) {
      target = clamp(p, 0, 100);
      if (!raf) {
        lastTs = 0;
        raf = requestAnimationFrame(step);
      }
    }

    function setInstant(p) {
      current = clamp(p, 0, 100);
      target = current;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      onUpdate(current);
    }

    function getCurrent() {
      return current;
    }

    return { setTarget, setInstant, getCurrent };
  }

  // Stage mapping (used when backend doesn't provide explicit progress)
  const STAGES = [
    { key: "starting", pct: 6, text: "Starting…" },
    { key: "fetching_company_site", pct: 18, text: "Checking your website…" },
    { key: "extracting_signals", pct: 32, text: "Extracting key topics…" },
    { key: "collecting_sgi_links", pct: 48, text: "Scanning SGI sections…" },
    { key: "fetching_sgi_pages", pct: 66, text: "Reading SGI pages…" },
    { key: "scoring", pct: 80, text: "Ranking relevance…" },
    { key: "summarizing", pct: 90, text: "Writing summaries…" },
    { key: "finalizing", pct: 96, text: "Finalizing…" },
    { key: "done", pct: 100, text: "Done ✅" },
  ];

  function stageByKey(key) {
    return STAGES.find((s) => s.key === key) || STAGES[0];
  }

  // If your backend later returns progress info, this will “sync” to it.
  // Supported (optional) response shapes:
  //   { meta: { stage: "scoring", progress: 80, message: "..." }, articles: [...] }
  //   { progress: { stage: "...", percent: 50, message: "..." }, articles: [...] }
  function readBackendProgress(data) {
    const meta = data?.meta || data?.progress || null;
    if (!meta) return null;

    const stage = meta.stage || meta.key || null;
    const percent =
      typeof meta.progress === "number"
        ? meta.progress
        : typeof meta.percent === "number"
          ? meta.percent
          : null;
    const message = meta.message || meta.text || null;

    return { stage, percent, message };
  }

  // -----------------------------
  // UI Creation
  // -----------------------------
  function injectStyles() {
    if (document.getElementById("sgi-strip-widget-styles")) return;

    const css = `
      :root{
        --sgi-purple:#4f46e5;
        --sgi-purple-2:#7c3aed;
        --sgi-ink:#111827;
        --sgi-muted:#6b7280;
        --sgi-border:#e5e7eb;
        --sgi-bg:#ffffff;
        --sgi-soft:#f8fafc;
        --sgi-shadow: 0 18px 60px rgba(0,0,0,0.22);
      }

      #sgi-strip-root, #sgi-strip-root * { box-sizing: border-box; }

      /* Bottom strip bar */
      #sgi-strip-root {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 999999;
        background: var(--sgi-bg);
        border-top: 1px solid var(--sgi-border);
        box-shadow: 0 -10px 28px rgba(0,0,0,0.10);
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji;
      }

      #sgi-strip-inner {
        max-width: 1200px;
        margin: 0 auto;
        padding: 12px 14px;
      }

      /* Row 1 (inputs + button) */
      #sgi-strip-row1 {
        display: grid;
        grid-template-columns: 220px 1fr 1fr 220px 38px;
        gap: 10px;
        align-items: center;
      }

      /* Responsive */
      @media (max-width: 980px){
        #sgi-strip-row1 {
          grid-template-columns: 1fr 1fr 160px 38px;
        }
        #sgi-strip-brand { display:none; }
      }
      @media (max-width: 720px){
        #sgi-strip-row1 {
          grid-template-columns: 1fr 1fr 38px;
          grid-auto-rows: auto;
        }
        #sgi-strip-job-wrap { grid-column: 1 / span 1; }
        #sgi-strip-site-wrap { grid-column: 2 / span 1; }
        #sgi-strip-btn { grid-column: 1 / span 2; }
      }

      #sgi-strip-brand {
        display:flex;
        align-items:center;
        gap:10px;
        min-width: 0;
      }
      #sgi-strip-badge {
        width: 38px;
        height: 38px;
        border-radius: 14px;
        display:flex;
        align-items:center;
        justify-content:center;
        color:#fff;
        font-weight: 900;
        background: linear-gradient(135deg, var(--sgi-purple), var(--sgi-purple-2));
      }
      #sgi-strip-title {
        min-width: 0;
      }
      #sgi-strip-title .h {
        font-weight: 900;
        color: var(--sgi-ink);
        font-size: 13px;
        line-height: 1.15;
      }
      #sgi-strip-title .s {
        color: var(--sgi-muted);
        font-size: 11px;
        line-height: 1.15;
        margin-top: 2px;
      }

      .sgi-input-label {
        font-size: 11px;
        color: var(--sgi-muted);
        font-weight: 800;
        margin-bottom: 6px;
      }

      .sgi-input {
        width: 100%;
        height: 44px;
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid var(--sgi-border);
        outline: none;
        font-size: 13px;
        background: #fff;
        color: var(--sgi-ink);
      }
      .sgi-input:focus{
        border-color:#c7d2fe;
        box-shadow: 0 0 0 4px rgba(79,70,229,0.12);
      }

      #sgi-strip-btn {
        height: 44px;
        border: none;
        border-radius: 14px;
        background: var(--sgi-purple);
        color: #fff;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 10px 18px rgba(79,70,229,0.25);
        transition: transform 120ms ease, opacity 120ms ease;
        font-size: 13px;
      }
      #sgi-strip-btn:hover { transform: translateY(-1px); }
      #sgi-strip-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

      #sgi-strip-close {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        border: 1px solid var(--sgi-border);
        background: #fff;
        cursor: pointer;
        font-weight: 900;
        color: var(--sgi-ink);
      }

      /* Row 2 (progress) */
      #sgi-strip-row2 {
        margin-top: 10px;
        padding: 10px 12px;
        border: 1px solid var(--sgi-border);
        border-radius: 14px;
        background: var(--sgi-soft);
        display: none; /* shown during runs */
      }
      #sgi-strip-progress-top {
        display:flex;
        align-items:center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 8px;
      }
      #sgi-strip-progress-text {
        font-size: 12px;
        color: #374151;
        font-weight: 900;
      }
      #sgi-strip-progress-pct {
        font-size: 12px;
        color: #374151;
        font-weight: 900;
      }
      #sgi-strip-progress-track {
        height: 10px;
        width: 100%;
        background: #e5e7eb;
        border-radius: 999px;
        overflow: hidden;
      }
      #sgi-strip-progress-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, var(--sgi-purple), var(--sgi-purple-2));
        border-radius: 999px;
        transition: width 200ms ease;
      }

      /* Results drawer */
      #sgi-results-drawer {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 70px; /* sits above strip */
        z-index: 999998;
        display: none;
      }
      #sgi-results-panel {
        max-width: 1200px;
        margin: 0 auto;
        background: #fff;
        border: 1px solid var(--sgi-border);
        border-radius: 18px;
        box-shadow: var(--sgi-shadow);
        overflow: hidden;
      }
      #sgi-results-header{
        padding: 12px 14px;
        display:flex;
        align-items:center;
        justify-content: space-between;
        gap: 10px;
        border-bottom: 1px solid #eef2f7;
        background: linear-gradient(180deg, #ffffff, #fafafa);
      }
      #sgi-results-header .left{
        display:flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      #sgi-results-header .left .h{
        font-weight: 900;
        color: var(--sgi-ink);
        font-size: 14px;
      }
      #sgi-results-header .left .s{
        color: var(--sgi-muted);
        font-size: 12px;
      }
      #sgi-results-close{
        border: 1px solid var(--sgi-border);
        background:#fff;
        border-radius: 12px;
        padding: 8px 10px;
        cursor: pointer;
        font-weight: 900;
      }
      #sgi-results-body{
        padding: 12px 14px;
        max-height: 48vh;
        overflow: auto;
      }

      .sgi-card{
        border: 1px solid var(--sgi-border);
        border-radius: 16px;
        padding: 12px;
        background:#fff;
      }
      .sgi-card + .sgi-card{ margin-top: 10px; }

      .sgi-card-top{
        display:flex;
        align-items:flex-start;
        justify-content: space-between;
        gap: 10px;
      }
      .sgi-card-title{
        font-weight: 900;
        font-size: 14px;
        color: var(--sgi-ink);
        line-height: 1.25;
      }
      .sgi-card-link{
        display:inline-block;
        margin-top: 6px;
        color: var(--sgi-purple);
        font-size: 12px;
        text-decoration: none;
        word-break: break-all;
      }
      .sgi-badge{
        padding: 6px 10px;
        border-radius: 999px;
        font-weight: 900;
        font-size: 12px;
        white-space: nowrap;
      }
      .sgi-card-section{
        margin-top: 10px;
        color: #374151;
        font-size: 13px;
        line-height: 1.5;
      }
      .sgi-muted{
        color: var(--sgi-muted);
        font-size: 12px;
        line-height: 1.4;
      }
    `;

    const style = document.createElement("style");
    style.id = "sgi-strip-widget-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function badgeColors(score) {
    const s = typeof score === "number" ? score : 0;
    if (s >= 90) return { bg: "#dcfce7", fg: "#166534" };
    if (s >= 70) return { bg: "#e0f2fe", fg: "#075985" };
    if (s >= 50) return { bg: "#fef9c3", fg: "#854d0e" };
    return { bg: "#fee2e2", fg: "#991b1b" };
  }

  function renderResults(listEl, items) {
    listEl.innerHTML = (items || [])
      .map((a) => {
        const title = escapeHtml(a.title || "Untitled");
        const url = escapeHtml(a.url || "#");
        const summary = escapeHtml(a.summary || "");
        const reason = escapeHtml(a.relevance_reason || "");
        const score = typeof a.relevance_score === "number" ? a.relevance_score : 0;

        const { bg, fg } = badgeColors(score);

        return `
          <div class="sgi-card">
            <div class="sgi-card-top">
              <div style="min-width:0;">
                <div class="sgi-card-title">${title}</div>
                <a class="sgi-card-link" href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>
              </div>
              <div class="sgi-badge" style="background:${bg};color:${fg};">${score}/100</div>
            </div>

            ${summary ? `<div class="sgi-card-section"><b>Summary:</b> ${summary}</div>` : ""}
            ${reason ? `<div class="sgi-card-section"><b>Why it’s relevant:</b> ${reason}</div>` : ""}
          </div>
        `;
      })
      .join("");
  }

  // -----------------------------
  // Create Widget
  // -----------------------------
  function createWidget() {
    if (document.getElementById("sgi-strip-root")) return;

    injectStyles();

    // Root strip
    const root = document.createElement("div");
    root.id = "sgi-strip-root";

    const inner = document.createElement("div");
    inner.id = "sgi-strip-inner";

    // Row 1
    const row1 = document.createElement("div");
    row1.id = "sgi-strip-row1";

    const brand = document.createElement("div");
    brand.id = "sgi-strip-brand";
    brand.innerHTML = `
      <div id="sgi-strip-badge">SGI</div>
      <div id="sgi-strip-title">
        <div class="h">SGI Content Finder</div>
        <div class="s">Matches SGI coverage to your role + your site</div>
      </div>
    `;

    const jobWrap = document.createElement("div");
    jobWrap.id = "sgi-strip-job-wrap";
    jobWrap.innerHTML = `
      <div class="sgi-input-label">Your job title / role</div>
      <input id="sgi-strip-job" class="sgi-input" type="text" placeholder="e.g. Digital marketing manager" />
    `;

    const siteWrap = document.createElement("div");
    siteWrap.id = "sgi-strip-site-wrap";
    siteWrap.innerHTML = `
      <div class="sgi-input-label">Your company website URL</div>
      <input id="sgi-strip-site" class="sgi-input" type="text" placeholder="e.g. https://yourcompany.com" />
    `;

    const btn = document.createElement("button");
    btn.id = "sgi-strip-btn";
    btn.type = "button";
    btn.textContent = "Find SGI content for me";

    const close = document.createElement("button");
    close.id = "sgi-strip-close";
    close.type = "button";
    close.title = "Hide";
    close.textContent = "✕";

    row1.appendChild(brand);
    row1.appendChild(jobWrap);
    row1.appendChild(siteWrap);
    row1.appendChild(btn);
    row1.appendChild(close);

    // Row 2 progress
    const row2 = document.createElement("div");
    row2.id = "sgi-strip-row2";
    row2.innerHTML = `
      <div id="sgi-strip-progress-top">
        <div id="sgi-strip-progress-text">Starting…</div>
        <div id="sgi-strip-progress-pct">0%</div>
      </div>
      <div id="sgi-strip-progress-track">
        <div id="sgi-strip-progress-fill"></div>
      </div>
      <div class="sgi-muted" style="margin-top:8px;">
        We only recommend content from <b>sgieurope.com</b>.
      </div>
    `;

    inner.appendChild(row1);
    inner.appendChild(row2);
    root.appendChild(inner);
    document.body.appendChild(root);

    // Results drawer (separate from strip)
    const drawer = document.createElement("div");
    drawer.id = "sgi-results-drawer";
    drawer.innerHTML = `
      <div id="sgi-results-panel">
        <div id="sgi-results-header">
          <div class="left">
            <div class="h">Your SGI matches</div>
            <div class="s">Top SGI items based on your role and your company site</div>
          </div>
          <button id="sgi-results-close" type="button">Close</button>
        </div>
        <div id="sgi-results-body">
          <div class="sgi-card">
            <div class="sgi-card-title">No results yet</div>
            <div class="sgi-card-section">Run a search from the bar below.</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);

    // Elements
    const jobInput = document.getElementById("sgi-strip-job");
    const siteInput = document.getElementById("sgi-strip-site");
    const progressWrap = row2;
    const progressText = document.getElementById("sgi-strip-progress-text");
    const progressPct = document.getElementById("sgi-strip-progress-pct");
    const progressFill = document.getElementById("sgi-strip-progress-fill");
    const resultsBody = document.getElementById("sgi-results-body");
    const resultsClose = document.getElementById("sgi-results-close");

    // Progress animator
    const animator = createProgressAnimator({
      onUpdate: (p) => {
        const pct = Math.round(p);
        progressFill.style.width = pct + "%";
        progressPct.textContent = pct + "%";
      },
    });

    function setLoading(isLoading) {
      btn.disabled = isLoading;
      btn.textContent = isLoading ? "Working…" : "Find SGI content for me";
    }

    function showDrawer() {
      drawer.style.display = "block";
    }

    function hideDrawer() {
      drawer.style.display = "none";
    }

    function setStage(key) {
      const s = stageByKey(key);
      progressText.textContent = s.text;
      animator.setTarget(s.pct);
    }

    // Simulated stage runner (fallback)
    function startSimulatedStages() {
      const sequence = [
        "starting",
        "fetching_company_site",
        "extracting_signals",
        "collecting_sgi_links",
        "fetching_sgi_pages",
        "scoring",
        "summarizing",
        "finalizing",
      ];
      let idx = 0;

      setStage(sequence[0]);

      const timer = setInterval(() => {
        idx = Math.min(idx + 1, sequence.length - 1);
        setStage(sequence[idx]);

        // after finalizing, creep to 97% and wait (never hit 100 until done)
        if (sequence[idx] === "finalizing") {
          clearInterval(timer);
          const creep = setInterval(() => {
            const cur = animator.getCurrent();
            if (cur < 97) animator.setTarget(cur + 0.6);
          }, 900);
          return () => clearInterval(creep);
        }
      }, 900);

      return () => clearInterval(timer);
    }

    // Main submit
    async function submit() {
      const job_title = (jobInput.value || "").trim();
      const website_url = normalizeWebsiteUrl(siteInput.value || "");

      if (!job_title) {
        progressWrap.style.display = "block";
        progressText.textContent = "Please enter your job title / role.";
        animator.setInstant(0);
        return;
      }

      if (!website_url || website_url.length < 8) {
        progressWrap.style.display = "block";
        progressText.textContent = "Please enter a valid website URL (https://…).";
        animator.setInstant(0);
        return;
      }

      // Show progress + reset
      progressWrap.style.display = "block";
      animator.setInstant(0);
      progressText.textContent = "Starting…";
      progressPct.textContent = "0%";
      progressFill.style.width = "0%";

      // Open drawer and show “working…”
      showDrawer();
      resultsBody.innerHTML = `
        <div class="sgi-card">
          <div class="sgi-card-title">⏳ Working…</div>
          <div class="sgi-card-section">We’re scanning your website and matching SGI coverage.</div>
        </div>
      `;

      setLoading(true);

      // Start fallback stages (used unless backend returns progress info)
      let stopSim = startSimulatedStages();

      try {
        // NOTE: This is a normal POST.
        // If you later add streaming progress (SSE/WebSocket) on the backend,
        // we can replace this with live updates. For now, we sync to:
        // - request lifecycle milestones
        // - optional progress fields in JSON response.
        const resp = await fetch(`${API_BASE}/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_title, website_url }),
        });

        // When headers arrive, we’re usually past “fetching SGI pages”
        // (helps sync to real request progress)
        animator.setTarget(Math.max(animator.getCurrent(), 72));
        progressText.textContent = "Processing results…";

        let data;
        try {
          data = await resp.json();
        } catch {
          throw new Error(`Server returned invalid JSON (HTTP ${resp.status}).`);
        }

        if (!resp.ok) {
          throw new Error(data?.detail || data?.error || `Server error (HTTP ${resp.status}).`);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        // If backend included progress meta, sync to it (best-effort)
        const prog = readBackendProgress(data);
        if (prog) {
          // Stop simulation and use backend info
          if (stopSim) stopSim();
          stopSim = null;

          if (typeof prog.percent === "number") {
            progressText.textContent = prog.message || "Working…";
            animator.setTarget(clamp(prog.percent, 0, 99));
          } else if (prog.stage) {
            const s = stageByKey(prog.stage);
            progressText.textContent = prog.message || s.text;
            animator.setTarget(clamp(s.pct, 0, 99));
          }
        }

        // Render results
        const articles = data?.articles || [];
        if (!articles.length) {
          if (stopSim) stopSim();
          progressText.textContent = "Done ✅";
          animator.setTarget(100);

          resultsBody.innerHTML = `
            <div class="sgi-card">
              <div class="sgi-card-title">No strong matches found</div>
              <div class="sgi-card-section">
                Try a more specific job title (e.g. “DTC e-commerce manager”, “sports retail buyer”, “trade policy advisor”).
              </div>
            </div>
          `;
          return;
        }

        // Final sync
        if (stopSim) stopSim();
        progressText.textContent = "Done ✅";
        animator.setTarget(100);

        renderResults(resultsBody, articles);
      } catch (e) {
        if (stopSim) stopSim();
        progressText.textContent = "Failed ❌";
        animator.setTarget(Math.max(animator.getCurrent(), 12));

        resultsBody.innerHTML = `
          <div class="sgi-card">
            <div class="sgi-card-title">❌ Error</div>
            <div class="sgi-card-section" style="white-space:pre-wrap;">${escapeHtml(e?.message || "Failed to fetch.")}</div>
          </div>
        `;
      } finally {
        setLoading(false);
      }
    }

    // Events
    btn.addEventListener("click", submit);
    jobInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") submit();
    });
    siteInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") submit();
    });

    close.addEventListener("click", () => {
      // Hide strip + drawer (you can remove this if you never want it closable)
      root.style.display = "none";
      hideDrawer();
    });

    resultsClose.addEventListener("click", hideDrawer);

    window.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        hideDrawer();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createWidget);
  } else {
    createWidget();
  }
})();
