// Load your JSON data
d3.json("https://raw.githubusercontent.com/bossbossleu/eb5/main/data/eb5_NY.json").then(function (originalData) {
  // Define margins
  var margin = { top: 120, right: 300, bottom: 60, left: 270 }; // Adjust as needed

  // Define the dimensions for the parallel categories diagram
  var dimensions = ["r_name", "p_name", "developer_1", "arch_firm_1"];

  // Replace null values and "N/A" values with "NA" and label sequential "NA"
  var data = JSON.parse(JSON.stringify(originalData)); // Clone the original data
  var naCounter = 0;
  data.forEach(function (d) {
    dimensions.forEach(function (dimension) {
      if (d[dimension] === null || d[dimension] === "N/A") {
        d[dimension] = "NA " + (++naCounter);
      }
    });
  });

  // Create the parallel categories diagram
  var width = 1920, height = 1080; // Adjust as needed

  // Append an SVG element to the myDiv container
  var svg = d3.select("#myDiv").append("svg")
    .attr("width", width)
    .attr("height", height);

  var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scalePoint()
    .domain(dimensions)
    .range([0, width - margin.left - margin.right]);

  var y = {};

  dimensions.forEach(function (dimension) {
    y[dimension] = d3.scalePoint()
      .domain(Array.from(new Set(data.map(function (d) { return d[dimension]; }))).reverse()) // Reverse the domain array
      .range([height - margin.top - margin.bottom, 0]);
  });

  var line = d3.line()
    .defined(function (d) { return d[1] !== undefined; })
    .x(function (d) { return x(d[0]); })
    .y(function (d) { return y[d[0]](d[1]); });

  // Loop through each dimension pair and draw connecting lines
  for (var i = 0; i < dimensions.length - 1; i++) {
    var currentDimension = dimensions[i];
    var nextDimension = dimensions[i + 1];

    g.selectAll(".dimension-path-" + currentDimension)
      .data(data)
      .enter().append("path")
      .attr("class", "dimension-path-" + currentDimension)
      .attr("d", function (d) {
        var dataSegment = dimensions.slice(i, i + 2).map(function (dimension) {
          return [dimension, d[dimension]];
        });
        return line(dataSegment);
      })
      .attr("stroke", function (d) {
        if (d[currentDimension].startsWith("NA") || d[nextDimension].startsWith("NA")) {
          return "lightgrey";
        } else {
          return "darkgrey";
        }
      })
      .attr("stroke-opacity", function (d) {
        if (d[currentDimension].startsWith("NA") || d[nextDimension].startsWith("NA")) {
          return 0;
        } else {
          return 0.5;
        }
      })
      .attr("fill", "none");
  }

  // Append dimension titles above the diagram
  g.selectAll(".dimension-title")
    .data(["Regional Center", "Project/Building", "Developer", "Architectural Firm"])
    .enter().append("text")
    .attr("class", "dimension-title")
    .attr("x", function (d, i) {
      return x(dimensions[i]);
    })
    .attr("y", -20) // Adjust the vertical position as needed
    .text(function (d) { return d; }); // Display the dimension titles

  // Draw axes
  g.selectAll(".dimension")
    .data(dimensions)
    .enter().append("g")
    .attr("class", "dimension")
    .attr("transform", function (d) { return "translate(" + x(d) + ")"; })
    .each(function (d) {
      var tickCounts = {}; // Object to store tick counts for each unique value
      data.forEach(function (item) {
        var value = item[d];
        tickCounts[value] = (tickCounts[value] || 0) + 1;
      });

      d3.select(this).call(d3.axisRight(y[d]))
        .selectAll(".tick")
        .each(function (tickValue) {
        });

      d3.select(this).selectAll("path")
        .style("opacity", 0);

      // Adjust the 'x' attribute for text elements based on the dimension name 'd'
      d3.select(this).selectAll("text")
        .attr("class", "dimension-label")
        .attr("x", function () {
          if (d === "r_name") {
            // For the "r_name" dimension, set it to x: -30 and text-anchor to 'end' for right alignment
            d3.select(this).attr("text-anchor", "end");
            return -30;
          } else {
            // For other dimensions, set x: 15 and keep text-anchor as 'start'
            d3.select(this).attr("text-anchor", "start");
            return 15;
          }
        });
    });

  // Adjust opacity for text labels starting with "NA"
  g.selectAll(".dimension text")
    .style("opacity", function (d) {
      if (d.startsWith("NA")) {
        return 0;
      } else {
        return 1;
      }
    });

  // Append circles for nodes
  dimensions.forEach(function (currentDimension) {
    var circles = g.selectAll(".node-circle-" + currentDimension)
      .data(data)
      .enter().append("circle")
      .attr("class", "node-circle node-circle-" + currentDimension)
      .attr("cx", x(currentDimension))
      .attr("cy", function (d) { return y[currentDimension](d[currentDimension]); })
      .attr("data-dimension", currentDimension)
      .attr("data-value", function (d) { return d[currentDimension]; })
      .attr("r", function (d) {
        var valueCount = data.filter(function (item) {
          return item[currentDimension] === d[currentDimension];
        }).length;
        return valueCount * 2;
      })
      .style("fill", "white")
      .style("stroke", "black")
      .style("stroke-width", "1px")
      .on("click", function (event, d) {
        handleCircleClick(this); // Pass the clicked circle element
      });
  });

  // Create an array to store all possible routes
  var allRoutes = [];

  // Generate all possible routes
  for (var i = 0; i < data.length; i++) {
    for (var j = 0; j < data.length; j++) {
      if (i !== j) {
        var route = {};
        dimensions.forEach(function (dimension) {
          route[dimension] = data[i][dimension];
        });
        allRoutes.push(route);
      }
    }
  }

  // Remove duplicate routes by converting the array to a Set and back to an array
  allRoutes = Array.from(new Set(allRoutes.map(JSON.stringify))).map(JSON.parse);

  console.log(allRoutes);

  // Function to handle circle click
  function handleCircleClick(clickedCircle) {
    // Get the clicked circle's value using the data-value attribute
    var clickedValue = clickedCircle.getAttribute("data-value");
    console.log("Clicked Value:", clickedValue);

    // Get the data-dimension attribute from the clicked circle
    var currentDimension = clickedCircle.getAttribute("data-dimension");

    // Clear the color of all circles and paths before updating
    dimensions.forEach(function (currentDimension, i) {
      var nextDimension = dimensions[i + 1];

      // Clear the color of circles for the selected route
      g.selectAll(".node-circle-" + currentDimension)
        .style("fill", "white")
        .style("stroke", "black");

      // Clear the color of paths for the selected route and dimension
      g.selectAll(".dimension-path-" + currentDimension)
        .attr("stroke", function (d) {
          if (d[currentDimension].startsWith("NA") || d[nextDimension].startsWith("NA")) {
            return "lightgrey"; // Set it to the color for NA values in the current dimension
          } else {
            return "darkgrey"; // Set it to the default color for other values
          }
        })
        .attr("stroke-opacity", function (d) {
          if (d[currentDimension].startsWith("NA") || d[nextDimension].startsWith("NA")) {
            return 0; // Set it to the opacity for NA values in the current dimension
          } else {
            return 0.5; // Set it to the default opacity for other values
          }
        })
        .attr("fill", "none");
    });


    // Filter routes based on the clicked value
    var selectedRoutes = allRoutes.filter(function (route) {
      return route[currentDimension] === clickedValue;
    });

    console.log("Selected Routes:", selectedRoutes);

    // Update connected elements and color the selected routes
    updateConnectedElements(selectedRoutes);
  }

  // Function to update connected elements and color the selected routes
  function updateConnectedElements(selectedRoutes) {
    // Iterate through the selected routes
    selectedRoutes.forEach(function (route) {
      dimensions.forEach(function (currentDimension) {
        var currentDimensionValue = route[currentDimension];

        // Update the color of circles for the selected route
        g.selectAll(".node-circle-" + currentDimension)
          .filter(function (d) {
            return d[currentDimension] === currentDimensionValue;
          })
          .style("fill", "red")
          .style("stroke", "red");

        // Update the color of paths for the selected route and dimension
        g.selectAll(".dimension-path-" + currentDimension)
          .filter(function (d) {
            // Check if the path's datum matches the selected route
            var pathDatum = {
              r_name: d.r_name,
              p_name: d.p_name,
              developer_1: d.developer_1,
              arch_firm_1: d.arch_firm_1
            };
            return (
              d[currentDimension] === currentDimensionValue &&
              JSON.stringify(pathDatum) === JSON.stringify(route)
            );
          })
          .attr("stroke", "red")
          .attr("stroke-opacity", 0.5)
          .attr("fill", "none");

        // Log to check if circles and paths are updated to red
        console.log("Circles updated to red:", currentDimension);
        console.log("Paths updated to red:", currentDimension);
      });
    });
  }


// Create a tooltip element and append it to the body
var tooltip = document.createElement("div");
tooltip.setAttribute("class", "tooltip");
document.body.appendChild(tooltip);

// Select the circle and text elements to add the tooltip to
var circles = document.querySelectorAll(".node-circle");

circles.forEach(function (circle) {
  circle.addEventListener("mouseover", function (event) {
    // Set the tooltip content for circles
    tooltip.textContent = circle.getAttribute("data-value");

    // Calculate the position for the tooltip
    var tooltipX = event.pageX + 10; // 10px to the right
    var tooltipY = event.pageY - 10; // 10px above

    // Position the tooltip
    tooltip.style.left = tooltipX + "px";
    tooltip.style.top = tooltipY + "px";

    // Show the tooltip
    tooltip.style.display = "block";
  });

  circle.addEventListener("mouseout", function () {
    // Hide the tooltip for circles
    tooltip.style.display = "none";
  });
});

});





























































