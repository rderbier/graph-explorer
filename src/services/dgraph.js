
const dgraphEndpoint = "/query?timeout=20s&debug=true"
var key
const runQuery = (query) =>   {

  console.log(`Run query ${query}`);
  var payload = {
    query: query,
    variables: {},
  }
  return fetch(dgraphEndpoint,{
      method: 'POST',
      headers: {'Content-Type':'application/json','Authorization':key},
      body: JSON.stringify(payload),
    }).then( (response) =>response.json())


}
const isConnected = (k) =>{
  key = k;
  return runQuery("schema {}")
  .then((r)=>{
    console.log(`response ${r}`);
    if (r.errors != undefined) {
      throw(r.errors[0].message)
    } else {
      return true
    }
  })
  .catch ( (e)=> {console.log(e); throw ("Connection refused")});
}





export default {runQuery,isConnected}
