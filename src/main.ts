import "./style.css";
import type { StationBoard, Connection } from "./api";
import { getStationBoard } from "./api";

interface AppConfig {
  stations: string[];
  language: "en" | "de";
}

const DEFAULT_CONFIG: AppConfig = {
  stations: ["Zürich HB", "Bern", "Basel SBB", "Geneva"],
  language: "en",
};

const LABELS = {
  en: {
    title:
      "SBB Timetable <a href=https://github.com/mavilov/sbb-dashboard>GitHub</a>",
    time: "Time",
    destination: "Destination",
    plat: "Plat.",
    train: "Train",
    settings: "Settings",
    save: "Save",
    station_label: "Station",
    lang_label: "Language",
    dep: "Dep",
  },
  de: {
    title: "SBB Fahrplan Dashboard",
    time: "Zeit",
    destination: "Nach",
    plat: "Gl.",
    train: "Zug",
    settings: "Einstellungen",
    save: "Speichern",
    station_label: "Bahnhof",
    lang_label: "Sprache",
    dep: "Ab",
  },
};

let currentConfig: AppConfig | null = null;
let refreshInterval: number;

function loadConfig(): AppConfig | null {
  const stored = localStorage.getItem("sbb_dashboard_config");
  if (stored) {
    return JSON.parse(stored);
  }
  return null;
}

function saveConfig(config: AppConfig) {
  localStorage.setItem("sbb_dashboard_config", JSON.stringify(config));
  currentConfig = config;
  renderApp();
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function renderConnection(conn: Connection) {
  const isDelayed = conn.stop.delay && conn.stop.delay > 0;
  const timeClass = isDelayed ? "time-col delayed" : "time-col";
  const delayText = isDelayed ? `(+${conn.stop.delay}')` : "";
  const timeText = `${formatTime(conn.stop.departure)} ${delayText}`;

  return `
    <tr>
      <td class="${timeClass}">${timeText}</td>
      <td class="train-col">${conn.category}${conn.number}</td>
      <td class="dest-col">${conn.to}</td>
      <td class="plat-col">${conn.stop.platform || "-"}</td>
    </tr>
  `;
}

function renderStationBoard(board: StationBoard, lang: "en" | "de") {
  const t = LABELS[lang];
  // Limit to top 8 connections
  const connections = board.stationboard.slice(0, 8);

  return `
    <div class="station-card">
      <div class="station-header">${board.station.name}</div>
      <table class="connections-table">
        <thead>
          <tr>
            <th class="time-col">${t.time}</th>
            <th class="train-col">${t.train}</th>
            <th class="dest-col">${t.destination}</th>
            <th class="plat-col">${t.plat}</th>
          </tr>
        </thead>
        <tbody>
          ${connections.map((c) => renderConnection(c)).join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function renderDashboard(config: AppConfig) {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const t = LABELS[config.language];

  app.innerHTML = `
    <header>
      <div class="sbb-logo">SBB <span class="red-arrow">↔</span> CFF <span class="red-arrow">↔</span> FFS</div>
      <h1>${t.title}</h1>
      <div class="settings-icon" id="btn-settings">⚙️</div>
    </header>
    <main id="station-grid">
      <div class="loading">Loading...</div>
    </main>
  `;

  document.getElementById("btn-settings")?.addEventListener("click", () => {
    renderSettings(config);
  });

  const grid = document.getElementById("station-grid")!;

  try {
    const promises = config.stations.map((s) => getStationBoard(s));
    const boards = await Promise.all(promises);

    grid.innerHTML = boards
      .map((b) => renderStationBoard(b, config.language))
      .join("");
  } catch (error) {
    console.error(error);
    grid.innerHTML = `<div style="color:red; padding:2rem;">Error loading data. Check console.</div>`;
  }
}

function renderSettings(initialConfig: AppConfig | null) {
  // If no config, use default just for filling the form
  const config = initialConfig || DEFAULT_CONFIG;
  const t = LABELS[config.language]; // Default to config language or EN if null (handled by logic)

  const app = document.querySelector<HTMLDivElement>("#app")!;

  // We overlay or replace? Replacing is cleaner for a "Setup" phase.
  // But overlay is better if we are already running.
  // If initialConfig is null, we MUST show settings.

  const html = `
    <div class="settings-modal">
      <div class="settings-content">
        <h2>${initialConfig ? t.settings : "Setup / Konfiguration"}</h2>
        <form id="settings-form">
          <div class="settings-group">
            <label>Language / Sprache</label>
            <select id="lang-select">
              <option value="en" ${
                config.language === "en" ? "selected" : ""
              }>English</option>
              <option value="de" ${
                config.language === "de" ? "selected" : ""
              }>Deutsch</option>
            </select>
          </div>
          
          <div class="settings-group">
            <label>Station 1</label>
            <input type="text" name="station0" value="${
              config.stations[0] || ""
            }" required />
          </div>
          <div class="settings-group">
            <label>Station 2</label>
            <input type="text" name="station1" value="${
              config.stations[1] || ""
            }" />
          </div>
          <div class="settings-group">
            <label>Station 3</label>
            <input type="text" name="station2" value="${
              config.stations[2] || ""
            }" />
          </div>
          <div class="settings-group">
            <label>Station 4</label>
            <input type="text" name="station3" value="${
              config.stations[3] || ""
            }" />
          </div>
          
          <button type="submit" class="btn-save">${
            initialConfig ? t.save : "Start"
          }</button>
        </form>
      </div>
    </div>
  `;

  // If we are already running, append to body. If not, replace app content.
  // Actually simpler: Just overwrite app HTML if it's the first load.
  if (!initialConfig) {
    app.innerHTML = html;
  } else {
    // Append
    const div = document.createElement("div");
    div.innerHTML = html;
    document.body.appendChild(div);
  }

  document.getElementById("settings-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const lang = (document.getElementById("lang-select") as HTMLSelectElement)
      .value as "en" | "de";
    const stations = [
      (form.elements.namedItem("station0") as HTMLInputElement).value,
      (form.elements.namedItem("station1") as HTMLInputElement).value,
      (form.elements.namedItem("station2") as HTMLInputElement).value,
      (form.elements.namedItem("station3") as HTMLInputElement).value,
    ].filter((s) => s && s.trim().length > 0);

    if (stations.length === 0) {
      alert("Please enter at least one station.");
      return;
    }

    const newConfig: AppConfig = {
      stations,
      language: lang,
    };

    // Remove modal if it was appended
    if (initialConfig) {
      document.querySelector(".settings-modal")?.remove();
    }

    saveConfig(newConfig);
  });
}

function renderApp() {
  if (!currentConfig) {
    renderSettings(null);
  } else {
    renderDashboard(currentConfig);

    // Clear existing interval
    if (refreshInterval) clearInterval(refreshInterval);

    // Refresh every 5 minutes (300,000 ms)
    refreshInterval = setInterval(() => {
      console.log("Refreshing data...");
      renderDashboard(currentConfig!);
    }, 300000);
  }
}

function init() {
  currentConfig = loadConfig();
  renderApp();
}

init();
