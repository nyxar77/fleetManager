// app.js - Simple API Bridge
class APIClient {
  constructor(baseURL = "http://localhost:8080") {
    this.baseURL = baseURL;
  }

  // Generic fetch helper
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

  // Dashboard & Stats
  async getDashboardStats() {
    return await this.fetchAPI("/api/dashboard/stats");
  }

  // Scooters
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

  // Trips
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

  // Reports & Monitoring
  async getAnomalies() {
    return await this.fetchAPI("/api/anomalies");
  }

  async getAlerts() {
    return await this.fetchAPI("/api/monitor/alerts");
  }

  async generateReport() {
    return await this.fetchAPI("/api/reports/generate");
  }

  // Health check
  async checkHealth() {
    return await this.fetchAPI("/api/health");
  }

  // UI Helper
  showError(message) {
    alert(`Error: ${message}`);
  }

  showSuccess(message) {
    alert(`Success: ${message}`);
  }
}

// Main Application with API Integration
class FleetManagerApp {
  constructor() {
    this.api = new APIClient();
    this.currentPage = "dashboard";
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupEventListeners();
    this.checkBackendConnection();
    this.loadDashboard();
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
  }

  setupEventListeners() {
    // Refresh button
    document.getElementById("refreshBtn").addEventListener("click", () => {
      this.loadDashboard();
    });

    // Quick actions
    document.querySelectorAll(".action-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        this.handleQuickAction(action);
      });
    });

    // Add scooter
    document.getElementById("addScooterBtn").addEventListener("click", () => {
      this.showAddScooterModal();
    });

    // Simulate trips
    document
      .getElementById("runSimulationBtn")
      .addEventListener("click", () => {
        const trips = parseInt(document.getElementById("tripCount").value);
        const distance = parseFloat(
          document.getElementById("tripDistance").value,
        );
        this.runTripSimulation(trips, distance);
      });

    // Calculate cost
    document
      .getElementById("calculateCostBtn")
      .addEventListener("click", async () => {
        const distance = parseFloat(prompt("Enter distance in km:") || "5");
        this.calculateTripCost(distance);
      });

    // Generate report
    document
      .getElementById("generateReportBtn")
      .addEventListener("click", () => {
        this.generateReport();
      });

    // Add scooter form submission
    document
      .getElementById("addScooterForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.submitAddScooterForm();
      });
  }

  switchPage(page) {
    // Update navigation
    document
      .querySelectorAll(".nav-link")
      .forEach((link) => link.classList.remove("active"));
    document.querySelector(`[data-page="${page}"]`).classList.add("active");

    // Show page
    document
      .querySelectorAll(".page")
      .forEach((p) => p.classList.remove("active"));
    document.getElementById(page).classList.add("active");

    // Load page data
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

      // Load recent scooters
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

    const scooters = scootersData.scooters || [];
    const recent = scooters.slice(0, 5); // Show 5 most recent

    recent.forEach((scooter) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td><strong>#${scooter.id}</strong></td>
                <td>${scooter.modele || scooter.model}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${scooter.batterie || scooter.battery}%"></div>
                        <span>${scooter.batterie || scooter.battery}%</span>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${scooter.etat || scooter.status}">
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
                        <div class="progress-fill" style="width: ${scooter.batterie || scooter.battery}%"></div>
                        <span>${scooter.batterie || scooter.battery}%</span>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${scooter.etat || scooter.status}">
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
    // Could load recent trips here
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
    // Update report cards
    if (report.batterieFaible !== undefined) {
      document.getElementById("batteryLow").textContent =
        report.batterieFaible || 0;
    }
    if (report.batterieCritique !== undefined) {
      document.getElementById("batteryCritical").textContent =
        report.batterieCritique || 0;
    }
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
      alertItem.className = `alert-item ${alert.critical ? "critical" : "warning"}`;
      alertItem.innerHTML = `
                <div class="alert-icon ${alert.critical ? "critical" : "warning"}">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${alert.type}</div>
                    <div class="alert-message">Scooter #${alert.scooterId}: ${alert.message}</div>
                    <div class="alert-time">${alert.timestamp}</div>
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
                    <span class="anomaly-scooter">Scooter #${anomaly.id}</span>
                    <span class="anomaly-time">Just now</span>
                </div>
                <div class="anomaly-description">${anomaly.anomalies || "No details"}</div>
            `;
      anomaliesList.appendChild(anomalyItem);
    });
  }

  handleQuickAction(action) {
    switch (action) {
      case "add-scooter":
        this.showAddScooterModal();
        break;
      case "simulate-trips":
        this.runTripSimulation(5);
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
      this.loadDashboard(); // Refresh stats
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
                    <span>Total Cost:</span>
                    <span>$${result.coutTotal || result.totalCost || "0.00"}</span>
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

      const modal = document.getElementById("scooterDetailsModal");
      const content = modal.querySelector(".scooter-details");

      content.innerHTML = `
                <div class="scooter-detail-item">
                    <strong>ID:</strong> #${id}
                </div>
                <div class="scooter-detail-item">
                    <strong>Model:</strong> ${details.scooter?.model || "Unknown"}
                </div>
                <div class="scooter-detail-item">
                    <strong>Battery:</strong> ${details.scooter?.battery || "0"}%
                </div>
                <div class="scooter-detail-item">
                    <strong>Status:</strong> ${details.scooter?.status || "Unknown"}
                </div>
                <div class="scooter-detail-item">
                    <strong>Location:</strong> ${this.formatLocation(details.scooter?.location)}
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

      // Get all scooters with low battery
      const scooters = await this.api.getAllScooters();
      const lowBatteryScooters = (scooters.scooters || []).filter(
        (s) => (s.batterie || s.battery) < 30,
      );

      // Charge each one
      for (const scooter of lowBatteryScooters) {
        await this.api.rechargeScooter(scooter.id, 10); // 10 minutes each
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

  // Helper methods
  formatLocation(location) {
    if (!location) return "Unknown";
    if (typeof location === "string") return location;
    if (location.latitude && location.longitude) {
      return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
    }
    return JSON.stringify(location);
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
}

// Initialize app when page loads
document.addEventListener("DOMContentLoaded", () => {
  window.app = new FleetManagerApp();
});
