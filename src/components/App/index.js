import React from 'react';
import logo from './logo.svg';
import './App.css';
import Container from 'react-bootstrap/Container';
import Explorer from '../Explorer';
import AppHeader from '../AppHeader';
import Credentials from '../Credentials';
//
// searchable properties must have at least one operator -> maybe set it to eq by default
// property can be a property of a linked nodes if the path is through 1-1 -> to be checked
const ontology = {
  entities : {
    "Company" : {
      type:"entity",
      properties : {
         "name" : { type:"text", searchable: true, operators:["anyoftext"]},
         "ticker" : { type:"text", searchable: true, operators:["eq"]},
         "factsetid" : { type:"text", searchable: true, operators:["eq"]},
         "country" : { type:"text", searchable: true, path:["country","name"], operators:["eq"]},
         "industry" : { type:"text", searchable: true, path:["industry","name"], operators:["eq"]},
         "sector" : { type:"text", searchable: true, path:["industry","sector","name"], operators:["eq"]}
      },
      relations : {
        "investors" : { isArray:true, entity:"Investor", relationNode:{predicate:"investments",type:"Investment",out_predicate:"investor"}},
        "industry" : { entity:"Industry"},
        "country" : { entity:"Country"}
      }
    },
    "Investment" : {
      type:"relation",
      relations : {
        "in" : { isArray:false, entity:"Company"}
      }
    },
    "Investor" : {
      type:"entity",
      relations : {
        "invest" : { isArray:true, entity:"Investment"},
        "type" : { entity:"InvestorType"}
      }
    },
    "Country" : {
      type:"category"
    },
    "Industry" : {
      type:"category",
      parent:"Sector",
      relations : {
        "sector" : { entity:"Sector"}
      }
    },
    "Sector" : {
      type:"category",
      label:"name"
    },
    "InvestorType" : {
      type:"category"
    }
  }
}
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

  render() {
    if (!this.state.connected) {
      return (<>
      <Container fluid >
      <AppHeader connexion="localhost:8080"/>
      <Container fluid className="pt-5">
      <Credentials onConnect={(state)=>this.setState({connected:state}) }/>
      </Container>
      </Container>


      </>)
    } else {
      return (
        <>
        <Container fluid >
        <AppHeader connexion="localhost:8080"/>
        <Container fluid className="pt-5">
        <Explorer style={style} ontology={ontology}/>
        </Container>
        </Container>


        </>
      );
    }
  }
}

  export default App;
