const mongoose = require("mongoose");
const app = require("./app");
const env = require("./config/env");

async function start() {
  try {
    await mongoose.connect(env.mongoUri);
    // eslint-disable-next-line no-console
    console.log("Connected to MongoDB");

    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Roundtable backend listening on port ${env.port}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
