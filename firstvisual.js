window.onload = function () {

    var w = 800;
    var h = 500;

    var svg = d3.select("#chart")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    var g = svg.append("g");

    var projection = d3.geoMercator();
    var path = d3.geoPath().projection(projection);

    // Tooltip
    var tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #999")
        .style("padding", "8px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Global variables
    var geoData;
    var csvData;
    var dataByCountry;
    var colorScale;
    var colorBlindMode = false; 
    var zoom;

    // Color Legend Indicator
    function renderColorLegend(colorScale) {
        const legendWidth = 220;
        const legendHeight = 20;
        const margin = { left: 10, right: 10, top: 10, bottom: 30 };

        d3.select("#colorLegend svg").remove();

        const svgLegend = d3.select("#colorLegend")
            .append("svg")
            .attr("width", legendWidth + margin.left + margin.right)
            .attr("height", legendHeight + margin.top + margin.bottom);

        const defs = svgLegend.append("defs");

        const linearGradient = defs.append("linearGradient")
            .attr("id", "legend-gradient");

        const [minVal, maxVal] = colorScale.domain();

        linearGradient.selectAll("stop")
            .data(d3.range(0, 1.01, 0.01))
            .enter()
            .append("stop")
            .attr("offset", d => `${d * 100}%`)
            .attr("stop-color", d => colorScale(minVal + d * (maxVal - minVal)));

        // Draw rectangle
        svgLegend.append("rect")
            .attr("x", margin.left)
            .attr("y", margin.top)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)")
            .style("stroke", "#333");

        // Axis
        const legendScale = d3.scaleLinear()
            .domain([minVal, maxVal])
            .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale)
            .ticks(5)
            .tickFormat(d => d + "%");

        svgLegend.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top + legendHeight})`)
            .call(legendAxis)
            .select(".domain").remove();
    }

    // Load  CSV Data and Geo Map
    Promise.all([
        d3.json("ne_110m_admin_0_countries.geojson"),
        d3.csv("first visual dataset.csv", d => ({
            iso: d.iso,
            country: d.country,
            year: +d.year,
            health: +d.health_exp
        }))
    ]).then(([geo, data]) => {

        geoData = geo;
        csvData = data;
        projection.fitSize([w, h], geo);
        dataByCountry = d3.group(data, d => d.iso);

        // Country Dropdown
        var countryList = Array.from(new Set(data.map(d => d.country))).sort();
        var dropdown = d3.select("#country-filter select");
        dropdown.append("option").attr("value", "All").text("All Countries");
        countryList.forEach(c => dropdown.append("option").attr("value", c).text(c));

        // Draw Geo Map
        g.selectAll("path")
            .data(geo.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5)
            .on("mouseover", function (event, d) {
                var countryData = dataByCountry.get(d.properties.ISO_A3);
                var countryName = d.properties.ADMIN;
                d3.select(this).attr("stroke-width", 1.5);

                tooltip
                    .style("opacity", 1)
                    .html(`<svg id="miniChartHealth" width="220" height="160"></svg>`);

                if (countryData) {
                    drawMiniLine(countryData, countryName);
                } else {
                    d3.select("#miniChartHealth")
                        .html(`<text x='50%' y='50%' text-anchor='middle'>No data for ${countryName}</text>`);
                }
            })
            .on("mousemove", function (event) {
                tooltip.style("left", (event.pageX + 12) + "px")
                       .style("top", (event.pageY - 30) + "px");
            })
            .on("mouseout", function () {
                d3.select(this).attr("stroke-width", 0.5);
                tooltip.style("opacity", 0);
            });

        // Initial render
        updateMap(+d3.select("#yearSlider").node().value, "All");

        // Dropdown event
        d3.select("#countrySelect").on("change", function () {
            updateMap(+d3.select("#yearSlider").node().value, this.value);
        });

        // Clear button
        d3.select("#clearCountry").on("click", function () {
            d3.select("#countrySelect").node().value = "All";
            updateMap(+d3.select("#yearSlider").node().value, "All");
        });

        // Color-blind toggle
        d3.select("#colorBlindModeButton").on("click", function () {
            colorBlindMode = !colorBlindMode;
            updateMap(+d3.select("#yearSlider").node().value, d3.select("#countrySelect").node().value);
            d3.select(this)
                .classed("color-blind-active", colorBlindMode)
                .text(colorBlindMode ? "Color Blind Mode: ON" : "Color Blind Mode: OFF");
        });

    });

    // Year slider
    d3.select("#yearSlider").on("input", function () {
        updateMap(+this.value, d3.select("#countrySelect").node().value);
    });

    // Update Map
    function updateMap(year, country) {
        d3.select("#sliderYear").text(year);

        var yearData = csvData.filter(d => d.year === year);
        if (country && country !== "All") yearData = yearData.filter(d => d.country === country);

        var yearMap = new Map(yearData.map(d => [d.iso, d.health]));

        colorScale = colorBlindMode
            ? d3.scaleSequential().domain(d3.extent(yearData, d => d.health)).interpolator(d3.interpolateViridis)
            : d3.scaleSequential().domain(d3.extent(yearData, d => d.health)).interpolator(d3.interpolateGreens);

        g.selectAll("path")
            .transition()
            .duration(300)
            .attr("fill", d => {
                var v = yearMap.get(d.properties.ISO_A3);
                return v != null ? colorScale(v) : "#e0e0e0";
            });

        renderColorLegend(colorScale);

        if (country && country !== "All") zoomToCountry(country);
        else resetZoom();
    }

    // Zooming Features
    function zoomToCountry(country) {
        var selectedCountry = geoData.features.find(d => d.properties.ADMIN === country);
        if (!selectedCountry) return;

        var bounds = path.bounds(selectedCountry);
        var dx = bounds[1][0] - bounds[0][0];
        var dy = bounds[1][1] - bounds[0][1];
        var x = (bounds[0][0] + bounds[1][0]) / 2;
        var y = (bounds[0][1] + bounds[1][1]) / 2;
        var scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / w, dy / h)));
        var translate = [w / 2 - scale * x, h / 2 - scale * y];

        svg.transition().duration(750)
            .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }

    function resetZoom() {
        svg.transition().duration(750)
            .call(zoom.transform, d3.zoomIdentity);
    }

    zoom = d3.zoom()
        .scaleExtent([1, 8])
        .translateExtent([[0, 0], [w, h]])
        .on("zoom", (event) => { g.attr("transform", event.transform); });

    svg.call(zoom);

    // Mini Line Charts (Hover Display)
    function drawMiniLine(countryData, countryName) {
        var svgMini = d3.select("#miniChartHealth");
        svgMini.selectAll("*").remove();

        var margin = { top: 35, right: 20, bottom: 45, left: 55 };
        var width = 220 - margin.left - margin.right;
        var height = 160 - margin.top - margin.bottom;

        var gMini = svgMini.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        countryData.sort((a,b) => a.year - b.year);

        var x = d3.scaleLinear().domain(d3.extent(countryData, d => d.year)).range([0, width]).nice();
        var y = d3.scaleLinear().domain(d3.extent(countryData, d => d.health)).range([height,0]).nice();

        // Title
        svgMini.append("text")
            .attr("x", margin.left + width/2)
            .attr("y", 16)
            .attr("text-anchor","middle")
            .style("font-size","12px")
            .style("font-weight","bold")
            .text(countryName);

        gMini.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(4).tickFormat(d3.format("d")));
        gMini.append("g").call(d3.axisLeft(y).ticks(4).tickFormat(d => d + "%"));

        gMini.append("path")
            .datum(countryData)
            .attr("fill","none")
            .attr("stroke","darkgreen")
            .attr("stroke-width",2)
            .attr("d", d3.line().x(d=>x(d.year)).y(d=>y(d.health)));

        gMini.selectAll("circle")
            .data(countryData)
            .enter()
            .append("circle")
            .attr("cx", d=>x(d.year))
            .attr("cy", d=>y(d.health))
            .attr("r", 3.5)
            .attr("fill", "darkgreen");
    }

};
