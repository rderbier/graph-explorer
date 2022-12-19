/*
* style
* reference https://js.cytoscape.org/#style
*/

function buildStyles(graphStyle) {
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
        'source-label': 'data(label)',
        'target-arrow-shape': 'triangle',
        'source-font-size': '12px',
        'source-font-weight': 'normal',
        'source-text-rotation': 'autorotate',
        'width': '1px',
        'line-color': 'black'

      },


    },

    {
      selector: 'node',
      style: {
        label: 'data(name)',
        borderOpacity: '50',
        textValign:'center',
        textHalign:'center',
        textMaxWidth: '80px',
        textWrap: 'wrap',
        width: '100px',
        height: '100px'
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
    if (graphStyle.entities[type].style["background-color"] != undefined) {
      styles.push({
        selector: `.${type}, .type${type}`,
        style: {
          'background-color': graphStyle.colors[graphStyle.entities[type].style["background-color"]]
        }
      })
    }
  }

  return styles;
}

function buildSchemaGraph(ontology) {
  let schemaGraph = [
  ];
  for (var entity in ontology.entities) {
    var elt = { group:"nodes", data:{ id:`${entity}`, name:`${entity}`, "dgraph.type":"type"}, classes: [`type${entity}`] };
    if ( ontology.entities[entity].type != undefined ) {
      elt.classes.push(`${ontology.entities[entity].type}`)
    }
    schemaGraph.push(elt)
    if (ontology.entities[entity].relations != undefined) {
      Object.entries(ontology.entities[entity].relations).forEach(([key, relation]) => {
        var rel = { group:"edges", data: { source: `${entity}`, target: `${relation.entity}`, label: `${key}` } }
        schemaGraph.push(rel)
      })
    }
  }
  return schemaGraph
}
export default {buildStyles, buildSchemaGraph}
