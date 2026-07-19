const DATA_URL =
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json";

// ---- Layout ----
const WIDTH = 900;
const HEIGHT = 520;
const MARGIN = { top: 56, right: 24, bottom: 48, left: 72 };
const innerW = WIDTH - MARGIN.left - MARGIN.right;
const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

d3.json(DATA_URL)
  .then(render)
  .catch((err) => {
    d3.select("#chart")
      .append("p")
      .style("color", "#f472b6")
      .text("Failed to load data: " + err.message);
  });

function render(dataset) {
  // Each item: { Time: "36:50", Place, Seconds, Name, Year, Nationality, Doping, URL }
  dataset.forEach((d) => {
    // Convert MM:SS into a Date object for the y-value.
    const [m, s] = d.Time.split(":").map(Number);
    d.timeDate = new Date(1970, 0, 1, 0, m, s);
    d.year = d.Year;
  });

  // ---- Scales ----
  const xScale = d3
    .scaleLinear()
    .domain([d3.min(dataset, (d) => d.Year) - 1, d3.max(dataset, (d) => d.Year) + 1])
    .range([0, innerW]);

  const yScale = d3
    .scaleTime()
    .domain(d3.extent(dataset, (d) => d.timeDate))
    .range([0, innerH]); // fastest (smallest) time at top

  // ---- Root SVG ----
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Title
  svg
    .append("text")
    .attr("id", "title")
    .attr("x", WIDTH / 2)
    .attr("y", 22)
    .attr("text-anchor", "middle")
    .text("Doping in Professional Bicycle Racing");

  svg
    .append("text")
    .attr("class", "subtitle")
    .attr("x", WIDTH / 2)
    .attr("y", 44)
    .attr("text-anchor", "middle")
    .text("35 Fastest times up Alpe d'Huez");

  const plot = svg
    .append("g")
    .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

  // ---- Axes ----
  const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(yScale).tickFormat(d3.timeFormat("%M:%S"));

  plot
    .append("g")
    .attr("id", "x-axis")
    .attr("transform", `translate(0, ${innerH})`)
    .call(xAxis);

  plot.append("g").attr("id", "y-axis").call(yAxis);

  // Y-axis label
  plot
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -52)
    .attr("text-anchor", "middle")
    .text("Time in Minutes");

  // ---- Tooltip element ----
  const tooltip = d3.select("body").append("div").attr("id", "tooltip");

  // ---- Dots ----
  plot
    .selectAll(".dot")
    .data(dataset)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("r", 6)
    .attr("data-xvalue", (d) => d.Year)
    .attr("data-yvalue", (d) => d.timeDate.toISOString())
    .attr("cx", (d) => xScale(d.Year))
    .attr("cy", (d) => yScale(d.timeDate))
    .classed("doping", (d) => d.Doping !== "")
    .on("mouseover", function (event, d) {
      tooltip
        .attr("data-year", d.Year)
        .classed("show", true)
        .html(
          `<div class="tt-name">${d.Name} <span class="tt-nat">(${d.Nationality})</span></div>` +
            `<div>Year: ${d.Year} &nbsp;·&nbsp; Time: ${d.Time}</div>` +
            (d.Doping ? `<div class="tt-doping">${d.Doping}</div>` : "")
        );
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 16 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      tooltip.classed("show", false);
    });

  // ---- Legend ----
  const legend = svg
    .append("g")
    .attr("id", "legend")
    .attr("transform", `translate(${WIDTH - MARGIN.right - 260}, ${MARGIN.top + 30})`);

  const legendItems = [
    { label: "No doping allegations", cls: "clean" },
    { label: "Riders with doping allegations", cls: "doping" },
  ];

  const row = legend
    .selectAll(".legend-row")
    .data(legendItems)
    .enter()
    .append("g")
    .attr("class", "legend-row")
    .attr("transform", (d, i) => `translate(0, ${i * 24})`);

  row
    .append("rect")
    .attr("x", 234)
    .attr("width", 16)
    .attr("height", 16)
    .attr("rx", 4)
    .attr("class", (d) => `legend-swatch ${d.cls}`);

  row
    .append("text")
    .attr("x", 226)
    .attr("y", 8)
    .attr("dominant-baseline", "middle")
    .attr("text-anchor", "end")
    .attr("class", "legend-text")
    .text((d) => d.label);
}
