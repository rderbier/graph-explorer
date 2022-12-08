import React from 'react'
import { Form } from "react-bootstrap";
import NavDropdown from 'react-bootstrap/NavDropdown';
import './Selector.css'
class Selector extends React.Component{

  constructor(props){
    super(props);
    this.state = {
      options: this.props.options
    };
  }

  onChangeSelect(event) {

    console.log(event.target.value);
    var selected = this.state.options.filter( (o)=>{return (o.name == event.target.value)});
    this.props.onChange(selected[0])

  }


  render(){
    return(
      <>


      <Form.Select className={'selector'} aria-label="Default select example" onChange={(e)=>this.onChangeSelect(e)}>
      {
        this.state.options.map((option) => {
          return (<option key={option.name} value={option.name}>{option.name}</option>)
        })
      }
      </Form.Select>
      </>
    )

  }
}
  export default Selector;
