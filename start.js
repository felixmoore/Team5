const init = require("./src/server/server.js");

const express = require("express");
const app = express();

path = require("path");
app.use("/public", express.static(path.join(__dirname, "/public")));
app.use("/src/client", express.static(path.join(__dirname, "/src/client")));
app.use(
  "/favicon.ico",
  express.static(path.join(__dirname, "/public/assets/favicon.ico"))
);
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/public", "index.html")); // path.join looks one level up in the directory
});

init.initialiseServer(app);
