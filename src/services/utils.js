/*
* style
* reference https://js.cytoscape.org/#style
*/
function sizePerField(ele,field) {
  var max = ele.parent().children().reduce((total, e) => {
  return Math.max(total,e.data()[field] ||  0) ;
}, 0);
   return 80 + 80*ele.data()[field]/max
}
function buildStyles(graphStyle, uiconfig = { entities : {}}) {
  // graphStyle has colors and colorMap

  let styles = [
    {
      selector: ':selected',
      style: {
        borderWidth: '3px',
        borderOpacity: '50'
      }
    },
    {
      selector: 'edge',
      style: {
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
      }
    },
    {
      selector: 'edge[label]',
      style: {
        'source-label': 'data(label)',
        'target-arrow-shape': 'triangle',
        'source-font-size': '6',
        'source-font-weight': 'normal',
        'source-text-rotation': 'autorotate',
        'width': '1px',
        'line-color': 'black',
        'curve-style': 'bezier',
        'source-text-offset' : 50,
        'min-zoomed-font-size' : 12

      },


    },

    {
      selector: 'node[label]',
      style: {
        label: 'data(label)',
        borderOpacity: '50',
        textValign:'center',
        textHalign:'center',
        textMaxWidth: '80px',
        textWrap: 'wrap',
        width: 100,
        height: 100,
      }

    },
    {
      selector: '.Company',
      style: {
        width: function( ele ){  return sizePerField(ele,'investors') },
        height: function( ele ){  return sizePerField(ele,'investors') },
      }
    },
    {
      selector: '.Investor',
      style: {
        width: function( ele ){  return sizePerField(ele,'investments') },
        height: function( ele ){  return sizePerField(ele,'investments') },
      }
    },

    {
      selector: '.visited',
      style: {
        borderWidth: '2px',
        'border-color': 'red',
      }
    },
    {
      selector: '.category',
      style: {
        width: '20px',
        height: '20px',
        textValign:'top',
        fontSize: '1em',
      }
    },
    {
      selector: '.relation',
      style: {
        shape: 'diamond',
        width: '20px',
        height: '20px',
        textValign:'top',
        fontSize: '1em',
      }
    },
    {
      selector: '.reverse',
      style: {
        curveStyle: 'bezier'
      }
    },
    {
      selector: '.infered',
      style: {
        'line-style': 'dashed',
        'line-dash-pattern': [6,3],
        'width' : '1px'
      }
    }



  ]

  for (var type in graphStyle.entities) {
    if (uiconfig.entities[type]?.style != undefined) {
      styles.push({
        selector: `.${type}, .type${type}`,
        style: uiconfig.entities[type].style 
      })
    } else if (graphStyle.entities[type].style != undefined) {
      styles.push({
        selector: `.${type}, .type${type}`,
        style: graphStyle.entities[type].style 
      })
    }
    // if we have a node sizePerField then we set the style to use the sizePerField function with the configured field

    /*
    if (uiconfig.entities[type] && uiconfig.entities[type].sizePerField) {
      styles.push({
        selector: `.${type}`,
        style: {
          width: function( ele ){  return sizePerField(ele,uiconfig.entities[type].sizePerField) },
          height: function( ele ){  return sizePerField(ele,uiconfig.entities[type].sizePerField) }
        }
      })
       
    }
    */
  }

  return styles;
}

function buildSchemaGraph(ontology) {
  let schemaGraph = [
  ];
  // create a UI node for each entity in the ontology with data dgraph.type=type id and name
  // and CSS class type<entityType> and a class for the type of entity (entity or relation) - (when an entity is used as a relation)
  //
  for (var entity in ontology.entities) {
    var elt = { group:"nodes", data:{ id:`${entity}`, label: `${entity}`, name:`${entity}`, "dgraph.type":"type"}, classes: [`type${entity}`] };
    if ( ontology.entities[entity].type != undefined ) {
      elt.classes.push(`${ontology.entities[entity].type}`)
    }
    schemaGraph.push(elt)
    if (ontology.entities[entity].relations != undefined) {
      Object.entries(ontology.entities[entity].relations).forEach(([key, relation]) => {
        var rel
        if (relation.relationNode != undefined) {
           rel = { group:"edges", data: { source: `${entity}`, target: `${relation.relationNode.entity}` } }
           // omit label: `${relation.relationNode.predicate}`
        } else {
         rel = { group:"edges", data: { source: `${entity}`, target: `${relation.entity}` } }
         // omit , label: `${key}`
        }
        schemaGraph.push(rel)
      })
    }
  }
  return schemaGraph
}
export default {buildStyles, buildSchemaGraph}
