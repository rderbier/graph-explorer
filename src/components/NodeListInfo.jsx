import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Accordion from 'react-bootstrap/Accordion';
import React from 'react';
import { CSVLink } from "react-csv";

import Stack from 'react-bootstrap/Stack';

class NodeListInfo extends React.Component {
  // display the list of node passed as props.elements
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  itemList() {
    let array = [];
    for (var ele of this.props.elements) {
      const data = ele.data();

      array.push(
        <Accordion.Item eventKey={data.id}>
        <Accordion.Header>{data.name}</Accordion.Header>
        <Accordion.Body>
        {Object.keys(ele.data()).map((key)=> {
          if ( ['id','uid','dgraph.type','label','name','parent'].indexOf(key) == -1) {
             return (<><b>{key}</b> {ele.data()[key]}<br/></> )
          }
        })}
        </Accordion.Body>
      </Accordion.Item>

      )
    }
    return array;
  }

  render() {
    if (this.props.elements != undefined) {
    return (
      <>
      <Accordion defaultActiveKey="0" flush>
      {this.itemList()}
    </Accordion>
     <CSVLink data={this.props.elements.map((e)=>e.data())}>Download</CSVLink>
      </>
    );
   }
  }
}


export default NodeListInfo;
