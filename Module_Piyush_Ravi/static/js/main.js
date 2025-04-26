// ==========================================================================
// main.js - Fake News Dashboard Visualization Logic
// ==========================================================================

// --- Constants ---
const API_BASE_URL = '/api';
const LOADING_PLACEHOLDER_HTML = '<div class="loading-placeholder">Loading Data...</div>';

// --- Global State Variables ---
let currentWordData = [];
let currentHeatmapData = [];
let currentDomainData = [];
let wordSimulation;

let currentFilters = {
    wordSource: 'both',
    wordType: 'both',
    wordSentiment: 'all',
    wordMinFreq: 5,
    heatmapMonth: 'all',
    domainType: 'all',
    domainMinArticles: 5,
    domainSort: 'count',
    selectedWord: null
};

// --- Tooltip D3 Selections ---
let wordCloudTooltip, heatmapTooltip, domainTooltip, bubbleChartTooltip;

// --- DOM Element References ---
const wordSourceSelect = document.getElementById('word-source');
const wordTypeSelect = document.getElementById('word-type');
const wordSentimentSelect = document.getElementById('word-sentiment');
const wordMinFreqSlider = document.getElementById('word-min-freq');
const wordMinFreqValueSpan = document.getElementById('word-min-freq-value');
const selectedWordInfoDiv = document.getElementById('selected-word-info');
const heatmapMonthSelect = document.getElementById('heatmap-month');
const heatmapResetButton = document.getElementById('heatmap-reset-filters');
const heatmapFilterInfo = document.getElementById('heatmap-filter-info');
const domainTypeSelect = document.getElementById('domain-type');
const domainMinArticlesSlider = document.getElementById('domain-min-articles');
const domainMinArticlesValueSpan = document.getElementById('domain-min-articles-value');
const domainSortSelect = document.getElementById('domain-sort');
const domainFilterInfo = document.getElementById('domain-filter-info');

// ==========================================================================
// Utility Functions
// ==========================================================================
async function fetchData(endpoint, params = {}) {
    const url = new URL(`${API_BASE_URL}${endpoint}`, window.location.origin);
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
            url.searchParams.append(key, params[key]);
        }
    });
    console.log('Fetching:', url.toString());
    try {
        const response = await fetch(url);
        if (!response.ok) {
            let errorMsg = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg += ` - ${errorData.error || 'Unknown server error'}`;
            } catch (e) {}
            throw new Error(errorMsg);
        }
        const data = await response.json();
        console.log(`Data received for ${endpoint}:`, Array.isArray(data) ? data.slice(0, 5) : data);
        return data;
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Creates a circular fisheye distortion function.
 * @param {number} radius - The radius of the fisheye effect.
 * @param {number} distortion - The distortion factor (e.g., 2-5). Higher means more magnification.
 * @returns {function} A function that takes coordinates [x, y] and returns distorted coordinates {x, y, scale}.
 */
function createFisheye(radius, distortion) {
    let radius2 = radius * radius;
    
    function distort(x, y) {
        const dx = x; // relative to focus [0,0]
        const dy = y;
        const distance2 = dx * dx + dy * dy;
        
        // No distortion outside the fisheye radius
        if (distance2 >= radius2) {
            return { x: x, y: y, scale: 1 };
        }
        
        const distance = Math.sqrt(distance2);
        const distortedDistance = distance * (distortion + 1) / (distortion * (distance / radius) + 1);
        
        if (distortedDistance === 0 || distance === 0) {
            return { x: 0, y: 0, scale: distortion + 1 };
        }
        
        const scale = distortedDistance / distance;
        return { x: dx * scale, y: dy * scale, scale: scale };
    }
    
    // Returns a function that distorts coordinates relative to a provided focus point.
    distort.focus = function(focusPoint) {
        return function(x, y) {
            const dx = x - focusPoint[0];
            const dy = y - focusPoint[1];
            const result = distort(dx, dy);
            return { x: focusPoint[0] + result.x, y: focusPoint[1] + result.y, scale: result.scale };
        };
    };
    
    distort.radius = function(_) { 
        if (!arguments.length) return radius; 
        radius = +_;
        radius2 = radius * radius;
        return distort;
    };
    
    distort.distortion = function(_) { 
        if (!arguments.length) return distortion; 
        distortion = +_;
        return distort;
    };
    
    return distort;
}

// ==========================================================================
// Chart Update Functions
// ==========================================================================

/** Word Cloud Update Function */
function updateWordCloud(data) {
    const container = document.getElementById('word-cloud-chart');
    container.innerHTML = '';
    if (!data || !data.length) {
        container.innerHTML = '<p class="loading-placeholder">No data uplink available.</p>';
        return;
    }
    const width = container.clientWidth > 0 ? container.clientWidth : 800;
    const height = 520;

    const svg = d3.select(container).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .style("max-width", "100%")
        .attr("preserveAspectRatio", "xMidYMid meet");

    // Prepare data (ensure numeric types)
    data = data.map(d => ({
        ...d,
        total_freq: +d.total_freq || 0,
        fake_freq: +d.fake_freq || 0,
        real_freq: +d.real_freq || 0,
        log2_ratio: +d.log2_ratio || 0
    }));

    // --- COLOR LOGIC START ---
    let colorScale; // For 'both' type
    const fakeColor = "var(--accent-red)"; // Use theme color for fake
    const realColor = "var(--accent-blue)"; // Use theme color for real

    if (currentFilters.wordType === 'both') {
        const extentRatio = d3.extent(data, d => d.log2_ratio);
        // Ensure the extent has a range before creating the scale
        if (extentRatio[0] !== undefined && extentRatio[1] !== undefined && extentRatio[0] !== extentRatio[1]) {
            colorScale = d3.scaleSequential(d3.interpolateRdBu)
                           .domain(extentRatio); // Use RdBu for ratio visualization
        } else {
            // Fallback if all ratios are identical (unlikely for 'both', but safe)
            console.warn("Ratio extent is invalid or single value for 'both' filter. Using default grey.");
            // Assign a function that returns grey, mimicking a scale
            colorScale = () => "var(--text-secondary)";
        }
    }
    // --- COLOR LOGIC END ---

    // Size Scale (remains the same)
    const extentFreq = d3.extent(data, d => d.total_freq);
    const sizeScale = d3.scaleSqrt()
        .domain([Math.max(1, extentFreq[0] || 1), Math.max(1, extentFreq[1] || 1)])
        .range([12, 45]) // Adjust range if needed
        .clamp(true);

    // Map data to nodes, applying the conditional color
    const nodes = data.map(d => {
        let nodeColor;
        if (currentFilters.wordType === 'fake') {
            nodeColor = fakeColor;
        } else if (currentFilters.wordType === 'real') {
            nodeColor = realColor;
        } else { // 'both'
            nodeColor = colorScale ? colorScale(d.log2_ratio) : "var(--text-secondary)"; // Use scale if valid
        }
        return {
            ...d,
            radius: sizeScale(d.total_freq) / 1.5 + 5, // Adjust radius calculation if needed
            color: nodeColor // Assign the determined color
        };
    });

    // Simulation setup (remains the same)
    if (wordSimulation) {
        wordSimulation.stop();
    }
    wordSimulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-20)) // Adjust strength if needed
        .force("collide", d3.forceCollide().radius(d => d.radius).strength(0.8))
        .force("center", d3.forceCenter().strength(0.02))
        .force("x", d3.forceX().strength(0.01))
        .force("y", d3.forceY().strength(0.01))
        .on("tick", ticked);

    // Node rendering (main change is the fill source)
    const node = svg.selectAll("g.node")
        .data(nodes, d => d.text)
        .join(
            enter => enter.append("g")
                .attr("class", "node")
                .attr("transform", `translate(${Math.random() * 10 - 5}, ${Math.random() * 10 - 5})`) // Initial random position
                .style("opacity", 0)
                .call(enter => enter.transition().duration(1000).ease(d3.easeCubicOut).style("opacity", 1)),
            update => update,
            exit => exit.transition().duration(400).ease(d3.easeCubicIn).style("opacity", 0).remove()
        )
        .classed("selected-word", d => d.text === currentFilters.selectedWord)
        .call(drag(wordSimulation)); // Apply drag behavior

    // Append text to nodes
    node.selectAll("text").remove(); // Clear previous text first
    node.append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .style("font-size", d => `${sizeScale(d.total_freq)}px`)
        .style("fill", d => d.color) // *** Use the pre-calculated d.color ***
        .style("cursor", "pointer")
        .text(d => d.text)
        .on("mouseover", (event, d) => {
            // Tooltip logic (remains the same)
            if (wordCloudTooltip && wordCloudTooltip.node()) {
                wordCloudTooltip.style("opacity", 1)
                    .html(`<b>${d.text}</b><br>Total: ${d.total_freq}<br>Fake: ${d.fake_freq}<br>Real: ${d.real_freq}<br>Ratio: ${d.log2_ratio.toFixed(2)}`)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 15) + "px");
            } else {
                console.error("wordCloudTooltip is not defined or not a node!");
            }
        })
        .on("mouseout", () => {
            // Tooltip logic (remains the same)
            if (wordCloudTooltip) wordCloudTooltip.style("opacity", 0);
        })
        .on("click", handleWordClick); // Word selection logic (remains the same)

    // Ticked function (remains the same)
    function ticked() {
        node.attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    }

    // Drag functions (remain the same)
    function drag(simulation) {
        // ... dragstarted, dragged, dragended functions ...
        function dragstarted(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
        function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
        function dragended(event, d) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }
        return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }

    // SVG background click handler (remains the same)
    svg.on("click", (event) => {
        // ... logic to clear selection ...
         if (event.target === svg.node()) { if (currentFilters.selectedWord) { const prev = currentFilters.selectedWord; currentFilters.selectedWord = null; if (selectedWordInfoDiv) selectedWordInfoDiv.innerHTML = 'Selected Word: None'; console.log("Word selection cleared"); svg.selectAll("g.node").classed("selected-word", false); if (prev !== currentFilters.selectedWord) { refreshHeatmap(); refreshDomainChart(); } } }
    });

    // Restart simulation
    wordSimulation.nodes(nodes).alpha(0.6).restart();
}

/** Heatmap Update Function */
function updateHeatmap(data, tooltip) {
    const container = document.getElementById('heatmap-chart'); container.innerHTML = '';
    if (!data || !data.length) { container.innerHTML = '<p class="loading-placeholder">No heatmap data available.</p>'; return; }
    data = data.map(d => ({ ...d, year: +d.year, month: +d.month, fake: +d.fake || 0, real: +d.real || 0 }));
    const width = container.clientWidth > 0 ? container.clientWidth : 600;
    const legendHeight = 40; const height = 400 + legendHeight;
    const margin = { top: 30, right: 30, bottom: 50 + legendHeight, left: 60 };
    const chartWidth = width - margin.left - margin.right; const chartHeight = height - margin.top - margin.bottom;
    const svg = d3.select(container).append("svg").attr("width", width).attr("height", height).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const years = [...new Set(data.map(d => d.year))].sort(d3.ascending); const months = d3.range(1, 13);
    const counts = data.map(d => d.fake + d.real); // Get all counts
    const maxCount = d3.max(counts) || 1;
    const minCount = 0; // Assume minimum is 0

    const x = d3.scaleBand().domain(years).range([0, chartWidth]).padding(0.05);
    const y = d3.scaleBand().domain(months).range([chartHeight, 0]).padding(0.05);

    const numberOfSteps = 7; // Number of distinct color steps (adjust as needed)
    const colorInterpolator = d3.interpolateViridis; // Keep Viridis or change (e.g., interpolatePlasma)

    const colorRange = d3.range(numberOfSteps).map(i => colorInterpolator(i / (numberOfSteps - 1)));

    const color = d3.scaleQuantize()
        .domain([minCount, maxCount]) // Input domain (min to max count)
        .range(colorRange);          // Output range (discrete colors)

    const cells = svg.selectAll(".heatmap-cell")
        .data(data, d => `${d.year}-${d.month}`)
        .join(
            enter => enter.append("rect")
                .attr("class", "heatmap-cell")
                .attr("x", d => x(d.year))
                .attr("y", d => y(d.month))
                .attr("width", x.bandwidth())
                .attr("height", y.bandwidth())
                .style("opacity", 0)
                .call(enter => enter.transition().duration(750).ease(d3.easeCubicOut).style("opacity", 1).attr("fill", d => color(d.fake + d.real))),
            update => update.call(update => update.transition().duration(750).ease(d3.easeCubicOut)
                .attr("x", d => x(d.year))
                .attr("y", d => y(d.month))
                .attr("width", x.bandwidth())
                .attr("height", y.bandwidth())
                .attr("fill", d => color(d.fake + d.real))),
            exit => exit.transition().duration(400).ease(d3.easeCubicIn).style("opacity", 0).remove()
        )
        .on("mouseover", (event, d) => {
            console.log("Heatmap mouseover fired for:", d);
            if (tooltip && tooltip.node()) {
                tooltip.style("opacity", 1)
                    .html(`<b>Year: ${d.year} / Month: ${new Date(2000, d.month - 1).toLocaleString('default', { month: 'long' })}</b><br>Fake: ${d.fake}<br>Real: ${d.real}<br>Total: ${d.fake + d.real}`)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 15) + "px");
                d3.select(event.currentTarget).raise().style("stroke", "var(--accent-yellow)").style("stroke-width", 1.5);
            } else { console.error("Invalid tooltip passed to updateHeatmap!"); }
        })
        .on("mouseout", (event) => {
            if (tooltip) tooltip.style("opacity", 0);
            d3.select(event.currentTarget).style("stroke", null).style("stroke-width", null);
        });

    svg.selectAll(".x-axis").remove(); svg.selectAll(".y-axis").remove();
    svg.append("g").attr("class", "x-axis axis")
        .attr("transform", `translate(0, ${chartHeight})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")).tickSizeOuter(0))
        .selectAll("text")
        .style("text-anchor", "middle");
    svg.append("g").attr("class", "y-axis axis")
        .call(d3.axisLeft(y)
            .tickFormat(d => new Date(2000, d - 1).toLocaleString('default', { month: 'short' }))
            .tickSizeOuter(0));
    svg.append("text").attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("x", chartWidth / 2)
        .attr("y", chartHeight + margin.bottom - legendHeight - 10)
        .text("Year");
    svg.append("text").attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -chartHeight / 2)
        .attr("y", -margin.left + 15)
        .text("Month");

    const legendWidth = Math.min(chartWidth * 0.8, 300);
    const legendBarHeight = 8;
    const legendX = (chartWidth - legendWidth) / 2;
    const legendY = chartHeight + margin.bottom - legendHeight + 5;

    const legendGroup = svg.append("g")
        .attr("class", "heatmap-legend")
        .attr("transform", `translate(${legendX}, ${legendY})`);

    const swatchWidth = legendWidth / numberOfSteps;

    legendGroup.selectAll("rect")
        .data(colorRange)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * swatchWidth)
        .attr("y", 0)
        .attr("width", swatchWidth)
        .attr("height", legendBarHeight)
        .attr("fill", d => d);

    const legendScale = d3.scaleLinear()
        .domain(color.domain())
        .range([0, legendWidth]);

    const thresholds = [color.domain()[0], ...color.thresholds(), color.domain()[1]];

    const legendAxis = d3.axisBottom(legendScale)
        .tickValues(thresholds)
        .tickFormat(d3.format(".0f"))
        .tickSize(legendBarHeight + 4);

    legendGroup.append("g")
        .attr("transform", `translate(0, 0)`)
        .call(legendAxis)
        .select(".domain").remove();

    legendGroup.append("text")
        .attr("class", "legend-title")
        .attr("text-anchor", "middle")
        .attr("x", legendWidth / 2)
        .attr("y", -6)
        .text("Article Count per Month");
}

/** Domain Chart Update Function */
function updateDomainChart(data, tooltip) {
    const container = document.getElementById('domain-chart');
    container.innerHTML = '';
    if (!data || !data.length) {
        container.innerHTML = '<p class="loading-placeholder">No domain data available.</p>';
        return;
    }
    data = data.map(d => ({ ...d, count: +d.count || 0 }));
    const width = container.clientWidth > 0 ? container.clientWidth : 600;
    const height = 450;
    const margin = { top: 20, right: 20, bottom: 150, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3.scaleBand().domain(data.map(d => d.domain)).range([0, chartWidth]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count) || 1]).range([chartHeight, 0]).nice();
    const domainTypes = [...new Set(data.map(d => d.domain_type || 'other'))];

    const colorScale = d3.scaleOrdinal(d3.schemeSet2)
                          .domain(domainTypes);

    const bars = svg.selectAll(".bar")
        .data(data, d => d.domain)
        .join(
             enter => enter.append("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.domain))
                .attr("y", chartHeight)
                .attr("width", x.bandwidth())
                .attr("height", 0)
                .attr("fill", d => colorScale(d.domain_type || 'other'))
                .call(enter => enter.transition().duration(1000).ease(d3.easeBounceOut)
                    .delay((d, i) => i * 30)
                    .attr("y", d => y(d.count))
                    .attr("height", d => chartHeight - y(d.count))),
            update => update.call(update => update.transition().duration(1000).ease(d3.easeCubicOut)
                .delay((d, i) => i * 20)
                .attr("x", d => x(d.domain))
                .attr("y", d => y(d.count))
                .attr("width", x.bandwidth())
                .attr("height", d => chartHeight - y(d.count))
                .attr("fill", d => colorScale(d.domain_type || 'other'))),
            exit => exit.transition().duration(400).ease(d3.easeCubicIn)
                .attr("y", chartHeight)
                .attr("height", 0)
                .remove()
        )
        .on("mouseover", (event, d) => {
            console.log("Domain mouseover fired for:", d);
            if (tooltip && tooltip.node()) {
                tooltip.style("opacity", 1)
                    .html(`<b>Domain: ${d.domain}</b><br>Count: ${d.count}<br>Type: ${d.domain_type || 'N/A'}<br>URL: ${d.url || 'N/A'}`)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 15) + "px");
                d3.select(event.currentTarget).raise().style("filter", "brightness(1.3)");
            } else {
                console.error("Invalid tooltip passed to updateDomainChart!");
            }
        })
        .on("mouseout", (event) => {
            if (tooltip) tooltip.style("opacity", 0);
            d3.select(event.currentTarget).style("filter", null);
        })
        .on("click", (event, d) => {
            console.log("Clicked domain:", d.domain, d.url);
            if (d.url && d.url !== 'N/A') {
                window.open(d.url.startsWith('http') ? d.url : 'http://' + d.url, '_blank');
            }
        });

    svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", `translate(0, ${chartHeight})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .selectAll("text")
        .attr("transform", "translate(-10,5)rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .attr("class", "y-axis axis")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0s")).tickSizeOuter(0));

    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("x", chartWidth / 2)
        .attr("y", chartHeight + margin.bottom - 15)
        .text("Domain");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -chartHeight / 2)
        .attr("y", -margin.left + 15)
        .text("Article Count");
}

/** Bubble Chart Update Function */
function updateBubbleChart(data, tooltip) {
    const container = document.getElementById('bubble-chart-chart');
    container.innerHTML = '';
    if (!data || !data.length) {
        container.innerHTML = '<p class="loading-placeholder">No bubble data available.</p>';
        return;
    }
    const width = container.clientWidth > 0 ? container.clientWidth : 800;
    const height = 500;
    const margin = 10;

    const root = d3.hierarchy({ children: data })
        .sum(d => Math.max(1, +d.total_freq || 1))
        .sort((a, b) => b.value - a.value);
    const packLayout = d3.pack()
        .size([width - margin * 2, height - margin * 2])
        .padding(3);
    const packedRoot = packLayout(root);

    packedRoot.descendants().forEach(d => {
        d.originalX = d.x;
        d.originalY = d.y;
        d.originalR = d.r;
    });

    const svg = d3.select(container).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("max-width", "100%")
        .attr("preserveAspectRatio", "xMidYMid meet");

    const wordTexts = data.map(d => d.text);
    const colorScale = d3.scaleOrdinal(d3.schemeSet3)
                          .domain(wordTexts);

    const fisheyeRadius = Math.min(width, height) / 3;
    const fisheyeDistortion = 3;
    const fisheye = createFisheye(fisheyeRadius, fisheyeDistortion);

    const nodeGroups = svg.selectAll("g.node-bubble")
        .data(packedRoot.descendants().slice(1))
        .join("g")
            .attr("class", "node-bubble")
            .attr("transform", d => `translate(${d.originalX + margin},${d.originalY + margin})`)
            .style("opacity", 0)
            .call(enter => enter.transition().duration(1000)
                .ease(d3.easeCubicOut)
                .delay((d, i) => i * 5)
                .style("opacity", 1));

    const circles = nodeGroups.append("circle")
        .attr("class", "bubble")
        .attr("r", d => d.originalR)
        .attr("fill", d => colorScale(d.data.text))
        .attr("fill-opacity", 0.85)
        .on("mouseover", (event, d) => {
            if (tooltip && tooltip.node()) {
                tooltip.style("opacity", 1)
                    .html(`<b>${d.data.text}</b><br>Freq: ${d.data.total_freq}<br>Ratio: ${d.data.log2_ratio.toFixed(2)}`)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 15) + "px");
            } else {
                console.error("Invalid tooltip passed to updateBubbleChart!");
            }
            if (selectedWordInfoDiv) {
                 console.log("Attempting to update details panel for bubble:", d.data.text);
                 selectedWordInfoDiv.innerHTML = `
                    <strong>Word (Hover):</strong> ${d.data.text}<br>
                    <strong>Total Frequency:</strong> ${d.data.total_freq}<br>
                    <strong>Fake Frequency:</strong> ${d.data.fake_freq}<br>
                    <strong>Real Frequency:</strong> ${d.data.real_freq}<br>
                    <strong>Log2 Ratio:</strong> ${d.data.log2_ratio.toFixed(2)}
                `;
            } else { console.warn("selectedWordInfoDiv not found, cannot update details."); }
            d3.select(event.currentTarget).raise().style("filter", "brightness(1.3)");
        })
        .on("mouseout", (event) => {
            if (tooltip) tooltip.style("opacity", 0);
            if (selectedWordInfoDiv && !currentFilters.selectedWord) {
                selectedWordInfoDiv.innerHTML = 'Selected Word: None';
            } else if (selectedWordInfoDiv && currentFilters.selectedWord) {
                const selectedData = currentWordData.find(w => w.text === currentFilters.selectedWord);
                if (selectedData) {
                    selectedWordInfoDiv.innerHTML = `
                        <strong>Selected Word:</strong> ${selectedData.text}<br>
                        <strong>Total Frequency:</strong> ${selectedData.total_freq}<br>
                        <strong>Fake Frequency:</strong> ${selectedData.fake_freq}<br>
                        <strong>Real Frequency:</strong> ${selectedData.real_freq}<br>
                        <strong>Log2 Ratio:</strong> ${selectedData.log2_ratio.toFixed(2)}
                    `;
                } else {
                    selectedWordInfoDiv.innerHTML = 'Selected Word: None';
                }
            }
            d3.select(event.currentTarget).style("filter", null);
        });

    const texts = nodeGroups.append("text")
        .attr("class", "bubble-text")
        .filter(d => d.originalR > 5)
        .attr("clip-path", d => `circle(${d.originalR * 0.9})`)
        .style("font-size", d => `${Math.max(6, Math.min(14, d.originalR / 2.5))}px`)
        .selectAll("tspan")
        .data(d => d.data.text.split(/(?=[A-Z][a-z])|\s+/g).slice(0, 2))
        .join("tspan")
        .attr("x", 0)
        .attr("y", (d, i, lines) => `${i - lines.length / 2 + 0.8}em`)
        .text(d => d);

    svg.on("mousemove", function(event) {
        const [mouseX, mouseY] = d3.pointer(event);
        const fisheyeFocus = fisheye.focus([mouseX - margin, mouseY - margin]);

        nodeGroups.each(function(d) {
            const distorted = fisheyeFocus(d.originalX, d.originalY);
            d.distortedX = distorted.x;
            d.distortedY = distorted.y;
            d.scale = distorted.scale;
        })
        .attr("transform", d => `translate(${d.distortedX + margin},${d.distortedY + margin})`);

        circles.attr("r", d => d.originalR * d.scale);

        texts.attr("clip-path", d => `circle(${(d.originalR * d.scale) * 0.9})`)
             .style("font-size", d => `${Math.max(6, Math.min(14, (d.originalR * d.scale) / 2.5))}px`);

    }).on("mouseleave", function() {
        nodeGroups.transition().duration(500).ease(d3.easeCubicOut)
            .attr("transform", d => `translate(${d.originalX + margin},${d.originalY + margin})`);
        circles.transition().duration(500).ease(d3.easeCubicOut)
            .attr("r", d => d.originalR);
        texts.transition().duration(500).ease(d3.easeCubicOut)
             .attr("clip-path", d => `circle(${d.originalR * 0.9})`)
             .style("font-size", d => `${Math.max(6, Math.min(14, d.originalR / 2.5))}px`);
    });
}

// ==========================================================================
// UI Update Functions
// ==========================================================================
function updateFilterInfoDisplays() {
    let heatmapInfo = 'Showing data for all words.';
    let domainInfo = 'Showing data for all words.';
    if (currentFilters.selectedWord) {
        const wordSpan = `<span class="badge bg-warning text-dark">${currentFilters.selectedWord}</span>`;
        const filterText = `Filtering for word: ${wordSpan}`;
        heatmapInfo = filterText;
        domainInfo = filterText;
    }
    if (heatmapFilterInfo) heatmapFilterInfo.innerHTML = heatmapInfo;
    if (domainFilterInfo) domainFilterInfo.innerHTML = domainInfo;
}

// ==========================================================================
// Event Handlers
// ==========================================================================
function handleWordClick(event, d) {
    event.stopPropagation();
    const previouslySelected = currentFilters.selectedWord;
    if (previouslySelected === d.text) {
        currentFilters.selectedWord = null;
        if (selectedWordInfoDiv) selectedWordInfoDiv.innerHTML = 'Selected Word: None';
        console.log("Word selection cleared");
    } else {
        currentFilters.selectedWord = d.text;
        if (selectedWordInfoDiv) {
            selectedWordInfoDiv.innerHTML = `<strong>Selected Word:</strong> ${d.text}<br><strong>Total Frequency:</strong> ${d.total_freq}<br><strong>Fake Frequency:</strong> ${d.fake_freq}<br><strong>Real Frequency:</strong> ${d.real_freq}<br><strong>Log2 Ratio:</strong> ${d.log2_ratio.toFixed(2)}`;
        }
        console.log("Selected word:", currentFilters.selectedWord, " Details:", d);
    }
    d3.select('#word-cloud-chart').selectAll("g.node")
        .classed("selected-word", node_d => node_d.text === currentFilters.selectedWord);
    if (previouslySelected !== currentFilters.selectedWord) {
        refreshHeatmap();
        refreshDomainChart();
    }
}

function addEventListeners() {
    console.log("Adding event listeners...");
    if (wordSourceSelect)
        wordSourceSelect.addEventListener('change', () => { currentFilters.wordSource = wordSourceSelect.value; refreshAllCharts(); });
    else { console.warn("wordSourceSelect not found"); }

    if (wordTypeSelect)
        wordTypeSelect.addEventListener('change', () => { currentFilters.wordType = wordTypeSelect.value; refreshAllCharts(); });
    else { console.warn("wordTypeSelect not found"); }

    if (wordSentimentSelect)
        wordSentimentSelect.addEventListener('change', () => { currentFilters.wordSentiment = wordSentimentSelect.value; refreshAllCharts(); });
    else { console.warn("wordSentimentSelect not found"); }

    if (wordMinFreqSlider) {
        wordMinFreqSlider.addEventListener('input', () => {
            if (wordMinFreqValueSpan)
                wordMinFreqValueSpan.textContent = wordMinFreqSlider.value;
        });
        wordMinFreqSlider.addEventListener('change', () => { currentFilters.wordMinFreq = wordMinFreqSlider.value; refreshWordCloud(); });
    } else { console.warn("Word Min Freq Slider not found"); }

    if (heatmapMonthSelect)
        heatmapMonthSelect.addEventListener('change', () => { currentFilters.heatmapMonth = heatmapMonthSelect.value; refreshHeatmap(); });
    else { console.warn("Heatmap Month Select not found"); }

    // Heatmap reset now resets only the month filter.
    if (heatmapResetButton) {
        heatmapResetButton.addEventListener('click', () => {
            if (heatmapMonthSelect) heatmapMonthSelect.value = 'all';
            currentFilters.heatmapMonth = 'all';
            refreshHeatmap();
        });
    } else { console.warn("Heatmap Reset Button not found"); }

    if (domainTypeSelect)
        domainTypeSelect.addEventListener('change', () => { currentFilters.domainType = domainTypeSelect.value; refreshDomainChart(); });
    else { console.warn("Domain Type Select not found"); }

    if (domainMinArticlesSlider) {
        domainMinArticlesSlider.addEventListener('input', () => {
            if (domainMinArticlesValueSpan)
                domainMinArticlesValueSpan.textContent = domainMinArticlesSlider.value;
        });
        domainMinArticlesSlider.addEventListener('change', () => { currentFilters.domainMinArticles = domainMinArticlesSlider.value; refreshDomainChart(); });
    } else { console.warn("Domain Min Articles Slider not found"); }

    if (domainSortSelect)
        domainSortSelect.addEventListener('change', () => { currentFilters.domainSort = domainSortSelect.value; refreshDomainChart(); });
    else { console.warn("Domain Sort Select not found"); }

    console.log("Event listeners added.");
}

// ==========================================================================
// Chart Refresh Functions (Fetch Data & Call Update)
// ==========================================================================
async function refreshWordCloud() { // Refreshes Word Cloud AND Bubble Chart
    const wcContainer = document.getElementById('word-cloud-chart');
    if (!wcContainer) { console.error("Word cloud container not found!"); return; }
    const bcContainer = document.getElementById('bubble-chart-chart');
    if (!bcContainer) { console.error("Bubble chart container not found!"); return; }
    wcContainer.innerHTML = LOADING_PLACEHOLDER_HTML;
    bcContainer.innerHTML = LOADING_PLACEHOLDER_HTML;
    try {
        const params = {
            source: currentFilters.wordSource,
            type: currentFilters.wordType,
            sentiment: currentFilters.wordSentiment,
            min_freq: currentFilters.wordMinFreq
        };
        console.log('Refreshing Word Cloud & Bubble Chart with params:', params);
        currentWordData = await fetchData('/word-data', params);
        console.log('Word data received, count:', currentWordData.length);
        updateWordCloud(currentWordData);
        updateBubbleChart(currentWordData, bubbleChartTooltip);
    } catch (error) {
        console.error("Failed to refresh Word Cloud/Bubble Chart:", error);
        const errorHtml = `<p class="error-message">Error loading word data: ${error.message}</p>`;
        wcContainer.innerHTML = errorHtml;
        bcContainer.innerHTML = errorHtml;
    }
}

async function refreshHeatmap() {
    const container = document.getElementById('heatmap-chart');
    if (!container) { console.error("Heatmap container not found!"); return; }
    container.innerHTML = LOADING_PLACEHOLDER_HTML;
    updateFilterInfoDisplays();
    try {
        const params = {
            source: currentFilters.wordSource,
            type: currentFilters.wordType,
            selected_word: currentFilters.selectedWord,
            month: currentFilters.heatmapMonth,
        };
        console.log('Refreshing Heatmap with params:', params);
        currentHeatmapData = await fetchData('/heatmap-data', params);
        console.log('Heatmap data received, count:', currentHeatmapData.length);
        updateHeatmap(currentHeatmapData, heatmapTooltip);
    } catch (error) {
        console.error("Failed to refresh Heatmap:", error);
        container.innerHTML = `<p class="error-message">Error loading heatmap data: ${error.message}</p>`;
    }
}

async function refreshDomainChart() {
    const container = document.getElementById('domain-chart');
    if (!container) { console.error("Domain chart container not found!"); return; }
    container.innerHTML = LOADING_PLACEHOLDER_HTML;
    updateFilterInfoDisplays();
    try {
        const params = {
            source: currentFilters.wordSource,
            type: currentFilters.wordType,
            selected_word: currentFilters.selectedWord,
            domain_type: currentFilters.domainType,
            min_articles: currentFilters.domainMinArticles
        };
        console.log('Refreshing Domain Chart with params:', params);
        currentDomainData = await fetchData('/domain-data', params);
        console.log('Domain data received, count:', currentDomainData.length);
        if (currentFilters.domainSort === 'alpha') {
            currentDomainData.sort((a, b) => d3.ascending(a.domain?.toLowerCase(), b.domain?.toLowerCase()));
        } else {
            currentDomainData.sort((a, b) => d3.descending(+a.count || 0, +b.count || 0));
        }
        updateDomainChart(currentDomainData, domainTooltip);
    } catch (error) {
        console.error("Failed to refresh Domain Chart:", error);
        container.innerHTML = `<p class="error-message">Error loading domain data: ${error.message}</p>`;
    }
}

async function refreshAllCharts() {
    console.log("Refreshing all charts...");
    const wcContainer = document.getElementById('word-cloud-chart');
    const bcContainer = document.getElementById('bubble-chart-chart');
    const hmContainer = document.getElementById('heatmap-chart');
    const dcContainer = document.getElementById('domain-chart');
    if (wcContainer) wcContainer.innerHTML = LOADING_PLACEHOLDER_HTML;
    if (bcContainer) bcContainer.innerHTML = LOADING_PLACEHOLDER_HTML;
    if (hmContainer) hmContainer.innerHTML = LOADING_PLACEHOLDER_HTML;
    if (dcContainer) dcContainer.innerHTML = LOADING_PLACEHOLDER_HTML;
    updateFilterInfoDisplays();
    try {
        await refreshWordCloud(); // Refreshes Word Cloud and Bubble Chart
        const results = await Promise.allSettled([refreshHeatmap(), refreshDomainChart()]);
        console.log("Dependent chart refresh results:", results);
        results.forEach((result, i) => {
            if (result.status === 'rejected') {
                console.error(`Chart refresh failed (${i === 0 ? 'heatmap' : 'domain'}):`, result.reason);
            }
        });
    } catch (error) {
        console.error("Error during refreshAllCharts sequence:", error);
        const errorHtml = `<p class="error-message">Error refreshing charts: ${error.message}</p>`;
        if (wcContainer?.querySelector('.loading-placeholder')) wcContainer.innerHTML = errorHtml;
        if (bcContainer?.querySelector('.loading-placeholder')) bcContainer.innerHTML = errorHtml;
        if (hmContainer?.querySelector('.loading-placeholder')) hmContainer.innerHTML = errorHtml;
        if (dcContainer?.querySelector('.loading-placeholder')) dcContainer.innerHTML = errorHtml;
    }
    console.log("Finished refreshing charts attempt.");
}

// ==========================================================================
// Initialization on DOM Load
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded - Initializing Dashboard");

    if (typeof d3 !== 'undefined') {
        const createTooltip = (id) => {
            let tooltip = d3.select(`#${id}`);
            if (!tooltip.node()) {
                tooltip = d3.select("body").append("div")
                    .attr("id", id)
                    .attr("class", "tooltip");
                console.log(`Created tooltip element: #${id}`);
            }
            return tooltip;
        };

        wordCloudTooltip = createTooltip("word-cloud-tooltip");
        heatmapTooltip = createTooltip("heatmap-tooltip");
        domainTooltip = createTooltip("domain-tooltip");
        bubbleChartTooltip = createTooltip("bubble-chart-tooltip");

        console.log("Tooltip elements ensured:", {
            word: wordCloudTooltip.node(),
            heatmap: heatmapTooltip.node(),
            domain: domainTooltip.node(),
            bubble: bubbleChartTooltip.node()
        });
    } else {
        console.error("D3 library not loaded!");
        document.body.innerHTML = '<h1 style="color:red; text-align:center; margin-top: 50px;">Critical Error: D3 library failed to load.</h1>';
        return;
    }

    if (wordMinFreqValueSpan && wordMinFreqSlider) wordMinFreqValueSpan.textContent = wordMinFreqSlider.value;
    if (domainMinArticlesValueSpan && domainMinArticlesSlider) domainMinArticlesValueSpan.textContent = domainMinArticlesSlider.value;

    addEventListeners();
    refreshAllCharts();

    console.log("Dashboard Initialization Complete.");
});