/**
 *  Configure SVG to display beadplots
 */

var marginB = {top: 50, right: 10, bottom: 50, left: 10},
    widthB = document.getElementById("svg-sankey").clientWidth - marginB.left - marginB.right,
    heightB = 1000 - marginB.top - marginB.bottom;

var visB = d3.select("div#svg-sankey")
            .append("svg")
            .attr("width", widthB + marginB.left + marginB.right)
            .attr("height", heightB + marginB.top + marginB.bottom)
            .append("g");

/**
 * Get sankey data for the current lineage
 */
function parse_sankey_edge(edge, cluster, country_filter=null, date_filter=null) {

  // Check for parameters in the Sankey GUI Panel
  var unsampled              = document.getElementById("sankey-unsampled-option").checked;
  var community_transmission = document.getElementById("sankey-community-option").checked;
  var multiple_sources       = document.getElementById("sankey-multiple-source-option").checked;

  // Initialize sankey graph
  const connection = {
    "source_country" : "",
    "target_countries" : []
  }

  // Extract statistics and metadata for the edge
  var source_node = edge[0];
  var target_node = edge[1];
  var length      = edge[2];
  var bootstrap   = edge[3];


  // Should unsampled locations be included?
  if(unsampled == false && (source_node.includes("unsampled") || target_node.includes("unsampled"))){
    return connection
  }

  // Never include community transmission in unsampled locations!
  if(source_node.includes("unsampled") && target_node.includes("unsampled")){ 
    return connection; 
  }    

  // Option 1: Single Source to Single Target
  // Option 2: Single Source to Multiple Targets
  // Option 3: Multiple Sources to Single Target
  // Option 4: Multiple Sources to Multiple Targets

  var source_country = "";
  var target_countries = [];
  var sequences, collection_date, seq_name, seq_name_array, target_country;    

  // Parse the geographic location of the source node
  if(!source_node.includes("unsampled")){

    sequences = cluster.nodes[source_node];

    // Shuold we include multiple source locations?
    if (multiple_sources == false && sequences.length > 1){ 
      return connection; 
    }
    //if (sequences.length > 1){ continue; }

    collection_date = sequences[0][0];
    seq_name        = sequences[0][2];
    seq_name_array  = seq_name.split("/");
    source_country  = seq_name_array[1];
  }
  else{
    source_country = "unsampled";
  }

  // Parse the geographic location of the target node(s)
  if(!target_node.includes("unsampled")){

    sequences = cluster.nodes[target_node];

    // We are allowing multiple target locations
    for (seq of sequences){

      collection_date = seq[0]
      seq_name        = seq[2]
      seq_name_array  = seq_name.split("/");
      target_country  = seq_name_array[1];

      
      // Should community transmission be excluded?
      if (community_transmission == false && source_country == target_country){ continue; }

      // Add the current country to the array of target locations
      target_countries.push(target_country)

    }
  }
  else{
    target_countries.push("unsampled");
  }  

  // Should we parse based on a target country
  if (country_filter != null){
    if (source_country == country_filter || target_countries.includes(country_filter)){
      connection["source_country"] = source_country;
      connection["target_countries"] = target_countries;
    }
    else{ return connection;}
  }

  connection["source_country"] = source_country;
  connection["target_countries"] = target_countries;

  return connection;

 }

 /**
 * Add connection to sankey graph
 */
 function add_sankey_connection(graph, connection){

  // Add these sources and targets to the graph links
  // First iterate through all the targets
  for (target_country of connection.target_countries){
    // Next iterate through all links that have been recorded in the graph
    var link_found = false;

    for (var i = 0; i < graph["link"]["source"].length; i++){
      if (graph["link"]["source"][i] == connection.source_country && graph["link"]["target"][i] == target_country)
      {
        // If a match is found, increase the times (value) it was observed by 1
        graph["link"]["value"][i] += 1;
        link_found = true;
      }
    }      
    
    // If a match wasn't found, we add it
    if (link_found == false){
      graph["link"]["source"].push(connection.source_country);
      graph["link"]["target"].push(target_country);
      graph["link"]["value"].push(1);
    }

  }
 }

/**
 * Recode labels in sankey graph to integers
 */
function recode_sankey_graph(graph){

  // In the graph, recode "source" and "target" as integers of labels
  // The sankey function in plotly requires this to be numeric
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

}


/**
 * Get sankey data for the current lineage
 */
function get_sankey_lineage_data(graph) {

  // Check for parameters in the Sankey GUI Panel
  var unsampled = document.getElementById("sankey-unsampled-option").checked;

  // Extract the cluster based on the current index
  var cluster   = clusters[cindex];

  // Use the lineage of the cluster
  graph.lineage = cluster.lineage;

  // If plotting unsampled locations, add those to labels and colors
  // #c4c4c4 is a light grey for unsampled locations
  if (unsampled == true){
    graph.label.push("unsampled");
    graph.color.push("#c4c4c4")
  }

  // Add the country labels for the cluster
  var country_labels = Object.keys(cluster.country);
  graph.label        = graph.label.concat(country_labels);

  // Add colors based on label (country) regions
  for (var i = 0; i < graph.label.length; i++) {

    // Skip mapping unsampled locations
    if (graph.label[i] == "unsampled"){ continue; }

    // Figure out which region the country maps to.
    var country = graph.label[i];
    var region  = countries[country];
    var color   = country_pal[region];
    graph.color.push(color)
  } 

  // Iterate through all edges (connections/migrations)
  for (edge of cluster.edges) {

    connection       = parse_sankey_edge(edge, cluster);
    if (connection.source_country == ""){ continue; }
    add_sankey_connection(graph, connection);

  }
  // At this point, we have fully recorded all links from sources to targets
  recode_sankey_graph(graph);

  return graph;

}

/**
 * Get sankey data for a country
 */
function get_sankey_country_data(graph) {

  // Check for parameters in the Sankey GUI Panel
  var unsampled = document.getElementById("sankey-unsampled-option").checked;

  var country_filter = "Canada";

  graph.lineage = "Canada<br>All Lineages";

  // If plotting unsampled locations, add those to labels and colors
  // #c4c4c4 is a light grey for unsampled locations
  if (unsampled == true){
    graph.label.push("unsampled");
    graph.color.push("#c4c4c4")
  }  

  // Iterate through ALL the lineages (ie. clusters)
  for (cluster of clusters){

    //if (cluster.lineage != "C.36.3"){ continue; }

    // Iterate through all edges (connections/migrations)
    for (edge of cluster.edges) {

      connection = parse_sankey_edge(edge, cluster, country_filter);
      if (connection.source_country == ""){ continue; }
      add_sankey_connection(graph, connection);

      // Update country labels
      if (!graph.label.includes(connection.source_country)){
        graph.label.push(connection.source_country);
      }
      for (target_country of connection.target_countries){
        if (!graph.label.includes(target_country)){
          graph.label.push(target_country);
        }        
      }    

    } 

  }

  // At this point, we have fully recorded all links from sources to targets
  recode_sankey_graph(graph);

  // Add colors based on label (country) regions
  for (var i = 0; i < graph.label.length; i++) {

    // Skip mapping unsampled locations
    if (graph.label[i] == "unsampled"){ continue; }

    // Figure out which region the country maps to.
    var country = graph.label[i];
    var region  = countries[country];
    var color   = country_pal[region];
    graph.color.push(color)
  }  


  return graph;   

}

/**
 * Draw the sankey diagram
 */
 function draw_sankey() {

  // Initialize sankey graph
  var graph = {
    "lineage"    : "",
    "label"      : [],
    "color"      : [],
    "link": {
      "source": [],
      "target": [],
      "value":  []
    }    
  };

  var sankey_country_view = document.getElementById("sankey-country-view").checked;
  if (sankey_country_view == true){
    graph = get_sankey_country_data(graph);
  }
  else{
    graph = get_sankey_lineage_data(graph);
  }

  // Select Sankey Object
  svg_sankey = document.getElementById('svg-sankey');

  var data = [{
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
    }]
    
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