// main.js
const { app, BrowserWindow } = require("electron");
const path = require("path");

// Load environment variables from .env
require("dotenv").config();

// Enable live reload for development
require("electron-reload")(__dirname, {
  electron: path.join(__dirname, "node_modules", ".bin", "electron"),
  hardResetMethod: "exit",
});

// Function to create the main window
function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // <-- use preload
      nodeIntegration: false, // safer, don’t expose Node directly to renderer
      contextIsolation: true, // safer, required for preload
    },
  });

  // Load the login page
  win.loadFile("login.html");

  // Optional: Open DevTools for debugging
  // win.webContents.openDevTools();
}

// Electron app lifecycle
app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Example: securely read GitHub token from .env
const githubToken = process.env.GITHUB_TOKEN;
if (githubToken) {
  console.log("GitHub Token is loaded securely (do not log in production).");
}
