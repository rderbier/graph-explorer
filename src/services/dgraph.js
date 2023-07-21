
import {ontology, uiconfig} from '../ontology/investments_graphql.js';

//const dgraphEndpoint = "/query?timeout=20s&debug=true"
const dgraphEndpoint = "/query?timeout=20s&debug=true"
const dgraphEndpointGraphQL = "/graphql"
var key
var schema
var behavior = uiconfig

Object.keys(behavior.entities).forEach((item) => {
  if (behavior.entities[item].expand === undefined) {
    behavior.entities[item].expand = {first:"10"}
  }
});


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
const getStyle = ()=> {
  let style = {
    colors: [
      "rgb(165, 137, 175)",
      "rgb(222, 164, 192)",
      "rgb(236, 202, 170)",
      "rgb(247, 237, 195)",
      "rgb(173, 225, 212)",
      "rgb(167, 187, 225)"],

      entities: {
      }
    };

    let i = 0
    Object.entries(ontology.entities).forEach(
      ([key, value]) => {
        style.entities[key] = {
          style: {
            "background-color": i
          }
        }
        i = (i + 1 ) % 6
      }
    );

    return style
}
const verifyOntology = () => {
  /* TO DO : use the schema to verify that the ontology can be executed
  */

}
function reverseEdge(type,relation) {
  const entity = ontology.entities[type];
  var reverse
  if ((entity!== undefined) && (entity.relations!== undefined) && (entity.relations[relation] !== undefined)) {
     reverse = entity.relations[relation].reverse
  }
  return reverse
}

function infoSet(type) {
  const entity = ontology.entities[type];
  var infoSet = "dgraph.type uid ";
  if (entity.properties) {
    Object.keys(entity.properties).forEach((key) => {
      infoSet += ` ${key} `;
    })
  }
  if (entity.relations) {
    Object.entries(entity.relations).forEach(([key,value]) => {
      let alias = key
      if (value.label !== undefined ) {
        alias = `${value.label} : `
      }
      if (value.isArray == true) {
         if (value.relationNode != undefined) {  // count the predicate to the relationNode
           infoSet += `${alias}:count(${value.relationNode.predicate}) `;
         } else {
           infoSet += `${alias}:count(${key}) `;
         }
      } else {
         let relEntity = ontology.entities[value.entity];
         let predicate = relEntity.label || Object.keys(relEntity.properties)[0] ;
         // take the property identified as label or the first property
         infoSet += `${alias}:${key} { label:${predicate} } `;
      }
    })
  }
  return infoSet;
}
const getTypeSchema = (type) => {
  return ontology.entities[type];
}
const getTypeBehavior = (type) => {
  return behavior.entities[type];
}

const setTypeBehavior = (type,config) => {
    behavior.entities[type] = config;
    return behavior.entities[type]
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
const buildExpandTypeQuery = (type) => {
  /* expand a node representing a type
  */
  const config = behavior.entities[type]?.expand;

  var query = `{ list(func:type(${type}),first:25) { `;
  if ((config !== undefined) && (config.first !== undefined)) {
    query = `{ list(func:type(${type}),first:${config.first}) { `;
  }
  query += infoSet(type)+'}}';
  return query

}
const buildExpandQuery = (type,uid,relation,uidMap) => {
  /* expand a node uid
  use type and ontology.entities[type] to build the query
  1- get entity type of the expand : e.relations[relation].entity
  2- list of relations of this target type which have UIds in the layout

  */
  var query = `{ list(func:uid(${uid})) { dgraph.type uid expand(_all_) { dgraph.type expand(_all_) }}}`
  const typeInfo = ontology.entities[type];
  if ((typeInfo!== undefined) && (typeInfo.relations[relation]!==undefined)) {
    const rel = typeInfo.relations[relation];

    // The current type has the relation we want to expand on
    const expandType = typeInfo.relations[relation].entity;
    const expandTypeInfo = ontology.entities[expandType];


    let nodeSection = "";
    if (expandTypeInfo.relations != undefined) {
    Object.entries(expandTypeInfo.relations).forEach(([key,value]) => {

      if (uidMap[value.entity] !== undefined) {
        if (value.relationNode !== undefined) {
          let relInfoSet = infoSetLimited(value.relationNode.entity);
          nodeSection = ` \
          ${key}(func:uid(nodes)) { \
            dgraph.type uid \
            ${key}:${value.relationNode.predicate} @filter(uid_in(${value.relationNode.out_predicate},[${uidMap[value.entity].join()}])) { \
              ${relInfoSet} \
              ${value.relationNode.out_predicate} { \
                dgraph.type uid \
              } }}`
            } else {
              nodeSection = ` \
              ${value.label || key}(func:uid(nodes)) { \
                dgraph.type uid
                ${key} @filter(uid(${uidMap[value.entity].join()})) { dgraph.type uid }
              }`
            }
          }
        })
      }
        // add a section for each entry in the uidMap
        let info = infoSet(expandType);
        let varName = (nodeSection !== "") ? "nodes as " : "";
        if ((rel.expand !== undefined) && (rel.expand.sort.startsWith("count")) ){
          query = `{ var(func:uid(${uid})) {
            ${relation} {
              c as ${rel.expand.sort}
            }
          }
          nodes as var(func:uid(c), ${rel.expand.order}:val(c), first:${rel.expand.first})
          list (func:uid(${uid})) { uid dgraph.type
             ${relation} @filter(uid(nodes)) {
                ${info}
            }
          }`;

        } else {
          query = `{ list(func:uid(${uid})) { uid dgraph.type `;
            let limit = `(first:10)`;
            if (rel.expand !== undefined) {
              limit = `(${rel.expand.order}:${rel.expand.sort}, first:${rel.expand.first})`;
            }

            if (rel.relationNode !== undefined) {
              let relInfoSet = infoSetLimited(rel.relationNode.entity);

              query += `${relation}:${rel.relationNode.predicate} ${limit} { \
                ${relInfoSet} \
                ${varName} ${rel.relationNode.out_predicate} { \
                  ${info} \
                } } } `;
              } else {
                query += `${varName}  ${relation} ${limit} {
                  ${info}
                } } `;
              }
            }

            query += ` ${nodeSection} }`

        }

        return query
      }
const buildJaccardQuery = (type, uid, params)=> {

  var query = `{
    var(func: uid(${uid})) {    # M1
      investments {
       M1target as investor {
         invest {
          company {
            M2 as count(investments)
          }
        }
       }
      }
    }


  # Calculate a Jaccard distance score for every movie that shares
  # at least 1 genre with the given movie.
  var(func: uid(${uid})) {    # M1
    norm as math(1.0)               # 1
    M1_num as count(investments) # 2
    investments {
      investor {
        invest {
          company {
            M1 as math(M1_num / norm)
            num as count(investments @filter(uid_in(investor,uid(M1target))))
            distance as math( 1 - ( num / (M1 + M2 - num) )) # 6
            }
        }
      }
    }
  }

  d(func:uid(distance),orderasc:val(distance),first:10) {
     uid name
     jaccard:val(distance)
     common:val(num)
     M1:val(M1)
     M2:val(M2)
  }
  }`
  return query
}
const isConnected = (k) =>{
  key = k;
  return runQuery("schema {}")
  .then((r)=>{
    console.log(`response ${r}`);
    schema = r.data;
    if (r.errors != undefined) {
      throw(r.errors[0].message)
    } else {
      verifyOntology(schema);
      return true
    }
  })
  .catch ( (e)=> {console.log(e); throw ("Connection refused")});
}





export default {
  reverseEdge,
  buildExpandQuery,
  buildExpandTypeQuery,
  runQuery,
  isConnected,
  getCategories,
  getStyle,
  getOntology,
  getTypeSchema,
  getTypeBehavior,
  infoSet,
  infoSetLimited,
  buildJaccardQuery}
