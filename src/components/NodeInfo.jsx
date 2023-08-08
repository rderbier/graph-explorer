
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import React from 'react';
import dgraph from '../services/dgraph.js';



/*
  displays the information of a selected node
  and display available actions
  Usage :
  <NodeInfo value={selectedNode} expand={(data)=>this.expandNode(data,'top 10')}/>

  value is cytoscape object , so we use .data() to get data with keys and values
  { name  : "company X"}
  NodeInfo is displaying all keys that are not dgraph.something, id, uid, label
  use the label value to find the property name to use for the Header
  TO DO : make the list of action buttons a parameter of the component
*/
class NodeInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data : this.props.value.data(),
      schema : dgraph.getTypeSchema(this.props.value.data()["dgraph.type"])
    };
  }


  render() {
    const data = this.props.value.data();
    if (data != undefined) {
    return (
      <>
      <Card>
      <Card.Body>
        <Card.Title>{data[data["label"]]}</Card.Title>
        <Card.Text>
        {Object.keys(data).map((key)=> {
          if ( ['id','source','target','round','uid','dgraph.type','label','name','parent'].indexOf(key) == -1) {
             return (typeof data[key] != 'object' && <><b>{this.state.schema.properties[key] ? this.state.schema.properties[key].alias : key}</b> {data[key]}<br/></> )
          }
        })}

        </Card.Text>
        <Button variant="secondary" size="sm" onClick={() => this.props.expand(this.props.value)}>Expand</Button>
        {(data !== undefined) && (data.inferedEdges !== undefined) && <Button variant="secondary" size="sm" onClick={() => this.props.reveal(this.props.value)}>Show relations</Button> }
      </Card.Body>
      </Card>

      </>
    );
  } else {
    return (
      <p>Select a node to get info</p>
    );
  }
  }
}


export default NodeInfo;
