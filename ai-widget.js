/* ============================================================
   SGI EUROPE - Bottom Strip Widget (COPY + PASTE READY)
   ✅ Bottom strip (full width) like your screenshot
   ✅ Keeps fields: job title + company website URL
   ✅ Real backend progress events (SSE over fetch streaming)
   ✅ Smooth % animation (no jumping)
   ✅ Uses:
      POST /recommend_stream
      body: { "job_title": "...", "website_url": "https://..." }
   ============================================================ */

console.log("✅ SGI Bottom Strip Widget Loaded");

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

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  // ---------- Smooth progress animator ----------
  function makeProgressAnimator(progressFill, progressLabelLeft, progressLabelRight) {
    let current = 0;
    let target = 0;
    let msg = "Starting…";
    let raf = null;

    function tick() {
      const diff = target - current;
      current = current + diff * 0.12; // easing
      if (Math.abs(diff) < 0.2) current = target;

      const pct = clamp(current, 0, 100);
      progressFill.style.width = pct.toFixed(0) + "%";
      progressLabelLeft.textContent = msg;
      progressLabelRight.textContent = pct.toFixed(0) + "%";

      if (current !== target) raf = requestAnimationFrame(tick);
      else raf = null;
    }

    return {
      set(p, text) {
        target = clamp(Number(p) || 0, 0, 100);
        msg = text || msg;
        if (!raf) raf = requestAnimationFrame(tick);
      },
      reset() {
        current = 0;
        target = 0;
        msg = "Starting…";
        progressFill.style.width = "0%";
        progressLabelLeft.textContent = "Starting…";
        progressLabelRight.textContent = "0%";
        if (raf) cancelAnimationFrame(raf);
        raf = null;
      },
      done(text) {
        target = 100;
        msg = text || "Done ✅";
        if (!raf) raf = requestAnimationFrame(tick);
      },
    };
  }

  // ---------- SSE over fetch streaming (POST) ----------
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

    if (!resp.body) throw new Error("Streaming not supported by this browser.");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";
    let eventName = "message";
    let dataLines = [];

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const rawFrame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        const lines = rawFrame.split("\n").map((l) => l.replace(/\r$/, ""));
        eventName = "message";
        dataLines = [];

        for (const line of lines) {
          if (line.startsWith("event:")) eventName = line.slice(6).trim();
          if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
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

  // ---------- Results rendering ----------
  function renderError(resultsEl, message) {
    resultsEl.innerHTML = `
      <div style="padding:12px;border:1px solid #fecaca;border-radius:14px;background:#fff1f2;color:#991b1b;line-height:1.45;">
        <b>❌ Error</b>
        <div style="margin-top:6px;white-space:pre-wrap;">${escapeHtml(message || "Something went wrong.")}</div>
      </div>
    `;
  }

  function renderEmpty(resultsEl) {
    resultsEl.innerHTML = `
      <div style="padding:12px;border:1px dashed #e5e7eb;border-radius:14px;background:#fafafa;color:#374151;line-height:1.45;">
        Enter your <b>role</b> and <b>website</b>, then click <b>Find SGI content for me</b>.
      </div>
    `;
  }

  function renderResults(resultsEl, items) {
    const html = (items || [])
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

    resultsEl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${html || ""}
      </div>
    `;
  }

  // ---------- Bottom strip widget ----------
  function createWidget() {
    // Prevent double-inject
    if (document.getElementById("sgi-strip-root")) return;

    // Styles
    const styleTag = el("style", { id: "sgi-strip-style" }, `
      #sgi-strip-root, #sgi-strip-root * { box-sizing: border-box; }
      #sgi-strip-root input::placeholder { color: #9ca3af; }
      #sgi-strip-root .sgi-focus:focus {
        outline: none;
        border-color: #c7d2fe !important;
        box-shadow: 0 0 0 4px rgba(79,70,229,0.12) !important;
      }
      @media (max-width: 900px) {
        #sgi-strip-bar { padding: 10px 10px !important; }
        #sgi-strip-grid { grid-template-columns: 1fr !important; }
        #sgi-strip-actions { grid-template-columns: 1fr !important; }
      }
    `);
    document.head.appendChild(styleTag);

    // Root container pinned to bottom
    const root = el("div", {
      id: "sgi-strip-root",
      style: {
        position: "fixed",
        left: "0",
        right: "0",
        bottom: "0",
        zIndex: 999999,
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
      },
    });

    // Top mini header (like your screenshot: "Your SGI matches" + Close)
    const topRow = el("div", {
      style: {
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid #e5e7eb",
        borderLeft: "1px solid #e5e7eb",
        borderRight: "1px solid #e5e7eb",
        margin: "0 10px",
        borderTopLeftRadius: "16px",
        borderTopRightRadius: "16px",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 -10px 30px rgba(0,0,0,0.10)",
      },
    });

    const topLeft = el("div", {}, [
      el("div", { style: { fontWeight: "900", color: "#111827", fontSize: "13px" } }, "Your SGI matches"),
      el("div", { style: { color: "#6b7280", fontSize: "12px", marginTop: "2px" } },
        "Top SGI items based on your role and your company site"
      ),
    ]);

    const closeAllBtn = el("button", {
      type: "button",
      style: {
        border: "1px solid #e5e7eb",
        background: "#fff",
        borderRadius: "12px",
        padding: "8px 12px",
        fontWeight: "800",
        cursor: "pointer",
      },
      onclick: () => {
        root.remove();
      },
    }, "Close");

    topRow.appendChild(topLeft);
    topRow.appendChild(closeAllBtn);

    // Main strip bar (fields + button + X)
    const bar = el("div", {
      id: "sgi-strip-bar",
      style: {
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(10px)",
        border: "1px solid #e5e7eb",
        margin: "0 10px 10px 10px",
        borderBottomLeftRadius: "16px",
        borderBottomRightRadius: "16px",
        padding: "12px 14px",
        boxShadow: "0 18px 50px rgba(0,0,0,0.16)",
      },
    });

    const grid = el("div", {
      id: "sgi-strip-grid",
      style: {
        display: "grid",
        gridTemplateColumns: "260px 1fr 240px 44px",
        gap: "12px",
        alignItems: "center",
      },
    });

    // Brand block (left)
    const brand = el("div", { style: { display: "flex", gap: "10px", alignItems: "center" } }, [
      el("div", {
        style: {
          width: "40px",
          height: "40px",
          borderRadius: "14px",
          background: "#4f46e5",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "900",
        },
      }, "SGI"),
      el("div", {}, [
        el("div", { style: { fontWeight: "900", color: "#111827", fontSize: "13px", lineHeight: "1.1" } }, "SGI Content Finder"),
        el("div", { style: { color: "#6b7280", fontSize: "12px", marginTop: "2px", lineHeight: "1.1" } },
          "Matches SGI coverage to your role + your site"
        ),
      ]),
    ]);

    // Job field
    const jobWrap = el("div", {}, [
      el("div", { style: { fontSize: "12px", color: "#111827", fontWeight: "900", marginBottom: "6px" } }, "Your job title / role"),
      el("input", {
        id: "sgi-strip-job",
        className: "sgi-focus",
        type: "text",
        placeholder: "e.g. product manager",
        style: {
          width: "100%",
          padding: "12px 12px",
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
          background: "#fff",
          fontSize: "13px",
          fontWeight: "600",
        },
      }),
    ]);

    // Website field + button (together like screenshot)
    const siteActions = el("div", { style: { display: "grid", gridTemplateColumns: "1fr 240px", gap: "12px", alignItems: "end" }, id: "sgi-strip-actions" });

    const siteWrap = el("div", {}, [
      el("div", { style: { fontSize: "12px", color: "#111827", fontWeight: "900", marginBottom: "6px" } }, "Your company website URL"),
      el("input", {
        id: "sgi-strip-site",
        className: "sgi-focus",
        type: "text",
        placeholder: "https://yourcompany.com",
        style: {
          width: "100%",
          padding: "12px 12px",
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
          background: "#fff",
          fontSize: "13px",
          fontWeight: "600",
        },
      }),
    ]);

    const goBtn = el("button", {
      type: "button",
      id: "sgi-strip-go",
      style: {
        width: "100%",
        height: "44px",
        borderRadius: "14px",
        border: "none",
        background: "#4f46e5",
        color: "#fff",
        fontWeight: "900",
        cursor: "pointer",
        boxShadow: "0 10px 18px rgba(79,70,229,0.25)",
        fontSize: "13px",
        marginTop: "20px",
      },
    }, "Find SGI content for me");

    siteActions.appendChild(siteWrap);
    siteActions.appendChild(goBtn);

    // Small X button (like your screenshot on right)
    const xBtn = el("button", {
      type: "button",
      style: {
        width: "44px",
        height: "44px",
        borderRadius: "14px",
        border: "1px solid #e5e7eb",
        background: "#fff",
        cursor: "pointer",
        fontWeight: "900",
        fontSize: "16px",
      },
      onclick: () => root.remove(),
      title: "Close",
    }, "×");

    grid.appendChild(brand);
    grid.appendChild(jobWrap);
    grid.appendChild(siteActions);
    grid.appendChild(xBtn);

    // Progress row (full width under inputs) — matches your screenshot
    const progressCard = el("div", {
      style: {
        marginTop: "12px",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        background: "#fff",
        padding: "10px 12px",
        display: "none",
      },
      id: "sgi-strip-progress-card",
    });

    const progressTop = el("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        marginBottom: "8px",
      },
    });

    const progressLeft = el("div", { style: { fontSize: "12px", color: "#111827", fontWeight: "900" }, id: "sgi-strip-progress-left" }, "Starting…");
    const progressRight = el("div", { style: { fontSize: "12px", color: "#111827", fontWeight: "900" }, id: "sgi-strip-progress-right" }, "0%");

    progressTop.appendChild(progressLeft);
    progressTop.appendChild(progressRight);

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
      style: {
        height: "100%",
        width: "0%",
        background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
        borderRadius: "999px",
        transition: "width 160ms linear",
      },
      id: "sgi-strip-progress-fill",
    });

    progressBar.appendChild(progressFill);

    const smallNote = el("div", {
      style: { marginTop: "8px", fontSize: "12px", color: "#6b7280" },
    }, 'We only recommend content from <b>sgieurope.com</b>.');
    smallNote.innerHTML = 'We only recommend content from <b>sgieurope.com</b>.';

    progressCard.appendChild(progressTop);
    progressCard.appendChild(progressBar);
    progressCard.appendChild(smallNote);

    // Results area (in bar under progress)
    const results = el("div", {
      id: "sgi-strip-results",
      style: {
        marginTop: "12px",
        borderTop: "1px solid #eef2f7",
        paddingTop: "12px",
        display: "none",
        maxHeight: "38vh",
        overflow: "auto",
      },
    });
    renderEmpty(results);

    // Assemble bar
    bar.appendChild(grid);
    bar.appendChild(progressCard);
    bar.appendChild(results);

    root.appendChild(topRow);
    root.appendChild(bar);
    document.body.appendChild(root);

    // animator
    const animator = makeProgressAnimator(progressFill, progressLeft, progressRight);

    // Loading state
    function setLoading(isLoading) {
      goBtn.disabled = isLoading;
      goBtn.style.opacity = isLoading ? "0.78" : "1";
      goBtn.style.cursor = isLoading ? "not-allowed" : "pointer";
      goBtn.textContent = isLoading ? "Working…" : "Find SGI content for me";
    }

    async function submit() {
      const job_title = (document.getElementById("sgi-strip-job")?.value || "").trim();
      const website_url = normalizeWebsiteUrl(document.getElementById("sgi-strip-site")?.value || "");

      // show containers
      progressCard.style.display = "block";
      results.style.display = "block";

      if (!job_title || job_title.length < 2) {
        animator.set(0, "Enter your job title…");
        renderError(results, "Please enter your job title / role.");
        document.getElementById("sgi-strip-job")?.focus();
        return;
      }
      if (!website_url || website_url.length < 8) {
        animator.set(0, "Enter a valid website URL…");
        renderError(results, "Please enter a valid website URL (example: https://yourcompany.com).");
        document.getElementById("sgi-strip-site")?.focus();
        return;
      }

      setLoading(true);
      animator.reset();
      animator.set(1, "Starting…");

      results.innerHTML = `
        <div style="padding:12px;border:1px solid #e5e7eb;border-radius:14px;background:#fafafa;color:#374151;">
          ⏳ Working…
        </div>
      `;

      try {
        await postSSE(`${API_BASE}/recommend_stream`, { job_title, website_url }, (event, payload) => {
          if (event === "progress") {
            const p = payload?.percent ?? 0;
            const msg = payload?.message ?? "Working…";
            animator.set(p, msg);
          }

          if (event === "error") {
            animator.set(100, "Failed");
            renderError(results, payload?.detail || "Failed to fetch.");
          }

          if (event === "result") {
            animator.done("Done ✅");

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
        animator.set(100, "Failed");
        renderError(results, e?.message || "Failed to fetch.");
      } finally {
        setLoading(false);
      }
    }

    goBtn.addEventListener("click", submit);

    // Enter submits
    document.getElementById("sgi-strip-job").addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") submit();
    });
    document.getElementById("sgi-strip-site").addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") submit();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createWidget);
  } else {
    createWidget();
  }
})();
