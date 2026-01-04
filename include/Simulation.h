#ifndef SIMULATION_H
#define SIMULATION_H

#include "GestionnaireFlotte.h"
#include <nlohmann/json.hpp>

using json = nlohmann::json;

class Simulation {
private:
  GestionnaireFlotte flotte;

public:
  Simulation();
  json setup(int nombre = 10);
  json executer(int trajets = 4);
  json calculerCoutTrajet(double distance);
  json gererTrottinettes(const json &action);

  json obtenirToutesTrottinettes() const {
    return flotte.obtenirToutesTrottinettes();
  }
  json obtenirTrottinettesDisponibles() const {
    return flotte.obtenirTrottinettesDisponibles();
  }
  json obtenirTrottinettesIndisponibles() const {
    return flotte.obtenirTrottinettesIndisponibles();
  }
  json obtenirTrajetsActifs() const { return flotte.obtenirTrajetsActifs(); }
  json genererRapport() const {
    auto stats = flotte.genererRapport();
    return {{"totalTrottinettes", stats.totalTrottinettes},
            {"disponibles", stats.disponibles},
            {"indisponibles", stats.indisponibles},
            {"pourcentageDisponibilite", stats.pourcentageDisponibilite},
            {"batterieFaible", stats.batterieFaible},
            {"batterieCritique", stats.batterieCritique}};
  }
  json surveillerFlotte() { return flotte.surveillerFlotte(); }
  json obtenirAnomalies() { return flotte.obtenirAnomalies(); }
};

#endif
