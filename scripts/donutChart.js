import { dataService } from "./dataService.js";

export async function loadAndDrawDonutChart() {
  const container = d3.select("#donutchart");
  container.selectAll("*").remove();

  const containerNode = container.node();
  const fullWidth = containerNode.clientWidth || 800;
  const fullHeight = containerNode.clientHeight || 500;
  const margin = { top: 40, right: 20, bottom: 80, left: 40 };
  const width = fullWidth - margin.left - margin.right;
  const height = fullHeight - margin.top - margin.bottom;
  const radius = Math.min(width, height) / 2.2;

  const svg = container
    .append("svg")
    .attr("width", fullWidth)
    .attr("height", fullHeight);

  const chartGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left + width / 2}, ${margin.top + height / 2})`);

  await dataService.loadData();
  const rawData = dataService.getFilteredData();

  const salesByStatus = Array.from(
    d3.rollup(
      rawData,
      (v) => d3.sum(v, (d) => d.sales),
      (d) => d.status
    ),
    ([status, sales]) => ({ status, sales })
  );

  if (salesByStatus.length === 0) {
    chartGroup
      .append("text")
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("No data available");
    return;
  }

  const total = d3.sum(salesByStatus, (d) => d.sales);

  const pie = d3.pie().value((d) => d.sales).sort(null);
  const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius * 0.9);

  const color = d3
    .scaleOrdinal()
    .domain(salesByStatus.map((d) => d.status))
    .range(["#4caf50", "#ff9800", "#2196f3", "#f44336", "#9c27b0"]);
    // You can optionally use: .range(d3.schemeSet2)

  // === Tooltip ===
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#1e1e1e")
    .style("color", "#fff")
    .style("padding", "8px 12px")
    .style("border-radius", "8px")
    .style("pointer-events", "none")
    .style("font-size", "14px")
    .style("line-height", "1.5")
    .style("max-width", "220px")
    .style("display", "none");

  // === Donut Slices ===
  chartGroup
    .selectAll("path")
    .data(pie(salesByStatus))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", (d) => color(d.data.status))
    .attr("stroke", "#1e1e1e")
    .attr("stroke-width", 2)
    .on("mouseover", function (event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("transform", () => {
          const [x, y] = arc.centroid(d);
          return `translate(${x * 0.15}, ${y * 0.15})`;
        });

      tooltip
        .style("display", "block")
        .html(
          `<strong>${d.data.status}</strong><br/>Sales: $${d3.format(",")(d.data.sales)}<br/>${Math.round(
            (d.data.sales / total) * 100
          )}%`
        );
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("transform", "scale(1)");

      tooltip.style("display", "none");
    });

  // === Center Label ===
  chartGroup
    .append("text")
    .attr("text-anchor", "middle")
    .style("font-size", "26px")
    .style("font-weight", "bold")
    .style("fill", "white")
    .selectAll("tspan")
    .data(["Total", `$${d3.format(",")(total)}`])
    .enter()
    .append("tspan")
    .attr("x", 0)
    .attr("dy", (d, i) => (i === 0 ? 0 : "1.4em"))
    .text((d) => d);

  // === Title ===
  svg
    .append("text")
    .attr("x", fullWidth / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "30px")
    .style("font-weight", "bold")
    .style("fill", "white")
    .text("Shipment Status");

  // === Legend ===
  const legend = svg
    .append("g")
    .attr("transform", `translate(${width / 2 - 100}, ${height + margin.top + 20})`);

  const legendItemWidth = 120;
  const maxItemsPerRow = 3;

  salesByStatus.forEach((d, i) => {
    const xPos = (i % maxItemsPerRow) * legendItemWidth;
    const yPos = Math.floor(i / maxItemsPerRow) * 20;

    const row = legend.append("g").attr("transform", `translate(${xPos}, ${yPos})`);

    row.append("rect").attr("width", 12).attr("height", 12).attr("fill", color(d.status));

    row
      .append("text")
      .attr("x", 18)
      .attr("y", 10)
      .style("fill", "white")
      .style("font-size", "24px")
      .text(d.status);
  });
}
