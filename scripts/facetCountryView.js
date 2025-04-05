import { dataService } from "./dataService.js";

export async function drawFacetCountryView() {
  await dataService.loadData();
  const data = dataService.getFilteredData();

  const grouped = Array.from(
    d3.rollup(data, v => d3.sum(v, d => d.sales), d => d.country),
    ([country, sales]) => ({ country, sales })
  );

  const top5 = [...grouped].sort((a, b) => d3.descending(a.sales, b.sales)).slice(0, 5);
  const bottom5 = [...grouped].sort((a, b) => d3.ascending(a.sales, b.sales)).slice(0, 5);

  drawBar("#top-countries", top5, "🏆 Top 5 Countries");
  drawBar("#bottom-countries", bottom5, "🚗 Bottom 5 Countries");
}

function drawBar(containerId, data, title) {
  const container = d3.select(containerId);
  container.selectAll("*").remove();

  const width = container.node().clientWidth;
  const height = container.node().clientHeight;
  const margin = { top: 50, right: 40, bottom: 50, left: 180 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const y = d3.scaleBand()
    .domain(data.map(d => d.country))
    .range([0, chartHeight])
    .padding(0.5);

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.sales)])
    .nice()
    .range([0, chartWidth]);

  chart.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("fill", "white")
    .style("font-size", "30px")
    .style("font-weight", "bold");

  chart.append("g")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("$.2s")))
    .selectAll("text")
    .style("fill", "white")
    .style("font-size", "28px");

  chart.selectAll(".line")
    .data(data)
    .enter()
    .append("line")
    .attr("x1", 0)
    .attr("x2", d => x(d.sales))
    .attr("y1", d => y(d.country) + y.bandwidth() / 2)
    .attr("y2", d => y(d.country) + y.bandwidth() / 2)
    .attr("stroke", "#3b82f6")
    .attr("stroke-width", 6)
    .on("mouseover", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("stroke", "#60a5fa")
        .attr("stroke-width", 10);
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 6);
    });

  chart.selectAll(".circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.sales))
    .attr("cy", d => y(d.country) + y.bandwidth() / 2)
    .attr("r", 12)
    .attr("fill", "#3b82f6")
    .style("cursor", "pointer")
    .on("mouseover", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", 18)
        .attr("fill", "#60a5fa")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 4);
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", 12)
        .attr("fill", "#3b82f6")
        .attr("stroke", "none");
    })
    .on("click", function (event, d) {
      const current = dataService.filters.country;
      const selected = d.country;
      const newFilter = current === selected ? null : selected; // toggle
      dataService.setFilter("country", newFilter);
      console.log("📍 Country filter set to:", newFilter);
      updateAllCharts();
    });

  chart.selectAll(".label")
    .data(data)
    .enter()
    .append("text")
    .attr("x", d => {
      const value = x(d.sales);
      return value > chartWidth - 100 ? value - 80 : value + 20;
    })
    .attr("text-anchor", d => {
      const value = x(d.sales);
      return value > chartWidth - 100 ? "end" : "start";
    })
    .attr("y", d => y(d.country) + y.bandwidth() / 2)
    .attr("alignment-baseline", "middle")
    .style("fill", "white")
    .style("font-size", "26px")
    .style("font-weight", "bold")
    .text(d => `$${d3.format(",.0f")(d.sales)}`)
    .on("mouseover", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .style("fill", "#90cdf4")
        .style("font-size", "32px");
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .style("fill", "white")
        .style("font-size", "26px");
    });

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("fill", "white")
    .style("font-size", "36px")
    .style("font-weight", "bold")
    .text(title);
}
