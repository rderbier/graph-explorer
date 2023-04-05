import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import React from 'react';
import NodeSelector from './NodeSelector.jsx';
import NodeTypeConfigurator from './NodeTypeConfigurator.jsx';
import dgraph from '../services/dgraph.js';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Stack from 'react-bootstrap/Stack';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faGear } from '@fortawesome/free-solid-svg-icons'


class NodeTypePanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      type : this.props.type,
      schema : dgraph.getTypeSchema(this.props.type),
      criteria : {}
    };
  }

render() {
    if (this.props.type != undefined) {
    return (
      <Tabs
      id="controlled-tab-example"
      activeKey={this.state.key}
      onSelect={(k) => this.setState({key:k})}
      className="mb-3"
      >

      <Tab eventKey="search" title={<FontAwesomeIcon icon={faMagnifyingGlass} color="blue"/>}>
      <NodeSelector type={this.props.type} schema={this.state.schema} query={this.props.query}/>
      </Tab>
      <Tab eventKey="config" title={<FontAwesomeIcon icon={faGear} color="blue"/>}>
      <NodeTypeConfigurator type={this.props.type} />
      </Tab>

      </Tabs>
    )
  }
  }
}


export default NodeTypePanel;
