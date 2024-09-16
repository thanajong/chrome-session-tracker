import Chart from 'chart.js/auto';

document.addEventListener('DOMContentLoaded', function () {
    // Fetch session data from Chrome storage
    chrome.storage.local.get(['keywords', 'topKeywords', 'totalTime'], (result) => {

      // Display top 3 keywords
      let topKeywordsList = document.getElementById('topKeywords');
      result.topKeywords.forEach(keyword => {
        let li = document.createElement('li');
        li.textContent = `${keyword[0]} (${keyword[1]} visits)`;
        topKeywordsList.appendChild(li);
      });

      // Display total time spent in the session
      let timeSpent = Math.floor(result.totalTime / 1000);
      document.getElementById('timeSpent').textContent = `${timeSpent} seconds`;

      // Display all browsing history
      let historyList = document.getElementById('historyList');
      result.keywords.forEach(keyword => {
        let li = document.createElement('li');
        li.textContent = `${keyword[0]} (${keyword[1]} visits)`;
        historyList.appendChild(li);
      });

      // Generate pie chart with keyword data
      generatePieChart(result.keywords);
    });
  });

  // Function to generate a pie chart
  function generatePieChart(keywords) {
    let ctx = document.getElementById('pieChart').getContext('2d');

    // Prepare labels and data from the keyword array
    let labels = keywords.map(keyword => keyword[0]);
    let data = keywords.map(keyword => keyword[1]);

    // Create a new pie chart using Chart.js
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels, // Keywords as labels
        datasets: [{
          data: data, // Keyword visit counts as data
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
          ],
          hoverBackgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
          ]
        }]
      },
      options: {
        responsive: true
      }
    });
  }

  // Function to extract keywords from a given URL
function extractKeywordsFromUrl(url) {
    // Create an anchor element to parse the URL
    let a = document.createElement('a');
    a.href = url;

    // Extract hostname and path
    let hostname = a.hostname.replace('www.', '');  // Remove 'www'
    let path = a.pathname;

    // Tokenize the hostname and path
    let tokens = tokenize(hostname + ' ' + path);

    // Remove common stopwords and filter out short tokens
    let filteredTokens = tokens.filter(token => !isStopWord(token) && token.length > 2);

    return filteredTokens;
  }

  // Tokenize a string by splitting on non-alphanumeric characters
  function tokenize(str) {
    return str.toLowerCase().split(/[\W_]+/);  // Split by non-alphanumeric characters
  }

  // List of common stopwords to filter out (can be expanded)
  const stopwords = ['the', 'and', 'of', 'in', 'to', 'a', 'for', 'with', 'on', 'this', 'by', 'is', 'it', 'at', 'as', 'be'];

  // Function to check if a word is a stopword
  function isStopWord(word) {
    return stopwords.includes(word);
  }

  // Function to process history items and extract keywords
  function processHistoryItems(historyItems) {
    let keywordCount = {};

    historyItems.forEach(item => {
      let keywords = extractKeywordsFromUrl(item.url);

      // Count the occurrence of each keyword
      keywords.forEach(keyword => {
        if (!keywordCount[keyword]) {
          keywordCount[keyword] = 0;
        }
        keywordCount[keyword]++;
      });
    });

    return keywordCount;
  }

  // Example function to simulate processing session data
  function analyzeBrowsingSession(startTime, stopTime) {
    // Use Chrome History API to get history between startTime and stopTime
    chrome.history.search({
      text: '',  // Search for all history items
      startTime: startTime,
      endTime: stopTime
    }, function (historyItems) {
      let keywordCount = processHistoryItems(historyItems);

      // Sort keywords by their frequency
      let sortedKeywords = Object.entries(keywordCount).sort((a, b) => b[1] - a[1]);

      // Save top 3 keywords and keyword data to Chrome storage
      chrome.storage.local.set({
        keywords: sortedKeywords,
        topKeywords: sortedKeywords.slice(0, 3)
      }, function () {
        console.log('Keywords and session data saved.');
      });

      // Optionally: Display or use sortedKeywords here
    });
  }
