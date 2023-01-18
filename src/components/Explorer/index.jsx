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
      selectedNode: undefined,
      data: props.value,
      elements: this.exploration.getElements()
    }
    this.stepIndex = 0;
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
    if (entitySchema.relations!= undefined) {
      Object.entries(entitySchema.relations).forEach(([key, value]) => {
        if (value.isArray == true) {
          topMenu.push({
            name: `${key}`, // html/text content to be displayed in the menu
            select: (ele) => { // a function to execute when the command is selected
              this.expandNode( ele, key ) // `ele` holds the reference to the active element
            }
          })
        }
      }
    )
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
  if (this.cyRef != cy) {
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
buildExpandQuery(type,uid,relation) {
  /* expand a node uid
     use type and ontology.entities[type] to build the query
  */
  var query = `{ list(func:uid(${uid})) { dgraph.type uid expand(_all_) { dgraph.type expand(_all_) }}}`
  var entity = this.props.ontology.entities[type];
  if ((entity!= undefined) && (entity.relations[relation]!=undefined)) {
    const rel = entity.relations[relation];
    query = `{ list(func:uid(${uid})) { uid dgraph.type ${relation} (${rel.expand.order}:${rel.expand.sort}, first:${rel.expand.first}) {
          uid dgraph.type
    }
  }`
}
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
infoSet(entity) {
  var infoSet = "dgraph.type uid ";
  if (entity.properties) {
    Object.keys(entity.properties).forEach((key) => {
      infoSet += ` ${key} `;
    })
  }
  if (entity.relations) {
    Object.entries(entity.relations).forEach(([key,value]) => {
      if (value.isArray == true) {
         if (value.relationNode != undefined) {  // count the predicate to the relationNode
           infoSet += `${key}:count(${value.relationNode.predicate}) `;
         } else {
           infoSet += `${key}:count(${key}) `;
         }
      }
    })
  }
  return infoSet;
}
expandType(ele,option) {
  const type = ele.id();
  this.resetSelection();
  var entity = this.props.ontology.entities[type];
  if (entity!= undefined) {
    var query = `{ list(func:type(${type}),first:25) { dgraph.type uid `;

      query += this.infoSet(entity)+'}}';
    var title = `expand ${type}`;
    this.runQuery(query).then((r)=>this.analyseQueryResponse(query,r["data"],true,title))
  }
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
  // criteria has a list of property operator value (value2) which are ANDed to search.
  // currently supporting "anyoftext"
  var query;
  if ((criteria.criteria != undefined) && (Object.keys(criteria.criteria).length > 0)) {
    var property = Object.keys(criteria.criteria)[0];
    var c = criteria.criteria[Object.keys(criteria.criteria)[0]]; // just using first criteria at the moment
    query = `{
      all(func:${c.operator}(${property},"${c.value}")) @filter(type(${criteria.type})) { `;
    query += this.infoSet(this.props.ontology.entities[criteria.type]);
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
  if (this.state.selectedNode != undefined) {
    return <NodeInfo value={this.state.selectedNode} expand={(data)=>this.expandNode(data,'top 10')}/>
  } else if (this.state.selectedType != undefined) {
    return <NodeSelector type={this.state.selectedType} schema={this.props.ontology.entities[this.state.selectedType]}query={(data)=>this.searchNode(data)}/>
  } else if (this.state.selectedList != undefined) {
    return <NodeListInfo elements={this.state.selectedList}/>
  }
}
setLayout(layoutName) {
  if (layouts.layoutMap[layoutName] != undefined) {
    this.layoutOptions = layouts.layoutMap[layoutName];
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
