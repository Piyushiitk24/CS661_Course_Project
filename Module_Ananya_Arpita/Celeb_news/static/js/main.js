d3.json("/data").then(data => {
    console.log("Data loaded:", data);

    const width = 1600; // Chart width
    const height = 1000; // Chart height

    // Create the SVG container for the bubble chart
    const svg = d3.select("#bubbleChart")
        .attr("width", width)
        .attr("height", height);

    // Create a tooltip for displaying information
    const tooltip = d3.select(".tooltip");

    // Define a scale for bubble radius based on the count
    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.count)])
        .range([10, 50]);

    // Assign radius property to each node
    data.forEach(d => {
        d.radius = radiusScale(d.count);
    });

    // Create a D3 force simulation for the bubble chart
    const simulation = d3.forceSimulation(data)
        .force("charge", d3.forceManyBody().strength(0)) // No repulsion or attraction
        .force("center", d3.forceCenter(width / 2, height / 2)) // Center alignment
        .force("collision", d3.forceCollide().radius(d => d.radius)); // Prevent overlap

    // Create bubbles for each data point
    const nodes = svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("r", d => d.radius)
        .attr("fill", () => `hsl(${Math.random() * 360}, 70%, 70%)`) // Random color for each bubble
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("class", "bubble")
        .on("click", (event, clickedNode) => {
            // Generate pie chart for the clicked bubble
            generatePieChart(clickedNode);
        });

    // Add event listeners for the bubbles
    nodes.on("mouseover", (event, d) => {
        // Show tooltip with noun and count
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`<strong>${d.noun}</strong><br/>Count: ${d.count}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", (event) => {
        // Update tooltip position
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
        // Hide tooltip
        tooltip.transition().duration(500).style("opacity", 0);
    });

    // Add labels to the bubbles
    const labels = svg.selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .text(d => d.noun)
        .attr("font-size", "10px")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em");

    // Update positions of bubbles and labels on each tick of the simulation
    simulation.on("tick", () => {
        nodes
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        labels
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });

    // Function to generate a pie chart for the clicked bubble
    function generatePieChart(bubbleData) {
        const pieSvg = d3.select("#histogram");
        pieSvg.selectAll("*").remove(); // Clear previous pie chart

        // Extract URLs and count types (fake/real)
        const urls = bubbleData.urls;
        const fakeCount = urls.filter(url => url.type === "fake").length;
        const realCount = urls.filter(url => url.type === "real").length;

        // Prepare data for the pie chart
        const pieData = [
            { type: "Fake", count: fakeCount, urls: urls.filter(url => url.type === "fake") },
            { type: "Real", count: realCount, urls: urls.filter(url => url.type === "real") }
        ];

        const pie = d3.pie().value(d => d.count);
        const arc = d3.arc().innerRadius(50).outerRadius(200); // Add inner radius for a donut chart

        // Define color scale
        const color = d3.scaleOrdinal()
            .domain(["Fake", "Real"])
            .range(["#ff4d4d", "#4caf50"]); // Red for fake, green for real

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
                tooltip.html(`<strong>${d.data.type}</strong><br/>Count: ${d.data.count}<br/>URLs:<br/>${d.data.urls.map(url => {
                    // Ensure the URL starts with http:// or https://
                    const fullUrl = url.url.startsWith('http') ? url.url : `http://${url.url}`;
                    return `<a href="${fullUrl}" target="_blank">${fullUrl}</a>`;
                }).join("<br/>")}`)
                    .style("left", (event.pageX + 10) + "px")
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
}).catch(error => {
    console.error("Data loading error:", error);
});