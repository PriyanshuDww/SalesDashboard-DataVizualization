import { dataService } from "./dataService.js";

export async function loadAndDrawSunburst() {
  const container = d3.select("#sunburst");
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "sunburst-tooltip")
    .style("position", "absolute")
    .style("background", "#1e1e1e")
    .style("color", "#fff")
    .style("padding", "24px 32px")
    .style("font-size", "14px")
    .style("line-height", "2")
    .style("border-radius", "14px")
    .style("box-shadow", "0 6px 20px rgba(0,0,0,0.7)")
    .style("pointer-events", "none")
    .style("display", "none")
    .style("z-index", "2000")
    .style("max-width", "400px");

  container.selectAll("*").remove();

  const containerNode = container.node();
  const fullWidth = containerNode.clientWidth || 600;
  const fullHeight = containerNode.clientHeight || 500;
  const radius = Math.min(fullWidth, fullHeight) / 2;

  await dataService.loadData();
  const rawData = dataService.getFilteredData();

  const productColor = d3.scaleOrdinal(d3.schemeCategory10);
  const countryColor = d3.scaleOrdinal(d3.schemeTableau10);

  const topCountries = Array.from(
    d3.rollup(
      rawData,
      (v) => d3.sum(v, (d) => d.sales),
      (d) => d.country
    ),
    ([country, total]) => ({ country, total })
  )
    .sort((a, b) => d3.descending(a.total, b.total))
    .slice(0, 6)
    .map((d) => d.country);

  const filteredData = rawData.filter((d) => topCountries.includes(d.country));

  const grouped = Array.from(
    d3.group(filteredData, (d) => d.country),
    ([country, records]) => {
      const topProducts = Array.from(
        d3.rollup(
          records,
          (v) => d3.sum(v, (d) => d.sales),
          (d) => d.productLine
        ),
        ([product, sales]) => ({ product, sales })
      )
        .sort((a, b) => d3.descending(a.sales, b.sales))
        .slice(0, 3);

      return {
        name: country,
        children: topProducts.map((p) => ({
          name: p.product,
          value: p.sales,
        })),
      };
    }
  );

  const hierarchy = {
    name: "World",
    children: grouped,
  };

  const partition = (data) => {
    const root = d3
      .hierarchy(data)
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value);
    return d3.partition().size([2 * Math.PI, root.height + 1])(root);
  };

  const root = partition(hierarchy);
  root.each((d) => (d.current = d));

  const arc = d3
    .arc()
    .startAngle((d) => d.x0)
    .endAngle((d) => d.x1)
    .innerRadius((d) => (d.y0 * radius) / 3)
    .outerRadius((d) => (d.y1 * radius) / 3);

  const svg = container
    .append("svg")
    .attr("width", fullWidth)
    .attr("height", fullHeight)
    .style("font", "12px sans-serif")
    .style("overflow", "visible");

  const g = svg
    .append("g")
    .attr("transform", `translate(${fullWidth / 2}, ${fullHeight / 2})`);

  const path = g.selectAll("path")
    .data(root.descendants().slice(1))
    .enter()
    .append("path")
    .attr("fill", (d) =>
      d.depth === 1 ? countryColor(d.data.name) : productColor(d.data.name)
    )
    .attr("d", arc)
    .on("mouseover", function (event, d) {
      const sequence = d.ancestors().map((d) => d.data.name).reverse().join(" → ");
      const percent = ((d.value / root.value) * 100).toFixed(1);

      tooltip
        .style("display", "block")
        .html(`<strong>${sequence}</strong><br>Sales: $${d.value.toLocaleString()}<br><em>${percent}% of Total</em>`);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY + 15 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("display", "none");
    })
    .on("click", function (event, d) {
      if (d.depth === 2) { // product line level
        const selected = d.data.name;
        const current = dataService.filters.productLine;
        const newFilter = current === selected ? null : selected;
        console.log("🌀 Sunburst clicked:", selected); // ✅ add this
        dataService.setFilter("productLine", newFilter);
        updateAllCharts();
      }
    })
    

  path.transition()
    .duration(1000)
    .attrTween("d", function (d) {
      const i = d3.interpolate(d.x0, d.x1);
      return function (t) {
        d.x1 = i(t);
        return arc(d);
      };
    });

  const productLines = Array.from(new Set(root.leaves().map((d) => d.data.name)));
  const legendContainer = d3.select("#sunburst-legend");
  legendContainer.html("");

  legendContainer.append("div").text("Product Lines").style("font-weight", "bold");
  productLines.forEach((product) => {
    const item = legendContainer.append("div").style("display", "flex").style("align-items", "center");
    item.append("div")
      .style("width", "12px")
      .style("height", "12px")
      .style("background-color", productColor(product))
      .style("margin-right", "6px");
    item.append("span").text(product);
  });

  legendContainer.append("div").text("Countries").style("font-weight", "bold").style("margin-top", "10px");
  grouped.forEach(({ name }) => {
    const item = legendContainer.append("div").style("display", "flex").style("align-items", "center");
    item.append("div")
      .style("width", "12px")
      .style("height", "12px")
      .style("background-color", countryColor(name))
      .style("margin-right", "6px");
    item.append("span").text(name);
  });
}
