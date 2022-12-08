import React from 'react';
import Container from 'react-bootstrap/Container';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Chart } from "react-chartjs-2";


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

class ChartView extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      data: undefined,
      options: undefined
    }


  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    const data = {
      labels: [],
      datasets: [{
        label: '',
        data: [],
        borderWidth: 1,
        backgroundColor: "rgba(255, 99, 132, 0.5)"
      }]
    };

    const options = {
      plugins: {
        title: {
          display: true,
          text: ""
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };
    if (this.props.value != prevProps.value) {
      if ( this.props.value.data) {
        var firstKey, firstProp;
        for(var key in this.props.value.data) {
          if(this.props.value.data.hasOwnProperty(key)) {
              firstKey = key;
              firstProp = this.props.value.data[key];
              break;
           }
        }

       if (firstProp && firstProp[0]) {
        options.plugins.title.text = firstKey;

        const points = firstProp[0]["@groupby"];

        //console.log(`Update ChartView data ${points}`);
        if (points != undefined) {
        for (var p of points) {
          var keys = Object.keys(p);
            data.labels.push(p[keys[0]]);
            data.datasets[0].data.push(p[keys[1]]);
            data.datasets[0].label = keys[1];
          }



        this.setState({data: data, options:options});
      }
      }
    }

    }
  }
  render() {
    if (this.state.data != undefined) {
    return (
      <Container >
      <Chart type='bar'data={this.state.data} options={this.state.option} >

      </Chart>
      </Container>

    )
   }
   return ( <></>);
  }
}


export default ChartView;
