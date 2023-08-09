import React from 'react';
import logo from './logo.svg';
import './App.css';
import Container from 'react-bootstrap/Container';
import Explorer from '../Explorer';
import AppHeader from '../AppHeader';
import Credentials from '../Credentials';
import dgraph from '../../services/dgraph.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
//
// searchable properties must have at least one operator -> maybe set it to eq by default
// property can be a property of a linked nodes if the path is through 1-1 -> to be checked


  class App extends React.Component {

    constructor(props) {
      super(props);
      this.state= { connected :false, uiconfig: dgraph.getUiconfig(),  ontology:dgraph.getOntology()};
      }
  start(state) {
     if (state == true) {
       this.setState({connected:state, style:dgraph.getStyle(), uiconfig: dgraph.getUiconfig(), ontology:dgraph.getOntology()})
     } else {
       this.setState({connected:state})
     }

  }
  render() {
    if (!this.state.connected) {
      return (<>
      <Container fluid >
      <AppHeader logo_url={this.state.uiconfig?.logo_url} connexion="localhost:8080"/>
      <Container fluid className="pt-5">
      <Credentials onConnect={(state)=>this.start(state) }/>
      </Container>
      </Container>


      </>)
    } else {
      return (
        <>
        <Container fluid >
        <AppHeader logo_url={this.state.uiconfig?.logo_url} connexion="localhost:8080"/>
        <Container fluid className="pt-5">
        <Explorer style={this.state.style} uiconfig={this.state.uiconfig} ontology={this.state.ontology}/>
        </Container>
        </Container>


        </>
      );
    }
  }
}

  export default App;
