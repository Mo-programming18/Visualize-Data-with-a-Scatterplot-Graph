const DATA_URL =
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/GDP-data.json";

// ---- Layout ----
const WIDTH = 900;
const HEIGHT = 460;
const MARGIN = { top: 24, right: 24, bottom: 60, left: 72 };
const innerW = WIDTH - MARGIN.left - MARGIN.right;
const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

const usd = d3.format("$,.1f");

d3.json(DATA_URL)
  .then((json) => render(json.data))
  .catch((err) => {
    d3.select("#chart")
      .append("p")
      .style("color", "#f472b6")
      .text("Failed to load data: " + err.message);
  });

function render(dataset) {
  // dataset: [ ["1947-01-01", 243.1], ... ] quarterly GDP in $ billions
  const dates = dataset.map((d) => new Date(d[0]));

  // ---- Scales ----
  const xScale = d3
    .scaleTime()
    .domain([d3.min(dates), d3.max(dates)])
    .range([0, innerW]);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(dataset, (d) => d[1])])
    .range([innerH, 0]);

  const barWidth = innerW / dataset.length;

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
    .attr("y", 4)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "hanging")
    .text("United States GDP");

  // Bar gradient
  const grad = svg
    .append("defs")
    .append("linearGradient")
    .attr("id", "barGradient")
    .attr("x1", "0")
    .attr("y1", "0")
    .attr("x2", "0")
    .attr("y2", "1");
  grad.append("stop").attr("offset", "0%").attr("stop-color", "#22d3ee");
  grad.append("stop").attr("offset", "100%").attr("stop-color", "#6366f1");

  const plot = svg
    .append("g")
    .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

  // ---- Axes ----
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

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
    .attr("y", -56)
    .attr("text-anchor", "middle")
    .text("Gross Domestic Product ($ Billions)");

  // ---- Tooltip element ----
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip");

  // ---- Bars ----
  plot
    .selectAll(".bar")
    .data(dataset)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("data-date", (d) => d[0])
    .attr("data-gdp", (d) => d[1])
    .attr("x", (d) => xScale(new Date(d[0])))
    .attr("y", (d) => yScale(d[1]))
    .attr("width", barWidth)
    .attr("height", (d) => innerH - yScale(d[1]))
    .on("mouseover", function (event, d) {
      const [year, q] = quarterLabel(d[0]);
      tooltip
        .attr("data-date", d[0])
        .classed("show", true)
        .html(
          `<div>${year} <span style="color:#a6add6">${q}</span></div>` +
            `<div class="tt-gdp">${usd(d[1])} Billion</div>`
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
}

// "1947-07-01" -> ["1947", "Q3"]
function quarterLabel(dateStr) {
  const [year, month] = dateStr.split("-");
  const q = "Q" + (Math.floor((+month - 1) / 3) + 1);
  return [year, q];
}
