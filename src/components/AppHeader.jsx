import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Button from 'react-bootstrap/Button';
import React from 'react';

class AppHeader extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
  return (
        <>
        <Navbar bg="light" expand="lg" fixed="top">
      <Container>
        <Navbar.Brand href="#home">
          <img
            alt=""
            src = {this.props.logo_url || "/images/dgraph.svg"}
            height="30"

            className="d-inline-block align-top"
          />{' '}
          | Explorer
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Navbar.Text>
            Connected
          </Navbar.Text>
        </Navbar.Collapse>
      </Container>
      </Navbar>
        </>
      );
  }
}

export default AppHeader;
