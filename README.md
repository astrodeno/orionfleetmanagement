

# FleetPro - Trucking Management System

FleetPro is a web-based trucking and fleet management system designed to help transport companies manage operations, vehicles, drivers, materials, routes, expenses, maintenance, insurance, attendance, and fuel records.

It is built with **HTML, CSS, JavaScript**, and integrates with **Supabase** for database management and **Chart.js** for data visualization.

---

## 🚀 Features

* **Dashboard Overview** with KPIs (Revenue, Expenses, Net Profit, Trips)
* **Operations Management**: Track trips, tonnage, revenue, and profit
* **Vehicle Management**: Manage fleet details and statuses (active, maintenance, inactive)
* **Driver Management**: Manage drivers, licenses, and activity status
* **Materials & Routes**: Manage transported goods and routes with base rates
* **Expenses & Maintenance**: Track fuel, repairs, and other costs
* **Insurance Records**: Manage vehicle insurance policies and premiums
* **Driver Attendance**: Track check-in, check-out, and working hours
* **Fuel Records**: Record refueling data, odometer readings, and receipts
* **Application Settings**: Company details, currency, date format, and database status
* **Supabase Integration**: Syncs all records with Supabase tables
* **Charts & Analytics**: Revenue vs Expenses, Vehicle Utilization

---

## 🛠️ Tech Stack

* **Frontend**: HTML, CSS, JavaScript
* **Database**: Supabase (PostgreSQL)
* **Charts**: Chart.js
* **Icons**: Font Awesome

---

## 📂 Project Structure

```
├── index.html      # Main application UI  
├── script.js       # Core logic & Supabase integration  
├── style.css       # Stylesheet (not uploaded yet)  
```

---

## ⚙️ Setup & Installation

1. Clone the repository

   ```bash
   git clone https://github.com/your-username/fleetpro.git
   cd fleetpro
   ```

2. Open **index.html** in your browser

   ```bash
   open index.html
   ```

3. Configure **Supabase** in `script.js`

   Replace with your own credentials:

   ```js
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_API_KEY = 'your-api-key';
   ```

---

## 📊 Supabase Tables

FleetPro expects the following tables in Supabase:

* `vehicles`
* `drivers`
* `materials`
* `routes`
* `operations`
* `expenses`
* `maintenance`
* `insurance`
* `attendance`
* `fuel_records`

Each table should include fields matching those in `script.js`.

---

## 🖼️ Screenshots

*(Add screenshots of your dashboard and modules here)*

---

## 🤝 Contributing

Contributions are welcome! Fork the repo and submit a pull request.

---

## 📜 License

This project is licensed under the MIT License.

---

Would you like me to also generate a **README.md file** (Markdown) ready for you to upload to GitHub, or just keep this as text here?
# orionfleetmanagement
