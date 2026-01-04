#include <Trottinette.h>

using namespace std;

Trottinette::Trottinette(int id, Position pos, string modele)
    : id(id), batterie(100.0f), etat(DISPONIBLE), position(pos), modele(modele),
      distanceTotale(0), enZone(true) {}

int Trottinette::getId() const { return id; }
float Trottinette::getBatterie() const { return batterie; }
EtatTrottinette Trottinette::getEtat() const { return etat; }
Position Trottinette::getPosition() const { return position; }
string Trottinette::getModele() const { return modele; }
bool Trottinette::estEnZone() const { return enZone; }
bool Trottinette::aAnomalies() const { return !anomalies.empty(); }
const vector<Anomalie> &Trottinette::getAnomalies() const { return anomalies; }

bool Trottinette::estDisponible() const {
  return etat == DISPONIBLE && batterie >= 30.0f && enZone && anomalies.empty();
}

void Trottinette::mettreAJourPosition(Position pos) { position = pos; }

void Trottinette::consommerBatterie(double distance) {
  batterie -= static_cast<float>(distance * 0.05);
  if (batterie < 0)
    batterie = 0;
  if (batterie < 30.0f) {
    changerEtat(BATTERIE_FAIBLE);
    Anomalie anomalie;
    anomalie.idTrottinette = id;
    anomalie.type = BATTERIE_FAIB;
    anomalie.description =
        "Batterie faible (" + to_string((int)batterie) + "%)";
    anomalies.push_back(anomalie);
  }
}

void Trottinette::chargerBatterie(float quantite) {
  batterie += quantite;
  if (batterie > 100.0f)
    batterie = 100.0f;

  if (batterie >= 30.0f) {
    for (size_t i = 0; i < anomalies.size(); i++) {
      if (anomalies[i].type == BATTERIE_FAIB) {
        anomalies.erase(anomalies.begin() + i);
        i--;
      }
    }
    if (enZone && anomalies.empty()) {
      changerEtat(DISPONIBLE);
    }
  }
}

void Trottinette::changerEtat(EtatTrottinette nouvelEtat) { etat = nouvelEtat; }

void Trottinette::definirZone(bool zone) {
  enZone = zone;
  if (!zone) {
    Anomalie anomalie;
    anomalie.idTrottinette = id;
    anomalie.type = HORS_ZONE;
    anomalie.description = "Hors zone autorisee";
    anomalies.push_back(anomalie);
    changerEtat(MAINTENANCE);
  } else {
    for (size_t i = 0; i < anomalies.size(); i++) {
      if (anomalies[i].type == HORS_ZONE) {
        anomalies.erase(anomalies.begin() + i);
        i--;
      }
    }
    if (batterie >= 30.0f && anomalies.empty()) {
      changerEtat(DISPONIBLE);
    }
  }
}

void Trottinette::ajouterAnomalie(Anomalie anomalie) {
  anomalies.push_back(anomalie);
}

void Trottinette::supprimerAnomalies() { anomalies.clear(); }

// NOTE:Old display methods

/* void Trottinette::afficherInfo() const {
  cout << "\n=== TROTTINETTE #" << id << " ===" << endl;
  cout << "Modele: " << modele << endl;
  cout << "Position: (" << fixed << setprecision(4) << position.latitude << ", "
       << position.longitude << ")" << endl;
  cout << "Etat: " << etatVersTexte(etat) << endl;
  cout << "Batterie: " << fixed << setprecision(1) << batterie << "%" << endl;
  cout << "Dans zone: " << (enZone ? "OUI" : "NON") << endl;
  cout << "Disponible: " << (estDisponible() ? "OUI" : "NON") << endl;

  if (aAnomalies()) {
    cout << "Anomalies:" << endl;
    for (size_t i = 0; i < anomalies.size(); i++) {
      cout << "  - " << anomalies[i].description << endl;
    }
  }
}

void Trottinette::afficherCourte() const {
  cout << "[" << id << "] " << modele << " | " << fixed << setprecision(1)
       << batterie << "% | "
       << "(" << fixed << setprecision(4) << position.latitude << ", "
       << position.longitude << ") | " << etatVersTexte(etat) << endl;
}

void Trottinette::afficherDetails() const {
  cout << "\n=== DETAILS TROTTINETTE #" << id << " ===" << endl;
  cout << "Modele: " << modele << endl;
  cout << "Position: (" << fixed << setprecision(4) << position.latitude << ", "
       << position.longitude << ")" << endl;
  cout << "Etat: " << etatVersTexte(etat) << endl;
  cout << "Batterie: " << fixed << setprecision(1) << batterie << "%" << endl;
  cout << "Zone: " << (enZone ? "DANS ZONE" : "HORS ZONE") << endl;
  cout << "Status: " << (estDisponible() ? "DISPONIBLE" : "INDISPONIBLE")
       << endl;

  if (aAnomalies()) {
    cout << "ANOMALIES:" << endl;
    for (size_t i = 0; i < anomalies.size(); i++) {
      cout << "  - " << anomalies[i].description << endl;
    }
  } else {
    cout << "Anomalies: AUCUNE" << endl;
  }
} */

// NOTE: json conversion:

json Trottinette::toJson() const {
  json result;
  result["id"] = id;
  result["batterie"] = batterie;
  result["etat"] = static_cast<int>(etat);
  result["etatTexte"] = etatVersTexte(etat);
  result["position"] = position.toJson();
  result["modele"] = modele;
  result["enZone"] = enZone;
  result["disponible"] = estDisponible();

  json anomaliesArray = json::array();
  for (const auto &anomalie : anomalies) {
    anomaliesArray.push_back(anomalie.toJson());
  }
  result["anomalies"] = anomaliesArray;

  return result;
}

json Trottinette::toJsonCourt() const {
  return {{"id", id},
          {"modele", modele},
          {"batterie", batterie},
          {"position", position.toJson()},
          {"etat", etatVersTexte(etat)},
          {"disponible", estDisponible()}};
}

json Trottinette::toJsonDetails() const {
  json result = toJson();
  result["distanceTotale"] = distanceTotale;
  result["aAnomalies"] = aAnomalies();

  if (!estDisponible()) {
    if (batterie < 30.0f) {
      result["raisonIndisponibilite"] = "Batterie faible";
    } else if (!enZone) {
      result["raisonIndisponibilite"] = "Hors zone";
    } else if (aAnomalies()) {
      result["raisonIndisponibilite"] = "Anomalies techniques";
    } else {
      result["raisonIndisponibilite"] = "En maintenance";
    }
  }

  return result;
}
