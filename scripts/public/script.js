// script.js - Frontend logic for the Mietrecht Agent Configuration Interface

// DOM elements
const tabLinks = document.querySelectorAll('.nav-link');
const tabContents = document.querySelectorAll('.tab-content');

// Load configuration when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadConfiguration();
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    // Tab navigation
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            switchTab(this.getAttribute('data-tab'));
        });
    });

    // Form submissions
    document.getElementById('data-sources-form').addEventListener('submit', saveDataSources);
    document.getElementById('nlp-settings-form').addEventListener('submit', saveNlpSettings);
    document.getElementById('integrations-form').addEventListener('submit', saveIntegrations);
    document.getElementById('notifications-form').addEventListener('submit', saveNotifications);
    document.getElementById('performance-form').addEventListener('submit', savePerformance);
    document.getElementById('lawyer-form').addEventListener('submit', saveLawyer);
    document.getElementById('cancel-lawyer').addEventListener('click', cancelLawyerEdit);

    // Load lawyers
    loadLawyers();
}

// Switch between tabs
function switchTab(tabId) {
    // Hide all tab contents
    tabContents.forEach(content => {
        content.classList.remove('active');
    });

    // Remove active class from all tab links
    tabLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Show the selected tab content
    document.getElementById(tabId).classList.add('active');

    // Add active class to the clicked tab link
    document.querySelector(`.nav-link[data-tab="${tabId}"]`).classList.add('active');
}

// Load configuration from server
function loadConfiguration() {
    fetch('/api/config')
        .then(response => response.json())
        .then(config => {
            // Populate data sources
            if (config.dataSources) {
                document.getElementById('bgh-enabled').checked = config.dataSources.bgh?.enabled || false;
                document.getElementById('bgh-baseurl').value = config.dataSources.bgh?.baseUrl || '';
                document.getElementById('bgh-maxresults').value = config.dataSources.bgh?.maxResults || 50;

                document.getElementById('landgerichte-enabled').checked = config.dataSources.landgerichte?.enabled || false;
                document.getElementById('landgerichte-baseurl').value = config.dataSources.landgerichte?.baseUrl || '';
                document.getElementById('landgerichte-maxresults').value = config.dataSources.landgerichte?.maxResults || 50;

                document.getElementById('bverfg-enabled').checked = config.dataSources.bverfg?.enabled || false;
                document.getElementById('bverfg-baseurl').value = config.dataSources.bverfg?.baseUrl || '';
                document.getElementById('bverfg-maxresults').value = config.dataSources.bverfg?.maxResults || 50;

                document.getElementById('beckonline-enabled').checked = config.dataSources.beckOnline?.enabled || false;
                document.getElementById('beckonline-baseurl').value = config.dataSources.beckOnline?.baseUrl || '';
                document.getElementById('beckonline-maxresults').value = config.dataSources.beckOnline?.maxResults || 50;
            }

            // Populate NLP settings
            if (config.nlp) {
                document.getElementById('nlp-summarization').checked = config.nlp.enableSummarization || false;
                document.getElementById('nlp-topic-extraction').checked = config.nlp.enableTopicExtraction || false;
                document.getElementById('nlp-entity-extraction').checked = config.nlp.enableEntityExtraction || false;
                document.getElementById('nlp-importance-classification').checked = config.nlp.enableImportanceClassification || false;
                document.getElementById('nlp-practice-implications').checked = config.nlp.enablePracticeImplications || false;
            }

            // Populate integrations
            if (config.integrations) {
                document.getElementById('asana-enabled').checked = config.integrations.asana?.enabled || false;
                document.getElementById('asana-projectid').value = config.integrations.asana?.projectId || '';
                document.getElementById('asana-workspaceid').value = config.integrations.asana?.workspaceId || '';

                document.getElementById('github-enabled').checked = config.integrations.github?.enabled || false;
                document.getElementById('github-owner').value = config.integrations.github?.owner || '';
                document.getElementById('github-repo').value = config.integrations.github?.repo || '';
            }

            // Populate notifications
            if (config.notifications) {
                document.getElementById('email-notifications').checked = config.notifications.email?.enabled || false;
                if (config.notifications.email?.smtp) {
                    document.getElementById('smtp-host').value = config.notifications.email.smtp.host || '';
                    document.getElementById('smtp-port').value = config.notifications.email.smtp.port || 587;
                    document.getElementById('smtp-secure').checked = config.notifications.email.smtp.secure || false;
                    document.getElementById('smtp-user').value = config.notifications.email.smtp.user || '';
                    // Note: We don't populate the password field for security reasons
                }
            }

            // Populate performance settings
            if (config.performance) {
                document.getElementById('cache-enabled').checked = config.performance.cacheEnabled || false;
                document.getElementById('cache-ttl').value = config.performance.cacheTtl || 30;
                document.getElementById('rate-limit').value = config.performance.rateLimit || 10;
                document.getElementById('max-retries').value = config.performance.maxRetries || 3;
                document.getElementById('retry-delay').value = config.performance.retryDelay || 1000;
            }
        })
        .catch(error => {
            console.error('Error loading configuration:', error);
            alert('Fehler beim Laden der Konfiguration: ' + error.message);
        });
}

// Save data sources configuration
function saveDataSources(e) {
    e.preventDefault();

    const config = {
        dataSources: {
            bgh: {
                enabled: document.getElementById('bgh-enabled').checked,
                baseUrl: document.getElementById('bgh-baseurl').value,
                maxResults: parseInt(document.getElementById('bgh-maxresults').value)
            },
            landgerichte: {
                enabled: document.getElementById('landgerichte-enabled').checked,
                baseUrl: document.getElementById('landgerichte-baseurl').value,
                maxResults: parseInt(document.getElementById('landgerichte-maxresults').value)
            },
            bverfg: {
                enabled: document.getElementById('bverfg-enabled').checked,
                baseUrl: document.getElementById('bverfg-baseurl').value,
                maxResults: parseInt(document.getElementById('bverfg-maxresults').value)
            },
            beckOnline: {
                enabled: document.getElementById('beckonline-enabled').checked,
                baseUrl: document.getElementById('beckonline-baseurl').value,
                maxResults: parseInt(document.getElementById('beckonline-maxresults').value)
            }
        }
    };

    saveConfiguration(config, 'Datenquellen');
}

// Save NLP settings
function saveNlpSettings(e) {
    e.preventDefault();

    const config = {
        nlp: {
            enableSummarization: document.getElementById('nlp-summarization').checked,
            enableTopicExtraction: document.getElementById('nlp-topic-extraction').checked,
            enableEntityExtraction: document.getElementById('nlp-entity-extraction').checked,
            enableImportanceClassification: document.getElementById('nlp-importance-classification').checked,
            enablePracticeImplications: document.getElementById('nlp-practice-implications').checked
        }
    };

    saveConfiguration(config, 'NLP-Einstellungen');
}

// Save integrations
function saveIntegrations(e) {
    e.preventDefault();

    const config = {
        integrations: {
            asana: {
                enabled: document.getElementById('asana-enabled').checked,
                projectId: document.getElementById('asana-projectid').value,
                workspaceId: document.getElementById('asana-workspaceid').value
            },
            github: {
                enabled: document.getElementById('github-enabled').checked,
                owner: document.getElementById('github-owner').value,
                repo: document.getElementById('github-repo').value
            }
        }
    };

    saveConfiguration(config, 'Integrationen');
}

// Save notifications
function saveNotifications(e) {
    e.preventDefault();

    const config = {
        notifications: {
            email: {
                enabled: document.getElementById('email-notifications').checked,
                smtp: {
                    host: document.getElementById('smtp-host').value,
                    port: parseInt(document.getElementById('smtp-port').value),
                    secure: document.getElementById('smtp-secure').checked,
                    user: document.getElementById('smtp-user').value,
                    pass: document.getElementById('smtp-pass').value
                }
            }
        }
    };

    saveConfiguration(config, 'Benachrichtigungseinstellungen');
}

// Save performance settings
function savePerformance(e) {
    e.preventDefault();

    const config = {
        performance: {
            cacheEnabled: document.getElementById('cache-enabled').checked,
            cacheTtl: parseInt(document.getElementById('cache-ttl').value),
            rateLimit: parseInt(document.getElementById('rate-limit').value),
            maxRetries: parseInt(document.getElementById('max-retries').value),
            retryDelay: parseInt(document.getElementById('retry-delay').value)
        }
    };

    saveConfiguration(config, 'Performance-Einstellungen');
}

// Save configuration to server
function saveConfiguration(config, sectionName) {
    fetch('/api/config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        alert(`${sectionName} erfolgreich gespeichert!`);
    })
    .catch(error => {
        console.error('Error saving configuration:', error);
        alert('Fehler beim Speichern der Konfiguration: ' + error.message);
    });
}

// Load lawyers from server
function loadLawyers() {
    fetch('/api/lawyers')
        .then(response => response.json())
        .then(lawyers => {
            const container = document.getElementById('lawyers-container');
            container.innerHTML = '';

            if (lawyers.length === 0) {
                container.innerHTML = '<p>Keine Anwälte registriert.</p>';
                return;
            }

            lawyers.forEach(lawyer => {
                const lawyerItem = document.createElement('li');
                lawyerItem.className = 'lawyer-item';
                lawyerItem.innerHTML = `
                    <div class="lawyer-info">
                        <h4>${lawyer.name}</h4>
                        <p>${lawyer.email}</p>
                        <p>${lawyer.lawFirm}</p>
                    </div>
                    <div class="lawyer-actions">
                        <button class="edit-btn" data-id="${lawyer.id}">Bearbeiten</button>
                        <button class="delete-btn" data-id="${lawyer.id}">Löschen</button>
                    </div>
                `;
                container.appendChild(lawyerItem);
            });

            // Add event listeners to edit and delete buttons
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', function() {
                    editLawyer(parseInt(this.getAttribute('data-id')));
                });
            });

            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', function() {
                    deleteLawyer(parseInt(this.getAttribute('data-id')));
                });
            });
        })
        .catch(error => {
            console.error('Error loading lawyers:', error);
            alert('Fehler beim Laden der Anwälte: ' + error.message);
        });
}

// Save lawyer
function saveLawyer(e) {
    e.preventDefault();

    const lawyer = {
        id: document.getElementById('lawyer-id').value ? parseInt(document.getElementById('lawyer-id').value) : Date.now(),
        name: document.getElementById('lawyer-name').value,
        email: document.getElementById('lawyer-email').value,
        lawFirm: document.getElementById('lawyer-lawfirm').value,
        practiceAreas: document.getElementById('lawyer-practiceareas').value.split(',').map(item => item.trim()).filter(item => item),
        regions: document.getElementById('lawyer-regions').value.split(',').map(item => item.trim()).filter(item => item),
        preferences: {
            courtLevels: document.getElementById('lawyer-courtlevels').value.split(',').map(item => item.trim()).filter(item => item),
            topics: document.getElementById('lawyer-topics').value.split(',').map(item => item.trim()).filter(item => item),
            frequency: document.getElementById('lawyer-frequency').value,
            importanceThreshold: document.getElementById('lawyer-importancethreshold').value
        }
    };

    fetch('/api/lawyers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(lawyer)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        alert('Anwalt erfolgreich gespeichert!');
        loadLawyers();
        cancelLawyerEdit();
    })
    .catch(error => {
        console.error('Error saving lawyer:', error);
        alert('Fehler beim Speichern des Anwalts: ' + error.message);
    });
}

// Edit lawyer
function editLawyer(lawyerId) {
    fetch('/api/lawyers')
        .then(response => response.json())
        .then(lawyers => {
            const lawyer = lawyers.find(l => l.id === lawyerId);
            if (lawyer) {
                document.getElementById('lawyer-id').value = lawyer.id;
                document.getElementById('lawyer-name').value = lawyer.name;
                document.getElementById('lawyer-email').value = lawyer.email;
                document.getElementById('lawyer-lawfirm').value = lawyer.lawFirm;
                document.getElementById('lawyer-practiceareas').value = lawyer.practiceAreas.join(', ');
                document.getElementById('lawyer-regions').value = lawyer.regions.join(', ');
                document.getElementById('lawyer-courtlevels').value = lawyer.preferences.courtLevels.join(', ');
                document.getElementById('lawyer-topics').value = lawyer.preferences.topics.join(', ');
                document.getElementById('lawyer-frequency').value = lawyer.preferences.frequency;
                document.getElementById('lawyer-importancethreshold').value = lawyer.preferences.importanceThreshold;

                // Switch to lawyers tab
                switchTab('lawyers');
            }
        })
        .catch(error => {
            console.error('Error loading lawyer for edit:', error);
            alert('Fehler beim Laden des Anwalts zum Bearbeiten: ' + error.message);
        });
}

// Delete lawyer
function deleteLawyer(lawyerId) {
    if (confirm('Sind Sie sicher, dass Sie diesen Anwalt löschen möchten?')) {
        fetch(`/api/lawyers/${lawyerId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            alert('Anwalt erfolgreich gelöscht!');
            loadLawyers();
        })
        .catch(error => {
            console.error('Error deleting lawyer:', error);
            alert('Fehler beim Löschen des Anwalts: ' + error.message);
        });
    }
}

// Cancel lawyer edit
function cancelLawyerEdit() {
    document.getElementById('lawyer-form').reset();
    document.getElementById('lawyer-id').value = '';
}