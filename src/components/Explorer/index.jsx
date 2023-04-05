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
import NodeTypePanel from '../NodeTypePanel.jsx';
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
import layouts from './layouts.js';

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
    this.categories = dgraph.getCategories(props.ontology);
    this.exploration = new Exploration();
    this.exploration.addStep('Business domain', "", this.schemaGraph, true)
    this.state = {
      useCompound: true, // group nodes in compounds
      selectedNode: undefined,
      data: props.value,
      elements: this.exploration.getElements()
    }
    this.stepIndex = 0;
    this.setLayout("dagre");
    this.setSchemaLayout("dagre");
  }
  initMenu(nodeType,commandList) {
    let defaults = {
      menuRadius: function(ele){ return 80; }, // the outer radius (node center to the end of the menu) in pixels. It is added to the rendered size of the node. Can either be a number or function as in the example.
      cxtmenuadaptativeNodeSpotlightRadius: true,
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
  topMenu(entitySchema) {
    var topMenu =[
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
      }

    ]
    /*
    * add expansion along relationships
    */
    if (entitySchema.relations!== undefined) {
      Object.entries(entitySchema.relations).forEach(([key, value]) => {
        //  if (value.isArray == true) {
        topMenu.push({
          name: `${value.label || key}`, // html/text content to be displayed in the menu
          select: (ele) => { // a function to execute when the command is selected
            this.expandNode( ele, key ) // `ele` holds the reference to the active element
          }
        })
        //  }
      }
    )
  }
  if (entitySchema.features!== undefined) {
    Object.entries(entitySchema.features).forEach(([key, value]) => {
      topMenu.push({
        name: `${key}`, // html/text content to be displayed in the menu
        select: (ele) => { // a function to execute when the command is selected
          this.expandNodeByFeature( ele, value) // `ele` holds the reference to the active element
        }
      })
    })
  }
  return topMenu
}
init(cy: CSCore) {


  const expandMenu =[
    {
      name: 'expand', // html/text content to be displayed in the menu
      select: (ele) => { // a function to execute when the command is selected
        this.expandType( ele,'expand'  ) // `ele` holds the reference to the active element
      }
    }
  ]
  if (this.cyRef !== cy) {
    console.log("init cy");
    this.cyRef = cy;


    cy.removeAllListeners();

    Object.entries(this.props.ontology.entities).forEach(
      ([key, value]) => {
        this.initMenu(key,this.topMenu(value));
        this.initMenu(`type${key}`,expandMenu);
      }
    )







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
  // source and target are object with type and uid
  if ((source !== undefined) && (target !== undefined)) {
    const sourceNode = this.getNodeById(source.uid,elements);
    const isTargetPresent = this.isNodePresent(target.uid);
    const id = `${source.uid}:${target.uid}:${label}`;
    if ((sourceNode != undefined) && (sourceNode.data != undefined) && (this.getEdgeById(elements,id) === undefined)) {
      const reverse = dgraph.reverseEdge(source.type,label);
      if ((reverse == undefined) || (this.getEdgeById(elements,`${target.uid}:${source.uid}:${reverse}`) == undefined )) {


        console.log(`adding Edge ${label} from ${source.uid} to ${target.uid} (new : ${isTargetPresent})`);

        let elt = { group: 'edges' };

        elt.data = data || {};
        elt.data.id = `${source.uid}:${target.uid}:${label}`;
        elt.data.info = `${source.uid}:${target.uid}:${label}`;
        elt.data.source =source.uid;
        elt.data.target =target.uid;
        elt.data.label = label;
        elt.data.round = this.stepIndex;

        if (isTargetPresent) {
          elt.classes = ["infered"]
          if (sourceNode.data.inferedEdges === undefined) {sourceNode.data.inferedEdges = []}
          sourceNode.data.inferedEdges.push(elt);
        } else {
          elements.push(elt);
        }
      }
    }
  }
}
getUidsForType(type) {
  return this.state.elements
  .filter((e)=> { return ((e.group === "nodes") && (e.data["dgraph.type"]===type))})
  .map((e) => e.data.id);

}
getNodeById(id,elements = undefined) {
  let result = this.state.elements.filter((e)=> { return ((e.group === "nodes") && (e.data["id"]==id))})
  if ((result.length === 0) && (elements !== undefined)) {
    result = elements.filter((e)=> { return ((e.group === "nodes") && (e.data["id"]==id))})
  }

  return result[0]
}
getEdgeById(elements,id) {

  let result = this.state.elements.filter((e)=> { return ((e.group === "edges") && (e.data["id"]==id))});
  if (result.length === 0) {
    result = elements.filter((e)=> { return ((e.group === "edges") && (e.data["id"]==id))})
  }
  return result[0]
}
isNodePresent(uid) {
  const test = this.getNodeById(uid);
  return test !== undefined;

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


      expandType(ele,option) {
        const type = ele.id();
        this.resetSelection();
        var entity = this.props.ontology.entities[type];
        if (entity!== undefined) {
          var query = dgraph.buildExpandTypeQuery(type);
          //var query = `{ list(func:type(${type}),first:25) { `;

          //  query += dgraph.infoSet(type)+'}}';
            var title = `expand ${type}`;
            this.runQuery(query).then((r)=>this.analyseQueryResponse(query,r["data"],true,title))
          }
        }
        removeNode(ele) {
          console.log(`delete node ${ele.id()}`);
          const uid = ele.id();
          var elements = this.state.elements.filter((e)=>{
            if (e.group == "nodes") {
              return (e.data.id !== uid)
            } else {
              return ((e.data.target !== uid) && (e.data.source!== uid))
            }
          })
          this.setState({elements:elements})
          //  ele.remove();
        }
        cropNode(ele) {
          console.log(`crop node `);
          const parent = ele.parent();
          if (parent !== undefined) {
            let idList = [];
            for (var n of parent.children()) {
              if (n.id() !== ele.id()) {
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
        revealEdgesOfGroup(group) {
          for (var ele of group) {
            this.revealEdges(ele);
          }

        }
        revealEdges(ele) {
          if (ele.data().inferedEdges !== undefined) {
            this.setState({elements: [...this.state.elements,...ele.data().inferedEdges]})
          }
        }
        expandNode(ele, relation) {
          this.resetSelection();
          const uid = ele.id();
          const type = ele.data()['dgraph.type'];
          //build the map of all uids we will need to find edges with existing nodes in the layout
          let uidMap = {};
          const typeInfo = this.props.ontology.entities[type];
          const rel = typeInfo.relations[relation];
          // The current type has the relation we want to expand on

          const expandType = typeInfo.relations[relation].entity;
          const expandTypeInfo = this.props.ontology.entities[expandType];
          Object.entries(expandTypeInfo.relations).forEach(([key,value]) => {
            if (uidMap[value.entity] == undefined) {
              var list = this.getUidsForType(value.entity);
              if (list.length > 0) {
                uidMap[value.entity] = list;
              }
            }
          })
          var query = dgraph.buildExpandQuery(type,uid,relation,uidMap);
          this.setVisitedNode(ele);
          const title = `Expand ${type} ${ele.data()['name']}`
          this.runQuery(query).then((r)=>this.analyseQueryResponse(query,r["data"],false,title))
          console.log(`round ${this.stepIndex}`);

        }
        expandNodeByFeature(ele, featureParams) {

          console.log(`Apply feature to expand node ${featureParams.algo}`);
          const nodeData = ele.data();
          const type = nodeData['dgraph.type'];
          const title = `Proximity ${type} ${ele.data()['name']}`
          const query = dgraph.buildJaccardQuery(type,nodeData.uid,featureParams);
          this.runQuery(query).then((r)=>this.analyseProximityResponse(query,r["data"],false,title))
        }
        isRelation(e) {
          return (e['dgraph.type'][0] == "Investment")
        }
        undo() {
          // remove last steps
          this.setState({elements: this.exploration.undoLastStep() })

        }
        addGraph(elements,e,compound,level,parentNode,predicate) {
          // elements is the current cytoscape graph
          // e is one node with potentially nested info to add
          // coumpound is a grouping info : we use the sequence of the query in the plan
          // level : nested level of analysing the node : we start at 1 and if the node as nested info we recurse addGraph at level+1
          // parentNode and predicate is used for nested (recursive) analysis : uid of the parent node and predicate leading to this child node.
          this.maxLevel=level;

          var target;
          let uid =  e['id'] || e['uid'] ;
          const type = e['dgraph.type'][0];
          const typeInfo = dgraph.getTypeSchema(type);
          const source = { uid:uid, type:type}
          console.log(`Entering ${type} ${uid}`);
          if (uid !== undefined) {
            var point = {};
            for(var key in e) {
              if (key!=='dgraph.type') {
                if(typeof e[key] == 'object') {

                  if (Array.isArray(e[key])) {
                    // Array could be a scalar array or node array
                    // we are handling only node arrays
                    if ((e[key].length > 0) && (typeof e[key][0] === 'object')) {
                      for (var child of e[key]) {
                        target= this.addGraph(elements,child,compound,level+1,source,key);
                        this.addEdge(elements,source, target, key)
                      }
                    }
                  } else {
                    // nested block : key is a predicate to a node or just an simple info
                    if (e[key]['dgraph.type'] === undefined) {

                      if (e[key].label !== undefined){
                        point[key]=e[key].label;
                      }
                    } else
                    if (!this.isRelation(e)) {
                      // if the node we are in is a normal node we can just add the nested object and create an edge
                      target = this.addGraph(elements,e[key],compound,level+1,source,key);
                      this.addEdge(elements,source, target, key)
                    } else {
                      // the node we are in is a 'fake' node used to hold relation information
                      // continue to add the target node of the relation
                      target = this.addGraph(elements,e[key],compound,level,source,key);
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
                var classes = type || ["default"];


                point['label'] = point[typeInfo.label] || point['id'];

                if (this.state.useCompound === true) {
                  point['parent'] = "c"+compound+"-"+level;
                  point['parent'] = "c"+compound+"-1";
                }
                elements.push({
                  group:"nodes",
                  data:point,
                  classes: classes
                });
                if (this.newNodeCounter[`${level}`] !== undefined) {
                  this.newNodeCounter[`${level}`] +=1;
                }  else {
                  this.newNodeCounter[`${level}`] = 1;
                }
                console.log(`adding node ${uid}`);
              } else {
                // if the current node is a relation,
                // we know the target and can add edge from parent (the from) to the target node, with the data of this relation node
                this.addEdge(elements,parentNode, target, predicate, point);
                // we clear the returned info so the parent in the recusive calls will no create an edge to this node
                uid = undefined;
              }
            } else {
              if (this.isRelation(e))  {
                uid = undefined;
              }
              console.log(`node already exists ${uid}`);
            }
          } else { console.log(`node without id or uid`)}
          // return an object with uid and type
          var nodeReturned
          if (uid !== undefined) {
            nodeReturned = {uid:uid, type:type}
          }
          return nodeReturned
        }
        analyseProximityResponse( query, data , reset = true, title) {
        }
        analyseQueryResponse( query, data , reset = true, title) {
          var elements = [];

          this.newNodeCounter = {}
          if (data) {
            console.log("analyseQueryResponse");
            //console.log(JSON.stringify(data,null,2));

            for(var key in data) { // each data block
              if(data.hasOwnProperty(key)) {

                for (var e of data[key]) { // each entry in the block array
                  this.addGraph(elements,e,this.stepIndex,1);

                }
              }
              //this.layout.run();
            }
            // add compound only if we found some nodes
            if ((Object.keys(this.newNodeCounter).length > 0) &&(this.state.useCompound === true)) {
              const compound = 'c'+this.stepIndex+"-"+1;
              elements.push({
                group:"nodes",
                data:{id:compound, name:this.stepIndex}
              })
              /*
              for (var i = 2; i <= this.maxLevel; i++) {
              if (this.newNodeCounter[`${i}`] > 0) {
              elements.push({
              group:"nodes",
              data:{id:'c'+this.stepIndex+"-"+i, name:""+this.stepIndex+"-"+i, parent:compound}
            })
          }
        }
        */
      }
      if (elements.length > 0) {
        if (title == undefined) { title = this.stepIndex}
        this.exploration.addStep(title,query,elements,reset);
        if (reset !== true) {
          elements = [...this.state.elements,...elements];
        }
        this.setState({elements: elements})
      }

      //  if (this.cyRef !== undefined) {
      //    this.cyRef.add(this.elements);
      //  }
    }
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    console.log("GraphView did update");
    if (this.props.value !== prevProps.value) {
      this.analyseQueryResponse("",this.props.value.data);
    }
  }
  buildSearchQuery(criteria) {
    // criteria has a list of property operator value (value2) which are ANDed to search.
    // currently supporting "anyoftext"
    var query;
    if ((criteria.criteria !== undefined) && (Object.keys(criteria.criteria).length > 0)) {
      var property = Object.keys(criteria.criteria)[0];
      var c = criteria.criteria[Object.keys(criteria.criteria)[0]]; // just using first criteria at the moment
      query = `{
        all(func:${c.operator}(${property},"${c.value}"), first:10) @filter(type(${criteria.type})) { `;
          query += dgraph.infoSet(criteria.type);
          query+=` } }`
        }

        // if (criteria.type == "Company") {
        //   query = `{
        //     all(func:anyoftext(name,"${criteria.name}")) @filter(type(${criteria.type})) { dgraph.type uid expand(_all_) investors: count(investments) }
        //   }`
        // }
        // if (criteria.type == "Investor") {
        //   query = `{
        //     all(func:anyoftext(name,"${criteria.name}")) @filter(type(${criteria.type})) { dgraph.type uid expand(_all_) investments: count(invest) }
        //   }`
        // }
        return query;
      }
      searchNode(criteria) {
        // criteria has a list of property operator value (value2) which are ANDed to search.
        // operator is the name of dgraph function (anyoftext, eq, ...)
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
        if (this.state.selectedNode !== undefined) {
          return <NodeInfo value={this.state.selectedNode} reveal={(data)=>this.revealEdges(data)} expand={(data)=>this.expandNode(data,'top 10')}/>
        } else if (this.state.selectedType !== undefined) {
          return   <NodeTypePanel type={this.state.selectedType} query={(data)=>this.searchNode(data)}/>


        } else if (this.state.selectedList !== undefined) {
          return <NodeListInfo elements={this.state.selectedList} reveal={(data)=>this.revealEdgesOfGroup(data)} />
        }
      }
      setLayout(layoutName) {
        if (layouts.layoutMap[layoutName] !== undefined) {
          this.layoutOptions = layouts.layoutMap[layoutName];
          if (this.cyRef !== undefined) {
            this.cyRef.nodes(":locked").unlock();
            this.cyRef.layout(this.layoutOptions).run();
          }
        }

      }
      setSchemaLayout(layoutName) {
        if (layouts.layoutMap[layoutName] !== undefined) {
          this.schemaLayoutOptions = layouts.layoutMap[layoutName];
          if (this.cyRef !== undefined) {
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
          <Tab eventKey="schema" title="Schema">
          <Selector options={[{name:"dagre"},{name:"cola"},{name:"klay"},{name:"cose-bilkent"}]} key={"layout"} onChange={(e)=>this.setSchemaLayout(e.name)}/>
          <CytoscapeComponent  stylesheet={this.styles} elements={this.schemaGraph} layout={this.schemaLayoutOptions}  cy={(cy) => {}} style={ { background: '#ffe6ff', width: '1200px', height: '600px' } } />;

          </Tab>

          </Tabs>
          </Col>
          <Col>
          <Offcanvas
          id="offcanvas-info"
          placement='end'
          backdrop={false}
          show={(this.state.selectedNode !== undefined)||(this.state.selectedType !== undefined)||(this.state.selectedList !== undefined)}
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
