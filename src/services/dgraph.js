
const dgraphEndpoint = "/query?timeout=20s&debug=true"
var key
var schema
var ontology
/* schema format
  {
   "schema": [
      {
        "predicate": "FSYMID",
        "type": "string",
        "index": true,
        "tokenizer": [
          "hash"
        ]
      },...],
   "types": [
    {
      "name": "Company",
      "fields": [
        {
          "name": "factsetid"
        },
        ...
      ],

    }]
  }
*/
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
    }).then( (response) => response.json()).then((j)=> {

      console.log(`response ${JSON.stringify(j)}`);
      return j})


}
const getCategories = (ontology) =>{
  var query = "";
  Object.entries(ontology.entities).forEach(
    ([key, value]) => {
      console.log(key, value);
      if ((value.type == "category") && (value.label != undefined)) {
        query += `  ${key}(func:type(${key})) { uid label:${value.label}} \n`;
      }
    }
  );
  query = "{ "+query+"}";
  return runQuery(query)
  .then((r)=>{
    console.log(`response ${r}`);
  })

  }

const getOntology = ()=>{
   return ontology;
}
const buildOntology = () => {
  /* TO DO : build from schema */
  ontology = {
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
          "investors" : {
            isArray:true,
            entity:"Investor",
            relationNode:{predicate:"investments",entity:"Investment",out_predicate:"investor"},
            expand:{order:"orderdesc",sort:"OS",first:"10"}
          },
          "industry" : { entity:"Industry"},
          "country" : { entity:"Country"}
        }
      },
      "Investment" : {
        type:"relation",
        properties : {
          "OS" : { type:"float", searchable: false},
          "POS" :{ type:"int", searchable: false},
          "MKTVAL" :{ type:"float", searchable: false}
        },
        relations : {
          "company" : { isArray:false, entity:"Company"}
        }
      },
      "Investor" : {
        type:"entity",
        properties : {
           "name" : { type:"text", searchable: true, operators:["anyoftext"]}
        },
        relations : {
          "investments" : {
            isArray:true,
            entity:"Company",
            relationNode:{predicate:"invest",entity:"Investment",out_predicate:"company"},
            expand:{order:"orderdesc",sort:"OS",first:"10"}
          },
          "type" : { entity:"InvestorType"}
        }
      },
      "Country" : {
        type:"category",
        properties : {
           "name" : { type:"text", searchable: true, operators:["anyoftext"]}
         }
      },
      "Industry" : {
        type:"category",
        parent:"Sector",
        properties : {
           "name" : { type:"text", searchable: true, operators:["anyoftext"]}
         },
        relations : {
          "sector" : { entity:"Sector"}
        }
      },
      "Sector" : {
        type:"category",
        label:"name",
        properties : {
           "name" : { type:"text", searchable: true, operators:["anyoftext"]}
         }
      },
      "InvestorType" : {
        type:"category",
        properties : {
           "name" : { type:"text", searchable: true, operators:["anyoftext"]}
         }
      }
    }
  }
}

const infoSet = (type) => {
  const entity = ontology.entities[type];
  var infoSet = "dgraph.type uid ";
  if (entity.properties) {
    Object.keys(entity.properties).forEach((key) => {
      infoSet += ` ${key} `;
    })
  }
  if (entity.relations) {
    Object.entries(entity.relations).forEach(([key,value]) => {
      if (value.isArray == true) {
         if (value.relationNode != undefined) {  // count the predicate to the relationNode
           infoSet += `${key}:count(${value.relationNode.predicate}) `;
         } else {
           infoSet += `${key}:count(${key}) `;
         }
      }
    })
  }
  return infoSet;
}
const infoSetLimited = (type) => {
  const entity = ontology.entities[type];
  var infoSet = "dgraph.type uid ";
  if (entity.properties) {
    Object.keys(entity.properties).forEach((key) => {
      infoSet += ` ${key} `;
    })
  }

  return infoSet;
}
const isConnected = (k) =>{
  key = k;
  return runQuery("schema {}")
  .then((r)=>{
    console.log(`response ${r}`);
    schema = r.data;
    buildOntology();
    if (r.errors != undefined) {
      throw(r.errors[0].message)
    } else {
      return true
    }
  })
  .catch ( (e)=> {console.log(e); throw ("Connection refused")});
}





export default {runQuery,isConnected, getCategories, getOntology, infoSet,infoSetLimited}
