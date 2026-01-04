#include <Trajet.h>
#include <iomanip>
#include <iostream>

using namespace std;

Trajet::Trajet(int id, int idTrott, int idUser)
    : id(id), idTrottinette(idTrott), idUtilisateur(idUser), distance(0.0),
      coutTrajet(0.0) {}

void Trajet::ajouterDistance(double d) { distance += d; }

void Trajet::calculerCout() {
  double km = distance / 1000.0;
  coutTrajet = 1.0 + km;
}

int Trajet::getId() const { return id; }

int Trajet::getIdTrottinette() const { return idTrottinette; }

double Trajet::getDistance() const { return distance; }

double Trajet::getCoutTrajet() const { return coutTrajet; }

void Trajet::afficher() const {
  std::cout << "\n=== TRAJET #" << id << " ===" << std::endl;
  std::cout << "Trottinette: " << idTrottinette << std::endl;
  std::cout << "Utilisateur: " << idUtilisateur << std::endl;
  std::cout << "Distance: " << distance << " m" << std::endl;
  std::cout << "Cout: " << coutTrajet << " $" << std::endl;
}
