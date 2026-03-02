/* ============================================================
   SGI EUROPE - INPUT WIDGET (COPY + PASTE READY)
   ✅ Collects:
      1) Job title / role
      2) Company website URL
   ✅ Then redirects to: results.html
   ✅ Results page will call backend and render results there
   ============================================================ */

console.log("✅ SGI Europe Input Widget Loaded");

(function () {
  // If results.html is in the SAME folder as the page, leave this:
  const RESULTS_PAGE = "results.html";

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

  function normalizeWebsiteUrl(raw) {
    let url = (raw || "").trim();
    if (!url) return "";
    if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;
    return url;
  }

  function createWidget() {
    if (document.getElementById("sgi-aiw-root")) return;

    // Pill button
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
        fontWeight: "900",
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
      el("span", {}, "Find SGI content"),
    ]);

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
          "Enter your role + website. Results open on a new page."
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
    const jobHint = el("div", { style: { color: "#6b7280", fontSize: "12px", marginTop: "-6px" } }, "Example: Product manager · Digital marketing manager · Retail buyer");
    const jobInput = el("input", {
      type: "text",
      placeholder: "e.g. Product manager",
      style: { width: "100%", padding: "12px", borderRadius: "14px", border: "1px solid #e5e7eb", outline: "none", fontSize: "13px" },
    });

    const siteLabel = el("div", { style: { color: "#111827", fontWeight: "900", fontSize: "13px", marginTop: "6px" } }, "Your company website URL");
    const siteHint = el("div", { style: { color: "#6b7280", fontSize: "12px", marginTop: "-6px" } }, "Example: https://yourcompany.com");
    const siteInput = el("input", {
      type: "text",
      placeholder: "e.g. https://www.nike.com",
      style: { width: "100%", padding: "12px", borderRadius: "14px", border: "1px solid #e5e7eb", outline: "none", fontSize: "13px" },
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

    const goBtn = el("button", {
      type: "button",
      style: {
        width: "100%",
        marginTop: "4px",
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
    }, "Open results page");

    const note = el("div", { style: { color: "#6b7280", fontSize: "11px", lineHeight: "1.35" } },
      "We only recommend content from SGI Europe (sgieurope.com)."
    );

    const errorBox = el("div", {
      style: {
        display: "none",
        padding: "10px",
        borderRadius: "14px",
        border: "1px solid #fecaca",
        background: "#fff1f2",
        color: "#991b1b",
        fontSize: "12px",
        lineHeight: "1.4",
        whiteSpace: "pre-wrap",
      },
    });

    function showError(msg) {
      errorBox.style.display = "block";
      errorBox.textContent = msg;
    }
    function hideError() {
      errorBox.style.display = "none";
      errorBox.textContent = "";
    }

    async function submit() {
      hideError();
      const job_title = (jobInput.value || "").trim();
      const website_url = normalizeWebsiteUrl(siteInput.value || "");

      if (!job_title || job_title.length < 2) {
        showError("Please enter your job title / role.");
        jobInput.focus();
        return;
      }

      if (!website_url || website_url.length < 8) {
        showError("Please enter a valid website URL (example: https://yourcompany.com).");
        siteInput.focus();
        return;
      }

      // Store data for the results page
      sessionStorage.setItem("sgi_reco_job_title", job_title);
      sessionStorage.setItem("sgi_reco_website_url", website_url);

      // Redirect
      window.location.href = RESULTS_PAGE;
    }

    goBtn.addEventListener("click", submit);
    jobInput.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
    siteInput.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });

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
    footer.appendChild(el("div", { style: { fontSize: "12px", color: "#6b7280" } }, "Powered by SGI Recommender"));
    footer.appendChild(el("a", {
      href: "https://www.sgieurope.com/",
      target: "_blank",
      rel: "noopener noreferrer",
      style: { fontSize: "12px", color: "#4f46e5", textDecoration: "none", fontWeight: "900" },
    }, "Open SGI ↗"));

    body.appendChild(jobLabel);
    body.appendChild(jobHint);
    body.appendChild(jobInput);
    body.appendChild(siteLabel);
    body.appendChild(siteHint);
    body.appendChild(siteInput);
    body.appendChild(goBtn);
    body.appendChild(note);
    body.appendChild(errorBox);

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
