chrome.runtime.onInstalled.addListener(() => {
    console.log("Browsing History Analyzer Extension Installed.");
  });
  
  // Optional: If you need to handle any background events (e.g., opening new tabs)
  // For now, background.js doesn't need much as everything is handled in popup.js and the popup.html page
  chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: "popup.html" });
  });
  