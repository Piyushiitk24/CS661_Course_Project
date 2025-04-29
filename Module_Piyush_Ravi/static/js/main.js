// ==========================================================================
// main.js - Fake News Dashboard Visualization Logic
// ==========================================================================

// --- Constants ---
const API_BASE_URL = '/api';
const LOADING_PLACEHOLDER_HTML = '<div class="loading-placeholder">Loading Data...</div>';
const ERROR_MESSAGE_HTML = (msg) => `<p class="error-message">Error: ${msg}</p>`;
const BUBBLE_PADDING = 2; // Padding for word cloud collision calculation


// --- Global State Variables ---
let currentWordData = [];
let currentHeatmapData = [];
let currentDomainData = [];
let wordSimulation; // Keep for word cloud
let isDraggingWord = false;

let currentFilters = {
    wordSource: 'both',
    wordType: 'both',
    wordSentiment: 'all',
    wordMinFreq: 5,
    heatmapMonth: 'all',
    heatmapMinYear: null, // Will be set on init
    heatmapMaxYear: null, // Will be set on init
    domainType: 'all',
    domainMinArticles: 5,
    domainSort: 'count',
    selectedWord: null
};

// --- Tooltip D3 Selections ---
let wordCloudTooltip, heatmapTooltip, domainTooltip;

// --- DOM Element References ---
const wordSourceSelect = document.getElementById('word-source');
const wordTypeSelect = document.getElementById('word-type');
const wordSentimentSelect = document.getElementById('word-sentiment');
const wordMinFreqSlider = document.getElementById('word-min-freq');
const wordMinFreqValueSpan = document.getElementById('word-min-freq-value');
const selectedWordInfoDiv = document.getElementById('selected-word-info');
const heatmapMonthSelect = document.getElementById('heatmap-month');
const heatmapMinYearSelect = document.getElementById('heatmap-min-year');
const heatmapMaxYearSelect = document.getElementById('heatmap-max-year');
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
            } catch (e) {
                console.warn("Could not parse error response body:", e);
            }
            throw new Error(errorMsg);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        throw error;
    }
}

function createFisheye(radius = 100, distortion = 3) {
    let radius2 = radius * radius;

    function distort(x, y) {
        const dx = x;
        const dy = y;
        const distance2 = dx * dx + dy * dy;
        if (distance2 >= radius2 || distance2 === 0) {
            return { x: x, y: y, scale: 1 };
        }
        const distance = Math.sqrt(distance2);
        const distortedDistance = distance * (distortion + 1) / (distortion * (distance / radius) + 1);
        const scale = distortedDistance / distance;
        return { x: dx * scale, y: dy * scale, scale: scale };
    }

    distort.focus = function(focusPoint) {
        return function(x, y) {
            const dx = x - focusPoint[0];
            const dy = y - focusPoint[1];
            const result = distort(dx, dy);
            return {
                x: focusPoint[0] + result.x,
                y: focusPoint[1] + result.y,
                scale: result.scale
            };
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
        container.innerHTML = '<p class="loading-placeholder">No word cloud data.</p>';
        return;
    }

    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width > 50 ? containerRect.width : 800;
    const height = containerRect.height > 100 ? containerRect.height : 700;

    console.log("Word Cloud Dimensions:", width, height);

    const svg = d3.select(container).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .style("max-width", "100%")
        .attr("preserveAspectRatio", "xMidYMid meet");

    const g = svg.append("g");

    data = data.map(d => ({
        ...d,
        total_freq: +d.total_freq || 0,
        fake_freq: +d.fake_freq || 0,
        real_freq: +d.real_freq || 0,
        log2_ratio: +d.log2_ratio || 0
     }));
    const fakeColor = "var(--accent-red)";
    const realColor = "var(--accent-blue)";
    const neutralColor = "var(--text-secondary)";
    const extentFreq = d3.extent(data, d => d.total_freq);
    const fontSizeScale = d3.scaleSqrt()
        .domain([Math.max(1, extentFreq[0] || 1), Math.max(1, extentFreq[1] || 1)])
        .range([12, 45])
        .clamp(true);

    const nodes = data.map(d => {
        let nodeColor;
        if (currentFilters.wordType === 'fake') nodeColor = fakeColor;
        else if (currentFilters.wordType === 'real') nodeColor = realColor;
        else {
             const ratio = d.log2_ratio;
             if (ratio > 0.75) nodeColor = fakeColor;
             else if (ratio < -0.75) nodeColor = realColor;
             else nodeColor = neutralColor;
        }
        nodeColor = nodeColor || neutralColor;
        const originalFontSize = fontSizeScale(d.total_freq);
        return {
            ...d,
            radius: originalFontSize * 0.6 + BUBBLE_PADDING,
            color: nodeColor,
            originalFontSize: originalFontSize
        };
    });

    if (wordSimulation) wordSimulation.stop();
    wordSimulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-20))
        .force("collide", d3.forceCollide().radius(d => d.radius).strength(0.8))
        .force("center", d3.forceCenter(0, 0).strength(0.05))
        .force("x", d3.forceX(0).strength(0.004))
        .force("y", d3.forceY(0).strength(0.02))
        .on("tick", ticked);

    const fisheye = createFisheye()
        .radius(Math.min(width, height) / 2.5)
        .distortion(2.5);

    const node = g.selectAll("g.node")
        .data(nodes, d => d.text)
        .join("g")
            .attr("class", "node")
            .style("opacity", 0)
            .call(enter => enter.transition().duration(1000).ease(d3.easeCubicOut).style("opacity", 1))
            .classed("selected-word", d => d.text === currentFilters.selectedWord)
            .call(drag(wordSimulation));

    node.append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .style("font-size", d => `${d.originalFontSize}px`)
        .style("fill", d => d.color)
        .style("cursor", "pointer")
        .text(d => d.text)
        .on("mouseover", handleWordMouseOver)
        .on("mouseout", handleWordMouseOut)
        .on("click", handleWordClick);

    function ticked() {
        node.each(() => { /* Simulation updates d.x, d.y */ });
        if (!svg.classed('fisheye-active')) {
             node.attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
        }
    }

    function drag(simulation) {
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
            isDraggingWord = true;
            svg.classed('fisheye-active', false);
            node.attr("transform", n => `translate(${n.x || 0},${n.y || 0})`)
                .select("text").style("font-size", n => `${n.originalFontSize}px`);
        }
        function dragged(event, d) {
            d.fx = event.x; d.fy = event.y;
        }
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
            isDraggingWord = false;
            const svgNode = svg.node();
            if (!svgNode) return;
            const svgBounds = svgNode.getBoundingClientRect();
            if (event.sourceEvent && event.sourceEvent.clientX >= svgBounds.left && event.sourceEvent.clientX <= svgBounds.right &&
                event.sourceEvent.clientY >= svgBounds.top && event.sourceEvent.clientY <= svgBounds.bottom) {
                 handleFisheyeMouseMove(event.sourceEvent);
            }
        }
        return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }

    svg.on("mousemove", handleFisheyeMouseMove)
       .on("mouseleave", handleFisheyeMouseLeave);

    function handleFisheyeMouseMove(event) {
        if (isDraggingWord) return;
        const svgNode = svg.node();
        const gNode = g.node();
        if (!svgNode || !gNode) return;
        let screenPoint = svgNode.createSVGPoint();
        screenPoint.x = event.clientX;
        screenPoint.y = event.clientY;
        let inverseMatrix;
        try { inverseMatrix = gNode.getScreenCTM().inverse(); }
        catch(e) { console.error("Error inverting CTM:", e); return; }
        let transformedPoint = screenPoint.matrixTransform(inverseMatrix);
        const focusPoint = [transformedPoint.x, transformedPoint.y];

        const fisheyeFocus = fisheye.focus(focusPoint);
        svg.classed('fisheye-active', true);

        node.each(function(d) {
            const nodeX = typeof d.x === 'number' ? d.x : 0;
            const nodeY = typeof d.y === 'number' ? d.y : 0;
            const distorted = fisheyeFocus(nodeX, nodeY);
            const scale = distorted.scale;

            d3.select(this)
                .attr("transform", `translate(${distorted.x}, ${distorted.y})`);

            d3.select(this).select('text')
                .style("font-size", `${d.originalFontSize * scale}px`);
        });
    }

    function handleFisheyeMouseLeave() {
        if (isDraggingWord) return;
        svg.classed('fisheye-active', false);
        node.transition().duration(400).ease(d3.easeCubicOut)
            .attr("transform", d => `translate(${d.x || 0},${d.y || 0})`)
            .select("text")
                .style("font-size", d => `${d.originalFontSize}px`);
    }

    function handleWordMouseOver(event, d) {
        if (isDraggingWord) return;
        d3.select(this.parentNode).raise();
        if (wordCloudTooltip && wordCloudTooltip.node()) {
             wordCloudTooltip.style("opacity", 1)
                 .html(`<b>${d.text}</b><br>Total: ${d.total_freq}<br>Fake: ${d.fake_freq}<br>Real: ${d.real_freq}<br>Ratio: ${d.log2_ratio.toFixed(2)}`)
                 .style("left", (event.pageX + 15) + "px")
                 .style("top", (event.pageY - 15) + "px");
         }
         if (selectedWordInfoDiv) {
             // Update details panel on hover
             selectedWordInfoDiv.innerHTML = `
                 <strong>Word:</strong> ${d.text}<br>
                 <strong>Total Frequency:</strong> ${d.total_freq}<br>
                 <strong>Fake Frequency:</strong> ${d.fake_freq}<br>
                 <strong>Real Frequency:</strong> ${d.real_freq}<br>
                 <strong>Log2 Ratio:</strong> ${d.log2_ratio.toFixed(2)}
             `;
         }
    }
    function handleWordMouseOut() {
         if (wordCloudTooltip) wordCloudTooltip.style("opacity", 0);
         if (selectedWordInfoDiv) {
             if (currentFilters.selectedWord) {
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
             } else {
                  selectedWordInfoDiv.innerHTML = 'Selected Word: None';
             }
         }
    }

    svg.on("click", (event) => {
        if (event.target === svg.node()) {
             if (currentFilters.selectedWord) {
                 const prev = currentFilters.selectedWord;
                 currentFilters.selectedWord = null;
                 if (selectedWordInfoDiv) selectedWordInfoDiv.innerHTML = 'Selected Word: None';
                 console.log("Word selection cleared");
                 svg.selectAll("g.node").classed("selected-word", false);

                 if (prev !== currentFilters.selectedWord) {
                     refreshHeatmap();
                     refreshDomainChart();
                     updateFilterInfoDisplays();
                 }
             }
         }
    });

    wordSimulation.nodes(nodes).alpha(0.6).restart();
}

/** Heatmap Update Function */
function updateHeatmap(data, tooltip) {
    const container = document.getElementById('heatmap-chart'); container.innerHTML = '';
    if (!data || !data.length) { container.innerHTML = '<p class="loading-placeholder">No heatmap data available.</p>'; return; }
    data = data.map(d => ({ ...d, year: +d.year, month: +d.month, fake: +d.fake || 0, real: +d.real || 0 }));

    const width = container.clientWidth > 0 ? container.clientWidth : 600;
    const legendHeight = 40;
    const height = 400 + legendHeight;
    const margin = { top: 30, right: 30, bottom: 50 + legendHeight, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container).append("svg").attr("width", width).attr("height", height)
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Determine year range based on data or filters
    const minDataYear = d3.min(data, d => d.year);
    const maxDataYear = d3.max(data, d => d.year);
    const startYear = minDataYear !== undefined ? minDataYear : parseInt(currentFilters.heatmapMinYear);
    const endYear = maxDataYear !== undefined ? maxDataYear : parseInt(currentFilters.heatmapMaxYear);
    const years = d3.range(startYear, endYear + 1);

    const months = d3.range(1, 13);

    const counts = data.map(d => d.fake + d.real);
    const calculatedMaxCount = d3.max(counts);
    const minCount = 0;

    // Adjust maxCount for color scale domain to handle no data or all zero counts
    let scaleMaxCount;
    if (calculatedMaxCount === undefined || calculatedMaxCount === null || calculatedMaxCount <= minCount) {
        scaleMaxCount = 1; // Ensure domain is at least [0, 1]
    } else {
        scaleMaxCount = calculatedMaxCount;
    }

    const x = d3.scaleBand().domain(years).range([0, chartWidth]).padding(0.05);
    const y = d3.scaleBand().domain(months).range([chartHeight, 0]).padding(0.05);

    const numberOfSteps = 7;
    const colorInterpolator = d3.interpolateViridis;
    const colorRange = d3.range(numberOfSteps).map(i => colorInterpolator(i / (numberOfSteps - 1)));

    const color = d3.scaleQuantize()
        .domain([minCount, scaleMaxCount])
        .range(colorRange);

    const cells = svg.selectAll(".heatmap-cell")
        .data(data, d => `${d.year}-${d.month}`)
        .join(
            enter => enter.append("rect")
                .attr("class", "heatmap-cell")
                .attr("x", d => x(d.year))
                .attr("y", d => y(d.month))
                .attr("width", x.bandwidth())
                .attr("height", y.bandwidth())
                .attr("rx", 3)
                .attr("ry", 3)
                .style("opacity", 0)
                .call(enter => enter.transition().duration(750).ease(d3.easeCubicOut).style("opacity", 1).attr("fill", d => color(d.fake + d.real))),
            update => update
                .attr("rx", 3)
                .attr("ry", 3)
                .call(update => update.transition().duration(750).ease(d3.easeCubicOut)
                    .attr("x", d => x(d.year))
                    .attr("y", d => y(d.month))
                    .attr("width", x.bandwidth())
                    .attr("height", y.bandwidth())
                    .attr("fill", d => color(d.fake + d.real))),
            exit => exit.transition().duration(400).ease(d3.easeCubicIn).style("opacity", 0).remove()
        )
        .on("mouseover", (event, d) => {
            // Bring the hovered element to the front in the SVG DOM
            d3.select(event.currentTarget).raise();

            // Tooltip logic
            if (tooltip && tooltip.node()) {
                tooltip.style("opacity", 1)
                    .html(`<b>Year: ${d.year} / Month: ${new Date(2000, d.month - 1).toLocaleString('default', { month: 'long' })}</b><br>Fake: ${d.fake}<br>Real: ${d.real}<br>Total: ${d.fake + d.real}`)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 15) + "px");
            } else { console.error("Invalid tooltip passed to updateHeatmap!"); }
        })
        .on("mouseout", (event) => {
            // Tooltip logic
            if (tooltip) tooltip.style("opacity", 0);
        });

    // Axes (X and Y)
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
        .attr("transform", "rotate(-90)")
        .attr("x", -chartHeight / 2)
        .attr("y", -margin.left + 15)
        .text("Month");

    // Legend
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

    const domainTypes = [...new Set(data.map(d => d.type || 'other'))];
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
                .attr("fill", d => colorScale(d.type || 'other'))
                .attr("rx", 6) // Rounded corners
                .attr("ry", 6)
                .call(enter => enter.transition().duration(1000).ease(d3.easeBounceOut)
                    .delay((d, i) => i * 30)
                    .attr("y", d => y(d.count))
                    .attr("height", d => chartHeight - y(d.count))),
            update => update
                .attr("rx", 6) // Rounded corners
                .attr("ry", 6)
                .call(update => update.transition().duration(1000).ease(d3.easeCubicOut)
                    .delay((d, i) => i * 20)
                    .attr("x", d => x(d.domain))
                    .attr("y", d => y(d.count))
                    .attr("width", x.bandwidth())
                    .attr("height", d => chartHeight - y(d.count))
                    .attr("fill", d => colorScale(d.type || 'other'))
                ),
            exit => exit.transition().duration(400).ease(d3.easeCubicIn)
                .attr("y", chartHeight)
                .attr("height", 0)
                .remove()
        )
        .on("mouseover", (event, d) => {
            if (tooltip && tooltip.node()) {
                tooltip.style("opacity", 1)
                    .html(`<b>Domain: ${d.domain}</b><br>Count: ${d.count}<br>Type: ${d.type || 'N/A'}<br>URL: ${d.url || 'N/A'}`)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 15) + "px");
            } else {
                console.error("Invalid tooltip passed to updateDomainChart!");
            }
        })
        .on("mouseout", (event) => {
            if (tooltip) tooltip.style("opacity", 0);
        })
        .on("click", (event, d) => {
            console.log("Clicked domain:", d.domain, d.url);
            if (d.url && d.url !== 'N/A') {
                window.open(d.url.startsWith('http') ? d.url : 'http://' + d.url, '_blank');
            }
        });

    // Axes
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

    // Axis Labels
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
        .attr("x", -(chartHeight / 2))
        .attr("y", -margin.left + 15)
        .text("Article Count");
}


// ==========================================================================
// UI Update Functions / Event Handlers / Refresh Functions / Initialization
// ==========================================================================

function updateFilterInfoDisplays() {
    let heatmapInfo = 'Showing data for all words.';
    let domainInfo = 'Showing data for all words.';
    if (currentFilters.selectedWord) {
        const wordSpan = `<span class="badge bg-warning text-dark">${currentFilters.selectedWord}</span>`;
        const filterText = `Filtering for word: ${wordSpan} `;
        heatmapInfo = filterText;
        domainInfo = filterText;
    }
    if (heatmapFilterInfo) heatmapFilterInfo.innerHTML = heatmapInfo;
    if (domainFilterInfo) domainFilterInfo.innerHTML = domainInfo;
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

    if (heatmapMinYearSelect) {
        heatmapMinYearSelect.addEventListener('change', () => {
            currentFilters.heatmapMinYear = heatmapMinYearSelect.value;
            // Ensure min year doesn't exceed max year
            if (heatmapMaxYearSelect && parseInt(currentFilters.heatmapMinYear) > parseInt(currentFilters.heatmapMaxYear)) {
                currentFilters.heatmapMaxYear = currentFilters.heatmapMinYear;
                heatmapMaxYearSelect.value = currentFilters.heatmapMaxYear;
            }
            refreshHeatmap();
        });
    } else { console.warn("Heatmap Min Year Select not found"); }

    if (heatmapMaxYearSelect) {
        heatmapMaxYearSelect.addEventListener('change', () => {
            currentFilters.heatmapMaxYear = heatmapMaxYearSelect.value;
            // Ensure max year isn't below min year
            if (heatmapMinYearSelect && parseInt(currentFilters.heatmapMaxYear) < parseInt(currentFilters.heatmapMinYear)) {
                currentFilters.heatmapMinYear = currentFilters.heatmapMaxYear;
                heatmapMinYearSelect.value = currentFilters.heatmapMinYear;
            }
            refreshHeatmap();
        });
    } else { console.warn("Heatmap Max Year Select not found"); }

    if (heatmapResetButton) {
        heatmapResetButton.addEventListener('click', () => {
            if (heatmapMonthSelect) heatmapMonthSelect.value = 'all';
            currentFilters.heatmapMonth = 'all';
            // Reset Year Filters to full range
            if (heatmapMinYearSelect && heatmapMinYearSelect.options.length > 0) {
                 heatmapMinYearSelect.value = heatmapMinYearSelect.options[0].value;
                 currentFilters.heatmapMinYear = heatmapMinYearSelect.value;
             }
             if (heatmapMaxYearSelect && heatmapMaxYearSelect.options.length > 0) {
                 heatmapMaxYearSelect.value = heatmapMaxYearSelect.options[heatmapMaxYearSelect.options.length - 1].value;
                 currentFilters.heatmapMaxYear = heatmapMaxYearSelect.value;
             }
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

function handleWordClick(event, d) {
    event.stopPropagation(); // Prevent triggering SVG background click
    const previouslySelected = currentFilters.selectedWord;

    if (previouslySelected === d.text) {
        // Deselect if clicking the already selected word
        currentFilters.selectedWord = null;
        if (selectedWordInfoDiv) selectedWordInfoDiv.innerHTML = 'Selected Word: None';
        console.log("Word selection cleared");
    } else {
        // Select the new word
        currentFilters.selectedWord = d.text;
        if (selectedWordInfoDiv) {
            selectedWordInfoDiv.innerHTML = `<strong>Selected Word:</strong> ${d.text}<br><strong>Total Frequency:</strong> ${d.total_freq}<br><strong>Fake Frequency:</strong> ${d.fake_freq}<br><strong>Real Frequency:</strong> ${d.real_freq}<br><strong>Log2 Ratio:</strong> ${d.log2_ratio.toFixed(2)}`;
        }
        console.log("Selected word:", currentFilters.selectedWord, " Details:", d);
    }

    // Update visual selection state in the word cloud
    d3.select('#word-cloud-chart').selectAll("g.node")
        .classed("selected-word", node_d => node_d.text === currentFilters.selectedWord);

    // Refresh dependent charts if the selection changed
    if (previouslySelected !== currentFilters.selectedWord) {
        refreshHeatmap();
        refreshDomainChart();
        updateFilterInfoDisplays();
    }
}

async function refreshWordCloud() {
    const wcContainer = document.getElementById('word-cloud-chart');
    if (!wcContainer) { console.error("Word cloud container not found!"); return; }
    wcContainer.innerHTML = LOADING_PLACEHOLDER_HTML;
    try {
        const params = {
            source: currentFilters.wordSource,
            type: currentFilters.wordType,
            sentiment: currentFilters.wordSentiment,
            min_freq: currentFilters.wordMinFreq
        };
        console.log('Refreshing Word Cloud with params:', params);
        currentWordData = await fetchData('/word-data', params);
        console.log('Word data received, count:', currentWordData.length);
        updateWordCloud(currentWordData);
    } catch (error) {
        console.error("Failed to refresh Word Cloud:", error);
        const errorHtml = ERROR_MESSAGE_HTML(`loading word data: ${error.message}`);
        wcContainer.innerHTML = errorHtml;
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
            min_year: currentFilters.heatmapMinYear,
            max_year: currentFilters.heatmapMaxYear
        };
        console.log('Refreshing Heatmap with params:', params);
        currentHeatmapData = await fetchData('/heatmap-data', params);
        console.log('Heatmap data received, count:', currentHeatmapData.length);
        updateHeatmap(currentHeatmapData, heatmapTooltip);
    } catch (error) {
        console.error("Failed to refresh Heatmap:", error);
        container.innerHTML = ERROR_MESSAGE_HTML(`loading heatmap data: ${error.message}`);
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

        // Sort data based on selected criteria
        if (currentFilters.domainSort === 'alpha') {
            currentDomainData.sort((a, b) => d3.ascending(a.domain?.toLowerCase(), b.domain?.toLowerCase()));
        } else { // Default to sorting by count descending
            currentDomainData.sort((a, b) => d3.descending(+a.count || 0, +b.count || 0));
        }

        updateDomainChart(currentDomainData, domainTooltip);
    } catch (error) {
        console.error("Failed to refresh Domain Chart:", error);
        container.innerHTML = ERROR_MESSAGE_HTML(`loading domain data: ${error.message}`);
    }
}

async function refreshAllCharts() {
    console.log("Refreshing all charts based on primary filters...");
    const wcContainer = document.getElementById('word-cloud-chart');
    const hmContainer = document.getElementById('heatmap-chart');
    const dcContainer = document.getElementById('domain-chart');
    if (wcContainer) wcContainer.innerHTML = LOADING_PLACEHOLDER_HTML;
    if (hmContainer) hmContainer.innerHTML = LOADING_PLACEHOLDER_HTML;
    if (dcContainer) dcContainer.innerHTML = LOADING_PLACEHOLDER_HTML;

    updateFilterInfoDisplays();

    try {
        // Load word cloud first as others might depend on its selection state
        await refreshWordCloud();
        // Load heatmap and domain chart concurrently
        const results = await Promise.allSettled([
            refreshHeatmap(),
            refreshDomainChart()
        ]);
        console.log("Dependent chart refresh results:", results);
        results.forEach((result, i) => {
            if (result.status === 'rejected') {
                console.error(`Chart refresh failed (${i === 0 ? 'heatmap' : 'domain'}):`, result.reason);
                // Display error in the specific chart container
                const container = i === 0 ? hmContainer : dcContainer;
                if (container) {
                    container.innerHTML = ERROR_MESSAGE_HTML(`loading data: ${result.reason?.message || 'Unknown error'}`);
                }
            }
        });
    } catch (error) {
        // Catch error from refreshWordCloud if it happens
        console.error("Error during refreshWordCloud sequence:", error);
        if (wcContainer) {
            wcContainer.innerHTML = ERROR_MESSAGE_HTML(`loading word data: ${error.message}`);
        }
        // Show errors in dependent charts if word cloud fails
        if (hmContainer) hmContainer.innerHTML = ERROR_MESSAGE_HTML('Word data failed to load');
        if (dcContainer) dcContainer.innerHTML = ERROR_MESSAGE_HTML('Word data failed to load');
    }
    console.log("Finished refreshing charts attempt.");
}


// --- Keep DOMContentLoaded listener ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded - Initializing Dashboard");

    if (typeof d3 !== 'undefined') {
        // Function to create or select a tooltip div
        const createTooltip = (id) => {
            let tooltip = d3.select(`#${id}`);
            if (!tooltip.node()) {
                tooltip = d3.select("body").append("div")
                    .attr("id", id)
                    .attr("class", "tooltip");
                 console.log(`Created tooltip element: #${id}`);
            }
             tooltip.style("opacity", 0).style("position", "absolute").style("pointer-events", "none");
            return tooltip;
        };

        // Initialize tooltips
        wordCloudTooltip = createTooltip("word-cloud-tooltip");
        heatmapTooltip = createTooltip("heatmap-tooltip");
        domainTooltip = createTooltip("domain-tooltip");

        console.log("Tooltip elements ensured:", {
            word: wordCloudTooltip.node(),
            heatmap: heatmapTooltip.node(),
            domain: domainTooltip.node()
        });
    } else {
        console.error("D3 library not loaded!");
        document.body.innerHTML = '<h1 style="color:red; text-align:center; margin-top: 50px;">Critical Error: D3 library failed to load.</h1>';
        return; // Stop initialization if D3 is missing
    }

    // Initialize slider value displays
    if (wordMinFreqValueSpan && wordMinFreqSlider) wordMinFreqValueSpan.textContent = wordMinFreqSlider.value;
    if (domainMinArticlesValueSpan && domainMinArticlesSlider) domainMinArticlesValueSpan.textContent = domainMinArticlesSlider.value;

    // Initialize year filters from the select elements' initial values
    if (heatmapMinYearSelect) currentFilters.heatmapMinYear = heatmapMinYearSelect.value;
    if (heatmapMaxYearSelect) currentFilters.heatmapMaxYear = heatmapMaxYearSelect.value;

    addEventListeners(); // Attach event listeners to controls
    refreshAllCharts(); // Perform initial data load and render all charts

    console.log("Dashboard Initialization Complete.");
});