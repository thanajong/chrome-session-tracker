document.getElementById("start-btn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "start" }, (response) => {
        displayStatus(response.status);
    });
});

document.getElementById("stop-btn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "stop" }, (response) => {
        displaySummary(response.summary);
        displayStatus(response.status);
    });
});

function displayStatus(status) {
    const statusDiv = document.getElementById('status');
    statusDiv.innerHTML = `<p>${status}</p>`;
}

function displaySummary(data) {
    if (!data || !data.pieChart) {
        console.error("No data available for summary.");
        return;
    }

    const ctx = document.getElementById('myChart').getContext('2d');
    if (ctx) {
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.pieChart.map(item => item.site),
                datasets: [{
                    data: data.pieChart.map(item => item.percentage),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                }]
            }
        });
    } else {
        console.error("Chart.js context not found.");
    }

    // Display top keywords and total time
    const summaryDiv = document.getElementById('summary');
    summaryDiv.innerHTML = `
        <h3>Top Keywords:</h3>
        <ul>${data.keywords.map(keyword => `<li>${keyword}</li>`).join('')}</ul>
        <h3>Total Time Spent:</h3>
        <p>${(data.totalTime / 60).toFixed(2)} minutes</p>
    `;
}
