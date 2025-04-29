// ========================
// Data and Initializations
// ========================

// Load the JSON file once when the page loads (for tweet activity)
let celebrityYearlyData = null;
// Store a promise for data loading
const dataLoadingPromise = d3.json('/static/data/celebrity_tweet_counts_by_year.json').then(data => {
    console.log("Tweet activity data loaded."); // Log successful load
    celebrityYearlyData = data;
    return data; // Pass data along the promise chain
}).catch(error => {
    console.error("Error loading tweet activity data:", error); // Add error handling
    celebrityYearlyData = {}; // Set to empty object on error to prevent crashes
    return {}; // Return empty object
});


// Sample data for bar chart (Leaderboard) - REMAINS THE SAME
const customData = {
    "real-politifact": [
        { type: "Hillary Clinton", value: 8 },
        { type: "Barack Obama", value: 6 },
        { type: "Donald Trump", value: 5 },
        { type: "John McCain", value: 4 },
        { type: "Bernie Sanders", value: 3 },
    ],
    "fake-politifact": [
        { type: "Hillary Clinton", value: 17 },
        { type: "Donald Trump", value: 13 },
        { type: "Malia Obama", value: 5 },
        { type: "Barack Obama", value: 3 },
        { type: "Michelle Obama", value: 3 },
    ],
    "real-gossipcop": [
        { type: "Kim Kardashian", value: 215 },
        { type: "Taylor Swift", value: 206 },
        { type: "Selena Gomez", value: 109 },
        { type: "Kylie Jenner", value: 96 },
        { type: "Khloe Kardashian", value: 96 },
    ],
    "fake-gossipcop": [
        { type: "Jennifer Aniston", value: 186 },
        { type: "Selena Gomez", value: 148 },
        { type: "Angelina Jolie", value: 125 },
        { type: "Taylor Swift", value: 107 },
        { type: "Kim Kardashian", value: 85 },
    ],
    "both-gossipcop": [
        { type: "Selena Gomez", value: 278 },
        { type: "Jennifer Aniston", value: 212 },
        { type: "Brad Pitt", value: 199 },
        { type: "Kim Kardashian", value: 198 },
        { type: "Kylie Jenner", value: 195 },
    ],
    "both-politifact": [
        { type: "Hillary Clinton", value: 25 },
        { type: "Donald Trump", value: 17 },
        { type: "Barack Obama", value: 6 },
        { type: "Malia Obama", value: 5 },
        { type: "John McCain", value: 5 },
    ],
    "fake-both": [
        { type: "Jennifer Aniston", value: 187 },
        { type: "Selena Gomez", value: 148 },
        { type: "Angelina Jolie", value: 125 },
        { type: "Taylor Swift", value: 107 },
        { type: "Kim Kardashian", value: 85 },
    ],
    "real-both": [
        { type: "Kim Kardashian", value: 215 },
        { type: "Taylor Swift", value: 206 },
        { type: "Selena Gomez", value: 109 },
        { type: "Kylie Jenner", value: 96 },
        { type: "Khloe Kardashian", value: 96 },
    ],
    "both-both": [
        { type: "Selena Gomez", value: 237 },
        { type: "Jennifer Aniston", value: 176 },
        { type: "Kim Kardashian", value: 172 },
        { type: "Kylie Jenner", value: 145 },
        { type: "Brad Pitt", value: 128 },
    ],
};

// Global variables - REMAINS THE SAME
let leaderboardSvg, leaderboardX, leaderboardY, leaderboardTooltip;
let bubbleChartSvg, bubbleChartTooltip;
let pieChartSvg, pieChartTooltip;
let lineChartSvg, lineChartTooltip; // Keep tooltip global if reused

// ========================
// Bar Chart (Horizontal Leaderboard) - REMAINS LARGELY THE SAME
// ========================
function updateLeaderboardChart(filteredData, type) {
    console.log("Updating chart with type:", type); // Debugging

    // Update scales
    leaderboardX.domain([0, d3.max(filteredData, d => d.value) || 1]);
    leaderboardY.domain(filteredData.map(d => d.type));

    // Bind data to bars
    const bars = leaderboardSvg.selectAll(".bar")
        .data(filteredData, d => d.type);

    // Remove old bars
    bars.exit().remove();

    // Update existing bars
    bars.transition()
        .duration(500)
        .attr("x", 0)
        .attr("y", d => leaderboardY(d.type))
        .attr("width", d => leaderboardX(d.value))
        .attr("height", leaderboardY.bandwidth())
        .style("fill", d => {
            if (type === "both") {
              return "steelblue";
            } else if (type === "fake") {
              return "red";
            } else if (type === "real") {
              return "green";
            } else {
              return "steelblue";
            }
          })

    // Add new bars
    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => leaderboardY(d.type))
        .attr("width", 0)
        .attr("height", leaderboardY.bandwidth())
        .style("fill", d => {
            if (type === "both") {
              return "steelblue";
            } else if (type === "fake") {
              return "red";
            } else if (type === "real") {
              return "green";
            } else {
              return "steelblue"; // fallback
            }
          })
          
        .on("mouseover", (event, d) => {
            // FIX: Ensure tooltip variable exists and update without transition
            if (leaderboardTooltip) {
                 leaderboardTooltip
                    .style("opacity", 1) // Show instantly
                    .style("display", "block") // Ensure display is block
                    .html(`<strong>${d.type}</strong>: ${d.value}`);
            }
        })
        .on("mousemove", (event) => {
            // FIX: Ensure tooltip variable exists
            if (leaderboardTooltip) {
                leaderboardTooltip.style("top", `${event.pageY - 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            }
        })
        .on("mouseout", () => {
             // FIX: Ensure tooltip variable exists and hide instantly
             if (leaderboardTooltip) {
                leaderboardTooltip.style("opacity", 0).style("display", "none");
             }
        })
        .on("click", (event, d) => { // Make sure plotTweetActivity is called correctly here too
            // Update Bubble Chart Title and Render
            const bubbleTitle = document.getElementById("bubble-chart-title");
            if (bubbleTitle) {
                bubbleTitle.textContent = `${d.type} Bubble Chart`;
            }
            const jsonFileName = `/static/data/${d.type.toLowerCase().replace(/\s+/g, "_")}.json`; // Handle spaces
            renderBubbleChart(jsonFileName);

            // Update Line Chart Title
            const graphTitle = document.getElementById("graph-title");
             if (graphTitle) {
                graphTitle.textContent = `Tweet Activity for ${d.type}`;
            }
            // Ensure data is loaded before plotting from click
            dataLoadingPromise.then(() => {
                 plotTweetActivity(d.type); // Plot activity for the clicked celebrity
            });
        })
        .transition()
        .duration(500)
        .attr("width", d => leaderboardX(d.value));

    // Update X-axis
    leaderboardSvg.selectAll(".x-axis").remove();
    leaderboardSvg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${leaderboardY.range()[1]})`) // Use range extent for height
        .call(d3.axisBottom(leaderboardX).ticks(5).tickSizeOuter(0))
        .selectAll("text")
        .style("font-size", "12px");
        leaderboardSvg.selectAll(".x-axis-label").remove();

        // Add x-axis label
        leaderboardSvg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", leaderboardX.range()[1] / 2) // Centered under the axis
            .attr("y", leaderboardY.range()[1] + 40) // 40px below the axis line; adjust as needed
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .attr("fill", "#333")
            .text("Frequency");
    // Update Y-axis
    leaderboardSvg.selectAll(".y-axis").remove();
    leaderboardSvg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(leaderboardY))
        .selectAll("text")
        .style("font-size", "12px")
        .style("fill", "#333");
}

// filterLeaderboardData() - REMAINS THE SAME
function filterLeaderboardData() {
    const selectedType = document.getElementById("type")?.value?.toLowerCase() || 'both';
    const selectedSource = document.getElementById("source")?.value?.toLowerCase() || 'both';
    const key = `${selectedType}-${selectedSource}`;
    const filteredData = customData[key] || [];
    // Sort data descending by value for leaderboard
    filteredData.sort((a, b) => b.value - a.value);
    updateLeaderboardChart(filteredData, selectedType);
}


// ========================
// Celebrity Circles Grid - REMAINS LARGELY THE SAME
// ========================
const celebrities = [
    { name: "Hillary Clinton", image: "/static/data/hillary_clinton.jpg" },
    { name: "Barack Obama", image: "/static/data/barack_obama.jpg" },
    { name: "Donald Trump", image: "/static/data/donald_trump.jpg" },
    { name: "Kim Kardashian", image: "/static/data/kim_kar.jpg" },
    { name: "Taylor Swift", image: "/static/data/taylor.jpg" },
    { name: "Selena Gomez", image: "/static/data/selena.jpg" },
    { name: "Kylie Jenner", image: "/static/data/kylie.jpg" },
    { name: "Jennifer Aniston", image: "/static/data/jennifer.jpg" },
    { name: "Angelina Jolie", image: "/static/data/jolie.jpg" },
    { name: "Brad Pitt", image: "/static/data/brad.jpg" },
];

function drawCelebrityCircles() {
    const container = d3.select("#celebrity-circles");
    if (container.empty()) {
        console.error("#celebrity-circles container not found.");
        return;
    }
    container.selectAll("*").remove(); // Clear previous content (simpler than removing just svg)

    // Use flexbox/grid in CSS for layout instead of SVG positioning
    const celebDivs = container.selectAll("div.celeb-item")
        .data(celebrities)
        .enter()
        .append("div")
        .attr("class", "celeb-item") // Add a class for styling
        .style("text-align", "center")
        .style("margin-bottom", "15px"); // Add some spacing

    celebDivs.append("img")
        .attr("src", d => d.image)
        .attr("alt", d => d.name)
        .attr("class", "celeb-image") // Use class from CSS
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            // Update Bubble Chart Title and Render
            const bubbleTitle = document.getElementById("bubble-chart-title");
            if (bubbleTitle) {
                bubbleTitle.textContent = `${d.name} Bubble Chart`;
            }
            const jsonFileName = `/static/data/${d.name.toLowerCase().replace(/\s+/g, "_")}.json`;
            renderBubbleChart(jsonFileName);

            // Update Line Chart Title
            const graphTitle = document.getElementById("graph-title");
            if (graphTitle) {
                graphTitle.textContent = `Tweet Activity for ${d.name}`;
            }
             // Ensure data is loaded before plotting from click
            dataLoadingPromise.then(() => {
                 plotTweetActivity(d.name);
            });
        });

    celebDivs.append("div")
        .attr("class", "celeb-name") // Add class for styling
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("margin-top", "5px")
        .text(d => d.name);
}


// ========================
// Bubble Chart + Pie Chart
// ========================
let currentBubbleData = []; // Store current data for filtering
let bubbleSimulation; // Store simulation reference

// renderBubbleChart - REMAINS LARGELY THE SAME
function renderBubbleChart(jsonFileName) {
    console.log("Rendering bubble chart for:", jsonFileName);
    const container = d3.select("#bubbleChart");
    if (container.empty()) {
        console.error("#bubbleChart container not found.");
        return;
    }
    container.selectAll("*").remove(); // Clear previous chart

    // Use container dimensions respecting aspect-ratio from CSS
    const containerNode = container.node();
    const width = containerNode.clientWidth;
    // Height is determined by aspect-ratio, but we need a value for force layout center
    const height = containerNode.clientHeight || width * (9 / 16); // Fallback if height isn't set yet

    bubbleChartSvg = container.append("svg")
        .attr("width", "100%") // Use 100% width
        .attr("height", "100%") // Use 100% height
        .attr("viewBox", `0 0 ${width} ${height}`) // Set viewBox for scaling
        .attr("preserveAspectRatio", "xMidYMid meet");

    // Tooltip selection (assuming one global tooltip defined in DOMContentLoaded)
    bubbleChartTooltip = d3.select(".tooltip");

    d3.json(jsonFileName).then(data => {
        if (!data || data.length === 0) {
            console.warn("No data loaded for bubble chart:", jsonFileName);
            bubbleChartSvg.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .text("No data available.");
            return;
        }
        currentBubbleData = data; // Store loaded data

        const radiusScale = d3.scaleSqrt()
            .domain([0, d3.max(data, d => d.count) || 1])
            .range([5, Math.min(width, height) / 15]); // Adjust range based on size

        data.forEach(d => d.radius = radiusScale(d.count) * 1.3); // Add radius property

        // Initialize simulation if it doesn't exist
        if (!bubbleSimulation) {
            bubbleSimulation = d3.forceSimulation()
                .force("charge", d3.forceManyBody().strength(1)) // Slightly repel
                .force("center", d3.forceCenter(width / 2, height / 2))
                .force("collision", d3.forceCollide().radius(d => d.radius + 2).strength(0.8)); // Collision force

            bubbleSimulation.on("tick", () => {
                if (bubbleChartSvg) {
                    bubbleChartSvg.selectAll("circle.bubble")
                        .attr("cx", d => d.x = Math.max(d.radius, Math.min(width - d.radius, d.x))) // Keep within bounds
                        .attr("cy", d => d.y = Math.max(d.radius, Math.min(height - d.radius, d.y))); // Keep within bounds
                    bubbleChartSvg.selectAll("text.bubble-label")
                        .attr("x", d => d.x)
                        .attr("y", d => d.y);
                }
            });
        } else {
             // Update center force if dimensions changed (though viewBox handles scaling)
             bubbleSimulation.force("center", d3.forceCenter(width / 2, height / 2));
        }


        const maxCount = d3.max(data, d => d.count) || 100; // Fallback max
        const slider = d3.select("#countSlider");
        if (!slider.empty()) {
            slider.attr("max", maxCount)
                  .attr("value", 0); // Reset slider value
            d3.select("#sliderValue").text(`Minimum Count: 0`);

            // Ensure listener is attached only once or use .on("input", null).on("input", ...)
            slider.on("input", function () {
                const sliderValue = +this.value;
                d3.select("#sliderValue").text(`Minimum Count: ${sliderValue}`);
                const filteredData = currentBubbleData.filter(d => d.count >= sliderValue);
                updateBubbleChartVisuals(filteredData); // Update visuals only
            });
        } else {
            console.warn("#countSlider not found.");
        }


        updateBubbleChartVisuals(data); // Initial draw with all data

    }).catch(error => {
        console.error("Error loading bubble chart data:", jsonFileName, error);
        bubbleChartSvg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .text("Error loading data.");
    });
}

// updateBubbleChartVisuals - REMAINS LARGELY THE SAME
function updateBubbleChartVisuals(filteredData) {
    if (!bubbleChartSvg || !bubbleSimulation) return;

    // --- Circles ---
    const circles = bubbleChartSvg.selectAll("circle.bubble")
        .data(filteredData, d => d.noun); // Use noun as key

    circles.exit()
        .transition().duration(300)
        .attr("r", 0)
        .remove();

    circles.enter()
        .append("circle")
        .attr("class", "bubble")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("fill", () => `hsl(${Math.random() * 360}, 70%, 70%)`)
        .attr("r", 0) // Start radius at 0 for transition
        .on("click", (e, d) => generatePieChart(d))
        .on("mouseover", showBubbleTooltip)
        .on("mouseout", hideBubbleTooltip)
        .merge(circles) // Merge enter and update selections
        .transition().duration(500) // Transition radius change
        .attr("r", d => d.radius);

    // --- Labels ---
    const labels = bubbleChartSvg.selectAll("text.bubble-label")
        .data(filteredData, d => d.noun); // Use noun as key

    labels.exit()
         .transition().duration(300)
         .style("opacity", 0)
         .remove();

    labels.enter()
        .append("text")
        .attr("class", "bubble-label")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .style("font-size", "10px") // Start small
        .style("opacity", 0) // Start transparent
        .text(d => d.noun)
        .merge(labels) // Merge enter and update selections
        .transition().duration(500) // Transition font size and opacity
        .style("font-size", d => Math.max(8, d.radius * 0.4) + "px") // Adjust label size based on radius
        .style("opacity", d => d.radius > 10 ? 1 : 0); // Hide labels for very small bubbles


    // Update simulation nodes and restart
    bubbleSimulation.nodes(filteredData)
        .alpha(0.5) // Give it a bit more energy to rearrange
        .restart();
}


function showBubbleTooltip(event, d) {
    // FIX: Remove transition from .html() call
    if (bubbleChartTooltip) {
        bubbleChartTooltip
            .style("opacity", 1) // Show instantly
            .html(`<strong>${d.noun}</strong><br/>Count: ${d.count}`) // Set content
            .style("left", (event.pageX + 10) + "px") // Position
            .style("top", (event.pageY - 28) + "px");
    }
}

function hideBubbleTooltip() {
    // FIX: Hide instantly or transition only opacity
     if (bubbleChartTooltip) {
        // Option 1: Hide instantly
        bubbleChartTooltip.style("opacity", 0);
        // Option 2: Transition opacity only
        // bubbleChartTooltip.transition().duration(500).style("opacity", 0);
     }
}

function generatePieChart(bubbleData) {
    console.log("Generating Pie Chart for:", bubbleData.noun);

    const pieContainer = d3.select("#histogram");
    if (pieContainer.empty()) {
        console.error("#histogram container not found for pie chart.");
        return;
    }
    pieContainer.selectAll("*").remove(); // Clear previous pie chart

    // Use container dimensions respecting aspect-ratio from CSS
    const containerNode = pieContainer.node();
    const width = containerNode.clientWidth;
    const height = containerNode.clientHeight || width; // Default to square if height not set
    const outerRadius = Math.min(width, height) / 2 - 30; // Leave margin
    const innerRadius = outerRadius * 0.4; // Make it a donut chart

    pieChartSvg = pieContainer.append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`); // Center the pie chart group

    // Tooltip selection
    pieChartTooltip = d3.select(".tooltip");

    // Update the Pie Chart title dynamically
    const pieChartTitleEl = document.getElementById("pie-chart-title");
    if (pieChartTitleEl) {
        pieChartTitleEl.textContent = `News Type for "${bubbleData.noun}"`;
    }

    // Extract URLs and count types (fake/real)
    const urls = bubbleData.urls || [];
    const fakeUrls = urls.filter(url => url.type === "fake");
    const realUrls = urls.filter(url => url.type === "real");

    // Prepare data for the pie chart
    const pieData = [
        { type: "Fake", count: fakeUrls.length, urls: fakeUrls },
        { type: "Real", count: realUrls.length, urls: realUrls }
    ].filter(d => d.count > 0); // Only include types with counts > 0

    if (pieData.length === 0) {
        pieChartSvg.append("text")
            .attr("text-anchor", "middle")
            .text("No URL data available.");
        return;
    }

    const pie = d3.pie().value(d => d.count).sort(null); // Don't sort slices
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

    // Define color scale
    const color = d3.scaleOrdinal()
        .domain(["Fake", "Real"])
        .range(["#ff4d4d", "#4caf50"]); // Red for Fake, Green for Real

    // Draw arcs
    pieChartSvg.selectAll("path")
        .data(pie(pieData))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.type))
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .on("mouseover", (event, d) => {
            d3.select(event.target).transition().duration(200).attr("transform", "scale(1.05)");
            // FIX: Remove transition from .html() call
            if (pieChartTooltip) {
                pieChartTooltip
                    .style("opacity", 1) // Show instantly
                    .html(`<strong>${d.data.type}</strong><br>Count: ${d.data.count}<br>URLs:<br>${d.data.urls.map(url => {
                        // Ensure URL has protocol
                        let fullUrl = url.url;
                        if (!fullUrl.match(/^https?:\/\//)) {
                            fullUrl = `http://${fullUrl}`;
                        }
                        // Truncate long URLs for display
                        const displayUrl = fullUrl.length > 50 ? fullUrl.substring(0, 47) + '...' : fullUrl;
                        return `<a href="${fullUrl}" target="_blank" title="${fullUrl}">${displayUrl}</a>`;
                    }).join("<br>")}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                // Transition opacity separately
                pieChartTooltip.transition().duration(200).style("opacity", 1);
            }
        })
        .on("mousemove", (event) => {
             if (pieChartTooltip) {
                pieChartTooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
             }
        })
        .on("mouseout", (event) => {
            d3.select(event.target).transition().duration(200).attr("transform", "scale(1)"); // Shrink back
             if (pieChartTooltip) {
                pieChartTooltip.transition().duration(500).style("opacity", 0);
             }
        });

    // Add labels to the pie chart slices
    pieChartSvg.selectAll("text.pie-label")
        .data(pie(pieData))
        .enter()
        .append("text")
        .attr("class", "pie-label")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "white")
        .text(d => `${d.data.type}: ${d.data.count}`);
}


// ========================
// Tweet Activity Line Chart
// ========================
async function fetchTweetData(celebrityName) {
    // Uses the local JSON file loaded at the top
    if (!celebrityYearlyData) {
        console.warn('Tweet data not loaded yet.');
        // Optionally try loading it again here if needed, but better to ensure it loads first
        return null;
    }
    const yearly = celebrityYearlyData[celebrityName];
    if (!yearly) {
        console.warn(`No tweet data available for ${celebrityName}`);
        return null;
    }
    const real = [], fake = [], overall = [];
    Object.entries(yearly).forEach(([year, counts]) => {
        // Ensure year is treated as a full year date object for time scale
        const date = new Date(parseInt(year), 0, 1); // Jan 1st of the year
        real.push({ Date: date, Tweet_Count: counts.real || 0 });
        fake.push({ Date: date, Tweet_Count: counts.fake || 0 });
        overall.push({ Date: date, Tweet_Count: counts.overall || 0 });
    });
    // Sort data by date just in case
    real.sort((a, b) => a.Date - b.Date);
    fake.sort((a, b) => a.Date - b.Date);
    overall.sort((a, b) => a.Date - b.Date);

    return { real, fake, overall };
}

async function plotTweetActivity(celebrityName) {
    console.log("Plotting tweet activity for:", celebrityName);
    const data = await fetchTweetData(celebrityName);

    const graphContainer = d3.select('#graph');
    const legendContainer = d3.select('#legend');
    const graphSection = document.getElementById('graph-section'); // Get the section element

    if (graphContainer.empty() || legendContainer.empty() || !graphSection) {
        console.error("Line chart container (#graph), legend (#legend), or section (#graph-section) not found.");
        return;
    }

    graphContainer.selectAll('*').remove(); // Clear previous graph
    legendContainer.selectAll('*').remove(); // Clear previous legend

    if (!data) {
        console.warn(`No data to plot for ${celebrityName}`);
        graphContainer.append("p").attr("class", "loading-placeholder").text(`No tweet data available for ${celebrityName}.`);
        graphSection.style.display = 'block'; // Ensure section is visible to show message
        return;
    }

    graphSection.style.display = 'flex'; // Make section visible (using flex as per CSS)

    // Use container dimensions respecting aspect-ratio from CSS
    const containerNode = graphContainer.node();
    const availableWidth = containerNode.clientWidth;
    const availableHeight = containerNode.clientHeight || availableWidth * (9 / 16); // Use aspect ratio fallback

    const margin = { top: 20, right: 150, bottom: 50, left: 100 }; // Adjusted margins
    const width = availableWidth - margin.left - margin.right;
    const height = availableHeight - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) {
        console.error("Calculated drawing dimensions are invalid:", width, height);
        graphContainer.append("p").attr("class", "loading-placeholder").text("Cannot draw chart in available space.");
        return;
    }

    lineChartSvg = graphContainer
        .append('svg')
        .attr('width', "100%") // Use 100% width
        .attr('height', "100%") // Use 100% height
        .attr('viewBox', `0 0 ${availableWidth} ${availableHeight}`) // Set viewBox
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const allDates = [...data.real, ...data.fake, ...data.overall].map(d => d.Date);
    const allCounts = [...data.real, ...data.fake, ...data.overall].map(d => d.Tweet_Count);

    const x = d3.scaleTime()
        .domain(d3.extent(allDates))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(allCounts) || 1]) // Ensure domain starts at 0 and handles max=0
        .nice() // Make the top axis value nice
        .range([height, 0]);

    const line = d3.line()
        .x(d => x(d.Date))
        .y(d => y(d.Tweet_Count));

    const colors = {
        real: 'green',
        fake: 'red',
        overall: 'steelblue'
    };

    // Draw lines
    ['real', 'fake', 'overall'].forEach(key => {
        if (data[key] && data[key].length > 0) { // Only draw if data exists
            lineChartSvg.append('path')
                .datum(data[key])
                .attr('fill', 'none')
                .attr('stroke', colors[key])
                .attr('stroke-width', 2)
                .attr('class', `line line-${key}`) // Add class for potential styling/interaction
                .attr('d', line);
        }
    });

    // X Axis
    lineChartSvg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(d3.timeYear.every(1)).tickFormat(d3.timeFormat("%Y")).tickSizeOuter(0)); // Yearly ticks

    // Y Axis
    lineChartSvg.append('g')
        .call(d3.axisLeft(y));

    // Add X-axis label
    lineChartSvg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 10) // Position below the X-axis ticks
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#333')
        .attr("font-weight", "bold")
        .text('Year');

    // Add Y-axis label
    lineChartSvg.append('text')
        .attr('x', -height / 2)
        .attr('y', -margin.left + 15) // Position to the left of the Y-axis ticks
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#333')
        .attr('transform', 'rotate(-90)') // Rotate the text
        .attr("font-weight", "bold")
        .text('Number of Tweet Heads');

    // Add Legend
    const legendItems = legendContainer.selectAll("div.legend-item")
        .data(['real', 'fake', 'overall'])
        .enter()
        .append("div")
        .attr("class", "legend-item")
        .style("display", "inline-block")
        .style("margin-right", "15px")
        .style("cursor", "pointer") // Add cursor pointer for interaction
        .on("click", function(event, key) {
            // Toggle line visibility on legend click
            const linePath = lineChartSvg.select(`.line-${key}`);
            const currentOpacity = linePath.style("opacity") === "0.1" ? 1 : 0.1;
            linePath.transition().style("opacity", currentOpacity);
            d3.select(this).transition().style("opacity", currentOpacity === 1 ? 1 : 0.5); // Dim legend item
        });

    legendItems.append("span")
        .style("color", key => colors[key])
        .style("font-weight", "bold")
        .html("&#9679; "); // Circle symbol

    legendItems.append("span")
        .text(key => key.charAt(0).toUpperCase() + key.slice(1)); // Capitalize key name
}


// ========================
// DOM Ready Initialization
// ========================
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed.");

    // --- Initialize Leaderboard ---
    const leaderboardContainer = d3.select("#chart");
    if (!leaderboardContainer.empty()) {
        const lbMargin = { top: 20, right: 30, bottom: 50, left: 120 };
        // Use container width if possible, fallback to fixed
        const lbWidth = (leaderboardContainer.node().clientWidth || 700) - lbMargin.left - lbMargin.right;
        const lbHeight = 400 - lbMargin.top - lbMargin.bottom; // Keep height fixed for now

        // Clear potential placeholder SVG and append the main group
        leaderboardContainer.select("svg").remove(); // Remove if exists
        leaderboardSvg = leaderboardContainer
            .append("svg")
            .attr("width", "100%") // Use 100% width
            .attr("height", lbHeight + lbMargin.top + lbMargin.bottom) // Keep height fixed
            .attr("viewBox", `0 0 ${lbWidth + lbMargin.left + lbMargin.right} ${lbHeight + lbMargin.top + lbMargin.bottom}`) // Set viewBox
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform", `translate(${lbMargin.left},${lbMargin.top})`);

        leaderboardX = d3.scaleLinear().range([0, lbWidth]);
        leaderboardY = d3.scaleBand().range([0, lbHeight]).padding(0.2);

        // Initialize tooltip (append to body once)
        leaderboardTooltip = d3.select("body").append("div")
            .attr("class", "tooltip") // Use class for styling
            .style("position", "absolute")
            .style("opacity", 0) // Start hidden
            .style("pointer-events", "none"); // Prevent interference

        // Add event listeners for dropdowns
        const typeDropdown = document.getElementById("type");
        const sourceDropdown = document.getElementById("source");
        if (typeDropdown) typeDropdown.addEventListener("change", filterLeaderboardData);
        if (sourceDropdown) sourceDropdown.addEventListener("change", filterLeaderboardData);

        filterLeaderboardData(); // Initial render of the leaderboard
    } else {
        console.error("#chart container not found for leaderboard.");
    }

    // --- Draw Celebrity Circles ---
    drawCelebrityCircles();

    // --- Initial Bubble Chart ---
    // Render for a default celebrity (e.g., Taylor Swift)
    renderBubbleChart("/static/data/taylor_swift.json");
    // Pie chart is drawn on bubble click (inside renderBubbleChart)

    // --- Initial Line Graph ---
    // Plot for a default celebrity (e.g., Taylor Swift)
    const initialCeleb = "Taylor Swift";
    const graphTitle = document.getElementById("graph-title");
    if (graphTitle) {
        graphTitle.textContent = `Tweet Activity for ${initialCeleb}`;
    }
    plotTweetActivity(initialCeleb);


    // --- Optional: Resize Listener ---
    window.addEventListener('resize', () => {
        // Basic redraw on resize - consider debouncing for performance
        console.log("Window resized - redrawing charts.");
        // Redraw leaderboard (might need adjustment if width calculation changes)
        filterLeaderboardData();
        // Redraw celebrity circles (CSS handles flex/grid layout)
        // drawCelebrityCircles(); // Might not be needed if CSS handles it
        // Redraw bubble chart (viewBox handles scaling, but simulation might need update)
        // Find current celeb file (this is tricky without storing state)
        // renderBubbleChart(currentBubbleChartFile);
        // Redraw line chart (viewBox handles scaling)
        // Find current celeb name (this is tricky without storing state)
        // plotTweetActivity(currentCelebName);
    });
});
