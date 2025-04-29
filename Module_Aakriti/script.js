let themeData;
let newsData;
let fakeClicked = false;

// Pie Chart-1 (right): Thematic Analysis Chart 
const svg1     = d3.select("#chart1 svg");
const g1       = svg1.append("g").attr("transform", "translate(200,200)");
const tooltip1 = d3.select("#tooltip1");

const color1 = d3.scaleOrdinal([
  "#22f3e3", "#ff6f61", "#6a5acd", "#ffa07a",
  "#20b2aa", "#9370db", "#ffb6c1", "#3cb371",
  "#00ced1", "#f08080"
]);
const pie1      = d3.pie().value(d => d.count).sort(null);
const arc1      = d3.arc().innerRadius(0).outerRadius(160);
const hoverArc1 = d3.arc().innerRadius(0).outerRadius(170);

d3.csv("domain_theme_cluster_counts_updated2_modified_updated (2).csv")
  .then(data => {
    themeData = data;
    drawThemePie("both");
  });

function drawThemePie(domain) {
  let domainData;
  if (domain === "both") {
    domainData = d3.rollups(
      themeData,
      v => d3.sum(v, d => +d.count),
      d => d.cluster
    )
    .map(([cluster, count]) => ({ cluster, count }))
    .filter(d => d.cluster.toLowerCase() !== "others");
  } else {
    domainData = themeData.filter(d => d.domain.toLowerCase() === domain);
  }

  const pieData = pie1(domainData);
  const paths   = g1.selectAll("path").data(pieData);

  paths.enter()
    .append("path")
    .merge(paths)
    .attr("d", arc1)
    .attr("fill", d => color1(d.data.cluster))
    .attr("stroke", "#fff")
    .attr("stroke-width", "2px")
    .on("mouseover", function(event, d) {
      d3.select(this).transition().duration(200).attr("d", hoverArc1);
      const total      = d3.sum(domainData, d => d.count);
      const perc       = ((d.data.count / total)*100).toFixed(2);
      const [x,y]      = d3.pointer(event, svg1.node());
      tooltip1.style("opacity",1)
        .html(`<strong>${d.data.cluster}</strong><br>${perc}%`)
        .style("left", (x+220)+"px")
        .style("top",  (y+20)+"px");
    })
    .on("mousemove", function(event) {
      const [x,y] = d3.pointer(event, svg1.node());
      tooltip1
        .style("left", (x+220)+"px")
        .style("top",  (y+20)+"px");
    })
    .on("mouseout", function() {
      d3.select(this).transition().duration(200).attr("d", arc1);
      tooltip1.style("opacity",0);
    });

  paths.exit().remove();
}

// Pie Chart-2 (left): Real vs Fake Chart 
const svg2      = d3.select("#chart2 svg");
const g2        = svg2.append("g").attr("transform", "translate(200,200)");
const color2    = d3.scaleOrdinal(["#f87171","#4ade80"]);
const pie2      = d3.pie().value(d => d.count).sort(null);
const arc2      = d3.arc().innerRadius(0).outerRadius(160);
const hoverArc2 = d3.arc().innerRadius(0).outerRadius(170);
const labelArc2 = d3.arc().innerRadius(80).outerRadius(130);

d3.csv("news_dataset_minimal.csv").then(data => {
  newsData = data.map(d => ({ ...d, count:+d.count }));
  drawNewsPie("both");
});

function drawNewsPie(domain) {
  const filtered = domain==="both"
    ? newsData
    : newsData.filter(d=>d.domain.toLowerCase()===domain);

  const counts = d3.rollups(filtered, v=>v.length, d=>d.label)
    .map(([lbl, cnt])=>({
      label: lbl==="0" ? "Real":"Fake",
      count: cnt
    }));

  const pieData = pie2(counts);
  const paths   = g2.selectAll("path").data(pieData);

  paths.enter()
    .append("path")
    .merge(paths)
    .attr("d", arc2)
    .attr("fill", d=>color2(d.data.label))
    .attr("stroke","#fff")
    .attr("stroke-width","2px")
    .on("mouseover", function(event,d){
      d3.select(this).transition().duration(200).attr("d",hoverArc2);
    })
    .on("mouseout", function(){
      d3.select(this).transition().duration(200).attr("d",arc2);
    })
    .on("click", function(event,d){
      if(d.data.label==="Fake") toggleThemeChart();
    });

  paths.exit().remove();

  const labels = g2.selectAll("text").data(pieData);
  labels.enter()
    .append("text")
    .merge(labels)
    .attr("transform", d=>`translate(${labelArc2.centroid(d)})`)
    .style("text-anchor","middle")
    .attr("fill","#fff")
    .text(d=>`${d.data.label}: ${((d.data.count/d3.sum(counts,c=>c.count))*100).toFixed(1)}%`)
    .style("font-size","14px")
    .style("font-weight","bold");
  labels.exit().remove();
}

// Toggle and resetting the charts
function toggleThemeChart(){
  fakeClicked = !fakeClicked;
  d3.select("#chart1").classed("hidden", !fakeClicked);
  d3.select("#dashboard")
    .style("gap", fakeClicked ? "80px" : "0");
}

d3.select("#domain-select").on("change", function(){
  // Resets to original view with only the Real vs Fake chart
  fakeClicked = false;
  d3.select("#chart1")
    .classed("hidden", true);
  d3.select("#dashboard")
    .style("gap","0");

  
  drawThemePie(this.value);
  drawNewsPie(this.value);
});


d3.select("label[for='domain-select']")
  .style("color", "#22f3e3")
  .style("font-family", "'Segoe UI', sans-serif")
  .style("font-size", "16px")
  .style("font-weight", "bold");
