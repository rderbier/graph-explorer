
const dgraphEndpoint = "/query?timeout=20s&debug=true"

const runQuery = (query) =>   {

  console.log(`Run query ${query}`);
  var payload = {
    query: query,
    variables: {},
  }
  return fetch(dgraphEndpoint,{
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload),
    }).then( (response) =>response.json())


}
const setEndpoint = (endpoint) => {
  dgraphEndpoint = endpoint;
}

export default {runQuery, setEndpoint}
