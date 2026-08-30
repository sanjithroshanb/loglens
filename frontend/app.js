const API_URL = "http://127.0.0.1:5001";

let timelineChart = null;
let attackChart = null;


// Show status message
function showStatus(message, type = "info") {
    const status = document.getElementById("statusMessage");

    if (!status) return;

    status.textContent = message;
    status.className = `alert alert-${type} mt-4`;
}


// Escape HTML safely
function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// Update dashboard
function updateDashboard(data) {

    console.log("Dashboard data received:", data);

    document.getElementById("totalLogs").textContent =
        data.total_logs || 0;

    document.getElementById("totalAttacks").textContent =
        data.total_attacks || 0;

    document.getElementById("highSeverity").textContent =
        data.high_severity || 0;


    // -------------------------------
    // TOP ATTACKERS
    // -------------------------------

    const attackersTable =
        document.getElementById("attackersTable");

    attackersTable.innerHTML = "";

    const attackers =
        data.top_attackers || [];


    const attackerCount =
        document.getElementById("attackerCount");

    if (attackerCount) {
        attackerCount.textContent =
            `${attackers.length} attackers`;
    }


    attackers.forEach(attacker => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <code>${escapeHtml(attacker.ip)}</code>
            </td>

            <td>
                <span class="badge bg-danger">
                    ${attacker.attack_count}
                </span>
            </td>
        `;

        attackersTable.appendChild(row);
    });


    // -------------------------------
    // GEOIP LOCATIONS
    // -------------------------------

    const locationsTable =
        document.getElementById("locationsTable");

    if (locationsTable) {

        locationsTable.innerHTML = "";

        attackers.forEach(attacker => {

            const location =
                attacker.location || {};

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>
                    <code>${escapeHtml(attacker.ip)}</code>
                </td>

                <td>
                    🌍 ${escapeHtml(
                        location.country || "Unknown"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        location.country_code || "UNKNOWN"
                    )}
                </td>

                <td>
                    <span class="badge bg-danger">
                        ${attacker.attack_count}
                    </span>
                </td>
            `;

            locationsTable.appendChild(row);
        });
    }


    // -------------------------------
    // DETECTED LOGS
    // -------------------------------

    const logsTable =
        document.getElementById("logsTable");

    logsTable.innerHTML = "";

    const detectedLogs =
        (data.results || []).filter(
            log => log.attack_type !== null
        );


    document.getElementById("resultCount").textContent =
        `${detectedLogs.length} detected`;


    detectedLogs.forEach(log => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>
                <code>${escapeHtml(log.ip)}</code>
            </td>

            <td>
                ${escapeHtml(log.timestamp)}
            </td>

            <td>
                ${escapeHtml(log.method)}
            </td>

            <td>
                ${escapeHtml(log.path)}
            </td>

            <td>
                ${log.status}
            </td>

            <td>
                ${escapeHtml(log.attack_type)}
            </td>

            <td>
                <span class="badge bg-danger">
                    ${escapeHtml(log.severity)}
                </span>
            </td>
        `;

        logsTable.appendChild(row);
    });


    // -------------------------------
    // CHARTS
    // -------------------------------

    createTimelineChart(
        data.attacks_per_hour || {}
    );

    createAttackChart(
        data.attack_types || {}
    );
}


// Timeline chart
function createTimelineChart(data) {

    const canvas =
        document.getElementById("timelineChart");

    if (!canvas) return;

    if (timelineChart) {
        timelineChart.destroy();
    }

    timelineChart = new Chart(canvas, {

        type: "line",

        data: {
            labels: Object.keys(data),

            datasets: [{
                label: "Attacks",

                data: Object.values(data),

                tension: 0.3,

                fill: false
            }]
        },

        options: {
            responsive: true,

            scales: {
                y: {
                    beginAtZero: true,

                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}


// Attack type chart
function createAttackChart(data) {

    const canvas =
        document.getElementById("attackChart");

    if (!canvas) return;

    if (attackChart) {
        attackChart.destroy();
    }

    attackChart = new Chart(canvas, {

        type: "doughnut",

        data: {
            labels: Object.keys(data),

            datasets: [{
                data: Object.values(data)
            }]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}


// -------------------------------
// LOAD DEMO
// -------------------------------

async function loadDemo() {

    console.log("Load Demo button clicked");

    showStatus(
        "Loading demo log...",
        "info"
    );

    try {

        const response =
            await fetch(`${API_URL}/demo`);

        console.log(
            "Demo response status:",
            response.status
        );


        const data =
            await response.json();

        console.log(
            "Demo data:",
            data
        );


        if (!response.ok) {
            throw new Error(
                data.error || "Demo request failed"
            );
        }


        updateDashboard(data);


        showStatus(
            "Demo log analyzed successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Demo error:",
            error
        );

        showStatus(
            `Error: ${error.message}`,
            "danger"
        );
    }
}


// -------------------------------
// UPLOAD LOG
// -------------------------------

async function uploadLog(file) {

    if (!file) return;


    showStatus(
        `Analyzing ${file.name}...`,
        "info"
    );


    const formData =
        new FormData();

    formData.append(
        "file",
        file
    );


    try {

        const response =
            await fetch(
                `${API_URL}/analyze`,
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        if (!response.ok) {
            throw new Error(
                data.error || "Upload failed"
            );
        }


        updateDashboard(data);


        showStatus(
            `${file.name} analyzed successfully.`,
            "success"
        );


    } catch (error) {

        console.error(error);

        showStatus(
            `Error: ${error.message}`,
            "danger"
        );
    }
}


// -------------------------------
// PAGE EVENTS
// -------------------------------

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const demoButton =
            document.getElementById("demoBtn");

        const fileInput =
            document.getElementById("logFile");


        if (demoButton) {

            demoButton.addEventListener(
                "click",
                loadDemo
            );

            console.log(
                "Demo button connected"
            );
        }


        if (fileInput) {

            fileInput.addEventListener(
                "change",
                event => {

                    const file =
                        event.target.files[0];

                    uploadLog(file);
                }
            );

            console.log(
                "File upload connected"
            );
        }

    }
);
