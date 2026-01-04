#ifndef UTILS_H
#define UTILS_H

#include <nlohmann/json.hpp>
#include <string>

using json = nlohmann::json;

enum EtatTrottinette { DISPONIBLE, EN_COURS, BATTERIE_FAIBLE, MAINTENANCE };
enum TypeAnomalie { AUCUNE, BATTERIE_FAIB, HORS_ZONE, MAINTENANCE_REQ };

struct Position {
  double latitude;
  double longitude;
  double calculerDistance(const Position &autre) const;
  json toJson() const {
    return {{"latitude", latitude}, {"longitude", longitude}};
  }
};

struct Anomalie {
  int idTrottinette;
  TypeAnomalie type;
  std::string description;
  json toJson() const {
    return {{"idTrottinette", idTrottinette},
            {"type", static_cast<int>(type)},
            {"description", description}};
  }
};

std::string etatVersTexte(EtatTrottinette etat);
std::string anomalieVersTexte(TypeAnomalie anomalie);
double calculerCoutTrajet(double distance);

#endif
