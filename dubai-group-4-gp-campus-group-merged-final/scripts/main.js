import { dataService } from "./dataService.js";
import { drawBarChart } from "./barchart.js";
import { loadAndDrawMap } from "./mapchart.js";
import { loadAndDrawSunburst } from "./sunburst.js";
import { loadAndDrawLineChart } from "./linechart.js";
import { loadAndDrawSalesHeatmapTable } from "./salesHeatmapTable.js";
import { loadAndDrawDonutChart } from "./donutChart.js";
import { loadAndDrawBubbleChart } from "./bubbleChart.js";
import { loadAndDrawHorizontalBarChart } from "./horizontalBarChart.js";
import { loadAndDrawKPICards } from "./KPIcards.js";
import { drawFacetCountryView } from "./facetCountryView.js";


async function initializeDashboard() {
  await dataService.loadData();

  // === COUNTRY DROPDOWN ===
  const countryDropdown = d3.select("#countryDropdown");
  countryDropdown.append("option").attr("value", "").text("All Countries");
  dataService.getAllCountries().forEach((country) => {
    countryDropdown.append("option").attr("value", country).text(country);
  });
  countryDropdown.on("change", () => {
    dataService.setFilter("country", countryDropdown.property("value") || null);
    updateAllCharts();
  });

  // === PRODUCT LINE DROPDOWN ===
  const productLineDropdown = d3.select("#productLineDropdown");
  productLineDropdown
    .append("option")
    .attr("value", "")
    .text("All Product Lines");
  dataService.getAllProductLines().forEach((pl) => {
    productLineDropdown.append("option").attr("value", pl).text(pl);
  });
  productLineDropdown.on("change", () => {
    dataService.setFilter(
      "productLine",
      productLineDropdown.property("value") || null
    );
    updateAllCharts();
  });

  // === CUSTOMER DROPDOWN ===
  const customerDropdown = d3.select("#customerDropdown");
  customerDropdown.append("option").attr("value", "").text("All Customers");
  dataService.getAllCustomers().forEach((cust) => {
    customerDropdown.append("option").attr("value", cust).text(cust);
  });
  customerDropdown.on("change", () => {
    dataService.setFilter(
      "customer",
      customerDropdown.property("value") || null
    );
    updateAllCharts();
  });

  // === MONTH MULTI-SELECT DROPDOWN ===
  const monthFilter = d3.select("#monthFilter");
  dataService.getAllOrderMonths().forEach((monthValue) => {
    const label = new Date(monthValue + "-01").toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    monthFilter.append("option").attr("value", monthValue).text(label);
  });
  monthFilter.on("change", () => {
    const selected = Array.from(monthFilter.node().selectedOptions).map(
      (opt) => opt.value
    );
    dataService.setMonthFilter(selected);
    updateAllCharts();
  });

  // === CLEAR FILTERS BUTTON ===
  const clearBtn = d3.select("#clearFilters");
  clearBtn.on("click", () => {
    countryDropdown.property("value", "");
    productLineDropdown.property("value", "");
    customerDropdown.property("value", "");
    monthFilter.selectAll("option").property("selected", false);
    dataService.clearFilters();
    updateAllCharts();
  });

  updateAllCharts();
}

function updateAllCharts() {
  drawBarChart();
  loadAndDrawMap();
  loadAndDrawSunburst();
  loadAndDrawLineChart();
  loadAndDrawSalesHeatmapTable();
  loadAndDrawDonutChart();
  loadAndDrawBubbleChart();
  loadAndDrawHorizontalBarChart();
  loadAndDrawKPICards();
  drawFacetCountryView();
}

initializeDashboard();

window.updateAllCharts = updateAllCharts;

