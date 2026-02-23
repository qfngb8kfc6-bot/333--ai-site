console.log("✅ AI Widget Loaded");

(function () {
  const API_BASE = "https://three33-ai.onrender.com";

  function createWidget() {
    const widget = document.createElement("div");
    widget.style.position = "fixed";
    widget.style.bottom = "20px";
    widget.style.right = "20px";
    widget.style.width = "350px";
    widget.style.background = "#ffffff";
    widget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    widget.style.borderRadius = "12px";
    widget.style.padding = "15px";
    widget.style.fontFamily = "Arial, sans-serif";
    widget.style.zIndex = "999999";

    widget.innerHTML = `
      <h3 style="margin-top:0;">AI Website Analyzer</h3>
      <input 
        type="text" 
        id="ai-url-input"
        placeholder="Enter website URL (https://...)"
        style="width:100%;padding:8px;border-radius:6px;border:1px solid #ccc;margin-bottom:10px;"
