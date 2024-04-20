const Book = require("../models/Book");
const fs = require("fs");

// Créer un livre
exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  book
    .save()
    .then(() => {
      res.status(201).json({ message: "Objet enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

// Modifier un livre
exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete bookObject._userId;
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Objet modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

// Supprimer un livre
exports.deleteBook = (req, res, next) => {
  Book.deleteOne({ _id: req.params.id })
    .then(() => res.status(200).json({ message: "Livre supprimé" }))
    .catch((error) => res.status(400).json({ error }));
};

// Afficher un livre selon son id
exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

// Afficher tout les livres
exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

// Renvoie un tableau des 3 livres de la base de données ayant la meilleure note moyenne.
exports.bestRatings = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 }) // Trie les livres par note moyenne décroissante.
    .limit(3) // Limite le résultat aux 3 meilleurs livres.
    .then((books) => {
      // Envoie le tableau des livres avec un statut 200.
      res.status(200).json(books);
    })
    .catch((error) => {
      // En cas d'erreur, renvoie un statut 400 avec l'erreur.
      res.status(400).json({ error });
    });
};

// Attribue une note à un livre que l'on ne possède pas et calcule la moyenne d'étoiles de ce livre.
exports.rateOneBook = (req, res, next) => {
  const userId = req.body.userId;
  const grade = req.body.rating;
  // Vérifie que la note est comprise entre 0 et 5.
  if (grade < 0 || grade > 5) {
    return res
      .status(400)
      .json({ message: "La note doit être comprise entre 0 et 5." });
  }

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        // Si le livre n'est pas trouvé, renvoie un message d'erreur.
        return res.status(400).json({ message: "Livre non trouvé! " });
      }
      if (book.userId === req.auth.userId) {
        // Empêche l'utilisateur de noter son propre livre.
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Vérifie si l'utilisateur a déjà noté le livre.
      const hasAlreadyRated = book.ratings.some(
        (rating) => rating.userId.toString() === userId
      );
      if (hasAlreadyRated) {
        // Si oui, empêche une nouvelle notation.
        return res
          .status(400)
          .json({ message: "L'utilisateur a déjà noté ce livre" });
      }

      // Ajoute la nouvelle note au tableau des notes du livre.
      book.ratings.push({ userId, grade });
      // Calcule la nouvelle moyenne des notes.
      const totalGrade = book.ratings.reduce(
        (accumulator, currentValue) => accumulator + currentValue.grade,
        0
      );
      book.averageRating = totalGrade / book.ratings.length;

      // Sauvegarde les modifications dans la base de données.
      book
        .save()
        .then(() => res.status(200).json(book))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(400).json({ error }));
};
