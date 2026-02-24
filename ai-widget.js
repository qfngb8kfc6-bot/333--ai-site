/* ============================================================
   SGI EUROPE - Visitor Recommender Widget (Copy/Paste Ready)
   - Floating pill button (bottom-right)
   - Opens a clean panel UI
   - Inputs: "Your role / what you care about" (profile)
   - Calls: POST https://three33-ai.onrender.com/recommend
     body: { "profile": "..." }
   - Renders: top SGI links + summary + why relevant + score
   ============================================================ */

console.log("✅ SGI Europe Recommender Widget Loaded");

(function () {
  // ✅ CHANGE THIS if your backend URL changes
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

  function setLoading(btn, isLoading) {
    btn.disabled = isLoading;
    btn.style.opacity = isLoading ? "0.75" : "1";
    btn.style.cursor = isLoading ? "not-allowed" : "pointer";
    btn.textContent = isLoading ? "Finding relevant SGI content…" : "Show me relevant SGI content";
  }

  function renderEmpty(stateEl) {
    stateEl.innerHTML = `
      <div style="padding:12px;border:1px dashed #e5e7eb;border-radius:12px;background:#fafafa;color:#374151;">
        No results yet. Tell us what you do and what you’re looking for, then click <b>Show me relevant SGI content</b>.
      </div>
    `;
  }

  function renderError(stateEl, message) {
    stateEl.innerHTML = `
      <div style="padding:12px;border:1px solid #fecaca;border-radius:12px;background:#fff1f2;color:#991b1b;">
        <b>❌ Error</b><div style="margin-top:6px;">${escapeHtml(message || "Something went wrong.")}</div>
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
          <div style="border:1px solid #e5e7eb;border-radius:14px;padding:12px;background:#fff;">
            <div style="display:flex;gap:10px;align-items:flex-start;justify-content:space-between;">
              <div style="min-width:0;">
                <div style="font-weight:700;font-size:14px;color:#111827;line-height:1.3;">
                  ${title}
                </div>
                <a href="${url}" target="_blank" rel="noopener noreferrer"
                   style="display:inline-block;margin-top:6px;color:#4f46e5;font-size:12px;text-decoration:none;word-break:break-all;">
                  ${url}
                </a>
              </div>
              <div style="flex:0 0 auto;">
                <div style="padding:6px 10px;border-radius:999px;background:${badgeBg};color:${badgeText};font-weight:700;font-size:12px;">
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
                <b>Why it’s relevant:</b> ${reason}
              </div>` : ""}
          </div>
        `;
      })
      .join("");

    stateEl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${html}
      </div>
    `;
  }

  // ---------- Widget UI ----------
  function createWidget() {
    // Avoid double-inject
    if (document.getElementById("sgi-aiw-root")) return;

    // Floating pill button
    const pill = el("button", {
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
        fontWeight: "700",
        letterSpacing: "0.2px",
      },
    }, [
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
      }, "AI"),
      el("span", {}, "Find SGI articles"),
    ]);

    // Panel container
    const panel = el("div", {
      id: "sgi-aiw-root",
      style: {
        position: "fixed",
        right: "20px",
        bottom: "76px",
        width: "420px",
        maxWidth: "calc(100vw - 40px)",
        maxHeight: "70vh",
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
        el("div", { style: { color: "#6b7280", fontSize: "12px", marginTop: "2px" } },
          "Tell us about you — we’ll surface relevant SGI coverage."
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
      style: {
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      },
    });

    // Profile field
    const label = el("div", {
      style: { color: "#111827", fontWeight: "800", fontSize: "13px" },
    }, "Your role / what you care about");

    const hint = el("div", {
      style: { color: "#6b7280", fontSize: "12px", marginTop: "-6px" },
    }, "Example: “Policy advisor focused on digital infrastructure, EU customs reform, and e-commerce regulation.”");

    const textarea = el("textarea", {
      id: "sgi-aiw-profile",
      placeholder: "Type your role, interests, and what you’re trying to learn…",
      style: {
        width: "100%",
        minHeight: "92px",
        resize: "vertical",
        padding: "12px",
        borderRadius: "14px",
        border: "1px solid #e5e7eb",
        outline: "none",
        fontSize: "13px",
        lineHeight: "1.45",
        background: "#fff",
      },
    });

    textarea.addEventListener("focus", () => {
      textarea.style.borderColor = "#c7d2fe";
      textarea.style.boxShadow = "0 0 0 4px rgba(79,70,229,0.12)";
    });
    textarea.addEventListener("blur", () => {
      textarea.style.borderColor = "#e5e7eb";
      textarea.style.boxShadow = "none";
    });

    // Button row
    const actions = el("div", { style: { display: "flex", gap: "10px", alignItems: "center" } });

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
    }, "Show me relevant SGI content");

    const smallNote = el("div", {
      style: { color: "#6b7280", fontSize: "11px", lineHeight: "1.3" },
    }, "We only pull content from SGI Europe.");

    actions.appendChild(goBtn);

    // Results
    const results = el("div", {
      id: "sgi-aiw-results",
      style: {
        marginTop: "2px",
        paddingTop: "10px",
        borderTop: "1px solid #eef2f7",
        overflow: "auto",
        maxHeight: "38vh",
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
      style: { fontSize: "12px", color: "#4f46e5", textDecoration: "none", fontWeight: "800" },
    }, "Open SGI ↗");

    footer.appendChild(powered);
    footer.appendChild(openSite);

    // Assemble
    body.appendChild(label);
    body.appendChild(hint);
    body.appendChild(textarea);
    body.appendChild(actions);
    body.appendChild(smallNote);
    body.appendChild(results);

    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);

    // Inject
    document.body.appendChild(pill);
    document.body.appendChild(panel);

    // Events
    pill.addEventListener("click", () => {
      panel.style.display = "block";
      pill.style.display = "none";
      textarea.focus();
    });

    // Submit
    goBtn.addEventListener("click", async () => {
      const profile = (textarea.value || "").trim();

      if (!profile || profile.length < 10) {
        renderError(results, "Please write a little more detail (at least ~10 characters).");
        return;
      }

      setLoading(goBtn, true);

      try {
        // Call backend
        const resp = await fetch(`${API_BASE}/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile }),
        });

        let data = null;
        try {
          data = await resp.json();
        } catch {
          // If server returns non-json
          throw new Error(`Server returned invalid JSON (HTTP ${resp.status}).`);
        }

        if (!resp.ok) {
          throw new Error(data?.detail || data?.error || `Server error (HTTP ${resp.status}).`);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        const articles = data?.articles || [];
        if (!articles.length) {
          results.innerHTML = `
            <div style="padding:12px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;color:#374151;">
              No strongly relevant SGI items were found from the current homepage links.
              <div style="margin-top:6px;color:#6b7280;font-size:12px;">
                Tip: add more specific keywords (e.g. “EU customs reform”, “DTC”, “trade tariffs”, “sports retail”).
              </div>
            </div>
          `;
          return;
        }

        renderResults(results, articles);
      } catch (e) {
        console.error("🔥 Widget error:", e);
        renderError(results, e?.message || "Failed to fetch.");
      } finally {
        setLoading(goBtn, false);
      }
    });

    // ESC to close
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
