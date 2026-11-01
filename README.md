# ⚽ Qismah (قِسمة)
### AI-Powered Pickup Football Organizer, Tactical Pitch & Smart Team Balancer

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-Expo_SDK_58-000000?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/Backend-Node.js_&_Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Local_LLM-Meta_Llama_3.1_(Ollama)-0467DF?style=for-the-badge&logo=meta&logoColor=white" />
  <img src="https://img.shields.io/badge/Cloud_AI-Google_Gemini_API-8E75B2?style=for-the-badge&logo=google&logoColor=white" />
</p>

---

## 📌 Project Overview

**Qismah (قِسمة)** is an end-to-end full-stack mobile platform engineered to eliminate the weekly chaos of organizing casual and amateur football matches (pickup games, rented pitches, and neighborhood leagues).

Instead of dealing with unstructured WhatsApp message lists, unbalanced squads, and manual calculations, **Qismah** leverages a **Hybrid AI engine (Meta Llama 3.1 & Google Gemini)** to parse raw WhatsApp rosters, balance teams tactically, render an interactive pitch with formation setups, manage tournaments, and even generate FIFA-style **EA FC Ultimate Team (FUT) player cards**.

---

## 🌟 Key Features

### 1. 🤖 Dual/Hybrid AI WhatsApp Parser (Meta Llama 3.1 & Gemini)
* **Raw Message Ingestion:** Paste chaotic, unformatted WhatsApp group lists containing numbers, emojis, nicknames, and informal notes.
* **LLM Extraction Engine:** Powered by local **Meta Llama 3.1** (via Ollama) and **Google Gemini API**, the system automatically cleans text, extracts confirmed players, detects primary & secondary positions, and separates waiting/bench lists.
* **Smart Tactical Balancing:** Intelligent auto-rounding logic for odd player counts (9v9, 7v7, 5v5) that balances team ratings based on historical database stats and player positions.

### 2. 🏟️ Interactive Tactical Pitch & Dynamic Formations
* **Visual Soccer Pitch:** Real-time visual pitch rendering showing Team A and Team B in head-to-head tactical formations (e.g., 2-2-1, 4-3-3, or custom lines).
* **Tap-to-Swap Repositioning:** Move players across tactical positions on the pitch seamlessly with single-tap or long-press interactions.
* **Squad Circle Filtering:** Filter draft attendees by specific squad circles to automatically balance only the players belonging to that group.
* **Instant WhatsApp Sharing:** Export the full pitch formation as a high-resolution image (`react-native-view-shot` + `expo-sharing`) or formatted WhatsApp text message with a single click.

### 3. 🎴 EA FC / FIFA Ultimate Team (FUT) Player Cards
* **Custom FUT Card Generator:** Turn any registered player into an authentic Ultimate Team card featuring dynamic card tiers:
  * 🌟 **MVP In-Form:** Special obsidian/gold edition for match MVP award winners.
  * ⭐ **Gold Rare (85+):** Metallic gold shine styling.
  * ⭐ **Gold Common (75-84):** Classic warm gold.
  * 🥈 **Silver (<75):** Sleek silver metallic theme.
* **Authentic 6 FUT Attributes:** Automatically calculates realistic ratings for PAC, SHO, PAS, DRI, DEF, PHY (or GK attributes: DIV, HAN, KIC, REF, SPE, POS).
* **Pickup Performance Badges:** Displays real-world pickup statistics: Matches played, Total wins, Win rate %, and MVP awards.
* **Export & Social Share:** Export high-res card images ready for Instagram Stories, Snapchat, and WhatsApp groups.

### 4. 👥 Multi-Squad Circles & Dynamic Group Manager
* **Dynamic Group Creation Modal:** Create and manage custom squads and playing circles on the fly with custom tags and sports emoji presets (e.g., `🏢 Office Squad`, `⚽ Friday Pickup`, `🏆 Weekend League`, `🔥 Street FC`).
* **Group-Filtered Tactical Division:** Filter players by specific groups directly in the tactical draft screen (`DraftScreen`). The smart split engine auto-selects only attendees from the active circle to balance Team A and Team B.
* **Circle Filtering Across Modals:** Filter players by squad circle in player management, individual pitch slot pickers, team building, and tournament scheduling with 1-tap bulk selection.
* **Persistent Squad Tagging:** Every player's squad tag is persistently stored in PostgreSQL and displayed on their profile, FUT card, and squad rosters.

### 5. 🏆 Tournament & League Engine
* **Tournament Modes:** Supports Round-Robin (League table with points) and Single Elimination (Knockout brackets).
* **Automated Standings:** Automatically tracks played matches, wins, draws, losses, goals for (GF), goals against (GA), goal difference (GD), and points.
* **Match Hub:** Record live scores, log match results, and designate the Man of the Match (MVP) with rating boosts.

### 6. 🛡️ Custom Teams & Kit Customization
* **Custom Kits & Codes:** Choose custom team names, colors, and kit emojis with automatic alphabetical naming codes (`Team A`, `Team B` ... `Team Z`, `Team AA`).
* **Pitch Assignment:** Assign any saved squad directly to either **Team A (Bottom Half)** or **Team B (Top Half)** with dynamic slot allocation.

### 7. 👑 Role-Based Access
* **Guest Mode:** Immediate, frictionless access to fast text parsing and basic squad division without login.
* **Registered / Pro Admin Mode:** Persistent PostgreSQL cloud storage, custom formation builders, player stats tracking, and match history archiving.

---

## 🛠️ Tech Stack & Architecture

| Component | Technology | Description |
|---|---|---|
| **Mobile App** | **React Native / Expo SDK 58** | Cross-platform mobile front-end (iOS, Android, Web) |
| **Backend API** | **Node.js & Express.js** | RESTful microservice handling business logic and ORM |
| **Database** | **PostgreSQL** | Relational database containerized with Docker |
| **Local LLM Engine** | **Meta Llama 3.1 (Ollama)** | Zero-latency local LLM parsing for registered users |
| **Cloud AI Engine** | **Google Gemini API (`@google/genai`)** | High-precision cloud NLP extraction and semantic analysis |
| **Media & Sharing** | **`react-native-view-shot` & `expo-sharing`** | High-definition canvas screenshot capturing & native sharing |

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [Docker Desktop](https://www.docker.com/) (for PostgreSQL)
* [Ollama](https://ollama.ai/) (optional for local Llama 3.1: `ollama run llama3.1`)
* [Expo Go](https://expo.dev/go) app installed on your physical mobile device

### 1. Clone the Repository
```bash
git clone https://github.com/AliAlali0/Qisma-app.git
cd Qisma-app
```

### 2. Start PostgreSQL via Docker
```bash
docker-compose up -d
```

### 3. Setup and Run the Backend Server
```bash
cd mobile/backend
npm install
npm run dev
# Server will run on http://localhost:5000
```

> **Note for Local AI:** Ensure Ollama is running with `ollama run llama3.1` if you want local Meta Llama 3.1 parsing enabled.

### 4. Start the Expo Mobile App
```bash
cd ../
npm install
npx expo start
```
Scan the displayed QR code with the **Expo Go** app on your phone to launch the app!

---

## 📂 Project Directory Structure

```
QismaApp/
├── docker-compose.yml          # PostgreSQL container configuration
├── PLAN.md                     # Roadmap and milestone documentation
├── mobile/
│   ├── App.js                  # Main controller, state management & navigation stack
│   ├── styles.js               # Global stylesheet and theme tokens
│   ├── components/
│   │   ├── FutCardModal.js     # EA FC / FUT player card modal & image exporter
│   │   ├── HeaderBar.js        # Global header with back navigation and auth switcher
│   │   ├── PlayerCard.js       # Visual pitch player slot cards
│   │   └── AppModals.js        # Score recording and auth modals
│   ├── screens/
│   │   ├── HomeScreen.js       # 2-column grid dashboard
│   │   ├── DivideScreen.js     # Raw WhatsApp text parsing and visual pitch
│   │   ├── DraftScreen.js      # Tactical formation builder and draft manager
│   │   ├── PlayersScreen.js    # Player database, FUT cards & squad circle filters
│   │   ├── TeamsScreen.js      # Custom team kit creator & pitch assigner
│   │   ├── MatchesScreen.js    # Match history archive & MVP booster
│   │   └── Tournaments...      # League standings and knockout management
│   └── backend/
│       ├── server.js           # Express API, Llama 3.1 & Gemini endpoints
│       └── db.js               # PostgreSQL pool setup and schema migrations
```

---

## 👨‍💻 Author

**Ali Alali**  
* **GitHub:** [@AliAlali0](https://github.com/AliAlali0)  
* **LinkedIn:** [Ali Alali](https://www.linkedin.com/in/aliadnanalali/)


