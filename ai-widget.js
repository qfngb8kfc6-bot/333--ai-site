console.log("✅ AI Widget Loaded");

(function () {
  const API_URL = "https://three33-ai.onrender.com/recommend";

  function createWidget() {
    // Create container
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

    // Title
    const title = document.createElement("h4");
    title.innerText = "AI Recommendation";
    title.style.marginTop = "0";
    container.appendChild(title);

    // Input
    const input = document.createElement("textarea");
    input.placeholder = "Type your question...";
    input.style.width = "100%";
    input.style.height = "60px";
    input.style.marginBottom = "10px";
    input.style.borderRadius = "6px";
    input.style.border = "1px solid #ccc";
    input.style.padding = "8px";
    container.appendChild(input);

    // Button
    const button = document.createElement("button");
    button.innerText = "Get Recommendation";
    button.style.width = "100%";
    button.style.padding = "10px";
    button.style.border = "none";
    button.style.borderRadius = "6px";
    button.style.background = "#4CAF50";
    button.style.color = "#fff";
    button.style.cursor = "pointer";
    container.appendChild(button);

    // Output
    const output = document.createElement("div");
    output.style.marginTop = "10px";
    output.style.fontSize = "14px";
    container.appendChild(output);

    // Button Click Logic
    button.addEventListener("click", async function () {
      const userInput = input.value.trim();

      if (!userInput) {
        output.innerText = "Please enter a question.";
        return;
      }

      output.innerText = "Loading...";

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt: userInput
          })
        });

        if (!response.ok) {
          throw new Error("Server error");
        }

        const data = await response.json();

        // Adjust this if your backend returns a different field
        output.innerText = data.response || data.result || JSON.stringify(data);

      } catch (error) {
        console.error(error);
        output.innerText = "Error connecting to AI server.";
      }
    });

    document.body.appendChild(container);
  }

  // Wait for page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createWidget);
  } else {
    createWidget();
  }
})();


    btn.disabled = false;
    btn.innerText = "Generate";
  });
})();
