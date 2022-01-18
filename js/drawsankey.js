/**
 * Get the data frame
 * @param {Object} cluster:  current cluster/lineage of beadplot
 */
 function get_sankey_data(cindex) {

  // Check for parameters in the Sankey GUI Panel
  var unsampled              = document.getElementById("sankey-unsampled-option").checked;
  var community_transmission = document.getElementById("sankey-community-option").checked;
  var multiple_sources       = document.getElementById("sankey-multiple-source-option").checked;  

  // Extract the cluster based on the current index
  var cluster = clusters[cindex];

  // Initialize sankey graph
  const graph = {
    "lineage"    : "",
    "label"      : [],
    "color"      : [],
    "link": {
      "source": [],
      "target": [],
      "value":  []
    }    
  };

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

    // Extract statistics and metadata for the edge
    var source_node = edge[0];
    var target_node = edge[1];
    // var length      = edge[2];
    // var bootstrap   = edge[3];


    // Should unsampled locations be included?
    if(unsampled == false && (source_node.includes("unsampled") || target_node.includes("unsampled"))){
      continue;
    }

    // Never include community transmission in unsampled locations!
    if(source_node.includes("unsampled") && target_node.includes("unsampled")){ continue; }    
    
    // (Y) Option 1: Single Source to Single Target
    // (Y) Option 2: Single Source to Multiple Targets
    // (N) Option 3: Multiple Sources to Single Target
    // (N) Option 4: Multiple Sources to Multiple Targets

    var source_country = "";
    var target_countries = [];
    var sequences, collection_date, seq_name, seq_name_array, target_country;    

    // Parse the geographic location of the source node
    if(!source_node.includes("unsampled")){

      sequences = cluster.nodes[source_node];

      // Shuold we include multiple source locations?
      if (multiple_sources == false && sequences.length > 1){ continue; }
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

    // Now, we need to add these sources and targets to the graph links

    // First iterate through all the targets
    for (target_country of target_countries){

      // Next iterate through all links that have been recorded in the graph
      var link_found = false;

      for (var i = 0; i < graph["link"]["source"].length; i++){
        if (graph["link"]["source"][i] == source_country && graph["link"]["target"][i] == target_country)
        {
          // If a match is found, increase the times (value) it was observed by 1
          graph["link"]["value"][i] += 1;
          link_found = true;
        }
      }      
     
      // If a match wasn't found, we add it
      if (link_found == false){
        graph["link"]["source"].push(source_country);
        graph["link"]["target"].push(target_country);
        graph["link"]["value"].push(1);
      }

    }

  } 
      
  // At this point, we have fully recorded all links from sources to targets

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
 
  return(graph);

}

/**
 * Draw the sankey diagram
 * @param {Object} graph:  pre-computed sankey graph data
 */
 function draw_sankey() {

  graph = get_sankey_data(cindex);

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