**Application Architecture Overview **

The app is build as a single-page application using modular JavaScript. Each chart resides in its own file and is initialized through (main.js). Shared state and filtering logic are managed via (dataService.js). 

**Key Component Highlights **

HTML (index.html): The HTML file is the entry point that integrates all visualizations. 

CSS (styles/main.css): Provides styling for the layout and elements. 

JavaScript: Core logic for rendering charts and handling interactions. 

main.js: Manages visualization logic and interactions. 

dataService.js: Loads and processes the imputed_sales_data.csv dataset. 

Other visualization scripts (barchart.js, linechart.js, etc.): Each handles a specific chart or visualization. 

**Data Flow **

Loading Data: dataService.js loads imputed_sales_data.csv 

Data Processing: The data is filtered and processed (e.g., converting dates, aggregating sales by categories). 

Visualization Rendering: Each chart or visualization script renders the data using D3.js. 

User Interaction: Users can zoom, filter, and interact with charts, with event listeners handling changes. 

**Visualizations **

Line Chart – Displays monthly sales trends by deal size. 

Horizontal Bar Chart – Shows comparative total sales performance by product line. 

Bubble Chart – Represents customer sales vs. quantity ordered. 

Donut Chart – Visualizes shipment status. 

Sunburst Chart – A hierarchical representation of sales data. 

Map Chart – Geographical sales performance across regions. 

Sales Heatmap Table – A tabular view of sales performance across different deal sizes and product lines. 

Facet Country View – In order to provide comparative insights, we added a lollipop-style horizontal bar chart that splits countries into "Top 5" and "Bottom 5" based on sales performance. This dual view helps decision-makers spot both outliers and underperforming regions immediately. Users can click on any country in the chart to filter the entire dashboard accordingly. 

KPI Cards – Displays key performance metrics like total sales, quantity sold, and average unit price. 