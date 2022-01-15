svg_sankey = document.getElementById('svg-sankey');

var palette= d3.scaleOrdinal(d3.schemeCategory10);

var data = {
    type: "sankey",
    orientation: "h",
        node: 
        {
            pad: 15,
            thickness: 30,
            line: {
                color: "black",
                width: 0.5
            },
            label: ["Canada","USA","Mexico"],
            color: [palette(1),palette(2),palette(3),]
        },  
        link: {
            source: [0,1],
            target: [1,2],
            value:  [2,4]
        }
  }
  
  var data = [data]
  
  var layout = {
    title: "Basic Sankey",
    font: {
      size: 10
    }
  }
  
  Plotly.react(svg_sankey, data, layout)