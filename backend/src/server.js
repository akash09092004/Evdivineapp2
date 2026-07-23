const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const http = require("http");
const { loadEnvFile } = require("./utils/loadEnvFile");

loadEnvFile();

const app = require("./app");
const connectDB = require("./config/db");
const initSocket = require("./sockets/socket");
const { initializeFirebase } = require("./config/firebase");
const { startBookingJobs } = require("./jobs/bookingJobs");

const start = async () => {
  try {
    await connectDB();

    initializeFirebase();

    const server = http.createServer(app);

    initSocket(server);
    startBookingJobs();

    const port = Number(process.env.PORT || 5000);

    server.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();
