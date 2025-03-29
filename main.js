// main.js
const { app, BrowserWindow } = require("electron");
const path = require("path");
require("dotenv").config(); // Load environment variables from .env file

// Add electron-reload for real-time updates
require("electron-reload")(__dirname, {
  electron: path.join(__dirname, "node_modules", ".bin", "electron"),
  hardResetMethod: "exit",
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, "script.js"),
      nodeIntegration: true, // Enable Node.js integration if needed
      contextIsolation: false, // Disable context isolation if needed
    },
  });

  // Load the login page first
  win.loadFile("login.html");

  // Open DevTools if needed
  // win.webContents.openDevTools();
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Securely retrieve any sensitive info such as tokens (if needed)
const githubToken = process.env.GITHUB_TOKEN; // Read token securely from .env
if (githubToken) {
  console.log("GitHub Token: " + githubToken); // Do not print sensitive info in production
}
