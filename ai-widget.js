/* ============================================================
   SGI EUROPE - Visitor Recommender Widget (COPY + PASTE READY)
   ✅ Real backend progress events (SSE via fetch streaming)
   ✅ Smooth percentage animation (no jumping)
   ✅ Uses:
      POST /recommend_stream
      body: { "job_title": "...", "website_url": "https://..." }
   ============================================================ */

console.log("✅ SGI Europe Recommender Widget Loaded");

(function () {
  const API_BASE = "https://three33-ai.onrender.com";

  // ---------- Helpers ----------
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "style") Object.assign(node.style, v);
      else if (k === "className") node.className = v;
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

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

  function setLoading(btn, isLoading) {
    btn.disabled = isLoading;
    btn.style.opacity = isLoading ? "0.78" : "1";
    btn.style.cursor = isLoading ? "not-allowed" : "pointer";
    btn.textContent = isLoading ? "Working…" : "Find SGI content for me";
  }

  function renderEmpty(stateEl) {
    stateEl.innerHTML = `
      <div style="padding:12px;border:1px dashed #e5e7eb;border-radius:14px;background:#fafafa;color:#374151;line-height:1.45;">
        Enter your <b>role</b> and <b>website</b>, then click <b>Find SGI content for me</b>.
        <div style="margin-top:8px;color:#6b7280;font-size:12px;">
          We only recommend content from <b>sgieurope.com</b>.
        </div>
      </div>
    `;
  }

  function renderError(stateEl, message) {
    stateEl.innerHTML = `
      <div style="padding:12px;border:1px solid #fecaca;border-radius:14px;background:#fff1f2;color:#991b1b;line-height:1.45;">
        <b>❌ Error</b>
        <div style="margin-top:6px;white-space:pre-wrap;">${escapeHtml(message || "Something went wrong.")}</div>
      </div>
    `;
  }

  function renderResults(stateEl, items) {
    const html = items
      .map((a) => {
        const title = escapeHtml(a.title || "Untitled");
        const url = escapeHtml(a.url || "#");
        const summary = escapeHtml(a.summary || "");
        const reason = escapeHtml(a.relevance_reason || "");
        const score = typeof a.relevance_score === "number" ? a.relevance_score : 0;

        const badgeBg =
          score >= 90 ? "#dcfce7" : score >= 70 ? "#e0f2fe" : score >= 50 ? "#fef9c3" : "#fee2e2";
        const badgeText =
          score >= 90 ? "#166534" : score >= 70 ? "#075985" : score >= 50 ? "#854d0e" : "#991b1b";

        return `
          <div style="border:1px solid #e5e7eb;border-radius:16px;padding:12px;background:#fff;">
            <div style="display:flex;gap:10px;align-items:flex-start;justify-content:space-between;">
              <div style="min-width:0;">
                <div style="font-weight:900;font-size:14px;color:#111827;line-height:1.25;">
                  ${title}
                </div>
                <a href="${url}" target="_blank" rel="noopener noreferrer"
                   style="display:inline-block;margin-top:7px;color:#4f46e5;font-size:12px;text-decoration:none;word-break:break-all;">
                  ${url}
                </a>
              </div>
              <div style="flex:0 0 auto;">
                <div style="padding:6px 10px;border-radius:999px;background:${badgeBg};color:${badgeText};font-weight:900;font-size:12px;">
                  ${score}/100
                </div>
              </div>
            </div>

            ${summary ? `
              <div style="margin-top:10px;color:#374151;font-size:13px;line-height:1.5;">
                <b>Summary:</b> ${summary}
              </div>` : ""}

            ${reason ? `
              <div style="margin-top:10px;color:#374151;font-size:13px;line-height:1.5;">
                <b>Why it’s relevant to you:</b> ${reason}
              </div>` : ""}
          </div>
        `;
      })
      .join("");

    stateEl.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px;">${html}</div>`;
  }

  // ---------- Smooth progress animator ----------
  function makeProgressAnimator(progressFill, progressText) {
    let current = 0;
    let target = 0;
    let lastMsg = "Starting…";
    let raf = null;

    function tick() {
      // smooth easing toward target
      const diff = target - current;
      current = current + diff * 0.12; // easing factor

      // snap near target
      if (Math.abs(diff) < 0.2) current = target;

      const pct = Math.max(0, Math.min(100, current));
      progressFill.style.width = pct.toFixed(0) + "%";
      progressText.textContent = `${lastMsg} (${pct.toFixed(0)}%)`;

      if (current !== target) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }

    return {
      set(p, msg) {
        target = Math.max(0, Math.min(100, Number(p) || 0));
        lastMsg = msg || lastMsg || "Working…";
        if (!raf) raf = requestAnimationFrame(tick);
      },
      done(msg) {
        target = 100;
        lastMsg = msg || "Done ✅";
        if (!raf) raf = requestAnimationFrame(tick);
      },
      reset() {
        current = 0;
        target = 0;
        lastMsg = "Starting…";
        progressFill.style.width = "0%";
        progressText.textContent = "Starting… (0%)";
        if (raf) cancelAnimationFrame(raf);
        raf = null;
      },
    };
  }

  // ---------- Stream parser (SSE over fetch POST) ----------
  async function postSSE(url, body, onEvent) {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      let msg = `Server error (HTTP ${resp.status})`;
      try {
        const j = await resp.json();
        msg = j?.detail || j?.error || msg;
      } catch {}
      throw new Error(msg);
    }

    if (!resp.body) {
      throw new Error("Streaming not supported by this browser.");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";
    let eventName = "message";
    let dataLines = [];

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // process by SSE frame separator
      let idx;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const rawFrame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        const lines = rawFrame.split("\n").map((l) => l.replace(/\r$/, ""));

        eventName = "message";
        dataLines = [];

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trim());
          } else {
            // ignore comments / keep-alives
          }
        }

        if (dataLines.length) {
          const dataStr = dataLines.join("\n");
          let payload = dataStr;
          try {
            payload = JSON.parse(dataStr);
          } catch {}
          onEvent(eventName, payload);
        }
      }
    }
  }

  // ---------- Widget UI ----------
  function createWidget() {
    if (document.getElementById("sgi-aiw-root")) return;

    // small global style
    const styleTag = el("style", { id: "sgi-aiw-style" }, `
      #sgi-aiw-root * { box-sizing: border-box; }
      #sgi-aiw-pill:hover { transform: translateY(-1px); }
    `);
    document.head.appendChild(styleTag);

    // Pill button
    const pill = el(
      "button",
      {
        id: "sgi-aiw-pill",
        type: "button",
        style: {
          position: "fixed",
          right: "20px",
          bottom: "20px",
          zIndex: 999999,
          border: "none",
          borderRadius: "999px",
          padding: "12px 14px",
          background: "#111827",
          color: "#fff",
          display: "flex",
          gap: "10px",
          alignItems: "center",
          boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
          cursor: "pointer",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
          fontSize: "14px",
          fontWeight: "900",
          letterSpacing: "0.2px",
          transition: "transform 120ms ease",
        },
      },
      [
        el("span", {
          style: {
            width: "28px",
            height: "28px",
            borderRadius: "10px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#4f46e5",
            fontWeight: "900",
          },
        }, "SGI"),
        el("span", {}, "Find SGI content"),
      ]
    );

    // Panel
    const panel = el("div", {
      id: "sgi-aiw-root",
      style: {
        position: "fixed",
        right: "20px",
        bottom: "76px",
        width: "440px",
        maxWidth: "calc(100vw - 40px)",
        maxHeight: "74vh",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "18px",
        boxShadow: "0 18px 60px rgba(0,0,0,0.22)",
        zIndex: 999999,
        overflow: "hidden",
        display: "none",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
      },
    });

    // Header
    const header = el("div", {
      style: {
        padding: "14px 14px 12px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #eef2f7",
        background: "linear-gradient(180deg, #ffffff, #fafafa)",
      },
    });

    const headerLeft = el("div", { style: { display: "flex", gap: "10px", alignItems: "center" } }, [
      el("div", {
        style: {
          width: "36px",
          height: "36px",
          borderRadius: "14px",
          background: "#4f46e5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: "900",
        },
      }, "SGI"),
      el("div", {}, [
        el("div", { style: { fontWeight: "900", color: "#111827", fontSize: "14px" } }, "SGI Content Finder"),
        el("div", { style: { color: "#6b7280", fontSize: "12px", marginTop: "2px", lineHeight: "1.25" } },
          "We match SGI articles to your role + your company website."
        ),
      ]),
    ]);

    const closeBtn = el("button", {
      type: "button",
      style: {
        border: "none",
        background: "#fff",
        borderRadius: "12px",
        padding: "8px 10px",
        cursor: "pointer",
        color: "#111827",
        fontWeight: "900",
        fontSize: "14px",
      },
      onclick: () => {
        panel.style.display = "none";
        pill.style.display = "flex";
      },
    }, "✕");

    header.appendChild(headerLeft);
    header.appendChild(closeBtn);

    // Body
    const body = el("div", {
      style: { padding: "14px", display: "flex", flexDirection: "column", gap: "10px" },
    });

    const jobLabel = el("div", { style: { color: "#111827", fontWeight: "900", fontSize: "13px" } }, "Your job title / role");
    const jobHint = el("div", { style: { color: "#6b7280", fontSize: "12px", marginTop: "-6px" } }, "Example: Digital marketing manager · Head of retail · Policy advisor");
    const jobInput = el("input", {
      id: "sgi-aiw-job",
      type: "text",
      placeholder: "e.g. Digital marketing manager",
      style: { width: "100%", padding: "12px", borderRadius: "14px", border: "1px solid #e5e7eb", outline: "none", fontSize: "13px", background: "#fff" },
    });

    const siteLabel = el("div", { style: { color: "#111827", fontWeight: "900", fontSize: "13px", marginTop: "6px" } }, "Your company website URL");
    const siteHint = el("div", { style: { color: "#6b7280", fontSize: "12px", marginTop: "-6px" } }, "Example: https://yourcompany.com (we scan this to understand your business)");
    const siteInput = el("input", {
      id: "sgi-aiw-site",
      type: "text",
      placeholder: "e.g. https://yourcompany.com",
      style: { width: "100%", padding: "12px", borderRadius: "14px", border: "1px solid #e5e7eb", outline: "none", fontSize: "13px", background: "#fff" },
    });

    function focusStyle(node) {
      node.addEventListener("focus", () => {
        node.style.borderColor = "#c7d2fe";
        node.style.boxShadow = "0 0 0 4px rgba(79,70,229,0.12)";
      });
      node.addEventListener("blur", () => {
        node.style.borderColor = "#e5e7eb";
        node.style.boxShadow = "none";
      });
    }
    focusStyle(jobInput);
    focusStyle(siteInput);

    // Progress UI
    const progressWrap = el("div", {
      id: "sgi-aiw-progress",
      style: {
        display: "none",
        marginTop: "8px",
        padding: "10px",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        background: "#fafafa",
      },
    });

    const progressText = el("div", {
      id: "sgi-aiw-progress-text",
      style: { fontSize: "12px", color: "#374151", fontWeight: "900", marginBottom: "8px" },
    }, "Starting… (0%)");

    const progressBar = el("div", {
      style: {
        height: "10px",
        width: "100%",
        background: "#e5e7eb",
        borderRadius: "999px",
        overflow: "hidden",
      },
    });

    const progressFill = el("div", {
      id: "sgi-aiw-progress-fill",
      style: {
        height: "100%",
        width: "0%",
        background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
        borderRadius: "999px",
        transition: "width 160ms linear",
      },
    });

    progressBar.appendChild(progressFill);
    progressWrap.appendChild(progressText);
    progressWrap.appendChild(progressBar);

    const animateProgress = makeProgressAnimator(progressFill, progressText);

    // Actions
    const goBtn = el("button", {
      type: "button",
      id: "sgi-aiw-go",
      style: {
        width: "100%",
        padding: "12px 14px",
        borderRadius: "14px",
        border: "none",
        background: "#4f46e5",
        color: "#fff",
        fontWeight: "900",
        cursor: "pointer",
        boxShadow: "0 10px 18px rgba(79,70,229,0.25)",
        fontSize: "13px",
      },
    }, "Find SGI content for me");

    const smallNote = el("div", { style: { color: "#6b7280", fontSize: "11px", lineHeight: "1.35" } }, "We only recommend content from SGI Europe (sgieurope.com).");

    // Results
    const results = el("div", {
      id: "sgi-aiw-results",
      style: {
        marginTop: "2px",
        paddingTop: "10px",
        borderTop: "1px solid #eef2f7",
        overflow: "auto",
        maxHeight: "40vh",
      },
    });
    renderEmpty(results);

    // Footer
    const footer = el("div", {
      style: {
        padding: "12px 14px",
        borderTop: "1px solid #eef2f7",
        background: "#fafafa",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
      },
    });

    const powered = el("div", { style: { fontSize: "12px", color: "#6b7280" } }, "Powered by SGI Recommender");
    const openSite = el("a", {
      href: "https://www.sgieurope.com/",
      target: "_blank",
      rel: "noopener noreferrer",
      style: { fontSize: "12px", color: "#4f46e5", textDecoration: "none", fontWeight: "900" },
    }, "Open SGI ↗");

    footer.appendChild(powered);
    footer.appendChild(openSite);

    // Assemble
    body.appendChild(jobLabel);
    body.appendChild(jobHint);
    body.appendChild(jobInput);
    body.appendChild(siteLabel);
    body.appendChild(siteHint);
    body.appendChild(siteInput);
    body.appendChild(goBtn);
    body.appendChild(progressWrap);
    body.appendChild(smallNote);
    body.appendChild(results);

    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);

    document.body.appendChild(pill);
    document.body.appendChild(panel);

    pill.addEventListener("click", () => {
      panel.style.display = "block";
      pill.style.display = "none";
      jobInput.focus();
    });

    async function submit() {
      const job_title = (jobInput.value || "").trim();
      const website_url = normalizeWebsiteUrl(siteInput.value || "");

      if (!job_title || job_title.length < 2) {
        renderError(results, "Please enter your job title / role.");
        jobInput.focus();
        return;
      }

      if (!website_url || website_url.length < 8) {
        renderError(results, "Please enter a valid website URL (example: https://yourcompany.com).");
        siteInput.focus();
        return;
      }

      // show progress
      progressWrap.style.display = "block";
      animateProgress.reset();
      animateProgress.set(1, "Starting…");

      results.innerHTML = `
        <div style="padding:12px;border:1px solid #e5e7eb;border-radius:14px;background:#fafafa;color:#374151;">
          ⏳ Working…
        </div>
      `;

      setLoading(goBtn, true);

      try {
        await postSSE(`${API_BASE}/recommend_stream`, { job_title, website_url }, (event, payload) => {
          if (event === "progress") {
            const p = payload?.percent ?? 0;
            const msg = payload?.message ?? "Working…";
            animateProgress.set(p, msg);
          }

          if (event === "error") {
            const msg = payload?.detail || "Failed to fetch.";
            animateProgress.set(100, "Failed");
            renderError(results, msg);
          }

          if (event === "result") {
            animateProgress.done("Done ✅");

            const articles = payload?.articles || [];
            if (!articles.length) {
              results.innerHTML = `
                <div style="padding:12px;border:1px solid #e5e7eb;border-radius:14px;background:#fafafa;color:#374151;line-height:1.45;">
                  No strong matches found right now.
                  <div style="margin-top:8px;color:#6b7280;font-size:12px;">
                    Try a more specific job title (e.g. “DTC e-commerce manager”, “sports retail buyer”, “trade policy advisor”).
                  </div>
                </div>
              `;
              return;
            }

            renderResults(results, articles);
          }
        });
      } catch (e) {
        console.error("🔥 Widget error:", e);
        animateProgress.set(100, "Failed");
        renderError(results, e?.message || "Failed to fetch.");
      } finally {
        setLoading(goBtn, false);
      }
    }

    goBtn.addEventListener("click", submit);
    jobInput.addEventListener("keydown", (ev) => { if (ev.key === "Enter") submit(); });
    siteInput.addEventListener("keydown", (ev) => { if (ev.key === "Enter") submit(); });

    window.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && panel.style.display !== "none") {
        panel.style.display = "none";
        pill.style.display = "flex";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createWidget);
  } else {
    createWidget();
  }
})();
