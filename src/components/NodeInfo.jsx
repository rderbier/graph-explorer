import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import React from 'react';

import Stack from 'react-bootstrap/Stack';


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
      data : props.value.data()
    };
  }


  render() {
    if (this.state.data != undefined) {
    return (
      <>
      <Card>
      <Card.Body>
        <Card.Title>{this.state.data[this.state.data["label"]]}</Card.Title>
        <Card.Text>
        {Object.keys(this.state.data).map((key)=> {
          if ( ['id','source','target','round','uid','dgraph.type','label','name','parent'].indexOf(key) == -1) {
             return (typeof this.state.data[key] != 'object' && <><b>{key}</b> {this.state.data[key]}<br/></> )
          }
        })}

        </Card.Text>
        <Button variant="secondary" size="sm" onClick={() => this.props.expand(this.props.value)}>Expand</Button>
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
