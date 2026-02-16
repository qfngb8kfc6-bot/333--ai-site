console.log("✅ Expandable AI Widget Loaded");

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

    // Chat Window
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
        <strong>AI Assistant</strong>
        <span id="ai-close" style="cursor:pointer;font-size:18px;">✖</span>
      </div>
      <textarea id="ai-input" placeholder="Ask something..."
        style="width:100%;height:70px;margin-top:10px;border-radius:6px;border:1px solid #ccc;padding:8px;"></textarea>
      <button id="ai-send"
        style="margin-top:10px;padding:10px;border:none;border-radius:6px;background:#4CAF50;color:#fff;cursor:pointer;">
        Send
      </button>
      <div id="ai-output" style="margin-top:10px;font-size:14px;max-height:150px;overflow:auto;"></div>
    `;

    document.body.appendChild(container);

    // Toggle open
    toggleButton.addEventListener("click", function () {
      container.style.display = "flex";
      toggleButton.style.display = "none";
    });

    // Close
    container.querySelector("#ai-close").addEventListener("click", function () {
      container.style.display = "none";
      toggleButton.style.display = "flex";
    });

    // Send message
    container.querySelector("#ai-send").addEventListener("click", async function () {
      const input = container.querySelector("#ai-input").value.trim();
      const output = container.querySelector("#ai-output");

      if (!input) {
        output.innerText = "Please enter a question.";
        return;
      }

      output.innerText = "Thinking...";

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
        console.error(err);
        output.innerText = "Error connecting to server.";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createWidget);
  } else {
    createWidget();
  }
})();

