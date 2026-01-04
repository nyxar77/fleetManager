#ifndef TROTTINETTE_H
#define TROTTINETTE_H

#include "Utils.h"
#include <nlohmann/json.hpp>
#include <nlohmann/json_fwd.hpp>
#include <string>
#include <vector>

using json = nlohmann::json;

class Trottinette {
private:
  int id;
  float batterie;
  EtatTrottinette etat;
  Position position;
  std::string modele;
  int distanceTotale;
  bool enZone;
  std::vector<Anomalie> anomalies;

public:
  Trottinette(int id, Position pos, std::string modele = "Standard");

  int getId() const;
  float getBatterie() const;
  EtatTrottinette getEtat() const;
  Position getPosition() const;
  std::string getModele() const;
  bool estDisponible() const;
  bool estEnZone() const;
  bool aAnomalies() const;
  const std::vector<Anomalie> &getAnomalies() const;

  void mettreAJourPosition(Position pos);
  void consommerBatterie(double distance);
  void chargerBatterie(float quantite);
  void changerEtat(EtatTrottinette nouvelEtat);
  void definirZone(bool zone);
  void ajouterAnomalie(Anomalie anomalie);
  void supprimerAnomalies();

  // JSON conversion
  json toJson() const;
  json toJsonCourt() const;
  json toJsonDetails() const;
};

#endif
