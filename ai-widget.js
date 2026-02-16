console.log("✅ AI Widget Loaded");

(function () {
  try {
    const API_URL = "https://three33-ai.onrender.com/recommend";

    function createWidget() {
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.bottom = "20px";
      container.style.right = "20px";
      container.style.width = "320px";
      container.style.background = "#ffffff";
      container.style.border = "1px solid #ddd";
      container.style.borderRadius = "10px";
      container.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
      container.style.padding = "15px";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.zIndex = "9999";

      // Inner HTML safely
      container.innerHTML = `
        <h4 style="margin-top:0;">AI Recommendation</h4>
        <textarea id="ai-input" placeholder="Type your question..."
          style="width:100%;height:60px;margin-bottom:10px;border-radius:6px;border:1px solid #ccc;padding:8px;"></textarea>
        <button id="ai-btn"
          style="width:100%;padding:10px;border:none;border-radius:6px;background:#4CAF50;color:#fff;cursor:pointer;">
          Get Recommendation
        </button>
        <div id="ai-output" style="margin-top:10px;font-size:14px;"></div>
      `;

      document.body.appendChild(container);

      // Event listener
      document.getElementById("ai-btn").addEventListener("click", async function () {
        const input = document.getElementById("ai-input").value.trim();
        const output = document.getElementById("ai-output");

        if (!input) {
          output.innerText = "Please enter a question.";
          return;
        }

        output.innerText = "Loading...";

        try {
          const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: input })
          });

          if (!response.ok) {
            throw new Error("Server error: " + response.status);
          }

          const data = await response.json();
          output.innerText = data.response || data.result || JSON.stringify(data);

        } catch (err) {
          console.error("Fetch error:", err);
          output.innerText = "Server connection error.";
        }
      });
    }

    // Init after page load
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", createWidget);
    } else {
      createWidget();
    }

  } catch (err) {
    console.error("Widget crashed:", err);
  }
})();
