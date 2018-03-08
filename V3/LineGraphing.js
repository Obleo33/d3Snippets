
var lineGraph = function (settings) {
    
        this.graphData = [];
    
        var _graphData,
            _containerId,
            containerGroup,
            margin,
            width,
            height;
    
        var isDateGraph = false,
            isTimeGraph = false,
            showLegend = true,
            textXAxis = false,
            showSideBar = true,
            showHoverMarker = true,
            showXHoverValue = false,
            showXAxis = true,
            skewXAxis = true,
            gridXAxis = false,
            showYAxis = true,
            gridYAxis = false,
            interpolation = null,
    
            svg,
            mainGroup,
            valueline,
            area,
            x,
            y,
            xAxis,
            yAxis,
            linesGroup,
            bisector,
            lastHoverX,
            hoverLine,
            xValue;
    
    
        if (settings !== undefined) {
            for (var key in settings) {
                switch (key) {
                    case 'containerId':
                        _containerId = settings[key];
                        break;
                    case 'containerGroup':
                        containerGroup = settings[key];
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
                    case 'showSideBar':
                        showSideBar = settings[key];
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
                    case 'gridXAxis':
                        gridXAxis = settings[key];
                        break;
                    case 'gridYAxis':
                        gridYAxis = settings[key];
                        break;
                    case 'interpolation':
                        //  See end of file for Interpolation types
                        interpolation = settings[key];
                        break;
                }
            }
        }
    
        /******************************************************* Setters *******************************************************/
        this.containerId = function (containerId) {
            if (containerId !== undefined) {
                _containerId = containerId;
            }
            return _containerId;
        }
    
        this.graphTimeOnly = function (timeOnly) {
            if (timeOnly !== undefined) {
                isTimeGraph = timeOnly;
            }
            return isTimeGraph;
        }
    
        this.showLegend = function (show) {
            if (show !== undefined) {
                showLegend = show;
            }
            return showLegend;
        }
    
        this.initalizeLineGraph = function () {
            _graphData = this.graphData;
            setGraphSize();

            isDateGraph = checkVarForDate(_graphData[0][0].x);
            if (isTimeGraph) {
                changeDatesToTime();
            }
            if (containerGroup != null && containerGroup !== undefined){
                svg = containerGroup;
            } else {
                svg = d3.select('#' + _containerId)
                    .append('svg')
                    .attr({
                        'id': _containerId + '-lg',
                        'width': width + margin.left + margin.right,
                        'height': height + margin.top + margin.bottom,
                        'class': 'line-graph'
                    });
            }
    
            addGradients();
    
            //  Concatnate data for scaling
            var graphDataconcatenated = _graphData[0];
    
            for (var gdc = 1; gdc < _graphData.length; gdc++) {
                graphDataconcatenated = graphDataconcatenated.concat(_graphData[gdc]);
            }
    
            // Determine x variable and assign x & xAxis
            if (textXAxis) {
                x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
                x.domain(graphDataconcatenated.map(function (d) { return d.x; }));
                xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(15);
            }
            else if (isDateGraph && isTimeGraph) {
                x = d3.time.scale().range([0, width]);
                x.domain(d3.extent(graphDataconcatenated, function (d) { return new Date(d.x); }));
                xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(15).tickFormat(d3.time.format('%I:%M %p'));
            } else if (isDateGraph) {
                x = d3.time.scale().range([0, width]);
                x.domain(d3.extent(graphDataconcatenated, function (d) { return new Date(d.x); }));
                xAxis = d3.svg.axis().scale(x).orient('bottom').tickFormat(d3.time.format("%b %d"));
            } else {
                x = d3.scale.linear().range([0, width]);
                x.domain(d3.extent(graphDataconcatenated, function (d) { return d.x; }));
                xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(15);
            }
    
            if (gridXAxis) {
                xAxis.tickSize(-height, 0, 0);
            }
            
            y = d3.scale.linear().range([height, 0]);
            yAxis = d3.svg.axis().scale(y).orient('left').ticks(10);
    
            if (gridYAxis) {
                yAxis.tickSize(-width, 0, 0)
            }
    
            y.domain(d3.extent(graphDataconcatenated, function (d) { return parseInt(d.y); }));
    
            valueline = d3.svg.line()   
                .x(function (d) { return (isDateGraph ? x(new Date(d.x)) : x(d.x)); })
                .y(function (d) { return y(d.y); });
                
            if (interpolation !== null){
                valueline.interpolate(interpolation);
            }
    
            // area = d3.svg.area()
            //     .interpolate('step-before')
            //     .x(function (d) { return x(d.x); })
            //     .y1(function (d) { return y(d.y); })
            //     .y0(y(0));
    
            // Hover line.
            var hoverLineGroup = svg.append("g")
                .attr("class", "hover-line");
            hoverLine = hoverLineGroup
                .append("line")
                .attr("x1", 0).attr("x2", 0)
                .attr("y1", 0).attr("y2", height + margin.top).style("opacity", 1e-6);
    
    
            mainGroup = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
            linesGroup = mainGroup.append('g').attr('class', 'lines-group');
    
            for (var i = 0; i < _graphData.length; i++) {
                linesGroup.append('path').attr({
                    'id': _containerId + '-line-' + i,
                    'data-i': i,
                    'class': 'line',
                    'stroke': color(i),
                    'd': valueline(_graphData[i])
                });
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
    
    
            bisector = d3.bisector(function (d) { return d.x; }).left;
    
            if (showXHoverValue) {
                xValue = new xValue();
            }
    
            if (showHoverMarker) {
                // Add mouseover events.
                svg.on("mouseover", function () { })
                    .on("mousemove", function () {
                        if (textXAxis) {
                            var j;
                            for (j = 0; d3.mouse(this)[0] > (x.range()[j] + x.rangeBand()); j++) { }
                            //do nothing, just increment j until case fails
                            onMouseHover(d3.mouse(this)[0], x.domain()[j]);
                        } else {
                            onMouseHover(d3.mouse(this)[0]);
                        }
    
                    }).on("mouseout", function () {
                        //hoverLine.style("opacity", 1e-6);
                    });
            }
    
    
            if (showSideBar) { initiateSideBar(); }
            if (showLegend) { buildLegend(); }
        };
    
        function onMouseHover(mouseValue, text) {
            if (lastHoverX !== parseInt(mouseValue) && parseInt(mouseValue) > margin.left) {
                if (showXHoverValue) {
                    var xv = mouseValue;
                    if (!textXAxis) { xv = x.invert(mouseValue - margin.left); }
                    
                    if (textXAxis) {
                        xValue.update(text, mouseValue);
                    } else if (isTimeGraph) {
                        xValue.update(ghf_timeToHumanTime(xv), mouseValue);
                    } else if (isDateGraph) {
                        xValue.update(ghf_timeToHuman(xv), mouseValue);
                    }
                }
                lastHoverX = parseInt(mouseValue);
                hoverLine.attr("x1", mouseValue).attr("x2", mouseValue).style("opacity", 1);
                if (showSideBar) { updateSideBarText(x.invert(mouseValue - margin.left)); }
            }
        }
    
        var xValue = function () {
    
            var xValueGroup = svg.append('g').attr({
                'class': 'x-value-group tick',
                'transform': 'translate(' + (width - 200) + ',' + (height + margin.top + 20) + ')'
            });
    
            var text = xValueGroup.append('text').attr({}).text('');
    
            this.update = function (value, mouseValue) {
                if (value !== undefined) {
                    text.text(value);
                }
                if (mouseValue !== undefined) {
                    xValueGroup.attr({
                        'transform': 'translate(' + (mouseValue) + ',' + (height + margin.top + 20) + ')'
                    })
                }
            }
    
        }
    
        function initiateSideBar() {
            var sideBarGroup = mainGroup.append('g').attr({
                'class': 'side-bar-group',
                'transform': 'translate(-' + margin.left + ', 0)'
            });
    
            for (var i = 0; i < _graphData.length; i++) {
                var tg = sideBarGroup.append('g').attr('data-i', i);
                tg.style('opacity', 0);
                tg.append('path').attr({
                    'd': 'M 0 0 h 40 L 50 8 L 40 19 h -40 Z',
                    'style': 'fill: ' + color(i)
                });
                tg.append('text').attr({
                    x: 4,
                    y: 14,
                    'fill': '#fff'
                }).text('')
            }
        }
    
        function updateSideBarText(xValue) {
            svg.select('.side-bar-group').selectAll('g').each(function () {
    
                var dt = d3.select(this);
    
                try {
    
                    var ti = dt.attr('data-i');
    
                    dt.style('opacity', 1);
    
                    var b = bisector(_graphData[ti], xValue, 1),
                        d0 = _graphData[ti][b - 1],
                        d1 = _graphData[ti][b],
                        d = xValue - d0.x > d1.x - xValue ? d1 : d0,
                        disp = d.y;
    
                    try {
                        disp = d.y.toFixed(2);
                    } catch (e) {
    
                    }
    
                    dt.select('text').text(disp);
                    dt.transition().duration(200).attr({
                        'transform': 'translate(0, ' + (y(d.y) + 0) + ')'
                    });
                } catch (e) {
                    dt.style('opacity', 0);
                }
            });
        }
    
        function setGraphSize() {
            margin = { top: 30, right: 20, bottom: 80, left: 80 };
            try {
                var container = window.getComputedStyle(document.getElementById(_containerId)),
                    cWidth = parseInt(container.width.replace('px', '')),
                    cHeight = parseInt(container.height.replace('px', ''));
                
                width = cWidth - margin.left - margin.right;
                height = cHeight - margin.top - margin.bottom;

            } catch(exception){

            }
        }
    
        function addGradients() {
            var defs = svg.append('defs'),
                aGradient = defs.append('linearGradient')
                    .attr({
                        'id': 'a-gradient',
                        'x1': '0%',
                        'y1': '0%',
                        'x2': '0%',
                        'y2': '100%'
                    });
            aGradient.append('stop').attr({ 'offset': '0%', 'class': 'a-gradient-0' })
            aGradient.append('stop').attr({ 'offset': '100%', 'class': 'a-gradient-100' })
    
            var bGradient = defs.append('linearGradient')
                .attr({
                    'id': 'b-gradient',
                    'x1': '0%',
                    'y1': '0%',
                    'x2': '0%',
                    'y2': '100%'
                });
            bGradient.append('stop').attr({ 'offset': '0%', 'class': 'b-gradient-0' })
            bGradient.append('stop').attr({ 'offset': '100%', 'class': 'b-gradient-100' })
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
    
        function checkVarForDate(pass) {
            isDateGraph = false;
            try {
                if (typeof (pass.getMonth) === 'function') {
                    if (pass.getFullYear() > 2001) {
                        return true;
                    }
                }
            } catch (e) {
                e = null;
            }
            return false;
        }
    
        function timeOnly(dtPass) {
            var og = new Date(dtPass);
            return new Date('1970-02-01 ' + og.getHours() + ':' + og.getMinutes() + ':' + og.getSeconds());
        }
    
        function changeDatesToTime() {
            for (var gd = 0; gd < _graphData.length; gd++) {
                for (var gdc = 0; gdc < _graphData[gd].length; gdc++) {
                    var t = timeOnly(_graphData[gd][gdc].x);
                    _graphData[gd][gdc].x = t;
                }
            }
        }
    
        function buildLegend() {
            var legendGroup = svg.append('g').attr({
                'class': 'legend-group',
                'transform': 'translate(' + (margin.left + (20)) + ',' + (margin.top / 2) + ')'
            });
            for (var i = 0; i < _graphData.length; i++) {
                var l = legendGroup.append('g').attr({
                    'class': 'legend-item',
                    'transform': 'translate(0,' + (26 * i) + ')'
                });
    
                try {
                    l.append('text').attr({
                        'class': 'legend-text',
                        'transform': 'translate(14,4)'
                    }).text(_graphData[i][0].name);
                    l.append('circle').attr({
                        r: 10,
                        fill: color(i)
                    });
    
                } catch (e) {
    
                }
            }
    
            var bb = legendGroup.node().getBBox();
            legendGroup.append('rect').attr({
                'height': bb.height + 10,
                'width': bb.width + 10,
                'x': (bb.x + (bb.x * 0.5)),
                'y': (bb.y + (bb.y * 0.5))
            })
        }
    
        var webColors = ['#000', '#300', '#303', '#306', '#309', '#330', '#333', '#336', '#339', '#360', '#363', '#366', '#369', '#390', '#393', '#396', '#399', '#600', '#603', '#606', '#609', '#630', '#633', '#636', '#639', '#660', '#663', '#666', '#669', '#690', '#693', '#696', '#699', '#900', '#903', '#906', '#909', '#930', '#933', '#936', '#939', '#960', '#963', '#966', '#969', '#990', '#993', '#996', '#999', '#003', '#006', '#009', '#00C', '#00F', '#030', '#033', '#036', '#039', '#039', '#03C', '#03F', '#060', '#063', '#066', '#06C', '#06F', '#090', '#093', '#096', '#099', '#09C', '#09F', '#0C0', '#0C3', '#0C6', '#0C9', '#0CC', '#0CF', '#0F0', '#0F3', '#0F6', '#0F9', '#0FC', '#0FF', '#30C', '#30F', '#33C', '#33F', '#36C', '#36F', '#39C', '#39F', '#3C0', '#3C3', '#3C6', '#3C9', '#3CC', '#3CF', '#3F0', '#3F3', '#3F6', '#3F9', '#3FC', '#3FF', '#60C', '#60F', '#63C', '#63F', '#66C', '#66F', '#69C', '#69F', '#6C0', '#6C3', '#6C6', '#6C9', '#6CC', '#6CF', '#6F0', '#6F3', '#6F6', '#6F9', '#6FC', '#6FF', '#90C', '#90F', '#93C', '#93F', '#96C', '#96F', '#99C', '#99F', '#9C0', '#9C3', '#9C6', '#9C9', '#9CC', '#9CF', '#9F0', '#9F3', '#9F6', '#9F9', '#9FC', '#9FF', '#C00', '#C03', '#C06', '#C09', '#C0C', '#C0F', '#C30', '#C33', '#C36', '#C39', '#C3C', '#C3F', '#C60', '#C63', '#C66', '#C69', '#C6C', '#C6F', '#C90', '#C93', '#C96', '#C99', '#C9C', '#C9F', '#CC0', '#CC3', '#CC6', '#CC9', '#CCC', '#CCF', '#CF0', '#CF3', '#CF6', '#CF9', '#CFC', '#CFF', '#F00', '#F03', '#F06', '#F09', '#F0C', '#F0F', '#F30', '#F33', '#F36', '#F39', '#F3C', '#F3F', '#F60', '#F63', '#F66', '#F69', '#F6C', '#F6F', '#F90', '#F93', '#F96', '#F99', '#F9C', '#F9F', '#FC0', '#FC3', '#FC6', '#FC9', '#FCC', '#FCF', '#FF0', '#FF3', '#FF6', '#FF9', '#FFC', '#FFF'];
    
        var ourColors = ['fuchsia', 'lime', 'blue', 'red', 'orange', 'aqua'];
    
        function color(i) {
            var cs = ourColors;
            if (_graphData.length > 11) {
                cs = webColors;
            }
            
            var l = cs.length - 1;
            if (i > l) {
                return cs[(i % l)];
            }
            else {
                return cs[i];
            }
        }
        
        function webColor(i) {
            var l = webColors.length - 1;
            if (i > l) {
                return webColors[(i % l)];
            }
            else {
                return webColors[i];
            }
        }
    };
    
var svgLineGraph = function (settings){
    
        var graphData,
            groupToAppendTo,
            margin = {top: 20, right: 20, bottom: 30, left: 50},
            width,
            height;
    
        var isDateGraph = false,
            isTimeGraph = false,
            showXAxis = true,
            gridXAxis = false,
            showYAxis = true,
            gridYAxis = false,
            interpolation = null,
            graphContainer,
            lineColor = 'lime',
            area,
            x,
            y,
            xAxis,
            yAxis,
            valueline;
    
        if (settings !== undefined) {
            for (var key in settings) {
                switch (key) {
                    case 'graphData':
                        graphData = settings[key];
                        break;
                    case 'groupToAppendTo':
                        groupToAppendTo = settings[key];
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
                    case 'showXAxis':
                        showXAxis = settings[key];
                        break;
                    case 'showYAxis':
                        showYAxis = settings[key];
                        break;
                    case 'gridXAxis':
                        gridXAxis = settings[key];
                        break;
                    case 'gridYAxis':
                        gridYAxis = settings[key];
                        break;
                    case 'interpolation':
                        interpolation = settings[key];
                        break;
                    case 'lineColor':
                        lineColor = settings[key];
                        break;
                }
            }
        }

        graphContainer = groupToAppendTo.append('g').attr('class', 'line-graph');
        graphContainer.append('rect').attr({
            'class': 'background',
            'width': width,
            'height': height
        })

        // Set the ranges
        x = d3.time.scale().range([0, width]);
        y = d3.scale.linear().range([height, 0]);

        // Define the axes
        xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(5);
        yAxis = d3.svg.axis().scale(y).orient('left').ticks(5);

        // Define the line
        valueline = d3.svg.line()
                      .x(function(d) { return x(d.x); })
                      .y(function(d) { return y(d.y); });

        // Scale the range of the data
        x.domain(d3.extent(graphData, function(d) { return d.x; }));
        y.domain(d3.extent(graphData, function(d) { return d.y; }));
        
        // Add the valueline path.
        graphContainer.append("path")
            .attr("class", "line")
            .attr('stroke', lineColor)
            .attr("d", valueline(graphData));
            
        // Add the X Axis
        if (showXAxis){
            graphContainer.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + height + ')')
                .call(xAxis);
        }

        // Add the Y Axis
        if (showYAxis){
            graphContainer.append("g")
                .attr("class", "y axis")
                .call(yAxis);
        }
    };
    
    

    /********************************************************************************************* Interpolation types ***************************************/
    // linear           - piecewise linear segments, as in a polyline.
    // linear-closed    - close the linear segments to form a polygon.
    // step-before      - alternate between vertical and horizontal segments, as in a step function.
    // step-after       - alternate between horizontal and vertical segments, as in a step function.
    // basis            - a B-spline, with control point duplication on the ends.
    // basis-open       - an open B-spline; may not intersect the start or end.
    // basis-closed     - a closed B-spline, as in a loop.
    // bundle           - equivalent to basis, except the tension parameter is used to straighten the spline.
    // cardinal         - a Cardinal spline, with control point duplication on the ends.
    // cardinal-open    - an open Cardinal spline; may not intersect the start or end, but will intersect other control points.
    // cardinal-closed  - a closed Cardinal spline, as in a loop.
    // monotone         - cubic interpolation that preserves monotonicity in y.

            