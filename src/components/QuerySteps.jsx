import React from 'react'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Stack from 'react-bootstrap/Stack'
import Accordion from 'react-bootstrap/Accordion'
import {Exploration, ExplorationStep} from '../services/exploration.js'
import CloseButton from 'react-bootstrap/CloseButton'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUndo } from '@fortawesome/free-solid-svg-icons'

class QuerySteps extends React.Component {
  constructor(props) {
    // props.value is an Exploration Object
    super(props);
    this.state = {
    };
  }

  showElements(step) {
    let array = [];
    for (var el of step.elements) {

      if (el.group == "nodes") {
        const data = el.data;
        array.push(
          <><b>{'name'}</b> {data["label"]}<br/></>

        )
      }
    }
    return array;
  }
  render() {
    return (
      <>
      <h3>Steps</h3>
      <Accordion defaultActiveKey="0" flush>
      {
        this.props.value.steps.map((step,index) => {
          return (<Accordion.Item eventKey={index}>
          <Accordion.Header>{step.title} </Accordion.Header>
          <Accordion.Body>
          {this.showElements(step)}
          </Accordion.Body>
          </Accordion.Item>
        )
      })
    }

    </Accordion>

    { (this.props.value.steps.length > 1) && <FontAwesomeIcon icon={faUndo} onClick={this.props.undo}/>}

    </>
  );
}
}


export default QuerySteps;
