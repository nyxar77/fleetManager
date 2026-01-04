#ifndef TRAJET_H
#define TRAJET_H

#include "Utils.h"

class Trajet {
private:
  int id;
  int idTrottinette;
  int idUtilisateur;
  double distance;
  double coutTrajet;

public:
  Trajet(int id, int idTrott, int idUser);

  void ajouterDistance(double d);
  void calculerCout();

  int getId() const;
  int getIdTrottinette() const;
  double getDistance() const;
  double getCoutTrajet() const;
  void afficher() const;
};

#endif
