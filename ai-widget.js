console.log("✅ AI Website Analyzer Widget Loaded");

(function () {
  const API_BASE = "https://three33-ai.onrender.com";

  function createWidget() {
    const widget = document.createElement("div");
    widget.style.position = "fixed";
    widget.style.bottom = "20px";
    widget.style.right = "20px";
    widget.style.width = "360px";
    widget.style.background = "#ffffff";
    widget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
    widget.style.borderRadius = "14px";
    widget.style.padding = "16px";
    widget.style.fontFamily = "Arial, sans-serif";
    widget.style.zIndex = "999999";

    widget.innerHTML = `
      <h3 style="margin-top:0;margin-bottom:10px;">
        AI Website Analyzer
      </h3>

      <input 
        type="text" 
        id="ai-url-input"
        placeholder="Enter website (example.com)"
        style="
          width:100%;
          padding:10px;
          border-radius:8px;
          border:1px solid #ddd;
          margin-bottom:10px;
          font-size:14px;
        "
      />

      <button 
        id="ai-analyze-btn"
        style="
          width:100%;
          padding:11px;
          border:none;
          border-radius:8px;
          background:#4f46e5;
          color:white;
          font-weight:bold;
          font-size:14px;
          cursor:pointer;
        "
      >
        Analyze Website
      </button>

      <div 
        id="ai-result" 
        style="
          margin-top:14px;
          font-size:14px;
          white-space:pre-wrap;
          max-height:250px;
          overflow-y:auto;
        "
      ></div>
    `;

    document.body.appendChild(widget);

    const button = document.getElementById("ai-analyze-btn");
    const input = document.getElementById("ai-url-input");
    const resultDiv = document.getElementById("ai-result");

    button.addEventListener("click", async () => {
      let url = input.value.trim();

      if (!url) {
        resultDiv.innerText = "⚠️ Please enter a website.";
        return;
      }

      // Auto-fix missing protocol
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }

      resultDiv.innerText = "⏳ Analyzing website...";

      try {
        const response = await fetch(`${API_BASE}/recommend`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Server error");
        }

        if (!data.analysis) {
          throw new Error("No analysis returned from server.");
        }

        resultDiv.innerText = data.analysis;

      } catch (error) {
        console.error("🔥 Widget Error:", error);
        resultDiv.innerText = "❌ " + error.message;
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createWidget);
  } else {
    createWidget();
  }
})();
