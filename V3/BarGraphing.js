
var barGraph = function (settings) {
    this.graphData;

    var _graphData;

    var _containerId,
        margin,
        width,
        height;

    var isDateGraph = false,
        isTimeGraph = false,
        showLegend = true,
        textXAxis = false,
        showHoverMarker = true,
        showXHoverValue = false,
        showXAxis = true,
        skewXAxis = true,
        showYAxis = true,

        svg,
        mainGroup,
        barsGroup,
        x,
        y,
        xAxis,
        yAxis;

    if (settings !== undefined) {
        for (var key in settings) {
            switch (key) {
                case 'containerId':
                    _containerId = settings[key];
                    break;
                case 'timeOnly':
                    isTimeGraph = settings[key];
                    break;
                case 'showLegend':
                    showLegend = settings[key];
                    break;
                case 'textXAxis':
                    textXAxis = settings[key];
                    break;
                case 'showHoverMarker':
                    showHoverMarker = settings[key];
                    break;
                case 'showXHoverValue':
                    showXHoverValue = settings[key];
                    break;
                case 'showXAxis':
                    showXAxis = settings[key];
                    break;
                case 'skewXAxis':
                    skewXAxis = settings[key];
                    break;
                case 'showYAxis':
                    showYAxis = settings[key];
                    break;
                case 'width':
                    width = parseInt(settings[key]);
                    break;
            }
        }
    }


    this.initalizeGraph = function () {
        _graphData = this.graphData;
        
        setGraphSize();

        svg = d3.select('#' + _containerId)
            .append('svg')
            .attr({
                'width': width + margin.left + margin.right,
                'height': height + margin.top + margin.bottom
            });

        mainGroup = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        barsGroup = mainGroup.append('g').attr('class', 'lines-group');

        var barWidth = width / (_graphData.length + 1),
            xMin = d3.min(_graphData, function (d) { return d.x; }),
            xMax = d3.max(_graphData, function (d) { return d.x; }),
            yMin = d3.min(_graphData, function (d) { return d.y; }),
            yMax = d3.max(_graphData, function (d) { return d.y; });
        
        y = d3.scale.linear().range([height, 0]);
        y.domain(d3.extent(_graphData, function (d) { return d.y; }));
        yAxis = d3.svg.axis().scale(y).orient('left').ticks(10);

        // Determine x variable and assign x & xAxis
        if (textXAxis) {
            x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
            x.domain(_graphData.map(function (d) { return d.x; }));
            xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(15);
        }
        else if (isDateGraph && isTimeGraph) {
            x = d3.time.scale().range([0, width]);
            x.domain(d3.extent(_graphData, function (d) { return new Date(d.x); }));
            xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(15).tickFormat(d3.time.format('%I:%M %p'));
        } else if (isDateGraph) {
            x = d3.time.scale().range([0, width]);
            x.domain(d3.extent(_graphData, function (d) { return new Date(d.x); }));
            xAxis = d3.svg.axis().scale(x).orient('bottom').tickFormat(d3.time.format("%b %d"));
        } else {
            x = d3.scale.linear().range([0, (width - barWidth)]);
            x.domain(d3.extent(_graphData, function (d) { return d.x; }));
            xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(15);
        }

        // Add the Axis's
        if (showXAxis) {
            var xAxisGroup = mainGroup.append('g').attr({ 'id': _containerId + '-x-axis', 'class': 'x axis', 'transform': 'translate(0,' + height + ')' }).call(xAxis);
            if (skewXAxis) {
                xAxisGroup.selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-65)");
            }
        } else {
            mainGroup.append('g').attr({ 'class': 'x axis' })
                .append('line').attr({
                    x1: 0,
                    y1: height,
                    x2: width,
                    y2: height
                });
        }
        if (showYAxis) {
            mainGroup.append('g').attr({ 'id': _containerId + '-y-axis', 'class': 'y axis', }).call(yAxis);
        }

        var divHover = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", 'absolute')
            .style('left', 0)
            .style('top', 0);

        //  Adding 2 to the y and height so 0 values still appear on the bar graph
        barsGroup.selectAll('rect')
            .data(_graphData)
            .enter()
            .append('rect')
            .attr({
                'id': function (d) { return _containerId + '-bar-' + d.x },
                'class': 'bar',
                'x': function (d) { return x(d.x); },
                'y': function (d) { return height - (height - (y(d.y) - 2)) },
                'height': function (d) { return height - (y(d.y) - 2) },
                'width': 10,
                'fill': function (d, i){ return color(i) },
                'opacity': 0.0,
                'stroke': function (d, i){ return color(i) },
                'stroke-width': 4,
                'stroke-opacity': 0.0
            })
            .on("mouseover", function (d) {
                console.log(d);
                divHover.transition()
                    .duration(200)
                    .style("opacity", .9);
                divHover.html(d.x + "<br/>" + d.y)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
                d3.select(this).transition().duration(200).attr({ 'stroke-opacity': 1.0, 'opacity': 0.8 });
            })
            .on("mouseout", function (d) {
                divHover.transition()
                    .duration(500)
                    .style("opacity", 0);
                d3.select(this).transition().duration(500).attr({ 'stroke-opacity': 0.0, 'opacity': 0.4 });
            });
            
        barsGroup.selectAll('rect')
            .transition()
            .duration(800)
            .attr({
                'y': function (d) { return y(d.y) - 2 },
                'height': function (d) { return height - (y(d.y) - 2) },
                'opacity': 0.4,
            });
            
    };

    function setGraphSize() {
        var container = window.getComputedStyle(document.getElementById(_containerId)),
            cWidth = parseInt(container.width.replace('px', '')),
            cHeight = parseInt(container.height.replace('px', ''));

        margin = { top: 30, right: 20, bottom: 30, left: 80 };
        if (textXAxis){
            margin.bottom = 80;
        }
        width = cWidth - margin.left - margin.right;
        height = cHeight - margin.top - margin.bottom;
    }


    this.updateGraph = function () {

        _graphData = this.graphData;

        var graphDataconcatenated = _graphData[0];
        for (var gdc = 1; gdc < _graphData.length; gdc++) {
            graphDataconcatenated = graphDataconcatenated.concat(_graphData[gdc]);
        }

        x.domain(d3.extent(graphDataconcatenated, function (d) { return parseInt(d.x); }));
        y.domain(d3.extent(graphDataconcatenated, function (d) { return d.y; }));

        linesGroup.selectAll('path').each(function () {
            var l = d3.select(this);
            l.transition()
                .duration(800)
                .attr({
                    'd': valueline(_graphData[parseInt(l.attr('data-i'))])
                });
        });

        svg.select('.x.axis')
            .transition()
            .duration(750)
            .call(xAxis);
        svg.select('.y.axis')
            .transition()
            .duration(750)
            .call(yAxis);
    }



    //var ourColors = ['rgba(230,230,230,1)', 'rgba(40,188,25,1)', 'rgba(50,132,193,1)', 'rgba(172,40,36,1)',  'rgba(181,164,8,1)', 'lime']
    //               accent         positive        neutral         negative        caution
    var ourColors = ['fuchsia', 'lime', 'blue', 'red', 'orange', 'aqua'];
    function color(i) {
        var l = ourColors.length - 1;
        if (i > l) {
            return ourColors[(i % l)];
        }
        else {
            return ourColors[i];
        }
    }


    /******************************************************************************** Setters ***************************************************/

    this.containerId = function (containerId) {
        if (containerId !== undefined) {
            _containerId = containerId;
        }
        return _containerId;
    }

};


var barGraphDate = function () {
    this.containerId = function (containerId) {
        if (containerId !== undefined) {
            _containerId = containerId;
        }
        return _containerId;
    }

    this.graphData;

    var _graphData,
        _containerId,
        margin,
        width,
        height,
        svg,
        mainGroup,
        barsGroup,
        x,
        y,
        xAxis,
        yAxis;

    this.initalizeGraph = function () {
        document.getElementById(_containerId).innerHTML = '';
        _graphData = this.graphData;
        setGraphSize();

        svg = d3.select('#' + _containerId)
            .append('svg')
            .attr({
                'width': width + margin.left + margin.right,
                'height': height + margin.top + margin.bottom
            });

        mainGroup = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        barsGroup = mainGroup.append('g').attr('class', 'lines-group');

        x = d3.time.scale().range([0, width]);
        y = d3.scale.linear().range([height, 0]);

        x.domain(d3.extent(_graphData, function (d) { return new Date(d.date); }));
        y.domain([0, d3.max(_graphData, function (d) { return d.value; })]);

        var divHover = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
        
        //  Adding 2 to the y and height so 0 values still appear on the bar graph
        barsGroup.selectAll('rect')
            .data(_graphData)
            .enter()
            .append('rect')
            .attr({
                'id': function (d) { return _containerId + '-bar-' + d.date },
                'class': 'bar',
                'x': function (d) { return x(new Date(d.date)); },
                //'y': function (d) { return y(d.value) - 2 },
                'y': height,
                'height': 0, // function (d) { return height - (y(d.value) - 2) },
                'width': 10,
                'fill': color(1),
                'opacity': 0.0,
                'stroke': color(1),
                'stroke-width': 6,
                'stroke-opacity': 0.0
            })
            .on("mouseover", function (d) {
                divHover.transition()
                    .duration(200)
                    .style("opacity", .9);
                divHover.html(d.date + "<br/>" + d.value)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
                d3.select(this).transition().duration(200).attr({ 'stroke-opacity': 1.0 });
            })
            .on("mouseout", function (d) {
                divHover.transition()
                    .duration(500)
                    .style("opacity", 0);
                d3.select(this).transition().duration(500).attr({ 'stroke-opacity': 0.0 });
            });

        barsGroup.selectAll('rect')
            .transition()
            .duration(800)
            .attr({
                'y': function (d) { return y(d.value) - 2 },
                'height': function (d) { return height - (y(d.value) - 2) },
                'opacity': 1.0,
            });

        // Define the axes
        xAxis = d3.svg.axis().scale(x).orient('bottom').tickFormat(d3.time.format("%b %d"));
        yAxis = d3.svg.axis().scale(y).orient('left').ticks(10);
        // Add the Axis's
        mainGroup.append('g').attr({ 'id': _containerId + '-x-axis', 'class': 'x axis', 'transform': 'translate(0,' + height + ')' }).call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");
        mainGroup.append('g').attr({ 'id': _containerId + '-y-axis', 'class': 'y axis', }).call(yAxis)
            .selectAll("text")
            .text(function () {
                var t = d3.select(this),
                    c = t.text();
                t.text('$' + c);
                return t.text();
            });
    };

    function setGraphSize() {
        var container = window.getComputedStyle(document.getElementById(_containerId)),
            cWidth = parseInt(container.width.replace('px', '')),
            cHeight = parseInt(container.height.replace('px', ''));

        margin = { top: 30, right: 20, bottom: 100, left: 80 };
        width = cWidth - margin.left - margin.right;
        height = cHeight - margin.top - margin.bottom;
    }

    this.updateGraph = function () {

        _graphData = this.graphData;

        //var graphDataconcatenated = _graphData[0];
        //for (var gdc = 1; gdc < _graphData.length; gdc++) {
        //    graphDataconcatenated = graphDataconcatenated.concat(_graphData[gdc]);
        //}

        //x.domain(d3.extent(graphDataconcatenated, function (d) { return parseInt(d.x); }));
        //y.domain(d3.extent(graphDataconcatenated, function (d) { return d.y; }));

        x.domain(d3.extent(_graphData, function (d) { return new Date(d.date); }));
        y.domain([0, d3.max(_graphData, function (d) { return d.value; })]);

        //linesGroup.selectAll('path').each(function () {
        //    var l = d3.select(this);
        //    l.transition()
        //        .duration(800)
        //        .attr({
        //            'd': valueline(_graphData[parseInt(l.attr('data-i'))])
        //        });
        //});

        barsGroup.selectAll('rect')
            .data(_graphData)
            .enter()
            .append('rect')
            .attr({
                'id': function (d) { return _containerId + '-bar-' + d.date },
                'class': 'bar',
                'x': function (d) { return x(new Date(d.date)); },
                //'y': function (d) { return y(d.value) - 2 },
                'y': height,
                'height': 0, // function (d) { return height - (y(d.value) - 2) },
                'width': 10,
                'fill': color(1),
                'opacity': 0.0,
                'stroke': color(1),
                'stroke-width': 6,
                'stroke-opacity': 0.0
            })
            .on("mouseover", function (d) {
                divHover.transition()
                    .duration(200)
                    .style("opacity", .9);
                divHover.html(d.date + "<br/>" + d.value)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
                d3.select(this).transition().duration(200).attr({ 'stroke-opacity': 1.0 });
            })
            .on("mouseout", function (d) {
                divHover.transition()
                    .duration(500)
                    .style("opacity", 0);
                d3.select(this).transition().duration(500).attr({ 'stroke-opacity': 0.0 });
            });

        barsGroup.selectAll('rect')
            .transition()
            .duration(800)
            .attr({
                'y': function (d) { return y(d.value) - 2 },
                'height': function (d) { return height - (y(d.value) - 2) },
                'opacity': 1.0,
            });

        svg.select('.x.axis')
            .transition()
            .duration(750)
            .call(xAxis);
        svg.select('.y.axis')
            .transition()
            .duration(750)
            .call(yAxis);
    }



    //var ourColors = ['rgba(230,230,230,1)', 'rgba(40,188,25,1)', 'rgba(50,132,193,1)', 'rgba(172,40,36,1)',  'rgba(181,164,8,1)', 'lime']
    //               accent         positive        neutral         negative        caution
    var ourColors = ['fuchsia', 'lime', 'blue', 'red', 'orange', 'aqua']
    function color(i) {
        var l = ourColors.length - 1;
        if (i > l) {
            return ourColors[(i % l)];
        }
        else {
            return ourColors[i];
        }
    }
};

var horziontalBarGraph = function (settings){

    var containerId,
        margin,
        width,
        height,
        alertsData;

    if (settings !== undefined) {
        for (var key in settings) {
            switch (key) {
                case 'containerId':
                    containerId = settings[key];
                    break;
                case 'alertsData':
                    alertsData = settings[key];
                    break;

                case 'textXAxis':
                    textXAxis = settings[key];
                    break;
                case 'showHoverMarker':
                    showHoverMarker = settings[key];
                    break;
                case 'showXHoverValue':
                    showXHoverValue = settings[key];
                    break;
                case 'showXAxis':
                    showXAxis = settings[key];
                    break;
                case 'skewXAxis':
                    skewXAxis = settings[key];
                    break;
                case 'showYAxis':
                    showYAxis = settings[key];
                    break;
                case 'width':
                    width = parseInt(settings[key]);
                    break;
            }
        }
    }

    var chartWidth = 350,
        barHeight = 18,
        groupHeight = barHeight * alertsData.series.length,
        gapBetweenGroups = 8,
        spaceForLabels = 0,
        spaceForLegend = 160;

    var initalizeGraph = function (){
        if (width && width > chartWidth){
            chartWidth = parseInt(width * 0.6);
            spaceForLegend = width - chartWidth;
        }
            

        // Zip the series data together (first values, second values, etc.)
        var zippedData = [];
        for (var i = 0; i < alertsData.labels.length; i++) {
            for (var j = 0; j < alertsData.series.length; j++) {
                zippedData.push(alertsData.series[j].values[i]);
            }
        }

        // Color scale
        var color = d3.scale.category20();
        var chartHeight = barHeight * zippedData.length + gapBetweenGroups * alertsData.labels.length + 100;

        var x = d3.scale.linear()
            .domain([0, d3.max(zippedData)])
            .range([0, chartWidth]);

        var y = d3.scale.linear()
            .range([chartHeight + gapBetweenGroups, 0]);

        var yAxis = d3.svg.axis()
            .scale(y)
            .tickFormat('')
            .tickSize(0)
            .orient("left");

        // Specify the chart area and dimensions
        var chart = d3.select('#' + containerId)
            .attr("width", spaceForLabels + chartWidth + spaceForLegend)
            .attr("height", chartHeight);

        // Create bars
        var bar = chart.selectAll("g")
            .data(zippedData)
            .enter().append("g")
            .attr("transform", function (d, i) {
                return "translate(" + spaceForLabels + "," + ((i * barHeight + gapBetweenGroups * (0.5 + Math.floor(i / alertsData.series.length))) + 26) + ")";
                // return "translate(" + spaceForLegend + "," + ((i * barHeight + gapBetweenGroups * (0.5 + Math.floor(i / alertsData.series.length))) + 26) + ")";
            });

        // Create rectangles of the correct width
        bar.append("rect")
            .attr("fill", function (d, i) { return color(i % (alertsData.series.length)); })
            .attr("class", function (d, i) { return ("bar bar-" + i) })
            .attr("x", spaceForLegend)
            .attr("width", x)
            .attr("height", barHeight - 1);

        // Add text label in bar
        bar.append("text")
            // .attr("x", function (d) { return x(d) + spaceForLegend - 10; })
            .attr("x", function (d) { return spaceForLegend + 10; })
            .attr("y", barHeight / 2)
            .attr("fill", "red")
            .attr("dy", ".35em")
            .text(function (d) { return (d > 0 ? d: ''); });

        // Draw labels
        bar.append("text")
            //.attr("x", function (d) { return - 10; })
            // .attr("x", function (d) { return (chartWidth + spaceForLegend - 10); })
            .attr("x", function (d) { return (spaceForLegend - 10); })
            .attr("y", groupHeight / 2)
            .attr("dy", ".35em")
            .text(function (d, i) {
                if (i % alertsData.series.length === 0)
                    return alertsData.labels[Math.floor(i / alertsData.series.length)];
                else
                    return ""
            })
            .attr("class", function (d, i) {
                if (i % alertsData.series.length === 0)
                    return "label alert-" + alertsData.labels[Math.floor(i / alertsData.series.length)];
                else
                    return "label"
            });

        chart.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + spaceForLabels + ", " + -gapBetweenGroups / 2 + ")")
            .call(yAxis);

        // Draw legend
        var legendRectSize = 18,
            legendSpacing = 4;

        var legend = chart.selectAll('.legend')
            .data(alertsData.series)
            .enter()
            .append('g')
            .attr('transform', function (d, i) {
                var height = legendRectSize + legendSpacing;
                var offset = -gapBetweenGroups / 2;
                //var horz = spaceForLabels + chartWidth + 40 - legendRectSize;
                var horz = (i * 80) + 40;
                var vert = (i * 0) * height - offset;
                return 'translate(' + horz + ',' + vert + ')';
            });

        legend.append('rect')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .style('fill', function (d, i) { return color(i); })
            .style('stroke', function (d, i) { return color(i); });

        legend.append('text')
            .attr('class', 'legend')
            .attr('x', legendRectSize + legendSpacing)
            .attr('y', legendRectSize - legendSpacing)
            .text(function (d) { return d.label; });


        for (i = 0; i < alertsData.labels.length; i++) {
            var a = alertsData.series[0].values[i],
                b = alertsData.series[1].values[i];
            if (a > b) {
                $('.alert-' + alertsData.labels[i]).addClass('label-highlight');
                $('.bar-' + (i * 2)).addClass('bar-highlight');
                //label-highlight
            }

        }


        function startHighlight() {
            var interval = setInterval(changeHighlight, 3000);
        }
        function changeHighlight() {
            $('.bar-highlight').each(function () {
                var t = $(this);
                if (t.hasClass('bar-highlight2'))
                    t.removeClass('bar-highlight2').addClass('bar-highlight1')
                else
                    t.removeClass('bar-highlight1').addClass('bar-highlight2')
            });
            $('.label-highlight').each(function () {
                var t = $(this);
                if (t.hasClass('label-highlight2'))
                    t.removeClass('label-highlight2')
                else
                    t.addClass('label-highlight2')
            });
        }

        // startHighlight();
        // changeHighlight();
        
    };

    this.initalizeGraph = initalizeGraph;
};

var svgBarGraph = function (settings){
    
    var groupToAppendTo,
        graphData,
        margin = {top: 20, right: 20, bottom: 30, left: 50},
        width,
        height,
        isDateGraph = false,
        isTimeGraph = false,
        showLegend = true,
        textXAxis = false,
        showHoverMarker = true,
        showXHoverValue = false,
        showXAxis = true,
        skewXAxis = true,
        showYAxis = true,
        barColor = 'lime',
        yAxisLegendText = '', 

        svg,
        mainGroup,
        barsGroup,
        x,
        y,
        xAxis,
        yAxis;

    if (settings !== undefined) {
        for (var key in settings) {
            switch (key) {
                case 'groupToAppendTo':
                    groupToAppendTo = settings[key];
                    break;
                case 'graphData':
                    graphData = settings[key];
                    break;
                case 'margin':
                    margin = settings[key];
                    break;
                case 'width':
                    width = settings[key];
                    break;
                case 'height':
                    height = settings[key];
                    break;
                case 'timeOnly':
                    isTimeGraph = settings[key];
                    break;
                case 'dateGraph':
                    isDateGraph = settings[key];
                    break;
                case 'showLegend':
                    showLegend = settings[key];
                    break;
                case 'textXAxis':
                    textXAxis = settings[key];
                    break;
                case 'showHoverMarker':
                    showHoverMarker = settings[key];
                    break;
                case 'showXHoverValue':
                    showXHoverValue = settings[key];
                    break;
                case 'showXAxis':
                    showXAxis = settings[key];
                    break;
                case 'skewXAxis':
                    skewXAxis = settings[key];
                    break;
                case 'showYAxis':
                    showYAxis = settings[key];
                    break;
                case 'width':
                    width = parseInt(settings[key]);
                    break;
                case 'barColor':
                barColor = settings[key];
                    break;
                case 'yAxisLegendText':
                    yAxisLegendText = settings[key];
                    break;
            }
        }
    }

    // var	parseDate = d3.time.format("%b %d").parse;

    mainGroup = groupToAppendTo.append('g');
    mainGroup.append('rect').attr({
        'class': 'background',
        'width': width,
        'height': height
    });

    var axesGroup = mainGroup.append('g').attr('class', 'axes');
    barsGroup = mainGroup.append('g').attr('class', 'lines-group');

    var barWidth = width / (graphData.length + 1),
        xMin = d3.min(graphData, function (d) { return d.x; }),
        xMax = d3.max(graphData, function (d) { return d.x; }),
        yMin = d3.min(graphData, function (d) { return d.y; }),
        yMax = d3.max(graphData, function (d) { return d.y; });

    // y = d3.scale.log().base(yMax).range([height, 0]);
    // y = d3.scale.log().base(yMax + 100).range([height, 0]);
    y = d3.scale.log().range([height, 0]);
    //Math.E
    // y.domain([(yMin - 10), (yMax + 100)]);
    y.domain([1, (yMax + yMax)]);
    yAxis = d3.svg.axis().scale(y).orient('left').ticks(5, ".1s");
                             
    // Determine x variable and assign x & xAxis
    if (textXAxis) {
        x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
        x.domain(graphData.map(function (d) { return d.x; }));
        xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(graphData.length);
    }
    else if (isDateGraph && isTimeGraph) {
        x = d3.time.scale().range([0, width]);
        x.domain(d3.extent(graphData, function (d) { return new Date(d.x); }));
        xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(graphData.length).tickFormat(d3.time.format('%I:%M %p'));
    } else if (isDateGraph) {
        x = d3.time.scale().range([0, (width - barWidth)]);
        // xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(d3.time.days, 1).tickFormat(d3.time.format("%b %d"));
        xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(d3.time.days, 1).tickFormat(d3.time.format("%m / %d"));
        x.domain(d3.extent(graphData, function (d) { return new Date(d.x); }));

    } else {
        x = d3.scale.linear().range([0, (width - barWidth)]);
        x.domain(d3.extent(graphData, function (d) { return d.x; }));
        xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(graphData.length);
    }

    // Add the Axis's
    if (showXAxis) {
        var xAxisGroup = axesGroup.append('g').attr({ 'id': 'x-axis', 'class': 'x axis', 'transform': 'translate(' + (barWidth / 2) + ',' + height + ')' }).call(xAxis);
        if (skewXAxis) {
            xAxisGroup.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");
        }
    } else {
        axesGroup.append('g').attr({ 'class': 'x axis' })
            .append('line').attr({
                x1: 0,
                y1: height,
                x2: width,
                y2: height
            });
    }

    if (showYAxis) {
        axesGroup.append('g').attr({ 'id': 'y-axis', 'class': 'y axis', }).call(yAxis);
        axesGroup.selectAll('#y-axis .tick line').attr({
            'x1': -6,
            'x2': width,
            'stroke-dasharray': (barWidth / 4) + ',6'
        });
        var lastYText;
        axesGroup.selectAll('#y-axis .tick').each(function (){
            var g = d3.select(this);
            var gt = g.select('text').text();
            if (gt !== ''){
                lastYText = g.select('text');
                g.select('line').attr('fill', 'yellow');
                g.select('line').attr('stroke', 'yellow');
                g.select('line').attr('class', 'axis-line-yellow');
            }
        });
        lastYText.text(yAxisLegendText + ' ' + lastYText.text());
    }

    var divHover = d3.select("body").append("div")
        .attr("class", "tooltip beta-graph")
        .style("opacity", 0)
        .style("position", 'absolute')
        .style('left', 0)
        .style('top', 0);


    //  Adding 2 to the y and height so 0 values still appear on the bar graph
    barsGroup.selectAll('rect')
        .data(graphData)
        .enter()
        .append('rect')
        .attr({
            'id': function (d, i) { return 'bar-' + i },
            'class': 'bar',
            // 'x': function (d) { return x(new Date(d.x)); },
            // 'x': function (d) { return x(d.x); },
            'x': function (d) { return x(new Date(d.x)); },
            'y': function (d) { return height - (height - (y(d.y) - 2)) },
            'height': function (d) { return height - (y(d.y) - 2) },
            'width': barWidth,
            'fill': barColor,
            //'fill': function (d, i){ return color(i) },
            'opacity': 0.0,
            'stroke': barColor,
            'stroke-width': 4,
            'stroke-opacity': 0.0
        })
        .on("mouseover", function (d) {
            divHover.transition()
                .duration(200)
                .style("opacity", .9);
            var hoverText = d.x + "<br/>" + d.y;
            if (isDateGraph){
                hoverText = ghf_timeToDate(d.x) + "<br/>" + d.y;
            }
            divHover.html(hoverText)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            d3.select(this).transition().duration(200).attr({ 'stroke-opacity': 1.0, 'opacity': 0.8 });
        })
        .on("mouseout", function (d) {
            divHover.transition()
                .duration(500)
                .style("opacity", 0);
            d3.select(this).transition().duration(500).attr({ 'stroke-opacity': 0.0, 'opacity': 0.4 });
        });

    barsGroup.selectAll('rect')
        .transition()
        .duration(800)
        .attr({
            'y': function (d) { return y(d.y) - 2 },
            'height': function (d) { return height - (y(d.y) - 2) },
            'opacity': 0.4,
        });

    mainGroup.on("mouseover", function (d) {
            animateGraphs = false;
        })
        .on("mouseout", function (d) {
            animateGraphs = true;
        });

    
    function color(i) {
        
        var ourColors = ['fuchsia', 'lime', 'blue', 'red', 'orange', 'aqua'];
        
        var l = ourColors.length - 1;
        if (i > l) {
            return ourColors[(i % l)];
        }
        else {
            return ourColors[i];
        }
    }
     
}



        //  Multiple bar graph sets
        //
        //var sets = _graphData.length,
        //    barsPerSet = _graphData[0].length,
        //    barSpacing = width / ((sets * barsPerSet) + sets),
        //    offset = (((barSpacing * sets) / 2) * -1),
        //    barWidth = barSpacing - (barSpacing * 0.1);
        //
        //for (var i = 0; i < sets; i++) {
        //    for (var j = 0; j < barsPerSet; j++) {
        //        var xPosition = offset + (barSpacing * i) + x(_graphData[i][j].x);
        //        barsGroup.append('rect').attr({
        //            'id': _containerId + '-bar-' + i + '-' + j,
        //            'class': 'bar',
        //            'data-i': i,
        //            'x': xPosition,
        //            'y': height - y(_graphData[i][j].y),
        //            'height': y(_graphData[i][j].y),
        //            'width': barWidth,
        //            'fill': color(i)
        //        });
        //    }
        //}



        //var n = 4, // The number of series.
        //    m = 58; // The number of values per series.

        //// The xz array has m elements, representing the x-values shared by all series.
        //// The yz array has n elements, representing the y-values of each of the n series.
        //// Each yz[i] is an array of m non-negative numbers representing a y-value for xz[i].
        //// The y01z array has the same structure as yz, but with stacked [y₀, y₁] instead of y.
        //var xz = d3.range(m),
        //    yz = d3.range(n).map(function () { return bumps(m); }),
        //    //y01z = d3.stack().keys(d3.range(n))(d3.transpose(yz)),
        //    yMax = d3.max(yz, function (y) { return d3.max(y); });
        //    //y1Max = d3.max(y01z, function (y) { return d3.max(y, function (d) { return d[1]; }); });

        //var r = randomXY(0, 100, 0, 200, 50);
        ////console.log(r);

        // Set the dimensions of the canvas / graph

        //.data([
        //    "linear",
        //    "step-before",
        //    "step-after",
        //    "basis",
        //    "basis-open",
        //    "basis-closed",
        //    "cardinal",
        //    "cardinal-open",
        //    "cardinal-closed",
        //    "monotone"
        //])