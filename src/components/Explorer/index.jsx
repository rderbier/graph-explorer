import React from 'react';
import Container from 'react-bootstrap/Container';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import QuerySteps from '../QuerySteps.jsx';
import NodeInfo from '../NodeInfo.jsx';
import NodeListInfo from '../NodeListInfo.jsx';
import NodeSelector from '../NodeSelector.jsx';
import Selector from '../Selector.jsx';
import Cytoscape from 'cytoscape';
import cxtmenu from 'cytoscape-cxtmenu';
import dgraph from '../../services/dgraph.js';
import utils from '../../services/utils.js';
import {Exploration} from '../../services/exploration.js';
import CytoscapeComponent from 'react-cytoscapejs';
import COSEBilkent from 'cytoscape-cose-bilkent';
import cola from 'cytoscape-cola';
import dagre from 'cytoscape-dagre';
import klay from 'cytoscape-klay';

Cytoscape.use( klay );

Cytoscape.use(dagre );
Cytoscape.use(cola);
Cytoscape.use(COSEBilkent);
Cytoscape.use(cxtmenu);

// colors from https://www.schemecolor.com/beautiful-pastels.php



  class GraphView extends React.Component {

    constructor(props) {
      super(props);
      this.styles = utils.buildStyles(props.style);
      this.schemaGraph = utils.buildSchemaGraph(props.ontology);
      this.exploration = new Exploration();
      this.exploration.addStep('Business domain', "", this.schemaGraph, true)
      this.state = {
        selectedNode: undefined,
        data: props.value,
        elements: this.exploration.getElements()
      }


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
        },
        "cose-bilkent": {
          name: "cose-bilkent",
          // Called on `layoutready`
          ready: function () {
          },
          // Called on `layoutstop`
          stop: function () {
          },
          // 'draft', 'default' or 'proof"
          // - 'draft' fast cooling rate
          // - 'default' moderate cooling rate
          // - "proof" slow cooling rate
          quality: 'default',
          // Whether to include labels in node dimensions. Useful for avoiding label overlap
          nodeDimensionsIncludeLabels: false,
          // number of ticks per frame; higher is faster but more jerky
          refresh: 30,
          // Whether to fit the network view after when done
          fit: true,
          // Padding on fit
          padding: 10,
          // Whether to enable incremental mode
          randomize: true,
          // Node repulsion (non overlapping) multiplier
          nodeRepulsion: 4500,
          // Ideal (intra-graph) edge length
          idealEdgeLength: 50,
          // Divisor to compute edge forces
          edgeElasticity: 0.45,
          // Nesting factor (multiplier) to compute ideal edge length for inter-graph edges
          nestingFactor: 0.1,
          // Gravity force (constant)
          gravity: 0.25,
          // Maximum number of iterations to perform
          numIter: 2500,
          // Whether to tile disconnected nodes
          tile: true,
          // Type of layout animation. The option set is {'during', 'end', false}
          animate: 'end',
          // Duration for animate:end
          animationDuration: 500,
          // Amount of vertical space to put between degree zero nodes during tiling (can also be a function)
          tilingPaddingVertical: 10,
          // Amount of horizontal space to put between degree zero nodes during tiling (can also be a function)
          tilingPaddingHorizontal: 10,
          // Gravity range (constant) for compounds
          gravityRangeCompound: 1.5,
          // Gravity force (constant) for compounds
          gravityCompound: 1.0,
          // Gravity range (constant)
          gravityRange: 3.8,
          // Initial cooling factor for incremental layout
          initialEnergyOnIncremental: 0.5
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
          name: 'remove', // html/text content to be displayed in the menu
          select: (ele) => { // a function to execute when the command is selected
            this.removeNode( ele ) // `ele` holds the reference to the active element
          }
        },
        {
          name: 'remove others', // html/text content to be displayed in the menu
          select: (ele) => { // a function to execute when the command is selected
            this.cropNode( ele ) // `ele` holds the reference to the active element
          }
        },
        {
          name: 'expand', // html/text content to be displayed in the menu
          select: (ele) => { // a function to execute when the command is selected
            this.expandNode( ele ) // `ele` holds the reference to the active element
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


        cy.removeAllListeners();
        this.initMenu("Company",topMenu);

        this.initMenu("Investor",topMenu);

        this.initMenu("typeCompany",expandMenu);



        cy.on('mousedown', 'node', (evt)=>{
          console.log( evt.type );
          evt.cy.$id(evt.target.id()).unlock();
          //this.cyRef.layout(this.layoutOptions).run();
        });
        cy.on('click', 'edge', (evt)=>{
          console.log( `edge evt ${evt.type}` );
          this.setState({"selectedNode":evt.target, "selectedType":undefined, "selectedList":undefined});
          //this.cyRef.layout(this.layoutOptions).run();
        });
        cy.on('click', 'node', (evt)=>{
          console.log( evt.type );
          if (evt.target.isParent()) {
            // a type is selected on the graph representing the schema
            this.setState({"selectedList":evt.target.children(), "selectedType":undefined,"selectedNode":undefined});
          } else if (evt.target.data()["dgraph.type"] == "type") {
            // a type is selected on the graph representing the schema
            this.setState({"selectedType":evt.target.data().name, "selectedNode":undefined, "selectedList":undefined});
          } else { // a graph node is selected
            this.setState({"selectedNode":evt.target, "selectedType":undefined, "selectedList":undefined});
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
    addEdge(elements,source,target,label, data) {
      if ((source != undefined) && (target != undefined)) {
        const isTargetPresent = !this.isNodePresent(target);
        console.log(`adding Edge ${label} from ${source} to ${target} (new : ${isTargetPresent})`);

        let elt = { group: 'edges' };
        elt.data = data || {};
        elt.data.source =source;
        elt.data.target =target;
        elt.data.label = label;
        elt.data.round = this.stepIndex;

        if (isTargetPresent) {
          elt.classes = ["infered"]
        }
        elements.push(elt);
      }
    }
    getUidsForType(type) {
      return this.state.elements
      .filter((e)=> { return ((e.group == "nodes") && (e.data["dgraph.type"]==type))})
      .map((e) => e.data.id);

    }
    getNodeById(id) {
      let result = this.state.elements.filter((e)=> { return (e.data["id"]==id)})
      if (result != undefined) {
          result = result[0]
        }
      return result
    }
    isNodePresent(uid) {
      const test = this.getNodeById(uid);
      return test != undefined;

    }
    removeNodes(idList) {
      const elements = this.state.elements.filter((e)=> {
        // remove nodes having an id in the list
        // remove edges having source or target in the list
        let remove = idList.includes(e.data["id"]) ||  idList.includes(e.data["source"]) ||  idList.includes(e.data["target"]);
        return (!remove)
      })
      this.setState({elements: elements});

    }
    runQuery = (query) =>   {
      this.stepIndex +=1;
      return dgraph.runQuery(query)

    }
    buildExpandQuery(type,uid) {
      var query = `{ list(func:uid(${uid})) { dgraph.type expand(_all_) { dgraph.type expand(_all_) }}}`
      switch (type) {
        case 'Company' :
        let companies = this.getUidsForType("Company");
        let companyInfo = '';
        if (companies.length > 0 ) {
          companyInfo = `invest @filter(uid_in(company,${companies.join()})) {
            uid dgraph.type
            name:uid
            OS
            POS
            MKTVAL
            company { dgraph.type uid }
          }`
        }
        query = `{
          list(func:uid(${uid})) {
            uid
            dgraph.type
            investors: count(investments)
            investor:investments(orderdesc: OS, first:10) {
              uid dgraph.type
              name:uid
              OS
              POS
              MKTVAL
              investor {
                dgraph.type
                uid
                name
                investments: count(invest)
                ${companyInfo}
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
            invest(first:10,orderdesc:OS)  {
              uid dgraph.type
              name:uid
              OS MKTVAL POS
              company {
                dgraph.type uid
                name
                ticker:ticker
                factsetid:factsetid
                investors: count(investments)

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
      this.resetSelection();
      var query = `{ list(func:type(${type}),first:25) { dgraph.type expand(_all_) investors: count(investments)}}`;
      var title = `expand ${type}`;
      this.runQuery(query).then((r)=>this.analyseQueryResponse(query,r["data"],true,title))
    }
    removeNode(ele) {
      console.log(`delete node ${ele.id()}`);
      const uid = ele.id();
      var elements = this.state.elements.filter((e)=>{
        if (e.group == "nodes") {
          return (e.data.id != uid)
        } else {
          return ((e.data.target != uid) && (e.data.source!= uid))
        }
      })
      this.setState({elements:elements})
      //  ele.remove();
    }
    cropNode(ele) {
      console.log(`crop node `);
      const parent = ele.parent();
      if (parent != undefined) {
        let idList = [];
        for (var n of parent.children()) {
          if (n.id() != ele.id()) {
            idList.push(n.id());
          }
        }
        this.removeNodes(idList)
      }
    }
    setVisitedNode(ele) {
      // add class to the visited node
      ele.addClass("visited");

    }
    expandNode(ele) {
      this.resetSelection();
      const uid = ele.id();
      const type = ele.data()['dgraph.type'];
      var query = this.buildExpandQuery(type,uid);
      this.setVisitedNode(ele);
      const title = `Expand ${type} ${ele.data()['name']}`
      this.runQuery(query).then((r)=>this.analyseQueryResponse(query,r["data"],false,title))
      console.log(`round ${this.stepIndex}`);

    }
    isRelation(e) {
      return (e['dgraph.type'][0] == "Investment")
    }
    undo() {
      // remove last steps
      this.setState({elements: this.exploration.undoLastStep() })

    }
    addGraph(elements,e,compound,level,parentUid,predicate) {
      this.maxLevel=level;

      var targetUid;
      let uid =  e['id'] || e['uid'] ;
      const type = e['dgraph.type'][0];
      console.log(`Entering ${type} ${uid}`);
      if (uid != undefined) {
        var point = {};
        for(var key in e) {
          if (key!='dgraph.type') {
            if(typeof e[key] == 'object') {
              if (Array.isArray(e[key])) {
                for (var child of e[key]) {
                  targetUid = this.addGraph(elements,child,compound,level+1,uid,key);
                  this.addEdge(elements,uid, targetUid, key)
                }
              } else {

                if (!this.isRelation(e)) {
                  targetUid = this.addGraph(elements,e[key],compound,level+1,uid,key);
                  this.addEdge(elements,uid, targetUid, key)
                } else {
                  targetUid = this.addGraph(elements,e[key],compound,level,uid,key);
                }
              }
            } else {
              point[key]=e[key];
            }
          }
        }
        let existingNode = this.cyRef.getElementById(uid);
        if (existingNode.length == 0) {
          point['id'] = uid;
          point['dgraph.type'] = type
          if (!this.isRelation(e)) {
            var classes = e["dgraph.type"] || ["default"];
            if (point['name'] != undefined) {
              point['label'] = 'name';
            }
            point['parent'] = "c"+compound+"-"+level;
            elements.push({
              group:"nodes",
              data:point,
              classes: classes
            });
            if (this.newNodeCounter[`${level}`] != undefined) {
              this.newNodeCounter[`${level}`] +=1;
            }  else {
              this.newNodeCounter[`${level}`] = 1;
            }
            console.log(`adding node ${uid}`);
          } else {
            this.addEdge(elements,parentUid, targetUid, predicate, point);
            uid = undefined;
          }
        } else {
          if (this.isRelation(e))  {
            uid = undefined;
          }
          console.log(`node already exists ${uid}`);
        }
      } else { console.log(`node without id or uid`)}
      return uid;
    }
    analyseQueryResponse( query, data , reset = true, title) {
      var elements = [];

      this.newNodeCounter = {}
      if (data) {
        console.log("Result");
        console.log(JSON.stringify(data,null,2));

        var firstKey, firstProp;
        for(var key in data) {
          if(data.hasOwnProperty(key)) {
            firstKey = key;

            for (var e of data[key]) {
              this.addGraph(elements,e,this.stepIndex,1);

            }
          }
          //this.layout.run();
        }
        // add compound only if we found some nodes
        if (Object.keys(this.newNodeCounter).length > 0) {
          const compound = 'c'+this.stepIndex+"-"+1;
          elements.push({
            group:"nodes",
            data:{id:compound, name:this.stepIndex}
          })
          for (var i = 2; i <= this.maxLevel; i++) {
            if (this.newNodeCounter[`${i}`] > 0) {
              elements.push({
                group:"nodes",
                data:{id:'c'+this.stepIndex+"-"+i, name:""+this.stepIndex+"-"+i, parent:compound}
              })
            }
          }
        }
        if (elements.length > 0) {
          if (title == undefined) { title = this.stepIndex}
          this.exploration.addStep(title,query,elements,reset);
          if (reset != true) {
            elements = [...this.state.elements,...elements];
          }
          this.setState({elements: elements})
        }

        //  if (this.cyRef != undefined) {
        //    this.cyRef.add(this.elements);
        //  }
      }
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
      console.log("GraphView did update");
      if (this.props.value != prevProps.value) {
        this.analyseQueryResponse("",this.props.value.data);
      }
    }
    buildSearchQuery(criteria) {
      var query;
      if (criteria.type == "Company") {
        query = `{
          all(func:anyoftext(name,"${criteria.name}")) @filter(type(${criteria.type})) { dgraph.type expand(_all_) investors: count(investments) }
        }`
      }
      if (criteria.type == "Investor") {
        query = `{
          all(func:anyoftext(name,"${criteria.name}")) @filter(type(${criteria.type})) { dgraph.type expand(_all_) investments: count(invest) }
        }`
      }
      return query;
    }
    searchNode(criteria) {
      console.log("search");
      var title = "search node";
      this.resetSelection();
      var query = this.buildSearchQuery(criteria);
      if (query) {
        this.runQuery(query).then((r)=>this.analyseQueryResponse(query,r["data"],true,title))
      }
    }
    infoSection() {
      // display the card about the selected node
      // it can be a node in the schema graph or the data graph
      if (this.state.selectedNode != undefined) {
        return <NodeInfo value={this.state.selectedNode} expand={(data)=>this.expandNode(data,'top 10')}/>
      } else if (this.state.selectedType != undefined) {
        return <NodeSelector type={this.state.selectedType} query={(data)=>this.searchNode(data)}/>
      } else if (this.state.selectedList != undefined) {
        return <NodeListInfo elements={this.state.selectedList}/>
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
    resetSelection() {
      this.setState({"selectedNode":undefined, "selectedType":undefined, "selectedList":undefined});
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
        <Selector options={[{name:"dagre"},{name:"cola"},{name:"klay"},{name:"cose-bilkent"}]} key={"layout"} onChange={(e)=>this.setLayout(e.name)}/>
        <CytoscapeComponent  stylesheet={this.styles} elements={this.state.elements} layout={this.layoutOptions}  cy={(cy) => this.init(cy)} style={ { background: '#ffe6ff', width: '1200px', height: '600px' } } />;
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
        <Offcanvas
           placement='end'
           show={(this.state.selectedNode != undefined)||(this.state.selectedType != undefined)||(this.state.selectedList != undefined)}
           onHide={()=>this.resetSelection()}>
       <Offcanvas.Header closeButton>
         <Offcanvas.Title>Selection</Offcanvas.Title>
       </Offcanvas.Header>
       <Offcanvas.Body>
         {this.infoSection()}
       </Offcanvas.Body>
     </Offcanvas>

        <QuerySteps value={this.exploration} undo={()=>this.undo()}/>
        </Col>
        </Row>
        </Container>
        </>
      )
      //  }
    }
  }


  export default GraphView;
