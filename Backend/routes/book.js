const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");

const bookCtrl = require("../controllers/book");

router.post("/", auth, multer, bookCtrl.createBook);

router.put("/:id", auth, multer, bookCtrl.modifyBook);

router.delete("/:id", auth, bookCtrl.deleteBook);

router.get("/:id", bookCtrl.getOneBook);

router.get("/bestrating", bookCtrl.bestRatings); // Route pour obtenir les 3 meilleurs livres

router.post("/:id/rating", auth, bookCtrl.rateOneBook); // Route pour noter un livre

router.get("/", bookCtrl.getAllBooks);

module.exports = router;
