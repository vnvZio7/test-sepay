require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const sepayRoutes = require("./routes/sepay");

const app = express();
app.use(bodyParser.json());

// Route Sepay
app.use("/sepay", sepayRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
