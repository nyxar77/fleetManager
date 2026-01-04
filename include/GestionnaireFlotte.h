#ifndef GESTIONNAIREFLOTTE_H
#define GESTIONNAIREFLOTTE_H

#include "Trajet.h"
#include "Trottinette.h"
#include <map>
#include <nlohmann/json.hpp>
#include <string>
#include <vector>

using json = nlohmann::json;

struct ResultatOperation {
  bool succes;
  std::string message;
  json donnees;
};

struct RapportStatistiques {
  int totalTrottinettes;
  int disponibles;
  int indisponibles;
  float pourcentageDisponibilite;
  int batterieFaible;
  int batterieCritique;
};

class GestionnaireFlotte {
private:
  std::vector<Trottinette> trottinettes;
  std::vector<Trajet> trajets;
  int prochainId;

public:
  GestionnaireFlotte();

  ResultatOperation ajouterTrottinette(Position pos, std::string modele,
                                       float batterie);
  ResultatOperation ajouterTrottinetteManuelle(const json &parametres);
  ResultatOperation supprimerTrottinette(int id);
  ResultatOperation rechargerTrottinette(int id, int minutes);
  json obtenirDetailsTrottinette(int id) const;
  int getNombreDisponibles() const;
  int getNombreTotal() const;
  Trottinette *trouverTrottinette(int id);

  json obtenirToutesTrottinettes() const;
  json obtenirTrottinettesDisponibles() const;
  json obtenirTrottinettesIndisponibles() const;
  json obtenirTrajetsActifs() const;
  RapportStatistiques genererRapport() const;
  json surveillerFlotte();
  json obtenirAnomalies();
  ResultatOperation simulerRecharge(int minutes);

  json trottinetteVersJson(const Trottinette &t) const;
  json trajetVersJson(const Trajet &t) const;
};

#endif
