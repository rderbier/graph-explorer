import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import React from 'react';

import Stack from 'react-bootstrap/Stack';

class NodeInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }


  render() {
    if (this.props.value != undefined) {
    return (
      <>
      <Card>
      <Card.Body>
        <Card.Title>{this.props.value.data()['name']}</Card.Title>
        <Card.Text>
        {Object.keys(this.props.value.data()).map((key)=> {
          if ( ['id','uid','dgraph.type','label','name'].indexOf(key) == -1) {
             return (<><b>{key}</b> {this.props.value.data()[key]}<br/></> )
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
