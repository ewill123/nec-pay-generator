// main.js
const { app, BrowserWindow } = require("electron");
const path = require("path");

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
