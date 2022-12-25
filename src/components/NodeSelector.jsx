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
      type : this.props.type
    };
  }
  generateForm() {

    return (
    <Form>
      <Form.Group  controlId="id1">
        <Form.Label>Name</Form.Label>
        <Form.Control
            required
            type="text"
            placeholder="search string"
            onChange={(event)=>this.state.name = event.target.value} />
      </Form.Group>
      <Button className="mt-2" type="submit" variant="secondary" size="sm" onClick={() => this.props.query(this.state)}>Search</Button>
    </Form>
    )


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
