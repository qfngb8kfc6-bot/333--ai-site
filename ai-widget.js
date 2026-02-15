(function () {
  const DEFAULTS = {
    apiBase: "",
    hostUrl: "",
    buttonText: "AI Relevance",
    title: "Tailored site highlights",
    subtitle: "Tell us your role/company and we’ll surface what matters on this site.",
    position: "bottom-right",
  };

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class") node.className = v;
      else if (k === "style") Object.assign(node.style, v);
      else node.setAttribute(k, v);
    });
    children.forEach((c) => node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return node;
  }

  function injectStyles() {
    if (document.getElementById("aiw-styles")) return;
    const css = `
      .aiw-wrap{position:fixed;z-index:999999;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial}
      .aiw-bottom-right{right:16px;bottom:16px}
      .aiw-btn{border:none;border-radius:999px;padding:12px 14px;cursor:pointer;box-shadow:0 10px 25px rgba(0,0,0,.15);background:#111;color:#fff;font-weight:700}
      .aiw-panel{width:380px;max-width:calc(100vw - 32px);border-radius:16px;background:#fff;box-shadow:0 18px 60px rgba(0,0,0,.22);overflow:hidden}
      .aiw-head{padding:14px 14px 10px;border-bottom:1px solid #eee;display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
      .aiw-title{font-size:14px;font-weight:900;margin:0}
      .aiw-sub{font-size:12px;color:#555;margin:4px 0 0}
      .aiw-close{background:transparent;border:none;cursor:pointer;font-size:18px;line-height:1;padding:2px 6px;color:#444}
      .aiw-body{padding:12px 14px;display:flex;flex-direction:column;gap:10px}
      .aiw-row{display:flex;gap:8px}
      .aiw-input{flex:1;border:1px solid #ddd;border-radius:10px;padding:10px 10px;font-size:13px}
      .aiw-submit{border:none;border-radius:10px;padding:10px 12px;background:#111;color:#fff;font-weight:800;cursor:pointer}
      .aiw-card{border:1px solid #eee;border-radius:14px;padding:10px 10px;display:flex;flex-direction:column;gap:6px}
      .aiw-p{font-size:13px;line-height:1.35;margin:0;color:#111}
      .aiw-meta{font-size:11px;color:#666;margin:0}
      .aiw-link{font-size:13px;color:#111;text-decoration:underline;font-weight:800}
      .aiw-loading{font-size:12px;color:#666}
      .aiw-error{font-size:12px;color:#b00020}
    `;
    document.head.appendChild(el("style", { id: "aiw-styles" }, [css]));
  }

  function positionClass(pos) {
    if (pos === "bottom-right") return "aiw-bottom-right";
    return "aiw-bottom-right";
  }

  function init(userConfig = {}) {
    injectStyles();
    const cfg = { ...DEFAULTS, ...userConfig };
    if (!cfg.apiBase) throw new Error("AIWidget: apiBase is required.");
    if (!cfg.hostUrl) cfg.hostUrl = window.location.href;

    const wrap = el("div", { class: `aiw-wrap ${positionClass(cfg.position)}` });
    const btn = el("button", { class: "aiw-btn", type: "button" }, [cfg.buttonText]);

    const panel = el("div", { class: "aiw-panel", style: { display: "none" } });

    const headLeft = el("div", {}, [
      el("p", { class: "aiw-title" }, [cfg.title]),
      el("p", { class: "aiw-sub" }, [cfg.subtitle]),
    ]);
    const close = el("button", { class: "aiw-close", type: "button", "aria-label": "Close" }, ["×"]);
    panel.appendChild(el("div", { class: "aiw-head" }, [headLeft, close]));

    const role = el("input", { class: "aiw-input", placeholder: "Your role (e.g., Product Manager)" });
    const company = el("input", { class: "aiw-input", placeholder: "Your company (e.g., Nike)" });
    const url = el("input", { class: "aiw-input", placeholder: "Optional: your URL (LinkedIn/company)" });
    const submit = el("button", { class: "aiw-submit", type: "button" }, ["Generate"]);

    const status = el("div", { class: "aiw-loading", style: { display: "none" } }, ["Thinking…"]);
    const error = el("div", { class: "aiw-error", style: { display: "none" } }, [""]);
    const output = el("div", { style: { display: "none" } }, []);

    const body = el("div", { class: "aiw-body" }, [
      el("div", { class: "aiw-row" }, [role]),
      el("div", { class: "aiw-row" }, [company]),
      el("div", { class: "aiw-row" }, [url]),
      el("div", { class: "aiw-row" }, [submit]),
      status,
      error,
      output,
    ]);
    panel.appendChild(body);

    function open() {
      panel.style.display = "block";
      btn.style.display = "none";
    }
    function closePanel() {
      panel.style.display = "none";
      btn.style.display = "inline-block";
    }

    btn.addEventListener("click", open);
    close.addEventListener("click", closePanel);

    async function recommend() {
      error.style.display = "none";
      error.textContent = "";
      status.style.display = "block";
      output.style.display = "none";
      output.innerHTML = "";

      const payload = {
        clientRole: (role.value || "").trim(),
        clientCompany: (company.value || "").trim(),
        hostUrl: cfg.hostUrl,
        clientUrl: (url.value || "").trim() || null,
        maxHighlights: 6,
      };

      if (!payload.clientRole || !payload.clientCompany) {
        status.style.display = "none";
        error.style.display = "block";
        error.textContent = "Please enter your role and company.";
        return;
      }

      try {
        const res = await fetch(cfg.apiBase.replace(/\/$/, "") + "/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();

        const paragraphCard = el("div", { class: "aiw-card" }, [
          el("p", { class: "aiw-p" }, [data.paragraph || ""]),
          data.hostSummary
            ? el("p", { class: "aiw-meta" }, ["Host summary: " + data.hostSummary])
            : el("span"),
        ]);

        output.appendChild(paragraphCard);

        (data.highlights || []).forEach((h) => {
          output.appendChild(
            el("div", { class: "aiw-card" }, [
              el("a", { class: "aiw-link", href: h.url, target: "_blank", rel: "noreferrer" }, [h.title]),
              el("p", { class: "aiw-p" }, [h.snippet]),
            ])
          );
        });

        status.style.display = "none";
        output.style.display = "block";
      } catch (e) {
        status.style.display = "none";
        error.style.display = "block";
        error.textContent = (e && e.message ? e.message : "Something went wrong.").slice(0, 220);
      }
    }

    submit.addEventListener("click", recommend);

    wrap.appendChild(btn);
    wrap.appendChild(panel);
    document.body.appendChild(wrap);
  }

  window.AIWidget = { init };
})();
