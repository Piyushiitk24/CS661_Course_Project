// ========================
// Data and Initializations
// ========================

// Load the JSON file once when the page loads (for tweet activity)
let celebrityYearlyData = null;
d3.json('/static/data/celebrity_tweet_counts_by_year.json').then(data => {
    celebrityYearlyData = data;
});

// Sample data for bar chart
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

// ========================
// Bar Chart (Horizontal)
// ========================

const margin = { top: 20, right: 30, bottom: 50, left: 120 };
const width = 700 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#chart svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleBand().range([0, height]).padding(0.2);

// Tooltip for interactivity
const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("box-shadow", "0 2px 4px rgba(0, 0, 0, 0.1)")
    .style("display", "none")
    .style("pointer-events", "none");

function updateChart(filteredData, type) {
    // Update scales
    x.domain([0, d3.max(filteredData, d => d.value)]);
    y.domain(filteredData.map(d => d.type));

    // Bind data to bars
    const bars = svg.selectAll(".bar")
        .data(filteredData, d => d.type);

    // Remove old bars
    bars.exit()
        .transition()
        .duration(500)
        .attr("width", 0)
        .remove();

    // Update existing bars
    bars.transition()
        .duration(500)
        .attr("x", 0)
        .attr("y", d => y(d.type))
        .attr("width", d => x(d.value))
        .attr("height", y.bandwidth())
        .attr("fill", type === "fake" ? "red" : type === "real" ? "green" : "steelblue");

    // Add new bars
    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d.type))
        .attr("width", 0)
        .attr("height", y.bandwidth())
        .attr("fill", type === "fake" ? "red" : type === "real" ? "green" : "steelblue")
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .html(`<strong>${d.type}</strong>: ${d.value}`);
        })
        .on("mousemove", (event) => {
            tooltip.style("top", `${event.pageY - 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
        })
        .on("click", (event, d) => {
            const jsonFileName = `/static/data/${d.type.toLowerCase().replace(" ", "_")}.json`;
            document.getElementById("bubble-chart-title").textContent = `${d.type} Bubble Chart`;
            renderBubbleChart(jsonFileName);
        })
        .transition()
        .duration(500)
        .attr("width", d => x(d.value));

    // Update X-axis
    svg.selectAll(".x-axis").remove();
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5))
        .selectAll("text")
        .style("font-size", "12px");

    // Update Y-axis
    svg.selectAll(".y-axis").remove();
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "12px")
        .style("fill", "#333");
}

function filterData() {
    const selectedType = document.getElementById("type").value.toLowerCase();
    const selectedSource = document.getElementById("source").value.toLowerCase();
    const key = `${selectedType}-${selectedSource}`;
    const filteredData = customData[key] || [];
    updateChart(filteredData, selectedType);
}

document.getElementById("type").addEventListener("change", filterData);
document.getElementById("source").addEventListener("change", filterData);
filterData(); // Initial render

// ========================
// Celebrity Circles Grid
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
    container.select("svg").remove(); // Clear previous

    const rows = celebrities.length;
    const cellWidth = 180;
    const cellHeight = 180;

    const svg = container.append("svg")
        .attr("width", cellWidth)
        .attr("height", rows * cellHeight);

    const cells = svg.selectAll("g")
        .data(celebrities)
        .enter()
        .append("g")
        .attr("transform", (d, i) => {
            const x = cellWidth / 2;
            const y = i * cellHeight + cellHeight / 2;
            return `translate(${x}, ${y})`;
        });

    cells.append("circle")
        .attr("r", 45)
        .attr("fill", "#ddd")
        .attr("stroke", "#333")
        .attr("stroke-width", 2);

    cells.append("clipPath")
        .attr("id", (d, i) => `clip-circle-${i}`)
        .append("circle")
        .attr("r", 67.5);

    cells.append("image")
        .attr("xlink:href", d => d.image)
        .attr("x", -67.5)
        .attr("y", -67.5)
        .attr("width", 135)
        .attr("height", 135)
        .attr("clip-path", (d, i) => `url(#clip-circle-${i})`)
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            document.getElementById("bubble-chart-title").textContent = `${d.name} Bubble Chart`;
            const jsonFileName = `/static/data/${d.name.toLowerCase().replace(" ", "_")}.json`;
            renderBubbleChart(jsonFileName);

            document.getElementById("graph-title").textContent = `Tweet Activity for ${d.name}`;
            plotTweetActivity(d.name);
        });

    cells.append("text")
        .attr("y", 90)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", "#333")
        .text(d => d.name);
}
drawCelebrityCircles();

// ========================
// Bubble Chart + Pie Chart
// ========================

function renderBubbleChart(jsonFileName) {
    d3.json(jsonFileName).then(data => {
        const width = 1600;
        const height = 1000;
        const svg = d3.select("#bubbleChart")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", `${width * 0.1} ${height * 0.1} ${width * 0.8} ${height * 0.8}`);

        const tooltip = d3.select(".tooltip");

        const radiusScale = d3.scaleSqrt()
            .domain([0, d3.max(data, d => d.count)])
            .range([10, 50]);

        data.forEach(d => d.radius = radiusScale(d.count) * 1.3);

        let simulation = d3.forceSimulation()
            .force("charge", d3.forceManyBody().strength(0))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(d => d.radius + 2));

        const maxCount = d3.max(data, d => d.count);
        d3.select("#countSlider")
            .attr("max", maxCount)
            .attr("value", 0);
        d3.select("#sliderValue").text(`Minimum Count: 0`);

        updateBubbleChart(data);

        d3.select("#countSlider").on("input", function () {
            const sliderValue = +this.value;
            d3.select("#sliderValue").text(`Minimum Count: ${sliderValue}`);
            const filteredData = data.filter(d => d.count >= sliderValue);
            updateBubbleChart(filteredData);
        });

        function updateBubbleChart(filteredData) {
            const circles = svg.selectAll("circle")
                .data(filteredData, d => d.noun);

            circles.exit().remove();

            circles.enter()
                .append("circle")
                .attr("class", "bubble")
                .attr("stroke", "black")
                .attr("stroke-width", 1.5)
                .attr("fill", () => `hsl(${Math.random() * 360}, 70%, 70%)`)
                .attr("r", d => d.radius)
                .on("click", (e, d) => generatePieChart(d))
                .on("mouseover", showTooltip)
                .on("mouseout", hideTooltip)
                .merge(circles);

            const labels = svg.selectAll("text")
                .data(filteredData, d => d.noun);

            labels.exit().remove();

            labels.enter()
                .append("text")
                .attr("text-anchor", "middle")
                .attr("dy", ".35em")
                .attr("font-size", d => Math.max(10, d.radius * 0.5) + "px")
                .merge(labels)
                .text(d => d.noun);

            simulation.nodes(filteredData)
                .alpha(1)
                .restart();

            simulation.on("tick", () => {
                svg.selectAll("circle")
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);
                svg.selectAll("text")
                    .attr("x", d => d.x)
                    .attr("y", d => d.y);
            });
        }

        function showTooltip(event, d) {
            tooltip.transition().duration(200).style("opacity", 1)
                .html(`<strong>${d.noun}</strong><br/>Count: ${d.count}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        }

        function hideTooltip() {
            tooltip.transition().duration(500).style("opacity", 0);
        }

        function generatePieChart(bubbleData) {
            console.log("Bubble Data:", bubbleData);

            // Update the Pie Chart title dynamically
            const pieChartTitle = document.getElementById("pie-chart-title");
            pieChartTitle.textContent = `Pie Chart for Keyword "${bubbleData.noun}"`; // Replace 'noun' with the relevant property

            const pieSvg = d3.select("#histogram");
            pieSvg.selectAll("*").remove(); // Clear previous pie chart

            // Extract URLs and count types (fake/real)
            const urls = bubbleData.urls || [];
            const fakeUrls = urls.filter(url => url.type === "fake");
            const realUrls = urls.filter(url => url.type === "real");

            // Prepare data for the pie chart
            const pieData = [
                { type: "Fake", count: fakeUrls.length, urls: fakeUrls },
                { type: "Real", count: realUrls.length, urls: realUrls }
            ];

            const pie = d3.pie().value(d => d.count);
            const arc = d3.arc().innerRadius(50).outerRadius(200);

            // Define color scale
            const color = d3.scaleOrdinal()
                .domain(["Fake", "Real"])
                .range(["#ff4d4d", "#4caf50"]);

            // Create pie chart
            const g = pieSvg.append("g")
                .attr("transform", "translate(400, 200)"); // Center the pie chart

            g.selectAll("path")
                .data(pie(pieData))
                .enter()
                .append("path")
                .attr("d", arc)
                .attr("fill", d => color(d.data.type))
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .on("mouseover", (event, d) => {
                    // Highlight the section on hover
                    d3.select(event.target)
                        .transition()
                        .duration(200)
                        .attr("transform", "scale(1.1)");

                    // Show tooltip with URLs for the type
                    tooltip.transition().duration(200).style("opacity", 1);
                    tooltip.html(`<strong>${d.data.type}</strong><br>Count: ${d.data.count}<br>URLs:<br>${d.data.urls.map(url => {
                        const fullUrl = url.url.startsWith('http') ? url.url : `http://${url.url}`;
                        return `<a href="${fullUrl}" target="_blank">${fullUrl}</a>`;
                    }).join("<br>")}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mousemove", (event) => {
                    // Update tooltip position
                    tooltip.style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", (event) => {
                    // Remove highlight on mouseout
                    d3.select(event.target)
                        .transition()
                        .duration(200)
                        .attr("transform", "scale(1)");

                    // Hide tooltip
                    tooltip.transition().duration(500).style("opacity", 0);
                });

            // Add labels to the pie chart
            g.selectAll("text")
                .data(pie(pieData))
                .enter()
                .append("text")
                .attr("transform", d => `translate(${arc.centroid(d)})`)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("fill", "white")
                .text(d => `${d.data.type}: ${d.data.count}`);
        }
    }).catch(error => console.error("Error loading data:", error));
}

// Example: Render the bubble chart for Taylor Swift on page load
renderBubbleChart("/static/data/taylor_swift.json");

// ========================
// Tweet Activity Line Chart
// ========================

async function fetchTweetData(celebrityName) {
    // Uses the local JSON file loaded at the top
    if (!celebrityYearlyData) {
        alert('Tweet data not loaded yet.');
        return [];
    }
    const yearly = celebrityYearlyData[celebrityName];
    if (!yearly) {
        alert(`No data available for ${celebrityName}`);
        return [];
    }
    const real = [], fake = [], overall = [];
    Object.entries(yearly).forEach(([year, counts]) => {
        real.push({ Date: year, Tweet_Count: counts.real });
        fake.push({ Date: year, Tweet_Count: counts.fake });
        overall.push({ Date: year, Tweet_Count: counts.overall });
    });
    return { real, fake, overall };
}

async function plotTweetActivity(celebrityName) {
    const data = await fetchTweetData(celebrityName);
    if (!data || Object.keys(data).length === 0) {
        alert(`No data available for ${celebrityName}`);
        return;
    }

    ['real', 'fake', 'overall'].forEach(key => {
        data[key].forEach(d => {
            d.Date = new Date(d.Date, 0, 1);
            d.Tweet_Count = +d.Tweet_Count;
        });
    });

    document.getElementById('graph-container').style.display = 'block';
    document.getElementById("graph-title").textContent = `Tweet Activity for ${celebrityName}`;
    d3.select('#graph').selectAll('*').remove();
    d3.select('#legend').selectAll('*').remove();

    const margin = { top: 20, right: 80, bottom: 70, left: 70 }; // Increased bottom and left margins for axis labels
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select('#graph')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const allDates = [...data.real, ...data.fake, ...data.overall].map(d => d.Date);
    const allCounts = [...data.real, ...data.fake, ...data.overall].map(d => d.Tweet_Count);

    const x = d3.scaleTime()
        .domain(d3.extent(allDates))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(allCounts)])
        .range([height, 0]);

    const line = d3.line()
        .x(d => x(d.Date))
        .y(d => y(d.Tweet_Count));

    const colors = {
        real: 'green',
        fake: 'red',
        overall: 'steelblue'
    };

    ['real', 'fake', 'overall'].forEach(key => {
        svg.append('path')
            .datum(data[key])
            .attr('fill', 'none')
            .attr('stroke', colors[key])
            .attr('stroke-width', 2)
            .attr('d', line);
    });

    // X Axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y"))); // Format year on x-axis

    // Y Axis
    svg.append('g')
        .call(d3.axisLeft(y));

    // Add X-axis label
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 50) // Position below the X-axis
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#333')
        .text('Year');

    // Add Y-axis label
    svg.append('text')
        .attr('x', -height / 2)
        .attr('y', -50) // Position to the left of the Y-axis
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#333')
        .attr('transform', 'rotate(-90)') // Rotate the text for the Y-axis
        .text('Number of Tweet Heads');

    const legend = d3.select("#legend");
    ['real', 'fake', 'overall'].forEach(key => {
        legend.append("div")
            .style("display", "inline-block")
            .style("margin-right", "15px")
            .html(`<span style="color:${colors[key]}">&#9679;</span> ${key.charAt(0).toUpperCase() + key.slice(1)}`);
    });
}
