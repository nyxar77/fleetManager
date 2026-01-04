#include "Utils.h"
#include <cmath>
#include <string>

using namespace std;

double Position::calculerDistance(const Position &autre) const {
  double diffLat = autre.latitude - latitude;
  double diffLon = autre.longitude - longitude;
  double metresLat = diffLat * 111000.0;
  double metresLon = diffLon * 111000.0 * 0.75;
  return sqrt(metresLat * metresLat + metresLon * metresLon);
}

string etatVersTexte(EtatTrottinette etat) {
  switch (etat) {
  case DISPONIBLE:
    return "DISPONIBLE";
  case EN_COURS:
    return "EN COURS";
  case BATTERIE_FAIBLE:
    return "BATTERIE FAIBLE";
  case MAINTENANCE:
    return "MAINTENANCE";
  default:
    return "INCONNU";
  }
}

string anomalieVersTexte(TypeAnomalie anomalie) {
  switch (anomalie) {
  case BATTERIE_FAIB:
    return "Batterie faible";
  case HORS_ZONE:
    return "Hors zone";
  case MAINTENANCE_REQ:
    return "Maintenance requise";
  default:
    return "Aucune";
  }
}

double calculerCoutTrajet(double distance) {
  double km = distance / 1000.0;
  return 1.0 + km;
}
