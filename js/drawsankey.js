/**
 * Get the data frame
 * @param {Object} cluster:  current cluster/lineage of beadplot
 */
 function get_sankey_data(cindex) {

  var unsampled = document.getElementById("sankey-unsampled-option").checked;
  var community_transmission = document.getElementById("sankey-community-option").checked;

  var cluster = clusters[cindex];
  console.log(cluster)

  // Initialize graph from cluster data
  const graph = {
    "lineage"    : cluster.lineage,
    "label"      : ["unsampled"].concat(Object.keys(cluster.country)),
    "color"      : ["#c4c4c4"],
    "connection" : {},
    "link": {
      "source": [],
      "target": [],
      "value":  []
    }    
  };

  // Add colors absed on label (country) regions
  for (var i = 1; i < graph["label"].length; i++) {
    var country = graph.label[i];
    var region  = countries[country];
    var color   = country_pal[region];
    graph.color.push(color)
  } 

  for (edge of cluster.edges) {

    var source_node = edge[0];
    var target_node  = edge[1];
    var length      = edge[2];
    var bootstrap   = edge[3];

    var source_node_lower = source_node.toLowerCase();
    var target_node_lower = target_node.toLowerCase();
  

    // Should unsampled locations be included?
    if(unsampled == false && 
      (source_node_lower.includes("unsampled") || target_node_lower.includes("unsampled"))){
      continue;
    }

    // Retrieve country of source and target
    // hCoV-19/Country/Province-ID/Year    
    var source_country = "unsampled";
    var target_country = "unsampled";


    if(!source_node_lower.includes("unsampled")){

      collection_date = cluster.nodes[source_node][0][0]
      seq_name        = cluster.nodes[source_node][0][2]
      seq_name_array  = seq_name.split("/");
      source_country  = seq_name_array[1]
    }

    if(!target_node_lower.includes("unsampled")){

      collection_date = cluster.nodes[target_node][0][0]
      seq_name        = cluster.nodes[target_node][0][2]
      seq_name_array  = seq_name.split("/");
      target_country  = seq_name_array[1]
    }

    // Should community transmission be included?
    if(community_transmission == "false" && source_country == target_country){ continue; }
    // Unsampled community transmission is never shown
    if(source_country == target_country && source_country == "unsampled"){ continue; }

    // Add Country Labels to Graph
    if(!graph["label"].includes(source_country)){
      graph["label"].push(source_country);
    }
    if(!graph["label"].includes(target_country)){
      graph["label"].push(target_country);
    } 

    // Check if the link has been seen before in the graph
    var link_found = false;
    for (var i = 0; i < graph["link"]["source"].length; i++){
      if (graph["link"]["source"][i] == source_country && graph["link"]["target"][i] == target_country)
      {
        // If a match is found, increase the times (value) it was observed by 1
        graph["link"]["value"][i] += 1;
        link_found = true;
      }
    }

    // If a match wasn't found, add it
    if (link_found == false){
      graph["link"]["source"].push(source_country);
      graph["link"]["target"].push(target_country);
      graph["link"]["value"].push(1);
    }
  }

  /* Unique Color Scales
  var palette = ["#c4c4c4"];

  if(graph["label"].length <= 10){
    palette = d3.scaleOrdinal(d3.schemeCategory10);
  }
  else{
    palette = d3.scaleSequential()
                .domain([0, graph.label.length])
                .interpolator(d3.interpolateRainbow);
  }
  for (var i = 0; i < graph["label"].length; i++) {
    graph["color"].push(palette(i));
  }
  */

  // In graph, recode "source" and "target" as integers of labels
  for (var i = 0; i < graph["link"]["source"].length; i++){

    // Source
    country             = graph["link"]["source"][i];
    country_i           = graph["label"].indexOf(country);
    graph["link"]["source"][i] = country_i;

    // Target
    country             = graph["link"]["target"][i];
    country_i           = graph["label"].indexOf(country);
    graph["link"]["target"][i] = country_i;
    
  }

  // Remove the temporary connection property from graph
  delete graph.connection;
  
  return(graph);

}

/**
 * Get the data frame
 * @param {Object} graph:  pre-computed sankey graph data
 */
 function draw_sankey(graph) {

  // Bootstrap Slider
  /*
  let max_dist = 1.0;
  let slider = $("#bootstrap-slider");
  slider.slider("value", 0.5)
        .slider("option", "max", max_dist )
  move_arrow();
  $( "#bootstrap-custom-handle" ).text("2.0");
  */

  // Select Sankey Object
  svg_sankey = document.getElementById('svg-sankey');

  var data = {
      type: "sankey",
      orientation: "h",
          node: 
          {
              pad: 15,
              thickness: 30,
              line: {
                  color: "black",
                  width: 1
              },
              label: graph.label,
              color: graph.color,
          },  
          link: graph.link
    }
    
    var data = [data]
    
    var layout = {
      title : {
        text: graph.lineage,
        font: {
          size: 30,
          weight: "bold",
        },
        x: 0.5,
        y: 0.9,
      },
      font: {
        size: 10
      }
    }
    
    Plotly.react(svg_sankey, data, layout)

}