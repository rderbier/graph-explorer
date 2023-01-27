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

const style = {
  colors: [
    "rgb(165, 137, 175)",
    "rgb(222, 164, 192)",
    "rgb(236, 202, 170)",
    "rgb(247, 237, 195)",
    "rgb(173, 225, 212)",
    "rgb(167, 187, 225)"],

    entities: {
      "Sector" : {
        style: {
          "background-color": 0
        }
      },
      "Industry" : {
        style: {
          "background-color": 2
        }
      },
      "Company" : {
        style: {
          "background-color": 1
        }
      },
      "Investment" :{
        style: {
          "background-color":   5
        }
      },
      "Investor" : {
        style: {
          "background-color": 4
        }
      },
      "Country" : {
        style: {
          "background-color": 5
        }
      },
      "InvestorType" : {
        style: {
          "background-color": 4
        }
      },
    }
  }

  class App extends React.Component {

    constructor(props) {
      super(props);
      this.state= { connected :false};
      }
  start(state) {
     if (state == true) {
       this.setState({connected:state, ontology:dgraph.getOntology()})
     } else {
       this.setState({connected:state})
     }

  }
  render() {
    if (!this.state.connected) {
      return (<>
      <Container fluid >
      <AppHeader connexion="localhost:8080"/>
      <Container fluid className="pt-5">
      <Credentials onConnect={(state)=>this.start(state) }/>
      </Container>
      </Container>


      </>)
    } else {
      return (
        <>
        <Container fluid >
        <AppHeader connexion="localhost:8080"/>
        <Container fluid className="pt-5">
        <Explorer style={style} ontology={this.state.ontology}/>
        </Container>
        </Container>


        </>
      );
    }
  }
}

  export default App;
