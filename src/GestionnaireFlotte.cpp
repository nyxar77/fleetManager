#include <GestionnaireFlotte.h>
#include <cstdlib>
#include <ctime>
#include <unistd.h>

using namespace std;

GestionnaireFlotte::GestionnaireFlotte() : prochainId(1) { srand(time(NULL)); }

ResultatOperation GestionnaireFlotte::ajouterTrottinette(Position pos,
                                                         string modele,
                                                         float batterie) {
  try {
    trottinettes.push_back(Trottinette(prochainId++, pos, modele));
    if (batterie != 100.0f) {
      trottinettes.back().chargerBatterie(batterie - 100.0f);
    }
    return {true,
            "Trottinette ajoutee avec succes",
            {{"id", prochainId - 1},
             {"modele", modele},
             {"batterie", trottinettes.back().getBatterie()},
             {"position", pos.toJson()}}};
  } catch (const exception &e) {
    return {false, "Erreur lors de l'ajout: " + string(e.what()), {}};
  }
}

ResultatOperation
GestionnaireFlotte::ajouterTrottinetteManuelle(const json &parametres) {
  try {
    string modele = parametres.value("modele", "Standard");
    float batterie = parametres.value("batterie", 100.0f);
    Position pos = {parametres["position"]["latitude"],
                    parametres["position"]["longitude"]};

    return ajouterTrottinette(pos, modele, batterie);
  } catch (const exception &e) {
    return {false, "Parametres invalides: " + string(e.what()), {}};
  }
}

ResultatOperation GestionnaireFlotte::supprimerTrottinette(int id) {
  for (size_t i = 0; i < trottinettes.size(); i++) {
    if (trottinettes[i].getId() == id) {
      trottinettes.erase(trottinettes.begin() + i);
      return {
          true, "Trottinette #" + to_string(id) + " supprimee", {{"id", id}}};
    }
  }
  return {false, "Trottinette #" + to_string(id) + " non trouvee", {}};
}

ResultatOperation GestionnaireFlotte::rechargerTrottinette(int id,
                                                           int minutes) {
  for (size_t i = 0; i < trottinettes.size(); i++) {
    if (trottinettes[i].getId() == id) {
      if (trottinettes[i].getBatterie() >= 100.0f) {
        return {false, "La trottinette est deja chargee a 100%", {}};
      }

      if (minutes <= 0) {
        return {false, "Nombre de minutes invalide", {}};
      }

      float batterieInitiale = trottinettes[i].getBatterie();
      vector<json> progression;

      for (int m = 1; m <= minutes; m++) {
        trottinettes[i].chargerBatterie(5.0f);
        float batterieActuelle = trottinettes[i].getBatterie();

        bool maintenantDisponible =
            (batterieActuelle >= 30.0f && batterieInitiale < 30.0f);

        progression.push_back({{"minute", m},
                               {"batterie", batterieActuelle},
                               {"disponible", maintenantDisponible}});

        usleep(100000);
      }

      return {true,
              "Recharge terminee",
              {{"id", id},
               {"batterieFinale", trottinettes[i].getBatterie()},
               {"progression", progression}}};
    }
  }
  return {false, "Trottinette #" + to_string(id) + " non trouvee", {}};
}

json GestionnaireFlotte::obtenirDetailsTrottinette(int id) const {
  for (const auto &trott : trottinettes) {
    if (trott.getId() == id) {
      return trott.toJsonDetails();
    }
  }
  return {{"erreur", "Trottinette non trouvee"}, {"id", id}};
}

json GestionnaireFlotte::obtenirToutesTrottinettes() const {
  json result = json::array();
  for (const auto &trott : trottinettes) {
    result.push_back(trott.toJsonCourt());
  }
  return {{"trottinettes", result}, {"total", trottinettes.size()}};
}

json GestionnaireFlotte::obtenirTrottinettesDisponibles() const {
  json result = json::array();
  int compteur = 0;

  for (const auto &trott : trottinettes) {
    if (trott.estDisponible()) {
      result.push_back(trott.toJsonCourt());
      compteur++;
    }
  }

  return {{"trottinettes", result}, {"totalDisponibles", compteur}};
}

json GestionnaireFlotte::obtenirTrottinettesIndisponibles() const {
  json result = json::array();

  for (const auto &trott : trottinettes) {
    if (!trott.estDisponible()) {
      json item = trott.toJsonCourt();

      if (trott.getBatterie() < 30.0f) {
        item["raison"] = "Batterie faible";
      } else if (!trott.estEnZone()) {
        item["raison"] = "Hors zone";
      } else if (trott.aAnomalies()) {
        item["raison"] = "Anomalie";
      } else {
        item["raison"] = "Maintenance";
      }

      result.push_back(item);
    }
  }

  return {{"trottinettes", result}, {"totalIndisponibles", result.size()}};
}

RapportStatistiques GestionnaireFlotte::genererRapport() const {
  RapportStatistiques stats;
  stats.totalTrottinettes = trottinettes.size();
  stats.disponibles = getNombreDisponibles();
  stats.indisponibles = stats.totalTrottinettes - stats.disponibles;
  stats.pourcentageDisponibilite =
      stats.totalTrottinettes > 0 ? (static_cast<float>(stats.disponibles) /
                                     stats.totalTrottinettes * 100)
                                  : 0;

  stats.batterieFaible = 0;
  stats.batterieCritique = 0;

  for (const auto &trott : trottinettes) {
    float batterie = trott.getBatterie();
    if (batterie < 30.0f)
      stats.batterieFaible++;
    if (batterie < 10.0f)
      stats.batterieCritique++;
  }

  return stats;
}

json GestionnaireFlotte::surveillerFlotte() {
  json alertes = json::array();

  for (const auto &trott : trottinettes) {
    if (trott.getBatterie() < 10.0f) {
      alertes.push_back(
          {{"type", "batterie_critique"},
           {"id", trott.getId()},
           {"message",
            "Batterie critique: " + to_string(trott.getBatterie()) + "%"}});
    }
    if (!trott.estEnZone()) {
      alertes.push_back({{"type", "hors_zone"},
                         {"id", trott.getId()},
                         {"message", "Hors zone autorisee"}});
    }
  }

  return {{"statutGlobal", getNombreDisponibles()},
          {"totalTrottinettes", getNombreTotal()},
          {"alertes", alertes},
          {"aucuneAnomalie", alertes.empty()}};
}

json GestionnaireFlotte::obtenirAnomalies() {
  json result = json::array();
  int totalAnomalies = 0;

  for (const auto &trott : trottinettes) {
    if (trott.aAnomalies()) {
      json anomaliesTrott = json::array();
      for (const auto &anomalie : trott.getAnomalies()) {
        anomaliesTrott.push_back(anomalie.toJson());
        totalAnomalies++;
      }

      result.push_back({{"id", trott.getId()}, {"anomalies", anomaliesTrott}});
    }

    if (trott.getBatterie() < 10.0f) {
      bool dejaListee = false;
      if (trott.aAnomalies()) {
        for (const auto &anomalie : trott.getAnomalies()) {
          if (anomalie.type == BATTERIE_FAIB) {
            dejaListee = true;
            break;
          }
        }
      }
      if (!dejaListee) {
        result.push_back(
            {{"id", trott.getId()},
             {"anomalies",
              json::array({{{"type", BATTERIE_FAIB},
                            {"description", "Batterie critique (" +
                                                to_string(trott.getBatterie()) +
                                                "%)"}}})}});
        totalAnomalies++;
      }
    }
  }

  return {{"anomalies", result}, {"total", totalAnomalies}};
}

int GestionnaireFlotte::getNombreDisponibles() const {
  int compteur = 0;
  for (const auto &trott : trottinettes) {
    if (trott.estDisponible())
      compteur++;
  }
  return compteur;
}

int GestionnaireFlotte::getNombreTotal() const {
  return static_cast<int>(trottinettes.size());
}

Trottinette *GestionnaireFlotte::trouverTrottinette(int id) {
  for (size_t i = 0; i < trottinettes.size(); i++) {
    if (trottinettes[i].getId() == id) {
      return &trottinettes[i];
    }
  }
  return nullptr;
}

json GestionnaireFlotte::trottinetteVersJson(const Trottinette &t) const {
  return t.toJson();
}

json GestionnaireFlotte::trajetVersJson(const Trajet &t) const {
  return {{"id", t.getId()},
          {"idTrottinette", t.getIdTrottinette()},
          {"distance", t.getDistance()},
          {"coutTrajet", t.getCoutTrajet()}};
}
