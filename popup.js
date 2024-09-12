let timerInterval;
let startTime;
let stopTime;

document.addEventListener('DOMContentLoaded', function () {
  // Add event listeners for Start and Stop buttons
  document.getElementById('startBtn').addEventListener('click', startTracking);
  document.getElementById('stopBtn').addEventListener('click', stopTracking);

  // Load start time and timer if it was already running
  chrome.storage.local.get(['startTime', 'stopTime'], function (result) {
    if (result.startTime) {
      startTime = result.startTime;
      startTimer();
      document.getElementById('startBtn').disabled = true;
      document.getElementById('stopBtn').disabled = false;
    }
  });
});

function startTracking() {
  startTime = new Date().getTime();
  chrome.storage.local.set({ 'startTime': startTime });
  startTimer();
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
}

function stopTracking() {
  stopTime = new Date().getTime();
  chrome.storage.local.set({ 'stopTime': stopTime });

  clearInterval(timerInterval);

  // Search for history from startTime to stopTime
  chrome.history.search({
    text: '',
    startTime: startTime,
    endTime: stopTime
  }, processHistory);

  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

// Function to start the timer
function startTimer() {
  timerInterval = setInterval(() => {
    let elapsedTime = new Date().getTime() - startTime;
    let seconds = Math.floor(elapsedTime / 1000) % 60;
    let minutes = Math.floor(elapsedTime / 60000);
    document.getElementById('timerDisplay').textContent = `Timer: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, 1000);
}

// Process browsing history to extract keywords
function processHistory(historyItems) {
  let urlToCount = {};

  historyItems.forEach(item => {
    let url = new URL(item.url);
    let keyword = url.hostname; // You can extract more specific parts of the URL if needed
    if (!urlToCount[keyword]) {
      urlToCount[keyword] = 0;
    }
    urlToCount[keyword]++;
  });

  // Sort and get top keywords
  let sortedKeywords = Object.entries(urlToCount).sort((a, b) => b[1] - a[1]);
  let topKeywords = sortedKeywords.slice(0, 3);

  // Display results in a new tab
  displayResults(sortedKeywords, topKeywords);
}

// Function to open a new tab and display results
function displayResults(sortedKeywords, topKeywords) {
  chrome.tabs.create({ url: 'results.html' }, function (tab) {
    chrome.storage.local.set({ 'keywords': sortedKeywords, 'topKeywords': topKeywords, 'totalTime': stopTime - startTime });
  });
}
