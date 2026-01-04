class APIClient {
  constructor(baseURL = "http://localhost:8080") {
    this.baseURL = baseURL;
  }

  async fetchAPI(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      this.showError(`API Error: ${error.message}`);
      throw error;
    }
  }

  async getDashboardStats() {
    return await this.fetchAPI("/api/dashboard/stats");
  }

  async getAllScooters() {
    return await this.fetchAPI("/api/trottinettes");
  }

  async getAvailableScooters() {
    return await this.fetchAPI("/api/trottinettes/disponibles");
  }

  async getUnavailableScooters() {
    return await this.fetchAPI("/api/trottinettes/indisponibles");
  }

  async getScooterDetails(id) {
    return await this.fetchAPI(`/api/scooters/${id}`);
  }

  async addScooter(scooterData) {
    return await this.fetchAPI("/api/scooters", {
      method: "POST",
      body: JSON.stringify(scooterData),
    });
  }

  async deleteScooter(id) {
    return await this.fetchAPI(`/api/scooters/${id}`, {
      method: "DELETE",
    });
  }

  async rechargeScooter(id, minutes) {
    return await this.fetchAPI(`/api/scooters/${id}/recharge`, {
      method: "POST",
      body: JSON.stringify({ minutes }),
    });
  }

  async simulateTrips(count) {
    return await this.fetchAPI("/api/trips/simulate", {
      method: "POST",
      body: JSON.stringify({ count }),
    });
  }

  async calculateTripCost(distance) {
    return await this.fetchAPI("/api/trips/calculate-cost", {
      method: "POST",
      body: JSON.stringify({ distance }),
    });
  }

  async getAnomalies() {
    return await this.fetchAPI("/api/anomalies");
  }

  async getAlerts() {
    return await this.fetchAPI("/api/monitor/alerts");
  }

  async generateReport() {
    return await this.fetchAPI("/api/reports/generate");
  }

  async checkHealth() {
    return await this.fetchAPI("/api/health");
  }

  showError(message) {
    alert(`Error: ${message}`);
  }

  showSuccess(message) {
    alert(`Success: ${message}`);
  }
}

class FleetManagerApp {
  constructor() {
    this.api = new APIClient();
    this.currentPage = "dashboard";
    this.isMonitoring = false;
    this.monitorInterval = null;
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupEventListeners();
    this.checkBackendConnection();
    this.loadDashboard();

    this.addNotificationStyles();
  }

  async checkBackendConnection() {
    try {
      const health = await this.api.checkHealth();
      console.log("Backend connected:", health);
      this.showNotification("Backend connected successfully", "success");
    } catch (error) {
      console.error("Backend connection failed:", error);
      this.showNotification(
        "Cannot connect to backend. Make sure the C++ server is running on port 8080.",
        "error",
      );
    }
  }

  setupNavigation() {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        this.switchPage(page);
      });
    });

    document.querySelectorAll(".view-all").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const page = button.dataset.page;
        this.switchPage(page);
      });
    });
  }

  setupEventListeners() {
    document.getElementById("refreshBtn").addEventListener("click", () => {
      this.showLoading();
      setTimeout(() => {
        this.loadDashboard();
        this.hideLoading();
        this.showNotification("Data refreshed successfully", "success");
      }, 1000);
    });

    document.querySelectorAll(".action-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        this.handleQuickAction(action);
      });
    });

    document.getElementById("addScooterBtn").addEventListener("click", () => {
      this.showAddScooterModal();
    });

    document.querySelectorAll(".modal-close").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.closeAllModals();
      });
    });

    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeAllModals();
        }
      });
    });

    document.getElementById("scooterBattery").addEventListener("input", (e) => {
      document.querySelector(".battery-display").textContent =
        `${e.target.value}%`;
    });

    document.getElementById("chargeMinutes").addEventListener("input", (e) => {
      const minutes = parseInt(e.target.value);
      const percentIncrease = minutes * 5;
      document.querySelector(".charge-display").textContent =
        `${minutes} minutes (+${Math.min(percentIncrease, 100)}%)`;
    });

    document.getElementById("startChargeBtn").addEventListener("click", () => {
      const minutes = parseInt(document.getElementById("chargeMinutes").value);
      this.startCharging(minutes);
    });

    document.getElementById("toggleMonitor").addEventListener("click", () => {
      this.toggleMonitoring();
    });

    document.getElementById("clearAlerts").addEventListener("click", () => {
      document.getElementById("alertsList").innerHTML = "";
    });

    document
      .getElementById("runSimulationBtn")
      .addEventListener("click", () => {
        const trips = parseInt(document.getElementById("tripCount").value);
        const distance = parseFloat(
          document.getElementById("tripDistance").value,
        );
        this.runTripSimulation(trips, distance);
      });

    document.getElementById("tripDistance").addEventListener("input", (e) => {
      document.getElementById("distanceValue").textContent =
        `${e.target.value} km`;
    });

    document
      .getElementById("calculateCostBtn")
      .addEventListener("click", async () => {
        const distance = parseFloat(prompt("Enter distance in km:") || "5");
        this.calculateTripCost(distance);
      });

    document
      .getElementById("generateReportBtn")
      .addEventListener("click", () => {
        this.generateReport();
      });

    document
      .getElementById("addScooterForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.submitAddScooterForm();
      });
  }

  switchPage(page) {
    document
      .querySelectorAll(".nav-link")
      .forEach((link) => link.classList.remove("active"));
    document.querySelector(`[data-page="${page}"]`).classList.add("active");

    document
      .querySelectorAll(".page")
      .forEach((p) => p.classList.remove("active"));
    document.getElementById(page).classList.add("active");

    switch (page) {
      case "dashboard":
        this.loadDashboard();
        break;
      case "scooters":
        this.loadScooters();
        break;
      case "trips":
        this.loadTrips();
        break;
      case "reports":
        this.loadReports();
        break;
      case "monitor":
        this.loadMonitor();
        break;
    }
  }

  async loadDashboard() {
    try {
      this.showLoading();
      const stats = await this.api.getDashboardStats();
      this.updateDashboardStats(stats);

      const scooters = await this.api.getAllScooters();
      this.updateRecentScooters(scooters);

      this.hideLoading();
      this.showNotification("Dashboard updated", "success");
    } catch (error) {
      this.hideLoading();
      this.showNotification("Failed to load dashboard", "error");
    }
  }

  updateDashboardStats(stats) {
    document.getElementById("totalScooters").textContent =
      stats.totalScooters || 0;
    document.getElementById("availableScooters").textContent =
      stats.availableScooters || 0;
    document.getElementById("unavailableScooters").textContent =
      stats.unavailableScooters || 0;
    document.getElementById("lowBattery").textContent = stats.lowBattery || 0;
  }

  updateRecentScooters(scootersData) {
    const tableBody = document.getElementById("recentScootersTable");
    tableBody.innerHTML = "";

    const scooters = scootersData.scooters || scootersData.trottinettes || [];
    const recent = scooters.slice(0, 5);

    recent.forEach((scooter) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td><strong>#${scooter.id}</strong></td>
                <td>${scooter.modele || scooter.model}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${scooter.batterie || scooter.battery}%; background: ${this.getBatteryColor(scooter.batterie || scooter.battery)}"></div>
                        <span>${scooter.batterie || scooter.battery}%</span>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${(scooter.etat || scooter.status).toLowerCase()}">
                        ${scooter.etatTexte || scooter.status}
                    </span>
                </td>
                <td>${this.formatLocation(scooter.position || scooter.location)}</td>
                <td>
                    <button class="btn-icon" onclick="app.viewScooterDetails(${scooter.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="app.chargeScooter(${scooter.id})">
                        <i class="fas fa-charging-station"></i>
                    </button>
                </td>
            `;
      tableBody.appendChild(row);
    });
  }

  async loadScooters() {
    try {
      this.showLoading();
      const scooters = await this.api.getAllScooters();
      this.updateScootersTable(scooters);
      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      this.showNotification("Failed to load scooters", "error");
    }
  }

  updateScootersTable(scootersData) {
    const tableBody = document.getElementById("scootersTable");
    tableBody.innerHTML = "";

    const scooters = scootersData.scooters || scootersData.trottinettes || [];

    scooters.forEach((scooter) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td><input type="checkbox" class="scooter-checkbox" value="${scooter.id}"></td>
                <td>#${scooter.id}</td>
                <td>${scooter.modele || scooter.model}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${scooter.batterie || scooter.battery}%; background: ${this.getBatteryColor(scooter.batterie || scooter.battery)}"></div>
                        <span>${scooter.batterie || scooter.battery}%</span>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${(scooter.etat || scooter.status).toLowerCase()}">
                        ${scooter.etatTexte || scooter.status}
                    </span>
                </td>
                <td>${this.formatLocation(scooter.position || scooter.location)}</td>
                <td>${scooter.lastUsed || "Today"}</td>
                <td>
                    <button class="btn-icon" onclick="app.viewScooterDetails(${scooter.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="app.chargeScooter(${scooter.id})">
                        <i class="fas fa-charging-station"></i>
                    </button>
                    <button class="btn-icon" onclick="app.deleteScooter(${scooter.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
      tableBody.appendChild(row);
    });
  }

  async loadTrips() {
    console.log("Trips page loaded");
  }

  async loadReports() {
    try {
      this.showLoading();
      const report = await this.api.generateReport();
      this.updateReportData(report);
      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      this.showNotification("Failed to load report", "error");
    }
  }

  updateReportData(report) {
    if (report.batterieFaible !== undefined) {
      document.getElementById("batteryLow").textContent =
        report.batterieFaible || 0;
    }
    if (report.batterieCritique !== undefined) {
      document.getElementById("batteryCritical").textContent =
        report.batterieCritique || 0;
    }

    document.getElementById("batteryFull").textContent = report.batterieFaible
      ? Math.max(0, 20 - report.batterieFaible)
      : 10;
    document.getElementById("batteryMedium").textContent =
      report.batterieFaible || 5;
    document.getElementById("batteryLow").textContent =
      report.batterieFaible || 3;
    document.getElementById("batteryCritical").textContent =
      report.batterieCritique || 2;
  }

  async loadMonitor() {
    try {
      const alerts = await this.api.getAlerts();
      this.updateAlerts(alerts);

      const anomalies = await this.api.getAnomalies();
      this.updateAnomalies(anomalies);
    } catch (error) {
      this.showNotification("Failed to load monitor data", "error");
    }
  }

  updateAlerts(alertsData) {
    const alertsList = document.getElementById("alertsList");
    alertsList.innerHTML = "";

    const alerts = alertsData.alerts || [];

    alerts.forEach((alert) => {
      const alertItem = document.createElement("div");
      const isCritical = alert.critical || alert.type.includes("critical");
      alertItem.className = `alert-item ${isCritical ? "critical" : "warning"}`;
      alertItem.innerHTML = `
                <div class="alert-icon ${isCritical ? "critical" : "warning"}">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${alert.type || "Alert"}</div>
                    <div class="alert-message">Scooter #${alert.scooterId || alert.idTrottinette || "N/A"}: ${alert.message || alert.description}</div>
                    <div class="alert-time">${alert.timestamp || "Just now"}</div>
                </div>
            `;
      alertsList.appendChild(alertItem);
    });
  }

  updateAnomalies(anomaliesData) {
    const anomaliesList = document.getElementById("anomaliesList");
    anomaliesList.innerHTML = "";

    const anomalies = anomaliesData.anomalies || [];

    anomalies.forEach((anomaly) => {
      const anomalyItem = document.createElement("div");
      anomalyItem.className = "anomaly-item";
      anomalyItem.innerHTML = `
                <div class="anomaly-header">
                    <span class="anomaly-scooter">Scooter #${anomaly.id || anomaly.idTrottinette}</span>
                    <span class="anomaly-time">Just now</span>
                </div>
                <div class="anomaly-description">${anomaly.anomalies || anomaly.description || "No details"}</div>
            `;
      anomaliesList.appendChild(anomalyItem);
    });

    const anomalyCount = anomalies.length;
    document.getElementById("anomalyCount").textContent =
      `${anomalyCount} anomalies`;
  }

  handleQuickAction(action) {
    switch (action) {
      case "add-scooter":
        this.showAddScooterModal();
        break;
      case "simulate-trips":
        this.runTripSimulation(5, 3);
        break;
      case "quick-charge":
        this.quickChargeAll();
        break;
      case "generate-report":
        this.switchPage("reports");
        break;
    }
  }

  showAddScooterModal() {
    document.getElementById("addScooterModal").classList.add("active");
  }

  async submitAddScooterForm() {
    try {
      const form = document.getElementById("addScooterForm");
      const formData = {
        model: document.getElementById("scooterModel").value,
        battery: parseFloat(document.getElementById("scooterBattery").value),
        latitude: parseFloat(document.getElementById("latitude").value),
        longitude: parseFloat(document.getElementById("longitude").value),
      };

      const result = await this.api.addScooter(formData);

      if (result.success) {
        this.showNotification("Scooter added successfully", "success");
        document.getElementById("addScooterModal").classList.remove("active");
        form.reset();
        this.loadDashboard();
      } else {
        this.showNotification(result.error || "Failed to add scooter", "error");
      }
    } catch (error) {
      this.showNotification("Error adding scooter", "error");
    }
  }

  async runTripSimulation(trips, distance = 3) {
    try {
      this.showLoading();
      const result = await this.api.simulateTrips(trips);
      this.showNotification(`Simulated ${trips} trips successfully`, "success");
      this.hideLoading();
      this.loadDashboard();
    } catch (error) {
      this.hideLoading();
      this.showNotification("Failed to simulate trips", "error");
    }
  }

  async calculateTripCost(distance) {
    try {
      const result = await this.api.calculateTripCost(distance);

      const breakdown = document.getElementById("costBreakdown");
      breakdown.innerHTML = `
                <div class="cost-item">
                    <span>Base fare:</span>
                    <span>$1.00</span>
                </div>
                <div class="cost-item">
                    <span>Time cost:</span>
                    <span>$${(distance * 10 * 0.25).toFixed(2)}</span>
                </div>
                <div class="cost-item">
                    <span>Distance cost:</span>
                    <span>$${(distance * 1.0).toFixed(2)}</span>
                </div>
                <div class="cost-total">
                    <span><strong>Total:</strong></span>
                    <span><strong>$${result.coutTotal || result.totalCost || "0.00"}</strong></span>
                </div>
            `;

      this.showNotification(
        `Trip cost calculated: $${result.coutTotal || result.totalCost || "0.00"}`,
        "success",
      );
    } catch (error) {
      this.showNotification("Failed to calculate cost", "error");
    }
  }

  async generateReport() {
    try {
      this.showLoading();
      await this.api.generateReport();
      this.hideLoading();
      this.showNotification("Report generated successfully", "success");
      this.switchPage("reports");
    } catch (error) {
      this.hideLoading();
      this.showNotification("Failed to generate report", "error");
    }
  }

  async viewScooterDetails(id) {
    try {
      const details = await this.api.getScooterDetails(id);
      const scooter = details.scooter || details;

      const modal = document.getElementById("scooterDetailsModal");
      const content = modal.querySelector(".scooter-details");

      content.innerHTML = `
                <div class="scooter-detail-item">
                    <strong>ID:</strong> #${id}
                </div>
                <div class="scooter-detail-item">
                    <strong>Model:</strong> ${scooter.modele || scooter.model || "Unknown"}
                </div>
                <div class="scooter-detail-item">
                    <strong>Battery:</strong> ${scooter.batterie || scooter.battery || "0"}%
                </div>
                <div class="scooter-detail-item">
                    <strong>Status:</strong> ${scooter.etatTexte || scooter.status || "Unknown"}
                </div>
                <div class="scooter-detail-item">
                    <strong>Location:</strong> ${this.formatLocation(scooter.position || scooter.location)}
                </div>
                <div class="scooter-detail-item">
                    <strong>Last Maintenance:</strong> ${scooter.lastMaintenance || "2024-03-15"}
                </div>
                <div class="scooter-detail-item">
                    <strong>Total Distance:</strong> ${scooter.totalDistance || "245"} km
                </div>
                <div class="scooter-detail-item">
                    <strong>Anomalies:</strong> ${scooter.anomalies || "None"}
                </div>
            `;

      modal.classList.add("active");
    } catch (error) {
      this.showNotification("Failed to load scooter details", "error");
    }
  }

  async chargeScooter(id) {
    const minutes = parseInt(prompt("Enter charging minutes (5-60):", "20"));
    if (minutes && minutes >= 5 && minutes <= 60) {
      try {
        this.showLoading();
        await this.api.rechargeScooter(id, minutes);
        this.hideLoading();
        this.showNotification(
          `Charging scooter #${id} for ${minutes} minutes`,
          "success",
        );
        this.loadDashboard();
      } catch (error) {
        this.hideLoading();
        this.showNotification("Failed to start charging", "error");
      }
    }
  }

  async deleteScooter(id) {
    if (confirm(`Are you sure you want to delete scooter #${id}?`)) {
      try {
        this.showLoading();
        await this.api.deleteScooter(id);
        this.hideLoading();
        this.showNotification(`Scooter #${id} deleted`, "success");
        this.loadDashboard();
      } catch (error) {
        this.hideLoading();
        this.showNotification("Failed to delete scooter", "error");
      }
    }
  }

  async quickChargeAll() {
    try {
      this.showLoading();

      const scooters = await this.api.getAllScooters();
      const scootersList = scooters.scooters || scooters.trottinettes || [];
      const lowBatteryScooters = scootersList.filter(
        (s) => (s.batterie || s.battery) < 30,
      );

      for (const scooter of lowBatteryScooters) {
        await this.api.rechargeScooter(scooter.id, 10);
      }

      this.hideLoading();
      this.showNotification(
        `Charged ${lowBatteryScooters.length} scooters`,
        "success",
      );
      this.loadDashboard();
    } catch (error) {
      this.hideLoading();
      this.showNotification("Failed to charge scooters", "error");
    }
  }

  startCharging(minutes) {
    this.showLoading();
    this.closeAllModals();

    setTimeout(() => {
      this.showNotification(
        `Charging started for ${minutes} minutes`,
        "success",
      );
      this.hideLoading();
      this.loadDashboard();
    }, 1000);
  }

  toggleMonitoring() {
    this.isMonitoring = !this.isMonitoring;
    const btn = document.getElementById("toggleMonitor");
    const indicator = document.querySelector(".status-indicator.active");

    if (this.isMonitoring) {
      btn.innerHTML = '<i class="fas fa-pause"></i> Pause Monitoring';
      if (indicator) indicator.style.background = "var(--success-color)";
      this.startMonitoring();
      this.showNotification("Monitoring resumed", "info");
    } else {
      btn.innerHTML = '<i class="fas fa-play"></i> Resume Monitoring';
      if (indicator) indicator.style.background = "var(--warning-color)";
      this.stopMonitoring();
      this.showNotification("Monitoring paused", "warning");
    }
  }

  startMonitoring() {
    this.monitorInterval = setInterval(async () => {
      try {
        await this.loadMonitor();
      } catch (error) {
        console.log("Monitoring update failed:", error);
      }
    }, 5000);
  }

  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  formatLocation(location) {
    if (!location) return "Unknown";
    if (typeof location === "string") return location;
    if (location.latitude && location.longitude) {
      return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
    }
    return JSON.stringify(location);
  }

  getBatteryColor(percentage) {
    if (percentage < 10) return "#f94144";
    if (percentage < 30) return "#f8961e";
    if (percentage < 70) return "#f9c74f";
    return "#4cc9f0";
  }

  openModal(modalId) {
    document.getElementById(modalId).classList.add("active");
  }

  closeAllModals() {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.classList.remove("active");
    });
  }

  showLoading() {
    document.getElementById("loadingOverlay").classList.add("active");
  }

  hideLoading() {
    document.getElementById("loadingOverlay").classList.remove("active");
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
            <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  addNotificationStyles() {
    const style = document.createElement("style");
    style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 4000;
                animation: slideIn 0.3s ease;
                max-width: 350px;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            .notification.success {
                border-left: 4px solid #4cc9f0;
            }
            
            .notification.warning {
                border-left: 4px solid #f8961e;
            }
            
            .notification.info {
                border-left: 4px solid #4361ee;
            }
            
            .notification.error {
                border-left: 4px solid #f94144;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                margin-left: auto;
                color: #666;
            }
            
            .progress-bar {
                width: 80px;
                height: 20px;
                background: #e9ecef;
                border-radius: 10px;
                position: relative;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                border-radius: 10px;
                position: absolute;
                left: 0;
                top: 0;
            }
            
            .progress-bar span {
                position: absolute;
                width: 100%;
                text-align: center;
                font-size: 12px;
                font-weight: 600;
                line-height: 20px;
                color: #333;
            }
            
            .status-badge {
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
            }
            
            .status-badge.available {
                background: rgba(76, 201, 240, 0.1);
                color: #4cc9f0;
            }
            
            .status-badge.unavailable {
                background: rgba(248, 150, 30, 0.1);
                color: #f8961e;
            }
            
            .status-badge.charging {
                background: rgba(67, 97, 238, 0.1);
                color: #4361ee;
            }
            
            .status-badge.maintenance {
                background: rgba(114, 9, 183, 0.1);
                color: #7209b7;
            }
            
            .btn-icon {
                background: none;
                border: none;
                color: #4361ee;
                cursor: pointer;
                padding: 5px;
                font-size: 16px;
                margin: 0 2px;
            }
            
            .btn-icon:hover {
                color: #3a56d4;
            }
            
            .scooter-detail-item {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #e9ecef;
            }
            
            .scooter-detail-item:last-child {
                border-bottom: none;
            }
            
            .cost-item, .cost-total {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e9ecef;
            }
            
            .cost-total {
                font-size: 18px;
                margin-top: 10px;
                border-bottom: 2px solid #4361ee;
            }
        `;
    document.head.appendChild(style);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new FleetManagerApp();
});
