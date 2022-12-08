import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import React from 'react';

import Selector from './Selector.jsx';
import Stack from 'react-bootstrap/Stack';

class QueryInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: "",
      response:"wait for response",
      rows:3
    };
    this.runQuery("schema{type}").then(this.setSchema)
  }
  setSchema = (schema)=> {
    console.log(`Update schema ${schema}`);
    this.setState({types: schema.data.types});

  }
  runQuery = (query) =>   {

    console.log(`Run query ${query}`);
    var payload = {
      query: query,
      variables: {},
    }
    return fetch("http://localhost:8080/query?timeout=20s&debug=true",{
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload),
      }).then((response) =>response.json())



  }
  runUserQuery = () =>   {
    this.props.onChange(this.state.query);
  }
  queryChanged(event) {
    // update react state
    this.setState({ query: event.target.value});
  }
  typeChanged(type) {
    // update react state
    console.log(JSON.stringify(type));
    var query = `{ list(func:type(${type.name})) { dgraph.type uid expand(_all_) } }`
    this.props.onChange(query);
  }
  render() {
    return (
      <>
      <Container className="mt-5">
      { this.state.types!=undefined &&
        <Selector options={this.state.types} key={"name"} onChange={(e)=>this.typeChanged(e)}/>
      }
      </Container>
      <Container fluid>

      <Form >
      <Stack  className="m-3" direction="horizontal" gap={3}>
        <Button variant="outline-secondary" onClick={() => this.runUserQuery()}>Run</Button>
        <Form.Control className="me-auto" placeholder="A title ..." />

      </Stack>
        <Form.Group className="m-3" controlId="exampleForm.ControlTextarea1">
          <Form.Label>Query</Form.Label>
          <Form.Control  as="textarea" placeholder={this.props.placeholder} value={this.state.query} rows={6} onChange={(e)=>this.queryChanged(e)} />
        </Form.Group>

      </Form>
      </Container>
      </>
    );
  }
}


export default QueryInput;
