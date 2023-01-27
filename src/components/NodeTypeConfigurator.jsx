import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import React from 'react';

import Stack from 'react-bootstrap/Stack';
import dgraph from '../services/dgraph.js';

class NodeTypeConfigurator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      type : this.props.type,
      schema : dgraph.getTypeSchema(this.props.type)
    };
  }
  generateForm() {
   if (this.props.type != undefined) {
    return (
    <Form>
      <Form.Group  controlId="id1">
      {Object.keys(this.state.schema.features).map((key)=> {
           return (
             <>
             <Form.Label>{key}</Form.Label>
             <Form.Control
                 required
                 type='text'
                 placeholder="search string"
                />
           </>
         )

      })}


      </Form.Group>
      <Button className="mt-2" type="submit" variant="secondary" size="sm" onClick={() => this.props.query(this.state)}>Search</Button>
    </Form>
    )
  } else {
    return ( <b>Type not configurable</b>)
  }


  }

  render() {
    if (this.props.type != undefined) {
    return (
      <>
      <Card>
      <Card.Body>
        <Card.Title>{this.props.type}</Card.Title>
        <Card.Text>
         {this.generateForm()}

        </Card.Text>

      </Card.Body>
      </Card>

      </>
    );
  } else {
    return (
      <p>Not configurable</p>
    );
  }
  }
}


export default NodeTypeConfigurator;
