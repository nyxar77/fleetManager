#include "Simulation.h"
#include <cstdlib>
#include <ctime>
#include <iomanip>
#include <iostream>
#include <unistd.h>

using namespace std;
using json = nlohmann::json;

Simulation::Simulation() { srand(time(NULL)); }

json Simulation::setup(int nombre) {
  cout << "\nInitialisation de " << nombre << " trottinettes..." << endl;

  int idDerniere = 0;

  for (int i = 0; i < nombre; i++) {
    Position pos;
    pos.latitude = 48.85 + (rand() % 1000) / 10000.0;
    pos.longitude = 2.35 + (rand() % 1000) / 10000.0;

    string modele;
    int randModele = rand() % 3;
    switch (randModele) {
    case 0:
      modele = "Standard";
      break;
    case 1:
      modele = "Premium";
      break;
    case 2:
      modele = "Xiaomi";
      break;
    }

    float batterie = 10.0f + (rand() % 90);
    auto result = flotte.ajouterTrottinette(pos, modele, batterie);
    if (result.succes) {
      idDerniere = result.donnees["id"];

      if (rand() % 10 == 0) {
        auto *trott = flotte.trouverTrottinette(idDerniere);
        if (trott) {
          trott->definirZone(false);
        }
      }
    }
  }

  return {{"message",
           "Flotte initialisee avec " + to_string(nombre) + " trottinettes."},
          {"total", flotte.getNombreTotal()},
          {"disponibles", flotte.getNombreDisponibles()},
          {"indisponibles",
           flotte.getNombreTotal() - flotte.getNombreDisponibles()}};
}

json Simulation::executer(int trajets) {
  cout << "\n=== SIMULATION DE " << trajets << " TRAJETS ===" << endl;

  json trajetsSimules = json::array();
  int trajetsReussis = 0;

  for (int i = 0; i < trajets; i++) {
    bool trajetEffectue = false;
    int essais = 0;

    while (!trajetEffectue && essais < 5) {
      int idTrott = 1 + rand() % flotte.getNombreTotal();
      auto *trott = flotte.trouverTrottinette(idTrott);

      if (trott && trott->estDisponible()) {
        double distance = 500 + (rand() % 9500);

        trott->consommerBatterie(distance);

        Position nouvellePos;
        nouvellePos.latitude =
            trott->getPosition().latitude + (rand() % 100 - 50) / 10000.0;
        nouvellePos.longitude =
            trott->getPosition().longitude + (rand() % 100 - 50) / 10000.0;
        trott->mettreAJourPosition(nouvellePos);

        double coutTrajet = 1.0 + (distance / 1000.0);

        json trajetJson = {{"numero", i + 1},
                           {"idTrottinette", idTrott},
                           {"modele", trott->getModele()},
                           {"distance", distance / 1000.0},
                           {"cout", coutTrajet},
                           {"batterieApres", trott->getBatterie()},
                           {"nouvellePosition", nouvellePos.toJson()}};

        trajetsSimules.push_back(trajetJson);
        trajetEffectue = true;
        trajetsReussis++;
      } else {
        essais++;
      }
    }

    usleep(100000);
  }

  return {{"message", "Simulation terminee"},
          {"trajetsDemandes", trajets},
          {"trajetsReussis", trajetsReussis},
          {"trajetsEchoues", trajets - trajetsReussis},
          {"trajets", trajetsSimules},
          {"statutFinal",
           {{"total", flotte.getNombreTotal()},
            {"disponibles", flotte.getNombreDisponibles()}}}};
}

json Simulation::calculerCoutTrajet(double distance) {
  if (distance <= 0) {
    return {{"erreur", "Distance invalide!"}};
  }

  double minutes = distance * 10;
  double coutTrajet = 1.0 + (minutes * 0.25) + (distance * 1.0);

  return {{"distance", distance},
          {"minutesEstime", minutes},
          {"coutTotal", coutTrajet},
          {"decomposition",
           {{"fraisDeblocage", 1.0},
            {"coutTemps", minutes * 0.25},
            {"coutDistance", distance * 1.0}}}};
}

json Simulation::gererTrottinettes(const json &action) {
  string actionType = action.value("action", "");

  if (actionType == "ajouter") {
    try {
      json data = action["data"];
      Position pos = {data["position"]["latitude"],
                      data["position"]["longitude"]};
      string modele = data.value("modele", "Standard");
      float batterie = data.value("batterie", 100.0f);

      auto result = flotte.ajouterTrottinette(pos, modele, batterie);
      return {{"succes", result.succes},
              {"message", result.message},
              {"donnees", result.donnees}};
    } catch (const exception &e) {
      return {{"erreur", "Parametres invalides: " + string(e.what())}};
    }
  } else if (actionType == "supprimer") {
    int id = action.value("id", 0);
    if (id <= 0) {
      return {{"erreur", "ID invalide"}};
    }

    auto result = flotte.supprimerTrottinette(id);
    return {{"succes", result.succes},
            {"message", result.message},
            {"donnees", result.donnees}};
  } else if (actionType == "recharger") {
    int id = action.value("id", 0);
    int minutes = action.value("minutes", 0);

    if (id <= 0) {
      return {{"erreur", "ID invalide"}};
    }
    if (minutes <= 0) {
      return {{"erreur", "Nombre de minutes invalide"}};
    }

    auto result = flotte.rechargerTrottinette(id, minutes);
    return {{"succes", result.succes},
            {"message", result.message},
            {"donnees", result.donnees}};
  } else if (actionType == "details") {
    int id = action.value("id", 0);
    if (id <= 0) {
      return {{"erreur", "ID invalide"}};
    }

    auto details = flotte.obtenirDetailsTrottinette(id);
    if (details.contains("erreur")) {
      return {{"succes", false}, {"message", details["erreur"]}};
    }
    return {{"succes", true},
            {"message", "Details recuperes"},
            {"donnees", details}};
  } else {
    return {{"erreur", "Action non reconnue: " + actionType}};
  }
}
