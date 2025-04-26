// Sample data for each case
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

// Set up the chart dimensions
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

// Function to update the chart
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
        .attr("fill", type === "fake" ? "red" : type === "real" ? "green" : "steelblue"); // Dynamically set the bar color

    // Add new bars
    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d.type))
        .attr("width", 0) // Start with width 0 for animation
        .attr("height", y.bandwidth())
        .attr("fill", type === "fake" ? "red" : type === "real" ? "green" : "steelblue") // Dynamically set the bar color
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

// Append the new code here
const typeField = document.getElementById('type');

// Function to set bar colors dynamically
const setHistogramBarColors = (type) => {
    console.log('setHistogramBarColors called with type:', type);

    // Determine the color based on the selected type
    const color = type === 'fake' ? 'red' : type === 'real' ? 'green' : 'steelblue';

    // Select all bars dynamically
    const histogramBars = document.querySelectorAll('#chart svg rect.bar');

    // Update the fill color of each bar
    histogramBars.forEach((bar) => {
        bar.setAttribute('fill', color);
        console.log('Updated bar fill:', bar.getAttribute('fill'));
    });
};

// Event listener for the type dropdown
typeField.addEventListener('change', (event) => {
    console.log('Type field changed:', event.target.value);
    setHistogramBarColors(event.target.value);
});

// Set the initial colors when the page loads
setHistogramBarColors(typeField.value);

// Function to filter data and update the chart
function filterData() {
    const selectedType = document.getElementById("type").value.toLowerCase(); // Normalize to lowercase
    const selectedSource = document.getElementById("source").value.toLowerCase(); // Normalize to lowercase

    const key = `${selectedType}-${selectedSource}`;
    const filteredData = customData[key] || [];

    updateChart(filteredData, selectedType); // Pass the selected type to updateChart
}

// Event listeners for dropdowns
document.getElementById("type").addEventListener("change", filterData);
document.getElementById("source").addEventListener("change", filterData);

// Initial chart rendering (default case: Both and Both)
filterData();

// Sample celebrity data
const celebrities = [
    { name: "Hillary Clinton", image: "./hillary_clinton.jpg" },
    { name: "Barack Obama", image: "./barack_obama.jpg" },
    { name: "Donald Trump", image: "./donald_trump.jpg" },
    { name: "Kim Kardashian", image: "./kim_kar.jpg" },
    { name: "Taylor Swift", image: "./taylor.jpg" },
    { name: "Selena Gomez", image: "./selena.jpg" },
    { name: "Kylie Jenner", image: "./kylie.jpg" },
    { name: "Jennifer Aniston", image: "./jennifer.jpg" },
    { name: "Angelina Jolie", image: "./jolie.jpg" },
    { name: "Brad Pitt", image: "./brad.jpg" },
];

// Draw circles with celebrity faces
function drawCelebrityCircles() {
    const container = d3.select("#celebrity-circles");

    // Clear any existing SVG (if re-rendering)
    container.select("svg").remove();

    // Set grid dimensions
    const rows = 5;
    const cols = 2;
    const cellWidth = 120; // Width of each cell
    const cellHeight = 120; // Height of each cell

    // Create an SVG container for the grid
    const svg = container.append("svg")
        .attr("width", cols * cellWidth)
        .attr("height", rows * cellHeight);

    // Bind data to the grid
    const cells = svg.selectAll("g")
        .data(celebrities)
        .enter()
        .append("g")
        .attr("transform", (d, i) => {
            const x = (i % cols) * cellWidth + cellWidth / 2;
            const y = Math.floor(i / cols) * cellHeight + cellHeight / 2;
            return `translate(${x}, ${y})`;
        });

    // Add a circle to each cell
    cells.append("circle")
        .attr("r", 45)
        .attr("fill", "#ddd")
        .attr("stroke", "#333")
        .attr("stroke-width", 2);

    // Add a clipPath to ensure the image fits inside the circle
    cells.append("clipPath")
        .attr("id", (d, i) => `clip-circle-${i}`) // Unique ID for each clipPath
        .append("circle")
        .attr("r", 45);

    // Add an image inside each circle, clipped to the circle's boundary
    cells.append("image")
        .attr("xlink:href", d => d.image)
        .attr("x", -45)
        .attr("y", -45)
        .attr("width", 90)
        .attr("height", 90)
        .attr("clip-path", (d, i) => `url(#clip-circle-${i})`); // Apply the clipPath

    // Add a label below each circle
    cells.append("text")
        .attr("y", 60)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#333")
        .text(d => d.name);
}

// Call the function to draw the circles
drawCelebrityCircles();