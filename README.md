# 🍳 BachelorBite — Solo Cooking Made Simple

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://naren-ks-hub.github.io/Bachelor-s-Bite/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

> **12-Minute Meals That Actually Taste Good.**  
> Stop wasting ₹18,000/month on food delivery apps. One pan. Fresh ingredients. Zero cooking skills needed. Perfect for bachelors, students, and busy professionals who refuse to live on instant noodles.

---

## 🌟 Key Features

- 🥘 **Interactive Pantry Matcher**: Select whatever ingredients you have left in your fridge and get immediate recipe matches with match percentages.
- 💰 **Delivery Bleed Savings Calculator**: Dynamic interactive slider calculating weekly and monthly financial savings compared to takeout apps.
- 📚 **Curated Situational Collections**:
  - 💰 *End-of-Month Broke Edition* (Cost-effective meals under ₹60)
  - ⚡ *10-Minute Hangry Meals* (Faster than ordering takeout)
  - 💪 *Single Skillet Gains* (High-protein macros for gym enthusiasts)
  - 🌙 *Late Night Study Cravings* (Silent, quick midnight munchies)
- 📝 **Lead Capture & Waitlist**: Built-in modal with Google Apps Script backend integration for instant access and onboarding.
- 📱 **Fully Responsive Modern UI**: Clean design, responsive flexbox/grid layout, smooth animations, and optimized typography.

---

## 🚀 Live Demo

Check out the live website deployed on GitHub Pages:  
👉 **[https://naren-ks-hub.github.io/Bachelor-s-Bite/](https://naren-ks-hub.github.io/Bachelor-s-Bite/)**

---

## 📂 Project Structure

```text
Bachelor-s-Bite/
├── images/
│   ├── collection_budget.jpg       # Broke edition collection image
│   ├── collection_midnight.jpg     # Midnight study cravings collection image
│   ├── collection_protein.jpg      # Single skillet protein collection image
│   ├── collection_quick.jpg        # 10-minute hangry collection image
│   ├── recipe_egg_toast.jpg        # Egg & cheese toast recipe image
│   ├── recipe_noodles.jpg          # Garlic butter noodles recipe image
│   └── recipe_smokey_rice.jpg      # Smokey black bean rice recipe image
├── bachelors bite.jpg               # Hero banner illustration
├── index.html                      # Main landing page & interactive UI
├── server.js                       # Lightweight local static server (Node.js)
└── README.md                       # Documentation
```

---

## 🔌 Backend REST API Reference

The backend runs on **Node.js**, **Express**, and native **SQLite** (`node:sqlite`).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service status check |
| `GET` | `/api/recipes` | List recipes (filters: `budget_max`, `time_max`, `cookware`, `category`, `search`) |
| `GET` | `/api/recipes/:idOrSlug` | Detailed recipe with ingredients, cooking steps, and timer metadata |
| `POST` | `/api/recipes/match` | Intelligent pantry matcher: matches ingredient array and computes % match scores |
| `GET` | `/api/collections` | List curated situational collections |
| `GET` | `/api/collections/:slug/recipes` | Recipes for a specific collection |
| `POST` | `/api/leads` | Register waitlist lead with email & phone validation |
| `GET` | `/api/leads` | Retrieve registered leads |

---

## 🛠️ Getting Started Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/Naren-ks-hub/Bachelor-s-Bite.git
   cd Bachelor-s-Bite
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the backend & frontend server:
   ```bash
   npm start
   ```

4. Run automated test suite:
   ```bash
   npm test
   ```

5. Open your browser at:
   ```
   http://localhost:3000
   ```

---

## 🛠️ Built With

- **Frontend**: HTML5, Vanilla CSS3, Vanilla JavaScript (Dynamic pantry matcher, recipe detail modal with interactive kitchen timer)
- **Backend API**: Node.js v24, Express.js, CORS
- **Database**: SQLite via Node native `node:sqlite` (`bachelor_bite.db`)
- **Automated Tests**: Custom zero-dependency Node HTTP integration test runner (`tests/api.test.js`)

---

## 📄 License

This project is licensed under the MIT License — feel free to use and modify it for your own projects!
