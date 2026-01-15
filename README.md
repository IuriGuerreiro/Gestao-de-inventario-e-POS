# Inventory Manager

A modern, desktop-based inventory management and Point of Sale (POS) application built with **Tauri v2**, **React**, and **TypeScript**. Designed for small businesses to track stock, process sales, and analyze performance with a clean, responsive UI.

![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?style=flat&logo=tauri&logoColor=black)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat&logo=tailwindcss&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Local_DB-003B57?style=flat&logo=sqlite&logoColor=white)

## ✨ Features

- **📊 Dashboard:** Real-time overview of daily sales, total revenue, and critical alerts.
- **📦 Inventory Management:**
  - Add, edit, and delete products.
  - Track stock levels with "Low Stock" indicators.
  - Organize products into custom categories.
  - Search and filter inventory instantly.
- **💰 Point of Sale (POS):**
  - Streamlined checkout interface.
  - Add items to cart and process transactions.
  - Automatic inventory deduction upon sale.
- **📈 Analytics & Reports:**
  - Visual sales history and revenue charts (via Recharts).
  - "Top Selling Products" and "Profit Margin" reports.
  - Detailed sales history logs.
- **💾 Local Database:** All data is stored locally in a SQLite database (`inventory_v2.db`), ensuring privacy and offline capability.

## 🛠 Tech Stack

- **Desktop Framework:** [Tauri v2](https://tauri.app/) (Rust)
- **Frontend Library:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **State/Data:** SQLite (via `@tauri-apps/plugin-sql`)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Charts:** [Recharts](https://recharts.org/)

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
1.  **Node.js** (v18 or newer recommended)
2.  **Rust & Cargo** (Required for Tauri). Follow the [Tauri Prerequisites guide](https://tauri.app/v1/guides/getting-started/prerequisites).

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd inventoryManagement
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### 🏃‍♂️ Running in Development

To start the application in development mode (with hot-reload for frontend):

```bash
npm run tauri dev
```

*Note: The first run might take a moment to compile the Rust backend.*

### ⚙️ Configuration (Mock Data)

You can control whether the database is seeded with mock data (sample products, sales, categories) using the `.env` file.

1.  Create or edit the `.env` file in the root directory:
    ```env
    VITE_SEED_MOCK_DATA=false
    ```
2.  **true**: Seeds the database with sample data on startup (if empty).
3.  **false**: Starts with an empty database (or keeps existing data).

**Important:** If you change this variable, you must restart the development server or rebuild the app.

## 📦 Building for Production

To build the optimized executable for your operating system:

```bash
npm run tauri build
```

The output binary will be located in:
- **Linux:** `src-tauri/target/release/bundle/deb/` (or AppImage)
- **Windows:** `src-tauri/target/release/bundle/msi/`
- **macOS:** `src-tauri/target/release/bundle/dmg/`

## 📂 Project Structure

```
inventoryManagement/
├── src/
│   ├── components/      # React components (Dashboard, Inventory, POS, etc.)
│   ├── hooks/           # Custom hooks (useInventory)
│   ├── services/        # Database services & logic
│   ├── types/           # TypeScript definitions
│   ├── App.tsx          # Main application layout
│   └── main.tsx         # Entry point
├── src-tauri/           # Rust backend (Tauri configuration)
│   ├── src/
│   │   ├── lib.rs       # Rust library code
│   │   └── main.rs      # Rust entry point
│   ├── tauri.conf.json  # Tauri configuration
│   └── Cargo.toml       # Rust dependencies
└── package.json         # Node.js dependencies & scripts
```

## 🧪 Testing

Run the test suite (Vitest):

```bash
npm run test
```