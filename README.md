
# 📊 Sales Dashboard Data Visualization (University Group Project)

This project is a dynamic and interactive **data visualization dashboard** built as part of a university group project. It visualizes sales performance data using various charts created with **D3.js**, and provides users with powerful filtering and exploration tools.

> 💡 Built collaboratively, this project demonstrates end-to-end data storytelling using a single-page HTML + JS setup.

---

## 🚀 Features

- 📌 Multiple interactive charts:
  - Line Chart
  - Bar Chart
  - Bubble Chart
  - Donut Chart
  - Horizontal Bar Chart
  - Map Chart (Geo)
  - Sunburst Chart
  - KPI Cards
  - Sales Heatmap Table
- 🔁 **Bidirectional filtering** (click a chart → filter other charts)
- 🧭 **Zooming and tooltips** on charts
- 🖱️ **Hover interactivity**
- 🌍 Map view using `topojson` for countries
- 🗃️ Modular JS structure for reusability

---

## 🛠️ Technologies Used

- **D3.js** (v7)
- HTML5
- CSS3
- JavaScript (modular, ES6)
- TopoJSON (for map chart)
- CSV data (`imputed_sales_data.csv`)

---

## 🧠 Personal Contribution

> I was responsible for the **core dashboard functionality**, including:

- Implementing **hover effects**, **tooltips**, and **interactivity** across charts
- Enabling **bidirectional filtering** between visualizations
- Making charts **clickable** for filtering and selection
- Refining layout and ensuring **cross-chart communication**
- Debugging and polishing overall user experience

---

## 📁 Folder Structure

```
sales-dashboard-dataviz/
├── index.html                  # Entry point
├── styles/
│   └── main.css                # Styling
├── scripts/
│   ├── KPIcards.js
│   ├── mapchart.js
│   ├── donutChart.js
│   └── ...                    # All individual charts
├── libs/
│   └── d3/d3.v7.min.js        # D3.js library
├── imputed_sales_data.csv     # Cleaned dataset
└── README.md                  # Project overview
```

---

## ▶️ How to Run

1. Clone or download the repo:
   ```bash
   git clone https://github.com/your-username/sales-dashboard-dataviz.git
   cd sales-dashboard-dataviz
   ```

2. Simply open `index.html` in a browser:
   - No server required
   - Works offline once loaded

---

## 🏁 Outcome

This dashboard allows users to **explore trends, compare KPIs**, and **drill down by country or product** with ease. It’s a great example of how front-end data visualization can turn raw data into compelling insights.

---

## 👥 Team Members

- [Your Name] *(Lead Developer - Interactivity, Filtering, UX)*
- Other team members (optional)

---

## 🪪 License

MIT License – open for use and inspiration.
