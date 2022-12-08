import React from 'react';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Accordion from 'react-bootstrap/Accordion';

import Stack from 'react-bootstrap/Stack';

class QuerySteps extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }


  render() {
    return (
      <>
      <h2>Steps</h2>
      <Accordion defaultActiveKey="0" flush>
      <Accordion.Item eventKey="0">
        <Accordion.Header>Step #1</Accordion.Header>
        <Accordion.Body>
          Sample explanation of what the user has selected
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="1">
        <Accordion.Header>Step #2</Accordion.Header>
        <Accordion.Body>
          maybe the list of new nodes added to the graph
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
    </>
    );
  }
}


export default QuerySteps;
