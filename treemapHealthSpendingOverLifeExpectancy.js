window.onload = function () {

    var w = 800;
    var h = 550;
    var padding = 45;

    var dataset = [
        [10.7, 83.2, "Australia"],
        [11.4, 81.3, "Austria"],
        [11.5, 80.8, "Belgium"],
        [13.0, 81.6, "Canada"],
        [9.7, 80.8, "Chile"],
        [8.7, 76.7, "Colombia"],
        [7.8, 80.6, "Costa Rica"],
        [9.0, 78.3, "Czechia"],
        [10.7, 81.6, "Denmark"],
        [7.5, 78.9, "Estonia"],
        [9.7, 82.0, "Finland"],
        [12.1, 82.3, "France"],
        [12.5, 81.1, "Germany"],
        [9.4, 81.4, "Greece"],
        [7.2, 75.5, "Hungary"],
        [9.6, 83.1, "Iceland"],
        [7.0, 82.5, "Ireland"],
        [7.7, 82.7, "Israel"],
        [9.6, 82.3, "Italy"],
        [11.5, 84.6, "Japan"],
        [8.0, 83.5, "Korea"],
        [7.5, 75.5, "Latvia"],
        [7.4, 75.2, "Lithuania"],
        [5.8, 82.2, "Luxembourg"],
        [6.1, 68.9, "Mexico"],
        [11.0, 81.4, "Netherlands"],
        [9.3, 82.3, "New Zealand"],
        [11.4, 83.3, "Norway"],
        [6.4, 76.4, "Poland"],
        [10.5, 81.5, "Portugal"],
        [7.1, 77.0, "Slovak Republic"],
        [9.5, 80.6, "Slovenia"],
        [10.8, 82.3, "Spain"],
        [11.4, 82.4, "Sweden"],
        [12.0, 83.1, "Switzerland"],
        [4.6, 77.7, "Türkiye"],
        [12.1, 80.3, "UK"],
        [18.5, 77.0, "US"]
    ];


    var svg = d3.select("#chart")
        .append("svg")
        .attr("width", w)
        .attr("height", h);


    var xScale = d3.scaleLinear()
        .domain(d3.extent(dataset, d => d[0]))
        .range([padding, w - padding]);

    var yScale = d3.scaleLinear()
        .domain(d3.extent(dataset, d => d[1]))
        .range([h - padding, padding]);


    svg.append("g")
        .attr("transform", "translate(0," + (h - padding) + ")")
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("transform", "translate(" + padding + ",0)")
        .call(d3.axisLeft(yScale));


    svg.append("text")
        .attr("x", w / 2)
        .attr("y", h - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Health Expenditure (% of GDP)");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -h / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Life Expectancy (years)");


    svg.selectAll("circle")
        .data(dataset)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d[0]))
        .attr("cy", d => yScale(d[1]))
        .attr("r", 3)
        .attr("fill", "lightgreen");


    svg.selectAll("text.label")
        .data(dataset)
        .enter()
        .append("text")
        .attr("class", "label")
        .text(d => d[2])
        .attr("x", d => xScale(d[0]) + 8)
        .attr("y", d => yScale(d[1]) - 6)
        .style("font-size", "9px")
        .style("fill", "black");
};

