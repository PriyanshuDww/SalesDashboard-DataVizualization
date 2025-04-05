import { dataService } from "./dataService.js";

export async function loadAndDrawHorizontalBarChart() {
  const container = d3.select("#horizontal-barchart");
  container.selectAll("*").remove();

  const containerNode = container.node();
  const zoomScale = 0.33;
  const fullWidth = 4500; // or whatever width your chart container should be
  let fullHeight = 800;   // same for height

if (fullHeight < 100) fullHeight = 500; // fallback height if DOM collapses


  const margin = { top: 40, right: 50, bottom: 40, left: 220 };
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
  const rawData = dataService.getFilteredData();

  const data = Array.from(
    d3.rollup(
      rawData,
      (v) => d3.sum(v, (d) => d.sales),
      (d) => d.productLine
    ),
    ([productLine, sales]) => ({ productLine, sales })
  ).sort((a, b) => a.sales - b.sales);

  const y = d3
    .scaleBand()
    .domain(data.map((d) => d.productLine))
    .range([height, 0])
    .padding(0.2);

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.sales) * 1.1])
    .range([0, width]);

  // === Gradient Definition ===
  const defs = svg.append("defs");
  const gradient = defs
    .append("linearGradient")
    .attr("id", "barGradient")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");
  gradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#3b82f6");
  gradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#1e3a8a");

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
    .style("display", "none");

  // === Y Axis ===
  chart.append("g")
  .call(d3.axisLeft(y))
  .selectAll("text")
  .style("fill", "white")
  .style("font-size", "26px")
  .style("font-weight", "bold");


    

  // === X Axis ===
  const xAxis = chart.append("g")
  .attr("transform", `translate(0, ${height})`)
  .call(d3.axisBottom(x).tickFormat(d3.format("$.2s")));

xAxis.selectAll("text")
  .style("fill", "white")
  .style("font-size", "26px")
  .style("font-weight", "bold");
  
    
    

  // === Bars ===
  chart
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("y", (d) => y(d.productLine))
    .attr("height", y.bandwidth())
    .attr("x", 0)
    .attr("width", 0)
    .attr("fill", "url(#barGradient)")
    .attr("rx", 4)
    .on("mouseover", (event, d) => {
      tooltip
        .style("display", "block")
        .html(`<strong>${d.productLine}</strong><br>Sales: $${d3.format(",")(d.sales)}`);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"))
    .transition()
    .duration(1000)
    .attr("width", (d) => x(d.sales));

  // === Value Labels ===
  chart
    .selectAll("text.value")
    .data(data)
    .enter()
    .append("text")
    .attr("x", (d) => x(d.sales) + 8)
    .attr("y", (d) => y(d.productLine) + y.bandwidth() / 2)
    .attr("alignment-baseline", "middle")
    .style("font-size", "26px")
    .style("fill", "white")
    .text((d) => `$${d3.format(",.0f")(d.sales)}`);

  // === Title ===
  svg
    .append("text")
    .attr("x", margin.left)
    .attr("y", 25)
    .style("font-size", "30px")
    .style("font-weight", "bold")
    .style("fill", "white")
    .text("Total Sales by Product Line");
}
