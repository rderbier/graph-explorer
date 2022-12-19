import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import "./Credentials.css";
import dgraph from '../../services/dgraph.js';

export default function Credentials(props) {
  const [key, setKey] = useState(localStorage.getItem('dgraph-key')||"");
   const [msg, setMsg] = useState("");
  function validateForm() {
    return key.length > 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    localStorage.setItem('dgraph-key', key);
    dgraph.isConnected(key)
    .then((state)=>props.onConnect(state))
    .catch((e)=> {
      setMsg(e)
    });
  }

  return (
    <div className="Login">

      <Form onSubmit={handleSubmit}>
      {msg}

        <Form.Group size="lg" controlId="password">
          <Form.Label>API key</Form.Label>
          <Form.Control
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </Form.Group>
        <Button block="true" size="lg" type="submit" disabled={!validateForm()}>
          Connect
        </Button>
      </Form>
    </div>
  );
}
