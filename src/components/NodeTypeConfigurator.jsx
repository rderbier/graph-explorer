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
      schema : dgraph.getTypeSchema(props.type)
    };
  }

  static getDerivedStateFromProps(props, state) {
    const config = dgraph.getTypeBehavior(props.type)
    const nstate = {
      schema : dgraph.getTypeSchema(props.type),
      config : dgraph.getTypeBehavior(props.type)
    }
    return nstate
  }
  handleExpandChange(event) {
    let fieldName = event.target.name;
    let fieldVal = event.target.value;
    let config = this.state.config
    config.expand[fieldName]=fieldVal;
    var newconf = dgraph.setTypeBehavior(this.props.type,config);
    this.setState({
      config: newconf
    });
  }
  generateForm() {
    return (
    <Form>
      <Form.Group  controlId="typeconfigurator">
      <Form.Label>{"Expand"}</Form.Label>
      <Form.Control
          required
          type='text'
          name='first'
          placeholder='search string'
          defaultValue={this.state.config.expand.first}
          onChange={this.handleExpandChange.bind(this)}/>
      </Form.Group>
      {/*
      <Button className="mt-2" type="submit" variant="secondary" size="sm" onClick={() => this.props.query(this.state)}>Search</Button>
      */}
    </Form>
    )

        /*  {Object.keys(this.state.schema.features).map((key)=> {
               return (
                 <>
                 <Form.Label>{key}</Form.Label>
               </>
             )

          })}
          */



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
