const express = require("express");
const auth = require("auth");
const router = express.Router();

const Book = require("../models/Book");

router.post("/", (req, res, next) => {
  delete req.body._id;
  const book = new Book({
    ...req.body,
  });
  book
    .save()
    .then(() => res.status(201).json({ message: "Livree enregistré !" }))
    .catch((error) => res.status(400).json({ error }));
});

module.exports = router;
