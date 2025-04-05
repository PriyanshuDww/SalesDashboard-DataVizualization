import { dataService } from "./dataService.js";

export async function loadAndDrawLineChart() {
  // Clear previous content
  d3.select("#linechart").selectAll("*").remove();

  // Get dynamic width and height from container
  const container = d3.select("#linechart");
  const containerNode = container.node();
  const fullWidth = containerNode.clientWidth || 800;
  const fullHeight = containerNode.clientHeight || 400;
  const margin = { top: 50, right: 150, bottom: 60, left: 60 };
  const width = fullWidth - margin.left - margin.right;
  const height = fullHeight - margin.top - margin.bottom;

  const svg = container
    .append("svg")
    .attr("width", fullWidth)
    .attr("height", fullHeight);

  const chartArea = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Load and filter data
  await dataService.loadData();
  const rawData = dataService.getFilteredData();

  // Group by month + deal size
  const dataByMonth = Array.from(
    d3.group(rawData, (d) => d3.timeMonth(d.orderDate)),
    ([date, records]) => {
      const sums = d3.rollup(
        records,
        (v) => d3.sum(v, (d) => d.sales),
        (d) => d.dealSize
      );
      return {
        date,
        Small: sums.get("Small") || 0,
        Medium: sums.get("Medium") || 0,
        Large: sums.get("Large") || 0,
      };
    }
  ).sort((a, b) => a.date - b.date);

  const dealSizes = ["Small", "Medium", "Large"];
  const color = d3
    .scaleOrdinal()
    .domain(dealSizes)
    .range(["#66c2a5", "#fc8d62", "#8da0cb"]);

  const x = d3
    .scaleTime()
    .domain(d3.extent(dataByMonth, (d) => d.date))
    .range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(dataByMonth, (d) => Math.max(d.Small, d.Medium, d.Large)),
    ])
    .nice()
    .range([height, 0]);

  let currentX = x;

  const xAxisGroup = chartArea
    .append("g")
    .attr("transform", `translate(0, ${height})`);

  const yAxisGroup = chartArea.append("g").call(d3.axisLeft(y));

  const initialXAxis = d3
    .axisBottom(currentX)
    .ticks(d3.timeMonth.every(2))
    .tickFormat(d3.timeFormat("%b %Y"));

  xAxisGroup
    .call(initialXAxis)
    .selectAll("text")
    .attr("transform", "rotate(-30)")
    .style("text-anchor", "end")
    .style("fill", "white")
    .style("font-size", "20px")
    .style("font-weight", "bold");

  yAxisGroup.selectAll("text")
    .style("fill", "white")
    .style("font-size", "20px")
    .style("font-weight", "bold");

  const area = d3
    .area()
    .x((d) => currentX(d.date))
    .y0(y(0))
    .y1((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  const line = d3
    .line()
    .x((d) => currentX(d.date))
    .y((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  svg
    .append("defs")
    .append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  const chart = chartArea.append("g").attr("clip-path", "url(#clip)");

  // Draw lines and areas
  dealSizes.forEach((size) => {
    const lineData = dataByMonth.map((d) => ({
      date: d.date,
      value: d[size],
    }));

    chart
      .append("path")
      .datum(lineData)
      .attr("fill", color(size))
      .attr("fill-opacity", 0.2)
      .attr("class", `area-${size}`)
      .attr("d", area);

    chart
      .append("path")
      .datum(lineData)
      .attr("fill", "none")
      .attr("stroke", color(size))
      .attr("stroke-width", 2)
      .attr("class", `line-${size}`)
      .attr("d", line);
  });

  // Legend
  dealSizes.forEach((size, i) => {
    svg
      .append("circle")
      .attr("cx", width + margin.left + 10)
      .attr("cy", margin.top + i * 28)
      .attr("r", 8)
      .style("fill", color(size));

    svg
      .append("text")
      .attr("x", width + margin.left + 28)
      .attr("y", margin.top + i * 28 + 4)
      .text(size)
      .style("font-size", "30px")
      .style("fill", "white")
      .style("font-weight", "bold")
      .attr("alignment-baseline", "middle");
  });

  // Labels
  svg
    .append("text")
    .attr("x", margin.left + width / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .style("font-size", "32px")
    .style("font-weight", "bold")
    .style("fill", "white")
    .text("Monthly Sales by Deal Size");

  svg
    .append("text")
    .attr(
      "transform",
      `translate(${margin.left / 3},${margin.top + height / 2}) rotate(-90)`
    )
    .attr("text-anchor", "middle")
    .style("font-size", "22px")
    .style("fill", "white")
    .text("Sales ($)");

  // Zoom behavior
  const zoom = d3
    .zoom()
    .scaleExtent([1, 5])
    .translateExtent([
      [0, 0],
      [width, height],
    ])
    .extent([
      [0, 0],
      [width, height],
    ])
    .on("zoom", (event) => {
      currentX = event.transform.rescaleX(x);

      const zoomLevel = event.transform.k;
      const tickInterval =
        zoomLevel >= 4
          ? d3.timeMonth.every(1)
          : zoomLevel >= 2
          ? d3.timeMonth.every(2)
          : d3.timeMonth.every(3);

      const updatedXAxis = d3
        .axisBottom(currentX)
        .ticks(tickInterval)
        .tickFormat(d3.timeFormat("%b %Y"));

      xAxisGroup
        .call(updatedXAxis)
        .selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end")
        .style("fill", "white")
        .style("font-size", "20px")
        .style("font-weight", "bold");

      dealSizes.forEach((size) => {
        const lineData = dataByMonth.map((d) => ({
          date: d.date,
          value: d[size],
        }));

        chart.select(`.line-${size}`).attr(
          "d",
          line.x((d) => currentX(d.date))
        );
        chart.select(`.area-${size}`).attr(
          "d",
          area.x((d) => currentX(d.date))
        );
      });
    });

  svg.call(zoom);
}
