/**
 * @author v.lugovksy
 * created on 16.12.2015
 */
(function() {
    'use strict';

    angular.module('ROA.theme.directives')
        .directive('linearChart', linearChart);

    /** @ngInject */
    function linearChart($compile, $filter) {


        return {
            restrict: 'EA',

            link: function(scope, elem, attrs) {

                var root, margin, x, y, treemap, svg, color, grandparent,
                    width, height, formatNumber, transitioning, tooltip;

                scope.loadTreeMap = function(treemapData) {
                    d3.select("svg").remove();
                    root = treemapData;
                    margin = {
                        top: 20,
                        right: 0,
                        bottom: 0,
                        left: 0
                    },
                    width = elem.width(),
                    height = 500 - margin.top - margin.bottom,
                    formatNumber = d3.format(",d"),
                    transitioning;

                    /* create x and y scales */
                    x = d3.scale.linear()
                        .domain([0, width])
                        .range([0, width]);

                    y = d3.scale.linear()
                        .domain([0, height])
                        .range([0, height]);

                    treemap = d3.layout.treemap()
                        .children(function(d, depth) {
                            return depth ? null : d._children;
                        })
                        .sort(function(a, b) {
                            return a.value - b.value;
                        })
                        .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
                        .round(false);

                    /* create svg */
                    svg = d3.select("#treemap_chart").append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.bottom + margin.top)
                        .style("margin-left", -margin.left + "px")
                        .style("margin.right", -margin.right + "px")
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                        .style("shape-rendering", "crispEdges");

                    /**
                   * tooltip
                   */
                  tooltip = d3.select(elem[0])
                      .append("div")
                      .classed("tooltip", true)
                      .text("a simple tooltip");

                    color = d3.scale.category20c();

                    grandparent = svg.append("g")
                        .attr("class", "grandparent");

                    grandparent.append("rect")
                        .attr("y", -margin.top)
                        .attr("width", width)
                        .attr("height", margin.top);

                    grandparent.append("text")
                        .attr("x", 6)
                        .attr("y", 6 - margin.top)
                        .attr("dy", ".75em");

                    initialize(root);
                    accumulate(root);
                    layout(root);
                    display(root);
                };

                function initialize(root) {
                    root.x = root.y = 0;
                    root.dx = width;
                    root.dy = height;
                    root.depth = 0;
                }

                // Aggregate the values for internal nodes. This is normally done by the
                // treemap layout, but not here because of the custom implementation.
                function accumulate(d) {
                    return (d._children = d.children) ? d.value = d.children.reduce(function(p, v) {
                        return p + accumulate(v);
                    }, 0) : d.value;
                }

                function setTooltip(tooltip, d) {                    
                    tooltip[0][0].innerHTML = 
                      ['<b>'+d.name+'</b><br>',
                      $filter('currency')(d.value, '', 0)+' | '+$filter('currency')(d.value_percent, '', 2)+'% '+d.text_value_percent+' <br>',
                      $filter('currency')(d.budget, $rootScope.userSettings.currency, 2) +' | ' + $filter('currency')(d.budget_percent, '', 2) +'% of total budget <br>',
                      $filter('currency')(d.conversion_value, $rootScope.userSettings.currency, 2) + ' | ' + $filter('currency')(d.conversion_percent, '', 2) + ' from total '+d.conversion_text].join('\n');
                }

                // Compute the treemap layout recursively such that each group of siblings
                // uses the same size (1×1) rather than the dimensions of the parent cell.
                // This optimizes the layout for the current zoom state. Note that a wrapper
                // object is created for the parent node for each group of siblings so that
                // the parent’s dimensions are not discarded as we recurse. Since each group
                // of sibling was laid out in 1×1, we must rescale to fit using absolute
                // coordinates. This lets us use a viewport to zoom.
                function layout(d) {
                    if (d._children) {
                        treemap.nodes({
                            _children: d._children
                        });
                        d._children.forEach(function(c) {
                            c.x = d.x + c.x * d.dx;
                            c.y = d.y + c.y * d.dy;
                            c.dx *= d.dx;
                            c.dy *= d.dy;
                            c.parent = d;
                            layout(c);
                        });
                    }
                }

                /* display shows the treemap and writes the embedded transition function */
                function display(d) {
                    /* create grandparent bar at top */
                    grandparent
                        .datum(d.parent)
                        .on("click", transition)
                        .select("text")
                        .text(name(d));

                    var g1 = svg.insert("g", ".grandparent")
                        .datum(d)
                        .attr("class", "depth");

                    /* add in data */
                    var g = g1.selectAll("g")
                        .data(d._children)
                        .enter().append("g");



                    /* transition on child click */
                    g.filter(function(d) {
                        return d._children;
                    })
                        .classed("children", true)
                        .on("click", transition);

                    /* write children rectangles */
                    g.selectAll(".child")
                        .data(function(d) {
                            return d._children || [d];
                        })
                        .enter().append("rect")
                        .attr("class", "child")
                        .call(rect)
                        .append("title")
                        .text(function(d) {
                            return d.name + " " + formatNumber(d.value);
                        });


                    /* write parent rectangle */
                    g.append("rect")
                        .attr("class", "parent")
                        .on("mouseover", function(d) {
                            setTooltip(tooltip, d);
                            return tooltip.style("visibility", "visible");
                        })
                        .on("mousemove", function() {
                            var coordinates = [0, 0];
                            coordinates = d3.mouse(this);
                            var x = coordinates[0];
                            var y = coordinates[1];

                            return tooltip
                                .style("top", y + 40 + "px")
                                .style("left", x + 35 + "px");
                        })
                        .on("mouseout", function() {
                            return tooltip.style("visibility", "hidden");
                        })
                        .call(rect)
                        .append("title")
                        .text(function(d) {
                            return d.name + " " + formatNumber(d.value);
                        }); /*should be d.value*/


                    /* Adding a foreign object instead of a text object, allows for text wrapping */
                    g.append("foreignObject")
                        .call(rect)
                        .attr("class", "foreignobj")
                        .append("xhtml:div")
                        .attr("dy", ".75em")
                        .html(function(d) {
                            return d.name;
                        })
                        .attr("class", "textdiv"); //textdiv class allows us to style the text easily with CSS

                    /* create transition function for transitions */
                    function transition(d) {
                        if (transitioning || !d) return;
                        transitioning = true;

                        scope.loadBarChart(d._children);

                        var g2 = display(d),
                            t1 = g1.transition().duration(750),
                            t2 = g2.transition().duration(750);

                        // Update the domain only after entering new elements.
                        x.domain([d.x, d.x + d.dx]);
                        y.domain([d.y, d.y + d.dy]);

                        // Enable anti-aliasing during the transition.
                        svg.style("shape-rendering", null);

                        // Draw child nodes on top of parent nodes.
                        svg.selectAll(".depth").sort(function(a, b) {
                            return a.depth - b.depth;
                        });

                        // Fade-in entering text.
                        g2.selectAll("text").style("fill-opacity", 0);
                        g2.selectAll("foreignObject div").style("display", "none"); /*added*/

                        // Transition to the new view.
                        t1.selectAll("text").call(text).style("fill-opacity", 0);
                        t2.selectAll("text").call(text).style("fill-opacity", 1);
                        t1.selectAll("rect").call(rect);
                        t2.selectAll("rect").call(rect);

                        t1.selectAll(".textdiv").style("display", "none"); /* added */
                        t1.selectAll(".foreignobj").call(foreign); /* added */
                        t2.selectAll(".textdiv").style("display", "block"); /* added */
                        t2.selectAll(".foreignobj").call(foreign); /* added */

                        // Remove the old node when the transition is finished.
                        t1.remove().each("end", function() {
                            svg.style("shape-rendering", "crispEdges");
                            transitioning = false;
                        });

                    } //endfunc transition

                    return g;
                } //endfunc display

                function text(text) {
                    text.attr("x", function(d) {
                        return x(d.x) + 6;
                    })
                        .attr("y", function(d) {
                            return y(d.y) + 6;
                        });
                }



                function rect(rect) {
                    rect.attr("x", function(d) {
                        return x(d.x);
                    })
                        .attr("y", function(d) {
                            return y(d.y);
                        })
                        .attr("width", function(d) {
                            return x(d.x + d.dx) - x(d.x);
                        })
                        .attr("height", function(d) {
                            return y(d.y + d.dy) - y(d.y);
                        })
                        .style("background", function(d) {
                            return d.parent ? color(d.name) : null;
                        });
                }

                function foreign(foreign) { /* added */
                    foreign.attr("x", function(d) {
                        return x(d.x);
                    })
                        .attr("y", function(d) {
                            return y(d.y);
                        })
                        .attr("width", function(d) {
                            return x(d.x + d.dx) - x(d.x);
                        })
                        .attr("height", function(d) {
                            return y(d.y + d.dy) - y(d.y);
                        });
                }

                function name(d) {
                    return d.parent ? name(d.parent) + "." + d.name : d.name;
                }
            }
        }

    }
})();