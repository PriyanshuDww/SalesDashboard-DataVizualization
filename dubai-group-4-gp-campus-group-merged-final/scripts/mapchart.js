import { dataService } from "./dataService.js";

export async function loadAndDrawMap() {
  const mapContainer = d3.select("#map");
  
  try {
    // Show loading state
    mapContainer.html('<div class="loading">Loading country bubble map...</div>');
    
    // Load TopoJSON and business data
    const [worldData, filteredData] = await Promise.all([
      d3.json("scripts/countries.topojson"),
      dataService.loadData().then(() => dataService.getFilteredData())
    ]);
    
    const geoJson = topojson.feature(worldData, worldData.objects.countries);
    const width = mapContainer.node().clientWidth || 800;
    const height = mapContainer.node().clientHeight || 600;

    // 1. First create SVG and zoom group
    const svg = mapContainer
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "#1b1f24");

    const zoomGroup = svg.append("g");

    // 2. Create projection
    const projection = d3.geoMercator()
      .fitSize([width, height], geoJson);

    // 3. Create country centroid lookup
    const countryCentroids = {};
    geoJson.features.forEach(country => {
      const centroid = d3.geoCentroid(country);
      countryCentroids[country.properties.name] = centroid;
    });

    // 4. Aggregate data by country
    const countryData = {};
    filteredData.forEach(d => {
      if (!d.country) return;
      if (!countryData[d.country]) {
        countryData[d.country] = {
          sales: 0,
          count: 0,
          products: new Set()
        };
      }
      countryData[d.country].sales += d.sales || 0;
      countryData[d.country].count++;
      if (d.productLine) countryData[d.country].products.add(d.productLine);
    });

    // 5. Prepare bubble data
    const bubbleData = Object.entries(countryData).map(([country, stats]) => {
      const centroid = countryCentroids[country];
      if (!centroid) {
        console.warn('No centroid found for:', country);
        return null;
      }
      const [x, y] = projection(centroid);
      return {
        country,
        x,
        y,
        sales: stats.sales,
        count: stats.count,
        products: Array.from(stats.products)
      };
    }).filter(Boolean);

    // 6. Set up zoom behavior with initial zoomed state
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
      });

    // Set initial zoomed-in state (adjust these values as needed)
    const initialTransform = d3.zoomIdentity
      .scale(2.4)  // 1.5 = 50% zoomed in
      .translate(width * -0.3, height * -0.1);  // Adjust panning

    // Apply zoom behavior and initial transform
    svg.call(zoom)
       .call(zoom.transform, initialTransform);

    // 7. Draw base map
    const path = d3.geoPath().projection(projection);
    zoomGroup.append("g")
      .selectAll("path")
      .data(geoJson.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#2d3748")
      .attr("stroke", "#4a5568")
      .attr("stroke-width", 0.5);

    // 8. Draw bubbles
    const maxSales = d3.max(bubbleData, d => d.sales) || 1;
    const radiusScale = d3.scaleSqrt()
      .domain([0, maxSales])
      .range([5, 40]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    zoomGroup.append("g")
      .selectAll("circle")
      .data(bubbleData)
      .enter()
      .append("circle")
      .attr("class", "country-bubble")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => radiusScale(d.sales))
      .attr("fill", d => colorScale(d.products.length))
      .attr("stroke", "white")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.8)
      .on("click", function (event, d) {
        const current = dataService.filters.country;
        const selected = d.country;
        const newFilter = current === selected ? null : selected; // toggle
        dataService.setFilter("country", newFilter);
        console.log("📍 Country filter set to:", newFilter);
        updateAllCharts();
      })
      .on("mouseover", function(event, d) {
        const transform = d3.zoomTransform(svg.node());
        const [mouseX, mouseY] = transform.invert([event.pageX, event.pageY]);
        
        d3.select(this).attr("stroke-width", 2);
        
        const tooltip = d3.select("body").append("div")
          .attr("class", "map-tooltip")
          .html(`
            <strong>${d.country}</strong><br>
            Sales: $${d3.format(",")(d.sales)}<br>
            Orders: ${d.count}<br>
            Products: ${d.products.join(", ")}
          `)
          .style("left", `${event.pageX + 15}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke-width", 0.5);
        d3.selectAll(".map-tooltip").remove();
      });

    // 9. Add legend and reset button
    const legend = svg.append("g")
    .attr("transform", `translate(${width - 500}, 30)`); // Moved left and down
  
  // First legend item
  legend.append("text")
    .text("● Bubble Size = Sales Volume") // Added bullet for clarity
    .attr("fill", "white")
    .style("font-size", "30px") // Reduced from 40px
    .attr("dy", "0.35em"); // Better vertical alignment
  
  // Second legend item
  legend.append("text")
    .text("● Color = Product Variety")
    .attr("fill", "white")
    .style("font-size", "30px") // Reduced from 40px
    .attr("y", 25) // Increased spacing
    .attr("dy", "0.35em");

    const resetButton = svg.append("g")
      .attr("transform", `translate(20, 20)`)
      .style("cursor", "pointer");

    resetButton.append("rect")
      .attr("width", 200)
      .attr("height", 100)
      .attr("fill", "#2d3748")
      .attr("rx", 3);

    resetButton.append("text")
      .text("Reset Zoom")
      .attr("x", 100)
      .attr("y", 55)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .style("font-size", "30px");

    resetButton.on("click", () => {
      svg.transition()
        .duration(750)
        .call(zoom.transform, initialTransform);  // Reset to initial zoomed state
    });

  } catch (error) {
    console.error("Country bubble map error:", error);
    mapContainer.html(`
      <div class="error">
        <h3>Error loading map</h3>
        <p>${error.message}</p>
        <button onclick="window.updateAllCharts()">Retry</button>
      </div>
    `);
  }
}