import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import React from 'react';

import Stack from 'react-bootstrap/Stack';

class NodeSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      type : this.props.type,
      schema : this.props.schema,
      criteria : {}
    };
  }
  generateForm() {
   if (this.state.schema.properties != undefined) {
    return (
    <Form>
      <Form.Group  controlId="id1">
      {Object.keys(this.state.schema.properties).map((key)=> {
        if ( this.state.schema.properties[key].searchable == true) {
           return (
             <>
             <Form.Label>{this.state.schema.properties[key].alias || key}</Form.Label>
             <Form.Control
                 required
                 type={this.state.schema.properties[key].type}
                 placeholder="search string"
                 onChange={(event)=>this.state.criteria[key] = { operator: this.state.schema.properties[key].operators[0], value: event.target.value}} />
           </>
         )
        }
      })}


      </Form.Group>
      <Button className="mt-2" type="submit" variant="secondary" size="sm" onClick={() => this.props.query(this.state)}>Search</Button>
    </Form>
    )
  } else {
    return ( <b>No searchable properties in the ontology</b>)
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
      <p>Select a node to get info</p>
    );
  }
  }
}


export default NodeSelector;
