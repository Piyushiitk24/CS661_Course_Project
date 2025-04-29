d3.json("/data").then(data => {
    console.log("Data loaded:", data);

    const width = 1600;
        const height = 1000;
        const svg = d3.select("#bubbleChart")
            .attr("width", width)
            .attr("height", height);

        const tooltip = d3.select(".tooltip");

        // Dynamic radius scaling
        const radiusScale = d3.scaleSqrt()
            .domain([0, d3.max(data, d => d.count)])
            .range([10, 50]);

        data.forEach(d => d.radius = radiusScale(d.count));

        // Initialize simulation
        let simulation = d3.forceSimulation()
            .force("charge", d3.forceManyBody().strength(0))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(d => d.radius + 2));

        // Slider setup with dynamic max
        const maxCount = d3.max(data, d => d.count);
        d3.select("#countSlider")
            .attr("max", maxCount)
            .attr("value", 0); // Start at 0 to show all bubbles initially
        d3.select("#sliderValue").text(`Minimum Count: 0`);

        // Initial render
        updateBubbleChart(data);

        // Slider handler with proper filtering
        d3.select("#countSlider").on("input", function() {
            const sliderValue = +this.value;
            d3.select("#sliderValue").text(`Minimum Count: ${sliderValue}`);
            const filteredData = data.filter(d => d.count >= sliderValue);
            updateBubbleChart(filteredData);
        });

        function updateBubbleChart(filteredData) {
            // Update bubbles
            const circles = svg.selectAll("circle")
                .data(filteredData, d => d.noun); // Key-based binding

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
                .merge(circles); // Merge new and existing

            // Update labels
            const labels = svg.selectAll("text")
                .data(filteredData, d => d.noun);

            labels.exit().remove();

            labels.enter()
                .append("text")
                .attr("text-anchor", "middle")
                .attr("dy", ".35em")
                .attr("font-size", "10px")
                .merge(labels)
                .text(d => d.noun);

            // Restart simulation correctly
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

        // Tooltip functions
        function showTooltip(event, d) {
            tooltip.transition().duration(200).style("opacity", 1)
                .html(`<strong>${d.noun}</strong><br/>Count: ${d.count}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        }

        function hideTooltip() {
            tooltip.transition().duration(500).style("opacity", 0);
        }

        // Generate pie chart for the clicked bubble
        function generatePieChart(bubbleData) {
            console.log("Bubble Data:", bubbleData);

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
