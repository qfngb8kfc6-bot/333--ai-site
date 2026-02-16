(function () {
  const API_URL = "https://YOUR-BACKEND-URL.com/generate"; // <-- replace this

  const widget = document.createElement("div");
  widget.style.position = "fixed";
  widget.style.bottom = "20px";
  widget.style.right = "20px";
  widget.style.width = "360px";
  widget.style.background = "#ffffff";
  widget.style.borderRadius = "14px";
  widget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.15)";
  widget.style.padding = "16px";
  widget.style.fontFamily = "system-ui, -apple-system, sans-serif";
  widget.style.zIndex = "9999";

  widget.innerHTML = `
    <div style="font-weight:600;font-size:16px;margin-bottom:6px;">
      Tailored site highlights
    </div>
    <div style="font-size:13px;color:#666;margin-bottom:12px;">
      Tell us your role/company and we'll surface what matters.
    </div>

    <input id="clientRole" placeholder="Your role"
      style="width:100%;padding:8px;margin-bottom:8px;border-radius:6px;border:1px solid #ddd;" />

    <input id="clientCompany" placeholder="Company"
      style="width:100%;padding:8px;margin-bottom:10px;border-radius:6px;border:1px solid #ddd;" />

    <button id="generateBtn"
      style="width:100%;padding:10px;background:#000;color:#fff;border:none;border-radius:8px;cursor:pointer;">
      Generate
    </button>

    <div id="widgetResult"
      style="margin-top:12px;font-size:13px;color:#333;"></div>
  `;

  document.body.appendChild(widget);

  const btn = document.getElementById("generateBtn");
  const resultDiv = document.getElementById("widgetResult");

  btn.addEventListener("click", async () => {
    const clientRole = document.getElementById("clientRole").value.trim();
    const clientCompany = document.getElementById("clientCompany").value.trim();

    // 🔥 THIS is what your backend expects
    const website_url = window.location.href;

    if (!clientRole || !clientCompany) {
      resultDiv.innerHTML =
        `<span style="color:red;">Please fill in all fields.</span>`;
      return;
    }

    btn.disabled = true;
    btn.innerText = "Generating...";
    resultDiv.innerHTML = "";

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clientRole: clientRole,
          clientCompany: clientCompany,
          website_url: website_url   // ✅ CORRECT FIELD NAME
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      resultDiv.innerHTML =
        `<div style="white-space:pre-wrap;">${data.result || JSON.stringify(data)}</div>`;

    } catch (error) {
      resultDiv.innerHTML =
        `<span style="color:red;">${error.message}</span>`;
    }

    btn.disabled = false;
    btn.innerText = "Generate";
  });
})();
