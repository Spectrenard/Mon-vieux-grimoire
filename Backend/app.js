const express = require("express");

const app = express();

app.use((req, res) => {
  res.json({ message: "Votre requeête a bien été reçue !" });
});

module.exports = app;
