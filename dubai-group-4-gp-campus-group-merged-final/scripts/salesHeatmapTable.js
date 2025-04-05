import { dataService } from "./dataService.js";

export async function loadAndDrawSalesHeatmapTable() {
  // ✅ Ensure data is loaded
  await dataService.loadData();
  const rawData = dataService.getFilteredData();

  // Group by product line and deal size
  const nested = Array.from(
    d3.rollup(
      rawData,
      (v) => d3.sum(v, (d) => d.sales),
      (d) => d.productLine,
      (d) => d.dealSize
    ),
    ([product, deals]) => {
      const row = { product };
      for (const [dealSize, total] of deals) {
        row[dealSize] = total;
      }
      return row;
    }
  );

  const dealSizes = ["Small", "Medium", "Large"];
  const allSales = nested.flatMap((row) =>
    dealSizes.map((size) => row[size] || 0)
  );

  const colorScale = d3
    .scaleLinear()
    .domain([0, d3.max(allSales)])
    .range(["#2E3A4B", "#D32F2F"]);

  // Clear previous content
  const container = d3.select("#sales-heatmap-table");
  container.html("");

  // Create the tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "heatmap-tooltip")
    .style("position", "absolute")
    .style("display", "none")
    .style("pointer-events", "none")
    .style("background", "#1e1e1e")
    .style("color", "white")
    .style("padding", "24px 32px")
    .style("border-radius", "12px")
    .style("font-size", "14px")
    .style("max-width", "350px")
    .style("line-height", "1.8")
    .style("box-shadow", "0 4px 10px rgba(0,0,0,0.5)")
    .style("z-index", "1000");

  // Create the table
  const table = container
    .append("table")
    .style("border-collapse", "collapse")
    .style("font-family", "sans-serif")
    .style("background-color", "#23252B")
    .style("color", "white");

  // Header
  const header = table.append("thead").append("tr");
  header
    .append("th")
    .text("Product Line")
    .style("border", "1px solid #444")
    .style("padding", "12px")
    .style("background-color", "#3b82f6")
    .style("color", "white")
    .style("font-size", "30px")
    .style("text-align", "center");

  dealSizes.forEach((size) => {
    header
      .append("th")
      .text(size)
      .style("border", "1px solid #444")
      .style("padding", "12px")
      .style("background-color", "#3b82f6")
      .style("color", "white")
      .style("font-size", "30px")
      .style("text-align", "center");
  });

  // Table Body
  const tbody = table.append("tbody");

  nested.forEach((row) => {
    const tr = tbody.append("tr");

    // Product Line Column
    tr.append("td")
      .text(row.product)
      .style("border", "1px solid #444")
      .style("padding", "12px")
      .style("background-color", "#2d2f36")
      .style("font-size", "30px")
      .style("color", "white");

    // Value Cells
    dealSizes.forEach((size) => {
      const value = row[size] || 0;
      tr.append("td")
        .text(`$${d3.format(",.0f")(value)}`)
        .style("border", "1px solid #444")
        .style("padding", "12px")
        .style("text-align", "right")
        .style("font-size", "30px")
        .style("background-color", colorScale(value))
        .style("color", "white")
        .on("mouseover", function (event) {
          d3.select(this)
            .style("outline", "2px solid #90cdf4")
            .style("cursor", "pointer");

          tooltip
            .style("display", "block")
            .html(`
              <strong>${row.product}</strong><br/>
              Deal Size: ${size}<br/>
              Sales: $${d3.format(",.0f")(value)}
            `);
        })
        .on("mousemove", function (event) {
          tooltip
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 30 + "px");
        })
        .on("mouseout", function () {
          d3.select(this).style("outline", "none");
          tooltip.style("display", "none");
        });
    });
  });
}
