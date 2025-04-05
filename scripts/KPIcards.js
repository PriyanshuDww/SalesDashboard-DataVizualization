import { dataService } from "./dataService.js";

export async function loadAndDrawKPICards() {
  await dataService.loadData();
  const filteredData = dataService.getFilteredData();

  const totalSales = d3.sum(filteredData, (d) => d.sales);
  const totalQuantity = d3.sum(filteredData, (d) => d.quantity);
  const avgRate = totalQuantity > 0 ? totalSales / totalQuantity : 0;

  d3.select("#kpi-sales").text(`$${d3.format(",.2f")(totalSales)}`);
  d3.select("#kpi-quantity").text(d3.format(",")(totalQuantity));
  d3.select("#kpi-rate").text(`$${d3.format(",.2f")(avgRate)}`);

  // === Monthly trend data ===
  const monthlyData = Array.from(
    d3.group(filteredData, (d) => d3.timeMonth(d.orderDate)),
    ([month, records]) => ({
      month,
      sales: d3.sum(records, (d) => d.sales),
      quantity: d3.sum(records, (d) => d.quantity),
    })
  ).sort((a, b) => a.month - b.month);

  const rateData = monthlyData.map((d) => ({
    month: d.month,
    rate: d.quantity > 0 ? d.sales / d.quantity : 0,
  }));

  drawSparkline("#kpi-sales-trend", monthlyData.map((d) => d.sales));
  drawSparkline("#kpi-quantity-trend", monthlyData.map((d) => d.quantity));
  drawSparkline("#kpi-rate-trend", rateData.map((d) => d.rate));
}

function drawSparkline(containerId, values) {
  const width = 700;
  const height = 30;

  const svg = d3.select(containerId)
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleLinear()
    .domain([0, values.length - 1])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(values)])
    .range([height, 0]);

  const line = d3.line()
    .x((d, i) => x(i))
    .y((d) => y(d))
    .curve(d3.curveMonotoneX);

  svg.append("path")
    .datum(values)
    .attr("fill", "none")
    .attr("stroke", "#3b82f6")
    .attr("stroke-width", 2)
    .attr("d", line);
}
