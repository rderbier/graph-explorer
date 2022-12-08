import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import QuerySteps from '../QuerySteps.jsx';
import NodeInfo from '../NodeInfo.jsx';
import NodeSelector from '../NodeSelector.jsx';
import Selector from '../Selector.jsx';
import Cytoscape from 'cytoscape';
import cxtmenu from 'cytoscape-cxtmenu';
import dgraph from '../../services/dgraph.jsx';
import CytoscapeComponent from 'react-cytoscapejs';
import COSEBilkent from 'cytoscape-cose-bilkent';
import cola from 'cytoscape-cola';
import dagre from 'cytoscape-dagre';
import klay from 'cytoscape-klay';

Cytoscape.use( klay );

Cytoscape.use(dagre );
Cytoscape.use(cola);
Cytoscape.use(cxtmenu);
// colors from https://www.schemecolor.com/beautiful-pastels.php
const colors = [
  "rgb(165, 137, 175)",
  "rgb(222, 164, 192)",
  "rgb(236, 202, 170)",
  "rgb(247, 237, 195)",
  "rgb(173, 225, 212)",
  "rgb(167, 187, 225)"]

  const colorMap = {
    "Sector" : colors[0],
    "Industry" : colors[2],
    "Company" : colors[1],
    "Investment" : colors[3],
    "Investor" : colors[4],
    "Country" : colors[5],
    "InvestorType" : colors[4]
  }

  class GraphView extends React.Component {

    constructor(props) {
      super(props);

      this.state = {
        selectedNode: undefined,
        data: props.value,
        elements: [
          { group:"nodes", data:{ id:"InvestorType", name:"InvestorType", "dgraph.type":"type"}, classes: ['category'] },
          { group:"nodes", data:{ id:"Sector", name:"Sector", "dgraph.type":"type"}, classes: ['category'] },
          { group:"nodes", data:{ id:"Industry", name:"Industry", "dgraph.type":"type"}, classes: ['category'] },
          { group:"nodes", data:{ id:"Company", name:"Company", "dgraph.type":"type"}, classes: ['typeCompany'] },
          { group:"nodes", data:{ id:"Investor", name:"Investor", "dgraph.type":"type"}, classes: ['typeInvestor'] },
          { group:"nodes", data:{ id:"Country", name:"Country", "dgraph.type":"type"}, classes: ['typeCountry'] },



          { group:"edges", data: { source: 'Company', target: 'Investor', label: 'investors' },classes: ['reverse'] },
          { group:"edges", data: { source: 'Investor', target: 'Company', label: 'owns' },classes: ['reverse'] },
          { group:"edges", data: { source: 'Company', target: 'Industry' }},
          { group:"edges", data: { source: 'Company', target: 'Country', label: 'is in' }},
          { group:"edges", data: { source: 'Industry', target: 'Sector'}},
          { group:"edges", data: { source: 'Investor', target: 'InvestorType' }}
        ]
      }
      // reference https://js.cytoscape.org/#style

      this.styles = [
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
            label: 'data(label)',
            'target-arrow-shape': 'triangle',
            fontSize: '12px',
            fontWeight: 'normal',
            textRotation: 'autorotate',

          },


        },
        {
          selector: 'node',
          style: {
            label: 'data(name)',
            borderWidth: '1px',
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
          selector: '.category',
          style: {
            width: '20px',
            height: '20px',
            textValign:'top',
            fontSize: '1em',
          }
        },
        {
          selector: '.Industry',
          style: {
            'background-color': colorMap["Industry"],
            'border-color': colorMap["Industry"]
          }
        },
        {
          selector: '.Company , .typeCompany',
          style: {
            'background-color': colorMap["Company"],
            'border-color': colorMap["Company"]
          }
        },
        {
          selector: '.Investor , .typeInvestor',
          style: {
            'background-color': colorMap["Investor"],
            'border-color': colorMap["Investor"]
          }
        },
        {
          selector: '.reverse',
          style: {
            curveStyle: 'bezier'
          }
        }


      ]

      this.stepIndex = 0;
      this.layoutMap = {
        "cola": {
          name: "cola",
          animate: true, // whether to show the layout as it's running
          refresh: 1, // number of ticks per frame; higher is faster but more jerky
          maxSimulationTime: 6000, // max length in ms to run the layout
          ungrabifyWhileSimulating: false, // so you can't drag nodes during layout
          fit: true, // on every layout reposition of nodes, fit the viewport
          padding: 30, // padding around the simulation
          boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
          nodeDimensionsIncludeLabels: true, // whether labels should be included in determining the space used by a node

          // layout event callbacks
          ready: function(){}, // on layoutready
          stop: function(){}, // on layoutstop

          // positioning options
          randomize: false, // use random node positions at beginning of layout
          avoidOverlap: true, // if true, prevents overlap of node bounding boxes
          handleDisconnected: true, // if true, avoids disconnected components from overlapping
          convergenceThreshold: 0.01, // when the alpha value (system energy) falls below this value, the layout stops
          nodeSpacing: function( node ){ return 40; }, // extra spacing around nodes
          flow: undefined, // use DAG/tree flow layout if specified, e.g. { axis: 'y', minSeparation: 30 }
          alignment: undefined, // relative alignment constraints on nodes, e.g. {vertical: [[{node: node1, offset: 0}, {node: node2, offset: 5}]], horizontal: [[{node: node3}, {node: node4}], [{node: node5}, {node: node6}]]}
          gapInequalities: undefined, // list of inequality constraints for the gap between the nodes, e.g. [{"axis":"y", "left":node1, "right":node2, "gap":25}]
          centerGraph: true, // adjusts the node positions initially to center the graph (pass false if you want to start the layout from the current position)

          // different methods of specifying edge length
          // each can be a constant numerical value or a function like `function( edge ){ return 2; }`
          edgeLength: undefined, // sets edge length directly in simulation
          edgeSymDiffLength: undefined, // symmetric diff edge length in simulation
          edgeJaccardLength: undefined, // jaccard edge length in simulation

          // iterations of cola algorithm; uses default values on undefined
          unconstrIter: undefined, // unconstrained initial layout iterations
          userConstIter: undefined, // initial layout iterations with user-specified constraints
          allConstIter: undefined, // initial layout iterations with all constraints including non-overlap
        },
        "dagre": {
          name: 'dagre',
          // dagre algo options, uses default value on undefined
          nodeSep: undefined, // the separation between adjacent nodes in the same rank
          edgeSep: undefined, // the separation between adjacent edges in the same rank
          rankSep: undefined, // the separation between each rank in the layout
          rankDir: undefined, // 'TB' for top to bottom flow, 'LR' for left to right,
          align: undefined,  // alignment for rank nodes. Can be 'UL', 'UR', 'DL', or 'DR', where U = up, D = down, L = left, and R = right
          acyclicer: undefined, // If set to 'greedy', uses a greedy heuristic for finding a feedback arc set for a graph.
          // A feedback arc set is a set of edges that can be removed to make a graph acyclic.
          ranker: 'tight-tree', // Type of algorithm to assign a rank to each node in the input graph. Possible values: 'network-simplex', 'tight-tree' or 'longest-path'
          minLen: function( edge ){ return 1; }, // number of ranks to keep between the source and target of the edge
          edgeWeight: function( edge ){
            return 1+ (edge.data().round || 0);
          }, // higher weight edges are generally made shorter and straighter than lower weight edges

          // general layout options
          fit: true, // whether to fit to viewport
          padding: 30, // fit padding
          spacingFactor: undefined, // Applies a multiplicative factor (>0) to expand or compress the overall area that the nodes take up
          nodeDimensionsIncludeLabels: true, // whether labels should be included in determining the space used by a node
          animate: true, // whether to transition the node positions
          animateFilter: function( node, i ){ return true; }, // whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
          animationDuration: 500, // duration of animation in ms if enabled
          animationEasing: undefined, // easing of animation if enabled
          boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
          transform: function( node, pos ){ return pos; }, // a function that applies a transform to the final node position
          ready: function(){}, // on layoutready
          sort: undefined, // a sorting function to order the nodes and edges; e.g. function(a, b){ return a.data('weight') - b.data('weight') }
          // because cytoscape dagre creates a directed graph, and directed graphs use the node order as a tie breaker when
          // defining the topology of a graph, this sort function can help ensure the correct order of the nodes/edges.
          // this feature is most useful when adding and removing the same nodes and edges multiple times in a graph.
          stop: function(){} // on layoutstop
        },
        "klay": {
          name: "klay",
          nodeDimensionsIncludeLabels: false, // Boolean which changes whether label dimensions are included when calculating node dimensions
          fit: true, // Whether to fit
          padding: 20, // Padding on fit
          animate: false, // Whether to transition the node positions
          animateFilter: function( node, i ){ return true; }, // Whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
          animationDuration: 500, // Duration of animation in ms if enabled
          animationEasing: undefined, // Easing of animation if enabled
          transform: function( node, pos ){ return pos; }, // A function that applies a transform to the final node position
          ready: undefined, // Callback on layoutready
          stop: undefined, // Callback on layoutstop
          klay: {
            // Following descriptions taken from http://layout.rtsys.informatik.uni-kiel.de:9444/Providedlayout.html?algorithm=de.cau.cs.kieler.klay.layered
            addUnnecessaryBendpoints: false, // Adds bend points even if an edge does not change direction.
            aspectRatio: 1.6, // The aimed aspect ratio of the drawing, that is the quotient of width by height
            borderSpacing: 20, // Minimal amount of space to be left to the border
            compactComponents: false, // Tries to further compact components (disconnected sub-graphs).
            crossingMinimization: 'LAYER_SWEEP', // Strategy for crossing minimization.
            /* LAYER_SWEEP The layer sweep algorithm iterates multiple times over the layers, trying to find node orderings that minimize the number of crossings. The algorithm uses randomization to increase the odds of finding a good result. To improve its results, consider increasing the Thoroughness option, which influences the number of iterations done. The Randomization seed also influences results.
            INTERACTIVE Orders the nodes of each layer by comparing their positions before the layout algorithm was started. The idea is that the relative order of nodes as it was before layout was applied is not changed. This of course requires valid positions for all nodes to have been set on the input graph before calling the layout algorithm. The interactive layer sweep algorithm uses the Interactive Reference Point option to determine which reference point of nodes are used to compare positions. */
            cycleBreaking: 'GREEDY', // Strategy for cycle breaking. Cycle breaking looks for cycles in the graph and determines which edges to reverse to break the cycles. Reversed edges will end up pointing to the opposite direction of regular edges (that is, reversed edges will point left if edges usually point right).
            /* GREEDY This algorithm reverses edges greedily. The algorithm tries to avoid edges that have the Priority property set.
            INTERACTIVE The interactive algorithm tries to reverse edges that already pointed leftwards in the input graph. This requires node and port coordinates to have been set to sensible values.*/
            direction: 'DOWN', // Overall direction of edges: horizontal (right / left) or vertical (down / up)
            /* UNDEFINED, RIGHT, LEFT, DOWN, UP */
            edgeRouting: 'ORTHOGONAL', // Defines how edges are routed (POLYLINE, ORTHOGONAL, SPLINES)
            edgeSpacingFactor: 0.5, // Factor by which the object spacing is multiplied to arrive at the minimal spacing between edges.
            feedbackEdges: false, // Whether feedback edges should be highlighted by routing around the nodes.
            fixedAlignment: 'NONE', // Tells the BK node placer to use a certain alignment instead of taking the optimal result.  This option should usually be left alone.
            /* NONE Chooses the smallest layout from the four possible candidates.
            LEFTUP Chooses the left-up candidate from the four possible candidates.
            RIGHTUP Chooses the right-up candidate from the four possible candidates.
            LEFTDOWN Chooses the left-down candidate from the four possible candidates.
            RIGHTDOWN Chooses the right-down candidate from the four possible candidates.
            BALANCED Creates a balanced layout from the four possible candidates. */
            inLayerSpacingFactor: 1.0, // Factor by which the usual spacing is multiplied to determine the in-layer spacing between objects.
            layoutHierarchy: false, // Whether the selected layouter should consider the full hierarchy
            linearSegmentsDeflectionDampening: 0.3, // Dampens the movement of nodes to keep the diagram from getting too large.
            mergeEdges: false, // Edges that have no ports are merged so they touch the connected nodes at the same points.
            mergeHierarchyCrossingEdges: true, // If hierarchical layout is active, hierarchy-crossing edges use as few hierarchical ports as possible.
            nodeLayering:'NETWORK_SIMPLEX', // Strategy for node layering.
            /* NETWORK_SIMPLEX This algorithm tries to minimize the length of edges. This is the most computationally intensive algorithm. The number of iterations after which it aborts if it hasn't found a result yet can be set with the Maximal Iterations option.
            LONGEST_PATH A very simple algorithm that distributes nodes along their longest path to a sink node.
            INTERACTIVE Distributes the nodes into layers by comparing their positions before the layout algorithm was started. The idea is that the relative horizontal order of nodes as it was before layout was applied is not changed. This of course requires valid positions for all nodes to have been set on the input graph before calling the layout algorithm. The interactive node layering algorithm uses the Interactive Reference Point option to determine which reference point of nodes are used to compare positions. */
            nodePlacement:'BRANDES_KOEPF', // Strategy for Node Placement
            /* BRANDES_KOEPF Minimizes the number of edge bends at the expense of diagram size: diagrams drawn with this algorithm are usually higher than diagrams drawn with other algorithms.
            LINEAR_SEGMENTS Computes a balanced placement.
            INTERACTIVE Tries to keep the preset y coordinates of nodes from the original layout. For dummy nodes, a guess is made to infer their coordinates. Requires the other interactive phase implementations to have run as well.
            SIMPLE Minimizes the area at the expense of... well, pretty much everything else. */
            randomizationSeed: 1, // Seed used for pseudo-random number generators to control the layout algorithm; 0 means a new seed is generated
            routeSelfLoopInside: false, // Whether a self-loop is routed around or inside its node.
            separateConnectedComponents: true, // Whether each connected component should be processed separately
            spacing: 20, // Overall setting for the minimal amount of space to be left between objects
            thoroughness: 7 // How much effort should be spent to produce a nice layout..
          },
          priority: function( edge ){ return null; }, // Edges with a non-nil value are skipped when greedy edge cycle breaking is enabled
        }
      };
      this.setLayout("dagre");
    }
    initMenu(nodeType,commandList) {
      let defaults = {
        menuRadius: function(ele){ return 80; }, // the outer radius (node center to the end of the menu) in pixels. It is added to the rendered size of the node. Can either be a number or function as in the example.
        selector: "."+nodeType, // elements matching this Cytoscape.js selector will trigger cxtmenus
        commands: [], // function( ele ){ return [ /*...*/ ] }, // a function that returns commands or a promise of commands
        fillColor: 'rgba(0, 0, 0, 0.75)', // the background colour of the menu
        activeFillColor: 'rgba(1, 105, 217, 0.75)', // the colour used to indicate the selected command
        activePadding: 20, // additional size in pixels for the active command
        indicatorSize: 24, // the size in pixels of the pointer to the active command, will default to the node size if the node size is smaller than the indicator size,
        separatorWidth: 3, // the empty spacing in pixels between successive commands
        spotlightPadding: 4, // extra spacing in pixels between the element and the spotlight
        adaptativeNodeSpotlightRadius: false, // specify whether the spotlight radius should adapt to the node size
        minSpotlightRadius: 24, // the minimum radius in pixels of the spotlight (ignored for the node if adaptativeNodeSpotlightRadius is enabled but still used for the edge & background)
        maxSpotlightRadius: 38, // the maximum radius in pixels of the spotlight (ignored for the node if adaptativeNodeSpotlightRadius is enabled but still used for the edge & background)
        openMenuEvents: 'cxttapstart taphold', // space-separated cytoscape events that will open the menu; only `cxttapstart` and/or `taphold` work here
        itemColor: 'white', // the colour of text in the command's content
        itemTextShadowColor: 'transparent', // the text shadow colour of the command's content
        zIndex: 9999, // the z-index of the ui div
        atMouse: false, // draw menu at mouse position
        outsideMenuCancel: false // if set to a number, this will cancel the command if the pointer is released outside of the spotlight, padded by the number given
      };
      for(var command of commandList) {
        defaults.commands.push( // an array of commands to list in the menu or a function that returns the array

          { // example command
            fillColor: 'rgba(200, 200, 200, 0.75)', // optional: custom background color for item
            content: command.name, // html/text content to be displayed in the menu
            contentStyle: {}, // css key:value pairs to set the command's css in js if you want
            select: command.select,
            enabled: true // whether the command is selectable
          }
        )
      }
      this.menu = this.cyRef.cxtmenu( defaults );
      console.log('adding menu '+nodeType);
    }
    init(cy: CSCore) {

      const topMenu =[
        {
          name: 'top10', // html/text content to be displayed in the menu
          select: (ele) => { // a function to execute when the command is selected
            this.expandNode( ele,'top 10 investors'  ) // `ele` holds the reference to the active element
          }
        },
        {
          name: 'top50', // html/text content to be displayed in the menu
          select: (ele) => { // a function to execute when the command is selected
            this.expandNode( ele,'top 50'  ) // `ele` holds the reference to the active element
          }
        },
        {
          name: 'top100', // html/text content to be displayed in the menu
          select: (ele) => { // a function to execute when the command is selected
            this.expandNode( ele,'top 100' ) // `ele` holds the reference to the active element
          }
        }
      ]
      const expandMenu =[
        {
          name: 'expand', // html/text content to be displayed in the menu
          select: (ele) => { // a function to execute when the command is selected
            this.expandType( ele,'expand'  ) // `ele` holds the reference to the active element
          }
        }
      ]
      if (this.cyRef != cy) {
        console.log("init cy");
        this.cyRef = cy;

        /*
        if (this.companyMenu != undefined) {
        this.companyMenu.destroy();
      }
      if (this.investorMenu != undefined) {
      this.investorMenu.destroy();
    }
    if (this.typeMenu != undefined) {
    this.typeMenu.destroy();
  }
  */
  cy.removeAllListeners();
  this.initMenu("Company",topMenu);

  this.initMenu("Investor",topMenu);

  this.initMenu("typeCompany",expandMenu);



  cy.on('mousedown', 'node', (evt)=>{
    console.log( evt.type );
    evt.cy.$id(evt.target.id()).unlock();
    //this.cyRef.layout(this.layoutOptions).run();
  });
  cy.on('click', 'node', (evt)=>{
    console.log( evt.type );
    if (evt.target.data()["dgraph.type"] == "type") {
      // a type is selected on the graph representing the schema
      this.setState({"selectedType":evt.target.data().name, "selectedNode":undefined});
    } else { // a graph node is selected
      this.setState({"selectedNode":evt.target, "selectedType":undefined});
    }
    //this.cyRef.layout(this.layoutOptions).run();
  });

  cy.on('dragfree', 'node', (evt)=>{
    console.log( evt.type );
    evt.cy.$id(evt.target.id()).lock();
    evt.cy.layout(this.layoutOptions).run();
  });



}
this.cyRef.layout(this.layoutOptions).run();
}
addEdge(elements,source,target,label) {
  if ((source != undefined) && (target != undefined)) {
    elements.push({ group: 'edges', data: { source: source, target: target, label: label, round: this.stepIndex } });
  }
}
runQuery = (query) =>   {
  this.stepIndex +=1;
  return dgraph.runQuery(query)

}
buildExpandQuery(type,option,uid) {
  var query = `{ list(func:uid(${uid})) { dgraph.type expand(_all_) { dgraph.type expand(_all_) }}}`
  switch (type) {
    case 'Company' :
    query = `{
      list(func:uid("${uid}")) {
        uid
        dgraph.type
        investors: count(~in)
        invetor:~in(orderdesc: OS, first:10) @normalize @cascade{
          OS:OS
          POS:POS
          MKTVAL: MKTVAL
          investor @filter(ge(count(invest),2)) {
            dgraph.type:dgraph.type
            id:uid
            name:name
          }
        }
      }
    }`

    break;
    case 'Investor' :
    query = `{
      list(func:uid(${uid})) {
        uid
        dgraph.type
        company:~investor @normalize {
          in {
            dgraph.type:dgraph.type
            id:uid
            name:name
            ticker:ticker
            factsetid:factsetid
            investors: count(~in)
          }
        }

      }
    }`

    break;
  }
  return query
}
expandType(ele,option) {
  const type = ele.id();

  var query = `{ list(func:type(${type})) { dgraph.type expand(_all_) }}`;

  this.runQuery(query).then((r)=>this.analyseQueryResponse(r["data"],true))
}
expandNode(ele,option) {
  const uid = ele.id();
  const type = ele.data()['dgraph.type'][0];
  var query = this.buildExpandQuery(type,option,uid);

  this.runQuery(query).then((r)=>this.analyseQueryResponse(r["data"],false))

  console.log(`round ${this.stepIndex}`);
}
addGraph(elements,e,compound) {
  var uid =  e['id'] || e['uid'] ;

  if (uid != undefined) {
    var point = {};
    for(var key in e) {
      if(typeof e[key] == 'object') {
        if (Array.isArray(e[key])) {
          for (var child of e[key]) {
            var targetUid = this.addGraph(elements,child,compound);
            this.addEdge(elements,uid, targetUid, key)
          }
        } else {
          var targetUid = this.addGraph(elements,e[key],compound);
          this.addEdge(elements,uid, targetUid, key)
        }
      }
      point[key]=e[key];
    }
    if (this.cyRef.getElementById(uid).length == 0) {
      point['id'] = uid;
      var classes = e["dgraph.type"] || ["default"];

      point['label'] = point['name'];
      point['parent'] = "c"+compound;
      elements.push({
        group:"nodes",
        data:point,
        classes: classes,
        position: { x: 100.0*Math.random(), y: 100.0*Math.random() } }
      );
    }
  }
  return uid;
}
analyseQueryResponse( data , reset = true) {
  var elements = [];
  if (data) {
    if (reset != true) {
      elements = [...this.state.elements];
    }
    var firstKey, firstProp;


    elements.push({
      group:"nodes",
      data:{id:'c'+this.stepIndex}})
    for(var key in data) {
      if(data.hasOwnProperty(key)) {
        firstKey = key;

        for (var e of data[key]) {
          this.addGraph(elements,e,this.stepIndex);

        }
      }
      //this.layout.run();
    }
    this.setState({elements: elements})
    //  if (this.cyRef != undefined) {
    //    this.cyRef.add(this.elements);
    //  }
  }
}
componentDidUpdate(prevProps, prevState, snapshot) {
  console.log("GraphView did update");
  if (this.props.value != prevProps.value) {
    this.analyseQueryResponse(this.props.value.data);
  }
}
buildSearchQuery(criteria) {
  var query;
  if (criteria.type == "Company") {
    query = `{
      all(func:anyoftext(name,"${criteria.name}")) @filter(type(${criteria.type})) { dgraph.type expand(_all_) investors: count(~in) }
    }`
  }
  return query;
}
searchNode(criteria) {
  console.log("search");
  var query = this.buildSearchQuery(criteria);
  if (query) {
    this.runQuery(query).then((r)=>this.analyseQueryResponse(r["data"],true))
  }
}
infoSection() {
  if (this.state.selectedNode != undefined) {
    return <NodeInfo value={this.state.selectedNode} expand={(data)=>this.expandNode(data,'top 10')}/>
  } else if (this.state.selectedType != undefined) {
    return <NodeSelector type={this.state.selectedType} query={(data)=>this.searchNode(data)}/>
  }
}
setLayout(layoutName) {
  if (this.layoutMap[layoutName] != undefined) {
    this.layoutOptions = this.layoutMap[layoutName];
    if (this.cyRef != undefined) {
      this.cyRef.nodes(":locked").unlock();
      this.cyRef.layout(this.layoutOptions).run();
    }
  }

}
render() {

  //const layout = { name: 'cose-bilkent' };
  //if (this.elements.length >0 ) {
  return (
    <>
    <Container  fluid className="pt-5">
    <Row>

    <Col xs={9}>

    <Tabs
    id="controlled-tab-example"
    activeKey={this.state.key}
    onSelect={(k) => this.setState({key:k})}
    className="mb-3"
    >

    <Tab eventKey="graph" title="Graph">
    <Selector options={[{name:"dagre"},{name:"cola"},{name:"klay"}]} key={"layout"} onChange={(e)=>this.setLayout(e.name)}/>
    <CytoscapeComponent  stylesheet={this.styles} layout={this.layoutOptions} elements={this.state.elements} cy={(cy) => this.init(cy)} style={ { width: '800px', height: '600px' } } />;
    </Tab>
    <Tab eventKey="json" title="JSON">
    <Form>
    <Form.Group className="m-3" controlId="exampleForm.ControlTextarea1">
    <Form.Label>Response</Form.Label>
    <Form.Control as="textarea" value={this.state.json} rows={this.state.rows} readOnly />
    </Form.Group>
    </Form>
    </Tab>

    </Tabs>
    </Col>
    <Col>
    {this.infoSection()}
    <QuerySteps />
    </Col>
    </Row>
    </Container>
    </>
  )
  //  }
}
}


export default GraphView;
