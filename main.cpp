#include <cstdlib>
#include <ctime>
#include <httplib.h>
#include <iostream>
#include <nlohmann/json.hpp>
#include <string>

using namespace std;
using json = nlohmann::json;
using namespace httplib;

void enableCORS(Response &res) {
  res.set_header("Access-Control-Allow-Origin", "*");
  res.set_header("Access-Control-Allow-Methods",
                 "GET, POST, PUT, DELETE, OPTIONS");
  res.set_header("Access-Control-Allow-Headers", "Content-Type");
}

// Generate mock data for testing
json generateMockScooters() {
  json scooters = json::array();

  srand(time(NULL));

  for (int i = 1; i <= 20; i++) {
    json scooter;
    scooter["id"] = i;
    scooter["modele"] = (i % 3 == 0)   ? "Premium"
                        : (i % 3 == 1) ? "Standard"
                                       : "Xiaomi";
    scooter["batterie"] = rand() % 101;
    scooter["etat"] =
        (scooter["batterie"] < 30) ? "BATTERIE_FAIBLE" : "DISPONIBLE";
    scooter["etatTexte"] =
        (scooter["batterie"] < 30) ? "Low Battery" : "Available";
    scooter["position"] = {{"latitude", 48.85 + (rand() % 1000) / 10000.0},
                           {"longitude", 2.35 + (rand() % 1000) / 10000.0}};
    scooters.push_back(scooter);
  }

  return scooters;
}

int main() {
  Server svr;

  svr.Options(R"(.*)", [](const Request &, Response &res) {
    enableCORS(res);
    res.status = 200;
  });

  svr.Get("/api/health", [](const Request &, Response &res) {
    enableCORS(res);
    res.set_content(R"({"status": "ok", "message": "Server is running"})",
                    "application/json");
  });

  svr.Get("/api/trottinettes", [](const Request &, Response &res) {
    enableCORS(res);
    auto scooters = generateMockScooters();
    json response = {{"trottinettes", scooters}, {"total", scooters.size()}};
    res.set_content(response.dump(), "application/json");
  });

  svr.Get("/api/trottinettes/disponibles", [](const Request &, Response &res) {
    enableCORS(res);
    auto allScooters = generateMockScooters();
    json available = json::array();

    for (const auto &scooter : allScooters) {
      if (scooter["batterie"] >= 30) {
        available.push_back(scooter);
      }
    }

    json response = {{"trottinettes", available},
                     {"totalDisponibles", available.size()}};
    res.set_content(response.dump(), "application/json");
  });

  svr.Get("/api/trottinettes/indisponibles",
          [](const Request &, Response &res) {
            enableCORS(res);
            auto allScooters = generateMockScooters();
            json unavailable = json::array();

            for (const auto &scooter : allScooters) {
              if (scooter["batterie"] < 30) {
                unavailable.push_back(scooter);
              }
            }

            json response = {{"trottinettes", unavailable},
                             {"totalIndisponibles", unavailable.size()}};
            res.set_content(response.dump(), "application/json");
          });

  svr.Get(R"(/api/scooters/(\d+))", [](const Request &req, Response &res) {
    enableCORS(res);
    int id = stoi(req.matches[1]);

    auto allScooters = generateMockScooters();
    json found;

    for (const auto &scooter : allScooters) {
      if (scooter["id"] == id) {
        found = scooter;
        break;
      }
    }

    if (!found.empty()) {
      json response = {{"success", true}, {"scooter", found}};
      res.set_content(response.dump(), "application/json");
    } else {
      json response = {{"success", false}, {"error", "Scooter not found"}};
      res.set_content(response.dump(), "application/json");
    }
  });

  svr.Post("/api/scooters", [](const Request &req, Response &res) {
    enableCORS(res);

    try {
      json body = json::parse(req.body);

      json response = {{"success", true},
                       {"message", "Scooter added successfully"},
                       {"id", rand() % 1000 + 100}};

      res.set_content(response.dump(), "application/json");
    } catch (const exception &e) {
      json response = {{"success", false}, {"error", e.what()}};
      res.set_content(response.dump(), "application/json");
    }
  });

  svr.Delete(R"(/api/scooters/(\d+))", [](const Request &req, Response &res) {
    enableCORS(res);
    int id = stoi(req.matches[1]);

    json response = {{"success", true},
                     {"message", "Scooter #" + to_string(id) + " deleted"}};

    res.set_content(response.dump(), "application/json");
  });

  svr.Post(R"(/api/scooters/(\d+)/recharge)",
           [](const Request &req, Response &res) {
             enableCORS(res);
             int id = stoi(req.matches[1]);

             try {
               json body = json::parse(req.body);
               int minutes = body.value("minutes", 10);

               json response = {
                   {"success", true},
                   {"message", "Charging scooter #" + to_string(id) + " for " +
                                   to_string(minutes) + " minutes"},
                   {"minutes", minutes},
                   {"batteryIncrease", minutes * 5}};

               res.set_content(response.dump(), "application/json");
             } catch (const exception &e) {
               json response = {{"success", false}, {"error", e.what()}};
               res.set_content(response.dump(), "application/json");
             }
           });

  svr.Post("/api/trips/simulate", [](const Request &req, Response &res) {
    enableCORS(res);

    try {
      json body = json::parse(req.body);
      int count = body.value("count", 5);

      json response = {{"success", true},
                       {"message", "Simulated " + to_string(count) + " trips"},
                       {"tripsCount", count}};

      res.set_content(response.dump(), "application/json");
    } catch (const exception &e) {
      json response = {{"success", false}, {"error", e.what()}};
      res.set_content(response.dump(), "application/json");
    }
  });

  svr.Post("/api/trips/calculate-cost", [](const Request &req, Response &res) {
    enableCORS(res);

    try {
      json body = json::parse(req.body);
      double distance = body.value("distance", 5.0);

      double cost = 1.0 + (distance * 10 * 0.25) + (distance * 1.0);

      json response = {{"success", true},
                       {"distance", distance},
                       {"coutTotal", cost},
                       {"totalCost", cost}};

      res.set_content(response.dump(), "application/json");
    } catch (const exception &e) {
      json response = {{"success", false}, {"error", e.what()}};
      res.set_content(response.dump(), "application/json");
    }
  });

  svr.Get("/api/anomalies", [](const Request &, Response &res) {
    enableCORS(res);

    json anomalies = json::array();

    for (int i = 0; i < 3; i++) {
      anomalies.push_back({{"id", i + 1}, {"anomalies", "Battery low (<30%)"}});
    }

    json response = {{"anomalies", anomalies}, {"total", anomalies.size()}};

    res.set_content(response.dump(), "application/json");
  });

  svr.Get("/api/monitor/alerts", [](const Request &, Response &res) {
    enableCORS(res);

    json alerts = json::array();

    if (rand() % 2) {
      alerts.push_back({{"scooterId", rand() % 20 + 1},
                        {"type", "battery_critical"},
                        {"message", "Battery below 10%"},
                        {"timestamp", "Just now"},
                        {"critical", true}});
    }

    json response = {{"alerts", alerts}, {"total", alerts.size()}};

    res.set_content(response.dump(), "application/json");
  });

  svr.Get("/api/dashboard/stats", [](const Request &, Response &res) {
    enableCORS(res);

    auto scooters = generateMockScooters();
    int total = scooters.size();
    int available = 0;
    int lowBattery = 0;

    for (const auto &scooter : scooters) {
      if (scooter["batterie"] >= 30)
        available++;
      if (scooter["batterie"] < 30)
        lowBattery++;
    }

    json response = {{"totalScooters", total},
                     {"availableScooters", available},
                     {"unavailableScooters", total - available},
                     {"lowBattery", lowBattery}};

    res.set_content(response.dump(), "application/json");
  });

  svr.Get("/api/reports/generate", [](const Request &, Response &res) {
    enableCORS(res);

    json response = {{"success", true},         {"message", "Report generated"},
                     {"batterieFaible", 5},     {"batterieCritique", 2},
                     {"totalTrottinettes", 20}, {"disponibles", 13},
                     {"indisponibles", 7}};

    res.set_content(response.dump(), "application/json");
  });

  cout << "🚀 Starting Fleet Manager Server on port 8080..." << endl;
  cout << "📡 API endpoints:" << endl;
  cout << "  - GET  /api/health" << endl;
  cout << "  - GET  /api/trottinettes" << endl;
  cout << "  - GET  /api/trottinettes/disponibles" << endl;
  cout << "  - GET  /api/trottinettes/indisponibles" << endl;
  cout << "  - POST /api/scooters" << endl;
  cout << "  - POST /api/trips/simulate" << endl;
  cout << "  - GET  /api/dashboard/stats" << endl;
  cout << endl;
  cout << "Open your HTML file and make sure C++ server is running!" << endl;

  svr.listen("0.0.0.0", 8080);

  return 0;
}
