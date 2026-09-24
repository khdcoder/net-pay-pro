# NetPay Pro 🚀

> **Modern, Offline-First ISP & Cable TV Bill Collection and Subscriber Management System**  
> Developed with ❤️ by **Khalid Software House** | GitHub: [@khdcoder](https://github.com/khdcoder)  
> Repository: [github.com/khdcoder/net-pay-pro](https://github.com/khdcoder/net-pay-pro)

[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/khdcoder/net-pay-pro)
[![Angular Version](https://img.shields.io/badge/Angular-21.x-dd0031.svg?style=flat&logo=angular)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38bdf8.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline_First-4f46e5.svg)](https://web.dev/progressive-web-apps/)

---

## 📌 About NetPay Pro

**NetPay Pro** is an open-source, production-ready billing and collection management application built for **Local Internet Service Providers (ISPs), Cable TV network operators, water/utility suppliers, and subscription-based service providers**.

Whether you operate in bustling urban sectors or rural villages (*Chaks, Mohallahs, Dhoks*) with intermittent internet connectivity, **NetPay Pro works 100% offline**. All records are saved securely in your browser's persistent storage engine, with automatic background synchronization to your personal Google Drive / Google Sheets whenever an internet connection is detected.

---

## ✨ Key Features

### 1. ⚡ 100% Offline-First Architecture
- **Dual Persistence Engine:** Powered by synchronous `localStorage` and resilient `IndexedDB` with Chrome Storage Protection API.
- **Chrome History Safe:** Engineered to prevent accidental data wipes with automated daily snapshot recovery.
- **Zero Internet Required for Daily Field Work:** Record collections, search customers, and inspect ledgers even in areas with zero mobile network reception.

### 2. 👥 Customer & Subscriber Directory
- **Rich Profiles:** Track customer name, phone number, physical address, monthly subscription fee, and service category (**Internet 🌐** or **Cable TV 📺**).
- **Village / Area (گاؤں / علاقہ) Filtering:** Filter subscribers by sector or village to streamline on-field bill collections area by area.
- **Lifecycle Management:** Seamlessly mark subscribers as Active or Dropout (Inactive) with preserved historical records.
- **Direct Calling:** Single-tap phone call button directly opens your phone dialer for rapid customer contact.

### 3. 💳 High-Speed Billing & Collection Desk
- **Auto Monthly Ledger:** Automatically generates monthly bill cards for all active subscribers for any selected month and year.
- **Previous Arrears Tracking:** Automatically calculates previous unpaid balances + current month fees to show exact total amount due.
- **Quick Cash Presets:** One-click quick-fill buttons for `Rs. 500`, `Rs. 1,000`, `Rs. 1,500`, `Rs. 2,000`, and **`Total with Arrears`**.
- **Duplicate Protection:** Built-in safeguards alert operators before overwriting an already paid bill.

### 4. 📲 Instant WhatsApp Receipts & Overdue Reminders
- **Instant WhatsApp Receipts:** Generate and dispatch branded payment acknowledgement receipts to customers with zero third-party messaging API subscriptions or fees.
- **Payment Reminders:** Send one-click courteous balance reminders detailing subscriber name, billing month, and outstanding arrears.

### 5. 📊 Interactive Dashboard & KPI Analytics
- **Executive KPIs:** Live metrics for Total Billed, Total Collected, Outstanding Arrears, and Collection Percentage rate.
- **Interactive D3.js Charts:** Visual breakdown of collection status and monthly cash-flow trends.
- **Smart Date & Text Filters:** Instant live search and full-field clickable calendar picker to inspect collections by exact dates.

### 6. 📄 Professional Reports & Statements
- **Annual Customer Statements:** Detailed 12-month fiscal payment ledgers for individual subscribers.
- **One-Click PDF Export:** Clean, printable PDF billing sheets formatted using `jsPDF` and `AutoTable`.
- **CSV / Excel Export:** Export data to CSV for record keeping in Microsoft Excel or Google Sheets.

### 7. ☁️ Google Cloud & Google Drive Backup
- Connect your own free Google Apps Script webhook to automatically back up encrypted snapshot archives to your private Google Drive.

### 8. 🚀 Clean Fresh Start (Production-Ready)
- Starts with a completely clean database (0 records) ready for immediate deployment. You can add your real customers immediately or use the optional **"Load 50 Sample Users"** tool under Settings if you want to explore with sample data first.

---

## 🛠️ Technology Stack

| Technology | Purpose |
| :--- | :--- |
| **Angular 21** | Zoneless component architecture with reactive signals |
| **TypeScript** | Strict type-safety across models and services |
| **Tailwind CSS** | Clean, responsive UI with dark mode support |
| **IndexedDB & LocalStorage** | Multi-tier offline client storage |
| **D3.js** | Interactive chart visualizations |
| **jsPDF & AutoTable** | Client-side vector PDF report generation |
| **FontAwesome 6** | Comprehensive icon system |
| **Google Apps Script** | Serverless Google Drive cloud backup webhook |

---

## 🚀 Getting Started

### Prerequisites
Make sure you have **Node.js** (v18.x or later) and **npm** installed on your system.
- Check Node version: `node -v`
- Check npm version: `npm -v`

### 1. Clone the Repository
```bash
git clone https://github.com/khdcoder/net-pay-pro.git
cd net-pay-pro
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Server
```bash
npm start
# or
npm run dev
```

### 4. Open in Browser
Navigate to `http://localhost:3000` in your web browser. The app will launch with 50 sample subscribers ready for testing!

---

## ☁️ Google Drive Cloud Backup Setup (Optional)

NetPay Pro can automatically sync your database to your Google Drive account without needing a paid cloud server.

### How to set up your free Google Apps Script Webhook:
1. Open [Google Drive](https://drive.google.com).
2. Create a new **Google Sheet** named `NetPay_Pro_Backup`.
3. In the menu, click **Extensions &rarr; Apps Script**.
4. Paste the following script:

```javascript
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var email = body.email;
    var data = body.data;
    var timestamp = body.timestamp || new Date().toISOString();

    var folderName = "NetPay_Pro_Backups";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    if (action === "backup") {
      var fileName = "netpay_backup_" + email.replace(/[^a-zA-Z0-9]/g, "_") + ".json";
      var files = folder.getFilesByName(fileName);
      if (files.hasNext()) {
        files.next().setContent(JSON.stringify(data));
      } else {
        folder.createFile(fileName, JSON.stringify(data), MimeType.PLAIN_TEXT);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, timestamp: timestamp })).setMimeType(ContentService.MimeType.JSON);
    } 
    else if (action === "restore") {
      var fileName = "netpay_backup_" + email.replace(/[^a-zA-Z0-9]/g, "_") + ".json";
      var files = folder.getFilesByName(fileName);
      if (files.hasNext()) {
        var content = files.next().getBlob().getDataAsString();
        return ContentService.createTextOutput(JSON.stringify({ success: true, data: JSON.parse(content) })).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "No backup found for this email." })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

5. Click **Deploy &rarr; New deployment**.
6. Select **Type: Web app**.
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
7. Click **Deploy** and copy the **Web App URL**.
8. In NetPay Pro, go to **Settings & Sync**, click the edit icon next to the Script URL, and paste your URL.

---

## 📁 Project Architecture

```
net-pay-pro/
├── index.html                  # HTML5 shell with responsive viewports & meta tags
├── index.css                   # Tailwind CSS styling & custom scrollbars
├── index.tsx                   # Angular bootstrap entry
├── manifest.json               # Progressive Web App (PWA) manifest
├── sw.js                       # Service worker for offline asset caching
├── src/
│   ├── app.component.ts        # App root layout with responsive navigation & theme signals
│   ├── app.component.html      # Responsive sidebar, top bar, & mobile bottom drawer
│   ├── app.routes.ts           # Client-side router configuration
│   ├── components/
│   │   ├── dashboard/          # Metrics cards, D3.js chart, date & search filters
│   │   ├── users/              # Subscriber directory, add/edit modal, category & village filters
│   │   ├── billing/            # Billing collection desk, arrears calculator, WhatsApp receipts
│   │   ├── statements/         # Customer annual fiscal ledgers, PDF/CSV export
│   │   ├── settings/           # Cloud sync, IndexedDB persistent protection, demo data controls
│   │   └── shared/             # Notification toast alerts
│   ├── models/
│   │   ├── user.model.ts       # Subscriber data interface
│   │   ├── bill-entry.model.ts # Monthly billing record interface
│   │   ├── app-data.model.ts   # System state & settings interface
│   │   └── mock-data.ts        # 50 realistic pre-loaded subscribers & payment histories
│   └── services/
│       ├── storage.service.ts  # Reactive signals store, dual localStorage + IndexedDB sync
│       ├── indexed-db.service.ts # IndexedDB low-level engine & rolling snapshots
│       ├── sync.service.ts     # Google Apps Script HTTP backup & restore
│       ├── utility.service.ts  # PDF builder, CSV exporter, & toast notifications
│       └── license.service.ts  # Open-source community edition status
└── package.json                # Project dependencies and npm scripts
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/khdcoder/net-pay-pro/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👨‍💻 Author & Credits

- **Developer:** Khalid Mahmood ([@khdcoder](https://github.com/khdcoder))
- **Organization:** [Khalid Software House](https://khalid-software-house.web.app)
- **Repository:** [https://github.com/khdcoder/net-pay-pro](https://github.com/khdcoder/net-pay-pro)

*If this project helps your business or organization, don't forget to give it a ⭐ on GitHub!*
