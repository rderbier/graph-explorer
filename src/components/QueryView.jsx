import React from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import ChartView from './ChartView.jsx';
import GraphView from './GraphView.jsx';
import QuerySteps from './QuerySteps.jsx';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
class QueryView extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      key: "graph",
      data: props.value
    }


  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.value != prevProps.value) {
      console.log(`Update QueryView data ${this.props.value}`);
      const pretty = JSON.stringify(this.props.value,null,2);
      const rows = Math.min(20,pretty.split(/\r\n|\r|\n/).length);
      this.setState({json: pretty, rows:rows});
    }
  }
  render() {
    return (
      <Container>
        <Row>
          <Col>
            <QuerySteps />
          </Col>
          <Col xs={9}>
          <Tabs
          id="controlled-tab-example"
          activeKey={this.state.key}
          onSelect={(k) => this.setState({key:k})}
          className="mb-3"
          >

            <Tab eventKey="graph" title="Graph">
              <GraphView value={this.props.value}/>
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
        </Row>
      </Container>


    );
  }
}


export default QueryView;
