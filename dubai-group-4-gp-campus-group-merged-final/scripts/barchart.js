import { dataService } from "./dataService.js";

export async function drawBarChart() {
  try {
    await dataService.loadData();
    const filteredData = dataService.getFilteredData();

    const salesByCountry = d3.rollup(
      filteredData,
      (v) => d3.sum(v, (d) => d.sales),
      (d) => d.country
    );

    const topCountries = Array.from(salesByCountry, ([country, sales]) => ({
      country,
      sales,
    }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 6);

    d3.select("#barchart").select("svg").remove();

    const width = 600;
    const height = 400;
    const margin = { top: 50, right: 30, bottom: 60, left: 100 };

    const svg = d3
      .select("#barchart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3
      .scaleBand()
      .domain(topCountries.map((d) => d.country))
      .range([0, chartWidth])
      .padding(0.3);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(topCountries, (d) => d.sales)])
      .nice()
      .range([chartHeight, 0]);

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
      .style("font-size", "12px")
      .style("display", "none");

    // === Bars ===
    chart
      .selectAll("rect")
      .data(topCountries)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.country))
      .attr("y", chartHeight)
      .attr("width", xScale.bandwidth())
      .attr("height", 0)
      .attr("fill", "url(#bar-gradient)")
      .attr("rx", 4)
      .attr("ry", 4)
      .on("mouseover", (event, d) => {
        tooltip
          .style("display", "block")
          .html(`<strong>${d.country}</strong><br>Sales: $${d3.format(",")(d.sales)}`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 20 + "px");
      })
      .on("mouseout", () => tooltip.style("display", "none"))
      .transition()
      .duration(1000)
      .attr("y", (d) => yScale(d.sales))
      .attr("height", (d) => chartHeight - yScale(d.sales));

    // === Gradient Fill Definition ===
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "bar-gradient")
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%");
    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#3b82f6");
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#1e3a8a");

    // === Axis X ===
    chart
      .append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-20)")
      .style("text-anchor", "end")
      .style("fill", "white");

    // === Axis Y ===
    chart.append("g").call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format("$.2s")))
      .selectAll("text")
      .style("fill", "white");

    // === Value Labels ===
    chart
      .selectAll(".label")
      .data(topCountries)
      .enter()
      .append("text")
      .attr("x", (d) => xScale(d.country) + xScale.bandwidth() / 2)
      .attr("y", (d) => yScale(d.sales) - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "white")
      .text((d) => `$${d3.format(",")(d.sales)}`);

    // === Titles ===
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .text("Top 6 Countries by Sales");
  } catch (error) {
    console.error("Error drawing bar chart:", error);
  }
}

