const DATA_URL =
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

// ---- Layout ----
const MARGIN = { top: 70, right: 40, bottom: 130, left: 90 };
const WIDTH = 1200;
const HEIGHT = 560;
const innerW = WIDTH - MARGIN.left - MARGIN.right;
const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

d3.json(DATA_URL)
  .then(render)
  .catch((err) => {
    d3.select("#chart")
      .append("p")
      .style("color", "#f472b6")
      .text("Failed to load data: " + err.message);
  });

function render(data) {
  const base = data.baseTemperature;
  const dataset = data.monthlyVariance.map((d) => ({
    year: d.year,
    month: d.month - 1, // 0-indexed for positioning
    monthData: d.month, // 1-12 preserved for data-month attribute
    variance: d.variance,
    temp: base + d.variance,
  }));

  const years = dataset.map((d) => d.year);
  const minYear = d3.min(years);
  const maxYear = d3.max(years);

  // ---- Scales ----
  const xScale = d3
    .scaleBand()
    .domain(d3.range(minYear, maxYear + 1))
    .range([0, innerW]);

  const yScale = d3
    .scaleBand()
    .domain(d3.range(0, 12))
    .range([0, innerH]);

  const tempExtent = d3.extent(dataset, (d) => d.temp);

  // Color buckets — sequential warm/cool palette (>= 4 colors).
  const colors = [
    "#4575b4", "#74add1", "#abd9e9", "#e0f3f8",
    "#ffffbf",
    "#fee090", "#fdae61", "#f46d43", "#d73027",
  ];
  const step = (tempExtent[1] - tempExtent[0]) / colors.length;
  const thresholds = d3.range(1, colors.length).map((i) => tempExtent[0] + i * step);
  const colorScale = d3.scaleThreshold().domain(thresholds).range(colors);

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
    .attr("y", 32)
    .attr("text-anchor", "middle")
    .text("Monthly Global Land-Surface Temperature");

  // Description
  svg
    .append("text")
    .attr("id", "description")
    .attr("x", WIDTH / 2)
    .attr("y", 56)
    .attr("text-anchor", "middle")
    .text(
      `${minYear} - ${maxYear}: base temperature ${base}℃`
    );

  const plot = svg
    .append("g")
    .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

  // ---- Axes ----
  const xAxis = d3
    .axisBottom(xScale)
    .tickValues(xScale.domain().filter((y) => y % 10 === 0))
    .tickFormat(d3.format("d"));

  const yAxis = d3.axisLeft(yScale).tickFormat((m) => MONTHS[m]);

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
    .attr("y", -70)
    .attr("text-anchor", "middle")
    .text("Month");

  // X-axis label
  plot
    .append("text")
    .attr("class", "axis-label")
    .attr("x", innerW / 2)
    .attr("y", innerH + 44)
    .attr("text-anchor", "middle")
    .text("Year");

  // ---- Tooltip element ----
  const tooltip = d3.select("body").append("div").attr("id", "tooltip");

  // ---- Cells ----
  plot
    .selectAll(".cell")
    .data(dataset)
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("data-month", (d) => d.month)
    .attr("data-year", (d) => d.year)
    .attr("data-temp", (d) => d.temp)
    .attr("x", (d) => xScale(d.year))
    .attr("y", (d) => yScale(d.month))
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("fill", (d) => colorScale(d.temp))
    .on("mouseover", function (event, d) {
      tooltip
        .attr("data-year", d.year)
        .classed("show", true)
        .html(
          `<div class="tt-head">${d.year} — ${MONTHS[d.month]}</div>` +
            `<div>${d3.format(".1f")(d.temp)}℃</div>` +
            `<div class="tt-var">${d3.format("+.1f")(d.variance)}℃</div>`
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
  const legendW = 400;
  const legendH = 30;
  const legendX = d3
    .scaleLinear()
    .domain(tempExtent)
    .range([0, legendW]);

  const legend = svg
    .append("g")
    .attr("id", "legend")
    .attr(
      "transform",
      `translate(${MARGIN.left}, ${HEIGHT - MARGIN.bottom + 66})`
    );

  // One rect per color bucket.
  const legendBounds = [tempExtent[0], ...thresholds, tempExtent[1]];

  legend
    .selectAll("rect")
    .data(colors)
    .enter()
    .append("rect")
    .attr("x", (d, i) => legendX(legendBounds[i]))
    .attr("y", 0)
    .attr("width", (d, i) => legendX(legendBounds[i + 1]) - legendX(legendBounds[i]))
    .attr("height", legendH)
    .attr("fill", (d) => d)
    .attr("stroke", "rgba(9, 11, 26, 0.6)");

  const legendAxis = d3
    .axisBottom(legendX)
    .tickValues(thresholds)
    .tickFormat(d3.format(".1f"));

  legend
    .append("g")
    .attr("class", "legend-axis")
    .attr("transform", `translate(0, ${legendH})`)
    .call(legendAxis);
}
