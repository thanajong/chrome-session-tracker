let trackingData = [];
let startTime = null;
let keywordFrequency = {};
let activeTabId = null;
let activeTabStartTime = null;

// Listener for messages from the popup (start/stop tracking)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(`Message received: ${request.action}`);
    if (request.action === "start") {
      startTracking(sendResponse);
    } else if (request.action === "stop") {
      stopTracking(sendResponse);
    }
  });
  
  function startTracking(sendResponse) {
    if (startTime !== null) {
      sendResponse({ status: "Tracking already started." });
      return; // Prevent multiple starts
    }
  
    startTime = new Date();
    activeTabStartTime = new Date();
    
    // Add listeners for tab updates, activations, and removals
    chrome.tabs.onUpdated.addListener(trackBrowsing);
    chrome.tabs.onActivated.addListener(handleTabActivation);
    chrome.tabs.onRemoved.addListener(handleTabRemoval);
  
    // Initialize tracking for currently active tab (if any)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        activeTabId = tabs[0].id;
        activeTabStartTime = new Date();
        console.log(`Tracking active tab ID: ${activeTabId}`);
      } else {
        console.warn("No active tab found.");
      }
    });
  
    sendResponse({ status: "Tracking started..." });
  }
  
  function stopTracking(sendResponse) {
    // Remove listeners
    chrome.tabs.onUpdated.removeListener(trackBrowsing);
    chrome.tabs.onActivated.removeListener(handleTabActivation);
    chrome.tabs.onRemoved.removeListener(handleTabRemoval);
    
    const endTime = new Date();
    const totalTime = (endTime - startTime) / 1000; // in seconds
    
    // Include the current active tab's time if applicable
    if (activeTabId !== null && activeTabStartTime !== null) {
      updateTabTime(activeTabId, new Date() - activeTabStartTime);
    }
  
    const summary = generateSummary(trackingData, totalTime);
    sendResponse({ status: "Tracking stopped. Summary generated:", summary });
  
    console.log("Tracking stopped. Summary generated:", summary);
  }

function trackBrowsing(tabId, changeInfo, tab) {
  if (changeInfo.status === "complete") {
    console.log(`Tab updated: ${tabId}`);
    const url = new URL(tab.url);
    const site = url.hostname;

    // Extract keywords from URL
    const keywords = extractKeywordsFromURL(tab.url);
    trackKeywords(keywords);

    // Update time spent on the active tab
    if (tabId === activeTabId) {
      updateTabTime(tabId, new Date() - activeTabStartTime);
      activeTabStartTime = new Date(); // Reset the start time for the active tab
    }

    // Add or update tracking data for the site
    const entry = trackingData.find(item => item.site === site);
    if (entry) {
      entry.timeSpent += 1; // Increment time spent
    } else {
      trackingData.push({ site, timeSpent: 1 });
    }
  }
}

function handleTabActivation(activeInfo) {
  console.log(`Tab activated: ${activeInfo.tabId}`);
  
  // Save the time spent on the previously active tab
  if (activeTabId !== null && activeTabStartTime !== null) {
    updateTabTime(activeTabId, new Date() - activeTabStartTime);
  }

  // Start tracking the newly activated tab
  activeTabId = activeInfo.tabId;
  activeTabStartTime = new Date();
}

function handleTabRemoval(tabId, removeInfo) {
  console.log(`Tab removed: ${tabId}`);
  
  if (tabId === activeTabId && activeTabStartTime !== null) {
    updateTabTime(tabId, new Date() - activeTabStartTime);
    activeTabId = null;
    activeTabStartTime = null;
  }
}

function updateTabTime(tabId, timeSpent) {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) {
      console.error("Error getting tab information:", chrome.runtime.lastError);
      return;
    }
    const url = new URL(tab.url);
    const site = url.hostname;

    const entry = trackingData.find(item => item.site === site);
    if (entry) {
      entry.timeSpent += timeSpent / 1000; // Convert time to seconds
    }
  });
}

function generateSummary(data, totalTime) {
  const pieChartData = data.map(item => ({
    site: item.site,
    percentage: (item.timeSpent / totalTime) * 100
  }));

  const topKeywords = extractTopKeywords();

  return {
    pieChart: pieChartData,
    keywords: topKeywords,
    totalTime
  };
}

function trackKeywords(keywords) {
  keywords.forEach(keyword => {
    if (!keywordFrequency[keyword]) {
      keywordFrequency[keyword] = 0;
    }
    keywordFrequency[keyword]++;
  });
}

function extractTopKeywords() {
  let sortedKeywords = Object.entries(keywordFrequency).sort((a, b) => b[1] - a[1]);
  return sortedKeywords.slice(0, 3).map(entry => entry[0]);
}

function extractKeywordsFromURL(url) {
  let urlObj = new URL(url);
  let keywords = [];

  // Split the domain and path into keywords
  let pathSegments = urlObj.pathname.split("/").filter(Boolean);
  keywords.push(...pathSegments);

  // If there are query parameters, extract them as well
  if (urlObj.search) {
    let queryParams = new URLSearchParams(urlObj.search);
    for (let [key, value] of queryParams.entries()) {
      keywords.push(...value.split(" "));
    }
  }

  // Clean up keywords: remove special characters and filter short words
  keywords = keywords.map(word => word.replace(/[^a-zA-Z0-9]/g, "").toLowerCase());
  keywords = keywords.filter(word => word.length > 2); // Filter short words

  return keywords;
}
