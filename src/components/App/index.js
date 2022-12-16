import logo from './logo.svg';
import './App.css';
import Container from 'react-bootstrap/Container';
import Explorer from '../Explorer';
import AppHeader from '../AppHeader';


const style = {
  colors: [
    "rgb(165, 137, 175)",
    "rgb(222, 164, 192)",
    "rgb(236, 202, 170)",
    "rgb(247, 237, 195)",
    "rgb(173, 225, 212)",
    "rgb(167, 187, 225)"],

  colorMap: {
      "Sector" : 0,
      "Industry" : 2,
      "Company" : 1,
      "Investment" : 3,
      "Investor" : 4,
      "Country" : 5,
      "InvestorType" : 4
    }
}
function App() {
  return (
    <>
    <Container fluid >
      <AppHeader connexion="localhost:8080"/>
      <Container fluid className="pt-5">
            <Explorer style={style}/>
      </Container>
    </Container>


  </>
  );
}

export default App;
