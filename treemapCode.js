var width = 800;
var height = 500;

var svg = d3.select("#treemap")
    .attr("width", width)
    .attr("height", height);

var tooltip = d3.select(".tooltip");

var color = d3.scaleSequential(function (t) {
    return d3.hsl(260, 0.6, 0.25 + t * 0.5).toString();
});

d3.csv("potentalYearsOfLifeLostTreeMapData.csv", function (d) {
    return {
        iso: d.REF_AREA,
        country: d["Reference area"],
        year: Number(d.TIME_PERIOD),
        value: Number(d.OBS_VALUE)
    };
}).then(function (data) {

    var years = [];
    for (var i = 0; i < data.length; i++) {
        if (years.indexOf(data[i].year) === -1) {
            years.push(data[i].year);
        }
    }
    years.sort(function (a, b) {
        return a - b;
    });

    var slider = d3.select("#yearSlider")
        .attr("min", years[0])
        .attr("max", years[years.length - 1])
        .attr("step", 1)
        .attr("value", years[0]);

    var yearLabel = d3.select("#yearLabel");
    yearLabel.text(years[0]);

    slider.on("input", function () {
        yearLabel.text(this.value);
        update(Number(this.value));
    });

    update(years[0]);

    function update(year) {

        d3.select("#title")
            .text("Potential Years of Life Lost (PYLL) by Country (" + year + ")");

        d3.select("#subtitle")
            .text("Rectangle size = PYLL • Colour = PYLL");

        var yearData = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i].year === year && data[i].value > 0) {
                yearData.push(data[i]);
            }
        }

        
        var totalValue = 0;
        for (var i = 0; i < yearData.length; i++) {
            totalValue += yearData[i].value;
        }
        var avgValue = totalValue / yearData.length;

        var children = [];
        for (var i = 0; i < yearData.length; i++) {
            children.push({
                name: yearData[i].country,
                value: yearData[i].value
            });
        }

        var hierarchyData = {
            name: "root",
            children: children
        };

        var root = d3.hierarchy(hierarchyData)
            .sum(function (d) {
                return d.value;
            })
            .sort(function (a, b) {
                return b.value - a.value;
            });

        d3.treemap()
            .size([width, height])
            .padding(2)(root);

        var values = [];
        for (var i = 0; i < yearData.length; i++) {
            values.push(yearData[i].value);
        }

        color.domain(d3.extent(values));

        var nodes = svg.selectAll("g")
            .data(root.leaves(), function (d) {
                return d.data.name;
            });

        nodes.exit()
            .transition()
            .duration(400)
            .style("opacity", 0)
            .remove();

        var enter = nodes.enter()
            .append("g")
            .attr("transform", function (d) {
                return "translate(" + d.x0 + "," + d.y0 + ")";
            });

        enter.append("rect")
            .attr("width", 0)
            .attr("height", 0)
            .attr("fill", function (d) {
                return color(d.data.value);
            })
            .attr("stroke", "#fff")
            .on("mouseover", function (event, d) {

                d3.select(this.parentNode).raise();
                d3.select(this).attr("stroke-width", 2);

                var comparison = "Below average PYLL";
                if (d.data.value >= avgValue) {
                    comparison = "Above average PYLL";
                }

                tooltip
                    .style("opacity", 1)
                    .html(
                        "<strong>" + d.data.name + "</strong><br>" +
                        "Potential Years of Life Lost: " + d.data.value + "<br>" +
                        comparison
                    );
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("left", (event.pageX + 12) + "px")
                    .style("top", (event.pageY + 12) + "px");
            })
            .on("mouseout", function () {
                d3.select(this).attr("stroke-width", 1);
                tooltip.style("opacity", 0);
            });

        enter.append("text")
            .attr("x", 4)
            .attr("y", 14)
            .text(function (d) {
                return d.data.name;
            });

        var merged = enter.merge(nodes);

        merged.transition()
            .duration(800)
            .attr("transform", function (d) {
                return "translate(" + d.x0 + "," + d.y0 + ")";
            });

        merged.select("rect")
            .transition()
            .duration(800)
            .attr("width", function (d) {
                return d.x1 - d.x0;
            })
            .attr("height", function (d) {
                return d.y1 - d.y0;
            });

        drawLegend();
    }

    function drawLegend() {

        var legend = d3.select("#legend");
        legend.selectAll("*").remove();

        var legendWidth = 260;
        var legendHeight = 35;

        legend
            .attr("width", legendWidth + 40)
            .attr("height", 90);

        legend.append("text")
            .attr("x", 20)
            .attr("y", 15)
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .text("Colour scale");

        legend.append("text")
            .attr("x", 20)
            .attr("y", 32)
            .attr("font-size", "11px")
            .attr("fill", "#333")
            .text("Potential Years of Life Lost (PYLL)");

        var defs = legend.append("defs");
        var gradient = defs.append("linearGradient")
            .attr("id", "legendGradient")
            .attr("x1", "0%")
            .attr("x2", "100%");

        for (var i = 0; i <= 100; i++) {
            gradient.append("stop")
                .attr("offset", i + "%")
                .attr("stop-color",
                    color(
                        color.domain()[0] +
                        (i / 100) * (color.domain()[1] - color.domain()[0])
                    )
                );
        }

        legend.append("rect")
            .attr("x", 20)
            .attr("y", 40)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legendGradient)")
            .attr("stroke", "#ccc");

        legend.append("text")
            .attr("x", 20)
            .attr("y", 50)
            .attr("font-size", "10px")
            .text("Lower PYLL (Lowest is " + Math.round(color.domain()[0]) + ")");

        legend.append("text")
            .attr("x", 20 + legendWidth)
            .attr("y", 70)
            .attr("text-anchor", "end")
            .attr("font-size", "10px")
            .text("Higher PYLL (Highest is " + Math.round(color.domain()[1]) + ")");
    }
});
