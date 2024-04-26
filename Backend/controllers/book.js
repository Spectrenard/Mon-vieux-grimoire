const { error } = require("console");
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
      res.status(201).json({ message: "Livre enregistré !" });
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
          .then(() => {
            // Supprime l'ancienne image
            if (req.file && book.imageUrl) {
              const imagePath = book.imageUrl.split("/images/")[1];
              fs.unlinkSync(`images/${imagePath}`);
            }
            res.status(200).json({ message: "Livre modifié!" });
          })
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

// Supprimer un livre
exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Non autorisé" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Livre supprimé" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
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
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(500).json({ error: "Internal server error" });
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
        return res.status(400).json({ message: "Livre non trouvé! " });
      }
      if (book.userId === req.auth.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const hasAlreadyRated = book.ratings.some(
        (rating) => rating.userId.toString() === userId
      );
      if (hasAlreadyRated) {
        return res
          .status(400)
          .json({ message: "L'utilisateur a déjà noté ce livre" });
      }

      // Ajoute la nouvelle note au tableau des notes du livre.
      book.ratings.push({ userId, grade });

      // Recalcul de la moyenne des notes.
      const totalGrade = book.ratings.reduce(
        (accumulator, currentValue) => accumulator + currentValue.grade,
        0
      );
      const averageRating = totalGrade / book.ratings.length;

      // Limite la moyenne à un seul chiffre après la virgule
      const roundedAverageRating = parseFloat(averageRating.toFixed(1));

      // Mise à jour de la moyenne dans le livre.
      book.averageRating = roundedAverageRating;

      // Sauvegarde les modifications dans la base de données.
      book
        .save()
        .then(() => res.status(200).json(book))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(400).json({ error }));
};
