// Chart 1: Theme Clusters
const svg1 = d3.select("#chart1 svg");
const g1 = svg1.append("g").attr("transform", "translate(200,200)");
const tooltip1 = d3.select("#tooltip1")
  .style("position", "absolute")
  .style("background", "#1e293b") // dark navy background
  .style("color", "#22f3e3")       // heading color
  .style("padding", "10px 15px")
  .style("border-radius", "8px")
  .style("box-shadow", "0px 2px 10px rgba(0, 0, 0, 0.5)")
  .style("pointer-events", "none")
  .style("opacity", 0)
  .style("font-family", "'Segoe UI', sans-serif") // heading font
  .style("font-size", "14px");

const color1 = d3.scaleOrdinal([
  "#22f3e3", "#ff6f61", "#6a5acd", "#ffa07a", 
  "#20b2aa", "#9370db", "#ffb6c1", "#3cb371", 
  "#00ced1", "#f08080"
]);

const pie1 = d3.pie().value(d => d.count).sort(null);
const arc1 = d3.arc().innerRadius(0).outerRadius(160);
const hoverArc1 = d3.arc().innerRadius(0).outerRadius(170);

let themeData;

d3.csv("domain_theme_cluster_counts_updated2_modified_updated (2).csv").then(function(data1) {
  themeData = data1;
  drawThemePie('both');
});

function drawThemePie(domain) {
  let domainData;
  if (domain === 'both') {
    domainData = d3.rollups(themeData, v => d3.sum(v, d => +d.count), d => d.cluster)
      .map(([cluster, count]) => ({ cluster, count }));
  } else {
    domainData = themeData.filter(d => d.domain.toLowerCase() === domain);
  }

  const pieData = pie1(domainData);

  const paths = g1.selectAll("path").data(pieData);

  paths.enter()
    .append("path")
    .merge(paths)
    .attr("d", arc1)
    .attr("fill", d => color1(d.data.cluster))
    .attr("stroke", "#fff")
    .attr("stroke-width", "2px")
    .on("mouseover", function(event, d) {
      d3.select(this).transition().duration(200).attr("d", hoverArc1);
      const total = d3.sum(domainData, d => d.count);
      const percentage = ((d.data.count / total) * 100).toFixed(2);

      const [x, y] = d3.pointer(event, svg1.node());
      tooltip1.style("opacity", 1)
        .html(`<strong>${d.data.cluster}</strong><br>${percentage}%`)
        .style("left", (x + 220) + "px")
        .style("top", (y + 20) + "px");
    })
    .on("mousemove", function(event) {
      const [x, y] = d3.pointer(event, svg1.node());
      tooltip1.style("left", (x + 220) + "px").style("top", (y + 20) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).transition().duration(200).attr("d", arc1);
      tooltip1.style("opacity", 0);
    });

  paths.exit().remove();
}

// Chart 2: Real vs Fake
const svg2 = d3.select("#chart2 svg");
const g2 = svg2.append("g").attr("transform", "translate(200,200)");

const color2 = d3.scaleOrdinal(["#4ade80", "#f87171"]);

const pie2 = d3.pie().value(d => d.count).sort(null);
const arc2 = d3.arc().innerRadius(0).outerRadius(160);
const hoverArc2 = d3.arc().innerRadius(0).outerRadius(170);
const labelArc2 = d3.arc().innerRadius(80).outerRadius(130);

let newsData;

d3.csv("news_dataset_minimal.csv").then(function(data2) {
  newsData = data2.map(d => ({ ...d, count: +d.count }));
  drawNewsPie('both');
});

function drawNewsPie(domain) {
  const filtered = domain === 'both' ? newsData : newsData.filter(d => d.domain.toLowerCase() === domain);

  const counts = d3.rollups(filtered, v => v.length, d => d.label)
    .map(([label, count]) => ({
      label: label === "0" ? "Real" : "Fake",
      count: count
    }));

  const pieData = pie2(counts);

  const paths = g2.selectAll("path").data(pieData);

  paths.enter()
    .append("path")
    .merge(paths)
    .attr("d", arc2)
    .attr("fill", d => color2(d.data.label))
    .attr("stroke", "#fff")
    .attr("stroke-width", "2px")
    .on("mouseover", function(event, d) {
      d3.select(this).transition().duration(200).attr("d", hoverArc2);
    })
    .on("mouseout", function() {
      d3.select(this).transition().duration(200).attr("d", arc2);
    });

  paths.exit().remove();

  const labels = g2.selectAll("text").data(pieData);

  labels.enter()
    .append("text")
    .merge(labels)
    .attr("transform", d => `translate(${labelArc2.centroid(d)})`)
    .style("text-anchor", "middle")
    .attr("fill", "#fff")
    .text(d => `${d.data.label}: ${(d.data.count / d3.sum(counts, d => d.count) * 100).toFixed(1)}%`)
    .style("font-size", "14px")
    .style("font-weight", "bold");

  labels.exit().remove();
}

// Update charts on domain selection change
d3.select("#domain-select").on("change", function() {
  drawThemePie(this.value);
  drawNewsPie(this.value);
});

// Update "Select Domain:" label style
d3.select("label[for='domain-select']")
  .style("color", "#22f3e3")             // heading color
  .style("font-family", "'Segoe UI', sans-serif") // heading font
  .style("font-size", "16px")             // optional: make it slightly bigger
  .style("font-weight", "bold");          // optional: bold for visibility












