console.log("✅ AI Website Analyzer Widget Loaded");

(function () {
  const API_URL = "https://three33-ai.onrender.com/recommend";

  function createWidget() {
    // Floating Button
    const toggleButton = document.createElement("div");
    toggleButton.innerText = "AI";
    toggleButton.style.position = "fixed";
    toggleButton.style.bottom = "20px";
    toggleButton.style.right = "20px";
    toggleButton.style.width = "60px";
    toggleButton.style.height = "60px";
    toggleButton.style.borderRadius = "50%";
    toggleButton.style.background = "#4CAF50";
    toggleButton.style.color = "#fff";
    toggleButton.style.display = "flex";
    toggleButton.style.alignItems = "center";
    toggleButton.style.justifyContent = "center";
    toggleButton.style.cursor = "pointer";
    toggleButton.style.fontWeight = "bold";
    toggleButton.style.fontSize = "18px";
    toggleButton.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
    toggleButton.style.zIndex = "9999";

    document.body.appendChild(toggleButton);

    // Chat Container
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.bottom = "90px";
    container.style.right = "20px";
    container.style.width = "340px";
    container.style.background = "#ffffff";
    container.style.borderRadius = "12px";
    container.style.boxShadow = "0 6px 18px rgba(0,0,0,0.2)";
    container.style.padding = "15px";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.display = "none";
    container.style.flexDirection = "column";
    container.style.zIndex = "9999";

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong>AI Website Analyzer</strong>
        <span id="ai-close" style="cursor:pointer;font-size:18px;">✖</span>
      </div>

      <div style="margin-top:10px;font-size:13px;color:#555;">
        Click analyze to get AI insights about this website.
      </div>

      <button id="ai-send"
        style="margin-top:12px;padding:10px;border:none;border-radius:6px;background:#4CAF50;color:#fff;cursor:pointer;">
        Analyze This Website
      </button>

      <div id="ai-output"
        style="margin-top:12px;font-size:14px;max-height:220px;overflow:auto;white-space:pre-wrap;"></div>
    `;

    document.body.appendChild(container);

    // Open widget
    toggleButton.addEventListener("click", function () {
      container.style.display = "flex";
      toggleButton.style.display = "none";
    });

    // Close widget
    container.querySelector("#ai-close").addEventListener("click", function () {
      container.style.display = "none";
      toggleButton.style.display = "flex";
    });

    // Analyze button
    container.querySelector("#ai-send").addEventListener("click", async function () {
      const output = container.querySelector("#ai-output");

      output.innerText = "Analyzing website...";

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            url: window.location.href
          })
        });

        if (!response.ok) {
          throw new Error("Server error: " + response.status);
        }

        const data = await response.json();

        if (data.analysis) {
          output.innerText = data.analysis;
        } else {
          output.innerText = "Unexpected response format.";
        }

      } catch (error) {
        console.error(error);
        output.innerText = "Error connecting to AI server.";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createWidget);
  } else {
    createWidget();
  }
})();

