import { dataService } from "./dataService.js";

export async function loadAndDrawBubbleChart() {
  const container = d3.select("#bubblechart");
  container.selectAll("*").remove();

  const containerNode = container.node();
  const fullWidth = containerNode.clientWidth || 1200;

  const fullHeight = containerNode.clientHeight || 500;
  const margin = { top: 40, right: 400, bottom: 80, left: 150 };
  const width = fullWidth - margin.left - margin.right;
  const height = fullHeight - margin.top - margin.bottom;

  const svg = container
    .append("svg")
    .attr("width", fullWidth)
    .attr("height", fullHeight)
    .style("background-color", "#23252B");

  const chart = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  await dataService.loadData();
  const data = dataService.getFilteredData();

  const customerSales = Array.from(
    d3.rollup(
      data,
      (v) => ({
        totalSales: d3.sum(v, (d) => d.sales),
        totalQuantity: d3.sum(v, (d) => d.quantity),
      }),
      (d) => d.customer
    ),
    ([customer, { totalSales, totalQuantity }]) => ({
      customer,
      totalSales,
      totalQuantity,
    })
  )
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 10); // Top 10 customers

  const maxSales = d3.max(customerSales, (d) => d.totalSales);
  const maxQty = d3.max(customerSales, (d) => d.totalQuantity);
  const paddingX = maxSales * 0.1;
  const paddingY = maxQty * 0.1;

  const x = d3.scaleLinear()
    .domain([
      d3.min(customerSales, (d) => d.totalSales) - paddingX,
      maxSales + paddingX
    ])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([
      d3.min(customerSales, (d) => d.totalQuantity) - paddingY,
      maxQty + paddingY
    ])
    .range([height, 0]);

  const r = d3.scaleSqrt()
    .domain([0, maxSales])
    .range([10, 40]);

  const color = d3.scaleOrdinal(d3.schemeSet2);

  // === Tooltip ===
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#1e1e1e")
    .style("color", "#fff")
    .style("padding", "8px 12px")
    .style("border-radius", "8px")
    .style("pointer-events", "none")
    .style("font-size", "16px")
    .style("display", "none");

  // === Gridlines ===
  chart.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickSize(-height).tickFormat(""))
    .selectAll("line")
    .attr("stroke", "#444");

  chart.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
    .selectAll("line")
    .attr("stroke", "#444");

  // === Bubbles ===
  chart.selectAll("circle")
    .data(customerSales)
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d.totalSales))
    .attr("cy", (d) => y(d.totalQuantity))
    .attr("r", (d) => r(d.totalSales))
    .attr("fill", (d) => color(d.customer))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1)
    .style("opacity", 0.85)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "#ffd54f").attr("stroke-width", 3);
      tooltip
        .style("display", "block")
        .html(
          `<strong>${d.customer}</strong><br>Sales: $${d3.format(",")(d.totalSales)}<br>Qty: ${d.totalQuantity}`
        );
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1);
      tooltip.style("display", "none");
    });

  // === Axes ===
  chart.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("$.2s")))
    .selectAll("text")
    .style("fill", "white")
    .style("font-size", "20px")
    .style("font-weight", "bold");

  chart.append("g")
    .call(d3.axisLeft(y).tickFormat(d3.format(",.0f")))
    .selectAll("text")
    .style("fill", "white")
    .style("font-size", "20px")
    .style("font-weight", "bold");

  // === Axis Label Styling ===
  chart.selectAll(".tick text")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .style("fill", "white");

  // === Axis Labels ===
  svg.append("text")
    .attr("x", margin.left + width / 2)
    .attr("y", fullHeight - 10)
    .attr("text-anchor", "middle")
    .style("fill", "white")
    .style("font-size", "26px")
    .style("font-weight", "bold")
    .text("Total Sales");

  svg.append("text")
    .attr("transform", `translate(20, ${margin.top + height / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .style("fill", "white")
    .style("font-size", "26px")
    .style("font-weight", "bold")
    .text("Total Quantity Ordered");

  // === Title ===
  svg.append("text")
    .attr("x", fullWidth / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .style("font-size", "34px")
    .style("font-weight", "bold")
    .style("fill", "white")
    .text("Distribution of Sales / Quantity by Customer");

  // === Legend ===
  const legend = svg.append("g")
    .attr("transform", `translate(${fullWidth - 300}, ${margin.top})`);

  customerSales.forEach((d, i) => {
    const g = legend.append("g").attr("transform", `translate(0, ${i * 28})`);
    g.append("circle")
      .attr("r", 8)
      .attr("fill", color(d.customer))
      .attr("cx", 0)
      .attr("cy", 8);
    g.append("text")
      .text(d.customer)
      .attr("x", 14)
      .attr("y", 12)
      .style("fill", "white")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .attr("alignment-baseline", "middle");
  });
}
