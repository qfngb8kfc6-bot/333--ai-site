/* ============================================================
   SGI EUROPE - EMBEDDED HERO RECOMMENDER (SGI BRAND STYLE)
   FULL COPY + PASTE widget.js

   ✅ Embedded hero bar (no floating widget)
   ✅ Inputs: Website URL + Job title
   ✅ Button: Find SGI matches
   ✅ Redirects to results.html (uses sessionStorage)
   ✅ Calls POST: https://three33-ai.onrender.com/recommend
       { job_title, website_url }
   ============================================================ */

console.log("✅ SGI Embedded Recommender (Brand Style) Loaded");

(function () {
  const API_BASE = "https://three33-ai.onrender.com";

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

  function normalizeUrl(url) {
    url = (url || "").trim();
    if (!url) return "";
    if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;
    return url;
  }

  function injectStyles() {
    if (document.getElementById("sgi-reco-styles")) return;

    const css = `
      :root{
        --sgi-navy:#0b1f3b;
        --sgi-blue:#0d4ea6;
        --sgi-blue-2:#0b63c9;
        --sgi-ink:#0f172a;
        --sgi-text:#334155;
        --sgi-muted:#64748b;
        --sgi-border:#e2e8f0;
        --sgi-bg:#f6f8fb;
        --sgi-white:#ffffff;
        --sgi-radius:18px;
        --sgi-shadow:0 18px 55px rgba(2, 10, 25, 0.12);
      }

      #sgi-embedded-widget {
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      }

      /* Make sure it feels native on SGI pages */
      #sgi-embedded-widget .sgi-wrap{
        width:100%;
        padding: 22px 18px;
        background: linear-gradient(180deg, #ffffff, var(--sgi-bg));
        border-bottom: 1px solid var(--sgi-border);
      }

      #sgi-embedded-widget .sgi-inner{
        width:100%;
        max-width: 1180px;
        margin: 0 auto;
        display:flex;
        flex-direction:column;
        gap: 14px;
      }

      #sgi-embedded-widget .sgi-toprow{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap: 14px;
      }

      #sgi-embedded-widget .sgi-brand{
        display:flex;
        align-items:center;
        gap: 12px;
        min-width: 260px;
      }

      #sgi-embedded-widget .sgi-mark{
        width: 40px;
        height: 40px;
        border-radius: 14px;
        background: linear-gradient(135deg, var(--sgi-blue), var(--sgi-blue-2));
        box-shadow: 0 10px 25px rgba(13, 78, 166, 0.25);
        display:flex;
        align-items:center;
        justify-content:center;
        color:#fff;
        font-weight:900;
        letter-spacing: .5px;
        user-select:none;
      }

      #sgi-embedded-widget .sgi-title{
        display:flex;
        flex-direction:column;
        line-height:1.1;
      }

      #sgi-embedded-widget .sgi-title b{
        font-size: 14px;
        color: var(--sgi-ink);
        letter-spacing: .2px;
      }

      #sgi-embedded-widget .sgi-title span{
        font-size: 12px;
        color: var(--sgi-muted);
        margin-top: 2px;
      }

      #sgi-embedded-widget .sgi-badge{
        font-size: 12px;
        color: #0b1f3b;
        background: #e9f2ff;
        border: 1px solid #cfe3ff;
        padding: 8px 10px;
        border-radius: 999px;
        font-weight: 800;
        white-space:nowrap;
      }

      #sgi-embedded-widget .sgi-bar{
        width:100%;
        display:flex;
        gap: 12px;
        align-items:stretch;
        padding: 10px;
        border: 1px solid var(--sgi-border);
        border-radius: 999px;
        background: var(--sgi-white);
        box-shadow: 0 12px 30px rgba(2,10,25,0.08);
      }

      #sgi-embedded-widget .sgi-field{
        flex: 1;
        display:flex;
        align-items:center;
        gap: 10px;
        padding: 8px 10px 8px 14px;
        border-radius: 999px;
        border: 1px solid transparent;
        background: #f8fafc;
      }

      #sgi-embedded-widget .sgi-icon{
        width: 30px;
        height: 30px;
        border-radius: 10px;
        display:flex;
        align-items:center;
        justify-content:center;
        background: #e9f2ff;
        color: var(--sgi-blue);
        font-weight: 900;
        user-select:none;
        flex: 0 0 auto;
      }

      #sgi-embedded-widget input.sgi-input{
        width: 100%;
        border: none;
        outline: none;
        background: transparent;
        font-size: 14px;
        color: var(--sgi-ink);
        padding: 8px 4px;
      }

      #sgi-embedded-widget input.sgi-input::placeholder{
        color: #94a3b8;
      }

      #sgi-embedded-widget .sgi-field:focus-within{
        border-color: #c7ddff;
        box-shadow: 0 0 0 4px rgba(13, 78, 166, 0.12);
        background: #ffffff;
      }

      #sgi-embedded-widget button.sgi-btn{
        border: none;
        outline: none;
        cursor: pointer;
        padding: 12px 18px;
        border-radius: 999px;
        background: var(--sgi-blue);
        color: #fff;
        font-weight: 900;
        font-size: 14px;
        letter-spacing: .2px;
        box-shadow: 0 14px 28px rgba(13, 78, 166, 0.28);
        white-space: nowrap;
        transition: transform 120ms ease, background 120ms ease, opacity 120ms ease;
      }

      #sgi-embedded-widget button.sgi-btn:hover{
        background: #0b57b8;
        transform: translateY(-1px);
      }

      #sgi-embedded-widget button.sgi-btn:disabled{
        opacity: .75;
        cursor: not-allowed;
        transform: none;
      }

      #sgi-embedded-widget .sgi-foot{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap: 10px;
        font-size: 12px;
        color: var(--sgi-muted);
      }

      #sgi-embedded-widget .sgi-foot a{
        color: var(--sgi-blue);
        text-decoration: none;
        font-weight: 800;
      }

      #sgi-embedded-widget .sgi-foot a:hover{
        text-decoration: underline;
      }

      /* Responsive: stack fields on small screens */
      @media (max-width: 720px){
        #sgi-embedded-widget .sgi-toprow{
          flex-direction:column;
          align-items:flex-start;
        }
        #sgi-embedded-widget .sgi-brand{
          min-width: 0;
        }
        #sgi-embedded-widget .sgi-bar{
          flex-direction: column;
          border-radius: var(--sgi-radius);
        }
        #sgi-embedded-widget .sgi-field{
          border-radius: 14px;
        }
        #sgi-embedded-widget button.sgi-btn{
          width: 100%;
          border-radius: 14px;
        }
      }
    `;

    const styleTag = el("style", { id: "sgi-reco-styles" }, css);
    document.head.appendChild(styleTag);
  }

  function createHeroWidget() {
    if (document.getElementById("sgi-embedded-widget")) return;

    injectStyles();

    const root = el("div", { id: "sgi-embedded-widget" });

    const wrap = el("div", { className: "sgi-wrap" });
    const inner = el("div", { className: "sgi-inner" });

    // Top row (brand + badge)
    const topRow = el("div", { className: "sgi-toprow" });

    const brand = el("div", { className: "sgi-brand" }, [
      el("div", { className: "sgi-mark" }, "SGI"),
      el("div", { className: "sgi-title" }, [
        el("b", {}, "SGI Content Finder"),
        el("span", {}, "Match SGI coverage to your role + your company site"),
      ]),
    ]);

    const badge = el("div", { className: "sgi-badge" }, "SGI Europe • sgieurope.com only");

    topRow.appendChild(brand);
    topRow.appendChild(badge);

    // Bar
    const bar = el("div", { className: "sgi-bar" });

    const websiteField = el("div", { className: "sgi-field" }, [
      el("div", { className: "sgi-icon", title: "Website" }, "🌐"),
    ]);
    const websiteInput = el("input", {
      className: "sgi-input",
      type: "text",
      placeholder: "Your website URL (e.g. https://yourcompany.com)",
      autocomplete: "url",
      inputmode: "url",
    });
    websiteField.appendChild(websiteInput);

    const jobField = el("div", { className: "sgi-field" }, [
      el("div", { className: "sgi-icon", title: "Job title" }, "💼"),
    ]);
    const jobInput = el("input", {
      className: "sgi-input",
      type: "text",
      placeholder: "Your job title (e.g. Digital marketing manager)",
      autocomplete: "organization-title",
    });
    jobField.appendChild(jobInput);

    const button = el("button", { className: "sgi-btn", type: "button" }, "Find my SGI matches");

    bar.appendChild(websiteField);
    bar.appendChild(jobField);
    bar.appendChild(button);

    // Foot row
    const foot = el("div", { className: "sgi-foot" }, [
      el("div", {}, "We scan your site to understand your business, then recommend SGI coverage."),
      el("a", { href: "https://www.sgieurope.com/", target: "_blank", rel: "noopener noreferrer" }, "Open SGI ↗"),
    ]);

    inner.appendChild(topRow);
    inner.appendChild(bar);
    inner.appendChild(foot);

    wrap.appendChild(inner);
    root.appendChild(wrap);

    // Insert at top of page
    document.body.insertBefore(root, document.body.firstChild);

    async function submit() {
      const website_url = normalizeUrl(websiteInput.value);
      const job_title = (jobInput.value || "").trim();

      if (!website_url) {
        alert("Please enter your website URL.");
        websiteInput.focus();
        return;
      }
      if (!job_title || job_title.length < 2) {
        alert("Please enter your job title.");
        jobInput.focus();
        return;
      }

      button.disabled = true;
      const oldText = button.textContent;
      button.textContent = "Matching SGI content…";

      try {
        // Optional: quick pre-flight ping to catch obvious errors
        // (We still redirect regardless on success.)
        const resp = await fetch(`${API_BASE}/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_title, website_url }),
        });

        const data = await resp.json().catch(() => null);
        if (!resp.ok) {
          const msg = data?.detail || data?.error || `Server error (HTTP ${resp.status})`;
          throw new Error(msg);
        }

        // Store inputs for results page (and optionally store results too)
        sessionStorage.setItem("sgi_reco_job_title", job_title);
        sessionStorage.setItem("sgi_reco_website_url", website_url);

        // If you want results page to avoid re-calling backend, store the response:
        sessionStorage.setItem("sgi_reco_results", JSON.stringify(data || {}));

        window.location.href = "results.html";
      } catch (e) {
        alert("Error: " + (e?.message || "Failed to fetch."));
        button.disabled = false;
        button.textContent = oldText;
      }
    }

    button.addEventListener("click", submit);
    websiteInput.addEventListener("keydown", (ev) => ev.key === "Enter" && submit());
    jobInput.addEventListener("keydown", (ev) => ev.key === "Enter" && submit());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createHeroWidget);
  } else {
    createHeroWidget();
  }
})();
