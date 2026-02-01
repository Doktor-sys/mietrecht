// Global variable to hold refresh interval
let refreshInterval;

// Load dashboard data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    loadRecentDecisions();
    loadSystemLogs();
    
    // Set up auto-refresh every 30 seconds
    refreshInterval = setInterval(() => {
        loadDashboardData();
        loadRecentDecisions();
        loadSystemLogs();
    }, 30000);
    
    // Set up manual refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => {
        loadDashboardData();
        loadRecentDecisions();
        loadSystemLogs();
    });
    
    // Set up check alerts button
    document.getElementById('check-alerts-btn').addEventListener('click', checkForAlerts);
    
    // Set up test notification button
    document.getElementById('send-test-notification-btn').addEventListener('click', sendTestNotification);
});

// Load dashboard data from API
function loadDashboardData() {
    fetch('/api/dashboard')
        .then(response => response.json())
        .then(data => {
            // Update agent status
            document.getElementById('agent-status').textContent = data.agentStatus;
            document.getElementById('agent-status').className = 'status-indicator ' + 
                (data.agentStatus === 'running' ? 'status-running' : 'status-stopped');
            
            // Update run times
            document.getElementById('last-run').textContent = data.lastRun || 'Nie';
            document.getElementById('next-run').textContent = data.nextRun || 'Unbekannt';
            
            // Update decision statistics
            document.getElementById('total-decisions').textContent = data.totalDecisionsProcessed;
            document.getElementById('successful-runs').textContent = data.successfulRuns;
            document.getElementById('failed-runs').textContent = data.failedRuns;
            
            // Update performance metrics
            document.getElementById('avg-response-time').textContent = 
                data.performance.avgResponseTime.toFixed(2) + ' ms';
            document.getElementById('cache-hit-rate').textContent = 
                (data.performance.cacheHitRate * 100).toFixed(1) + '%';
            document.getElementById('active-requests').textContent = 
                data.performance.activeRequests;
            
            // Update data sources
            updateDataSources(data.dataSources);
            
            // Update analytics visualizations
            updateAnalyticsVisualizations(data.visualizations);
            
            // Update recent decisions and system logs are handled separately
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
        });
}

// Update data sources display
function updateDataSources(dataSources) {
    const container = document.getElementById('data-sources');
    container.innerHTML = '';
    
    for (const [sourceName, sourceData] of Object.entries(dataSources)) {
        const sourceElement = document.createElement('div');
        sourceElement.className = 'source-card';
        
        const statusClass = sourceData.status === 'online' ? 'status-online' : 
                           sourceData.status === 'offline' ? 'status-offline' : 'status-unknown';
        
        sourceElement.innerHTML = `
            <h3>${sourceName}</h3>
            <div class="source-status ${statusClass}">${sourceData.status}</div>
            <div class="source-last-check">Letzte Prüfung: ${sourceData.lastCheck || 'Nie'}</div>
        `;
        
        container.appendChild(sourceElement);
    }
}

// Update analytics visualizations
function updateAnalyticsVisualizations(visualizations) {
    // Update trend chart
    document.getElementById('trend-chart-content').innerHTML = visualizations.trendChart;
    
    // Update topic distribution
    document.getElementById('topic-distribution-content').innerHTML = visualizations.topicDistribution;
    
    // Update performance metrics
    document.getElementById('performance-metrics-content').innerHTML = visualizations.performanceMetrics;
    
    // Update alerts
    const alertsContainer = document.getElementById('alerts-content');
    if (visualizations.bottleneckAlerts) {
        alertsContainer.innerHTML = visualizations.bottleneckAlerts;
    } else {
        alertsContainer.textContent = 'Keine Warnungen';
    }
}

// Load recent decisions
function loadRecentDecisions() {
    // This function is kept for future implementation
    // For now, we're focusing on the notifications functionality
}

// Load system logs
function loadSystemLogs() {
    // This function is kept for future implementation
    // For now, we're focusing on the notifications functionality
}

// Check for system alerts
function checkForAlerts() {
    fetch('/api/notifications/check-alerts', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        alert('Alarmprüfung abgeschlossen. Ergebnisse in der Konsole.');
        console.log('Alert check results:', data);
    })
    .catch(error => {
        console.error('Error checking for alerts:', error);
        alert('Fehler bei der Alarmprüfung: ' + error.message);
    });
}

// Send test notification
function sendTestNotification() {
    const channel = document.getElementById('test-channel').value;
    const recipient = document.getElementById('test-recipient').value;
    const subject = document.getElementById('test-subject').value;
    const message = document.getElementById('test-message').value;
    
    // Validate inputs
    if (!recipient || !subject || !message) {
        alert('Bitte füllen Sie alle Felder aus.');
        return;
    }
    
    // Disable button during request
    const button = document.getElementById('send-test-notification-btn');
    button.disabled = true;
    button.textContent = 'Senden...';
    
    // Send test notification
    fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            channel: channel,
            recipient: recipient,
            subject: subject,
            message: message
        })
    })
    .then(response => response.json())
    .then(data => {
        // Display result
        const resultDiv = document.getElementById('notification-test-result');
        if (data.results && data.results.length > 0) {
            const success = data.results[0].success;
            resultDiv.innerHTML = `<p class="notification-result ${success ? 'success' : 'error'}">
                ${success ? '✓' : '✗'} Benachrichtigung ${success ? 'erfolgreich gesendet' : 'fehlgeschlagen'}
            </p>`;
        } else {
            resultDiv.innerHTML = '<p class="notification-result error">Unerwartete Antwort vom Server</p>';
        }
    })
    .catch(error => {
        console.error('Error sending test notification:', error);
        const resultDiv = document.getElementById('notification-test-result');
        resultDiv.innerHTML = `<p class="notification-result error">Fehler: ${error.message}</p>`;
    })
    .finally(() => {
        // Re-enable button
        button.disabled = false;
        button.textContent = 'Testbenachrichtigung senden';
    });
}