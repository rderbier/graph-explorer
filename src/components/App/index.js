import logo from './logo.svg';
import './App.css';
import Container from 'react-bootstrap/Container';
import Explorer from '../Explorer';
import AppHeader from '../AppHeader';

function App() {
  return (
    <>
    <Container fluid >
      <AppHeader/>
      <Container fluid className="pt-5">
            <Explorer />
      </Container>
    </Container>


  </>
  );
}

export default App;
