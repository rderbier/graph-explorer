import {ontology, uiconfig} from '../ontology/investments_graphql.js'


// const dgraphEndpoint = "https://icy-moon.eu-west-1.aws.cloud.dgraph.io/query?timeout=20s&debug=true"
const dgraphEndpoint = "/query?debug=true"
// key is passed by the the UI login page
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
      headers: {'Content-Type':'application/json','Dg-Auth':key},
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
      if ((value.type === "category") && (value.label !== undefined)) {
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
  // build ontology from the schema
  const query = "schema {}";
  return runQuery(query).then((r)=>{ return ontologyFromSchema(r.data); });
}
const ontologyFromSchema = async (schema) => {
  console.log(`schema ${schema}`);
  // build a map from predicates in schema
  var predicates = {}

  for (var item of schema.schema) {
    const predicate =  item.predicate
    predicates[predicate] = item
    predicates[predicate].label = predicate
  }
  var o = {entities:{}}
  for (var item of schema.types) {
    if (item.name.startsWith("dgraph.")) {
      continue
    }
    let entity = {type:"entity", properties:{}, relations:{}}
    // get all fields
    for (let field of item.fields) {
      const predicate = field.name;
      if ((entity.label === undefined) && (predicate.endsWith("name") || predicate.endsWith("title") || predicate.endsWith("label"))) {
        entity.label = predicate
      }
      // add properties and relations
      if (predicates[predicate] !== undefined) {
        // add the type to predicate domain
        predicates[predicate].domain = predicates[predicate].domain || []
        predicates[predicate].domain.push(item['name'])

        const type = predicates[predicate].type
        if (type === "uid") {
          entity.relations[predicate] = {label:predicate, isArray:predicates[predicate].list === true}
        } else {
          entity.properties[predicate] = {type:type}
          if (predicates[predicate].tokenizer !== undefined) {
            entity.properties[predicate].searchable = true;
            entity.properties[predicate].operators = ["allofterms"] // default operator -> set depending on tokenizer
          }
        }
      }
    }
    o.entities[item.name] = entity
  }
  // get range for each predicate with a domain i.e used in a type
  var query = '{'
  for (let item of schema.schema) {
    const predicate =  item.predicate
    if ((item.domain !== undefined) && (item.type === "uid")) {
      query += `
        ${predicate} (func:has(${predicate}),first:1) {
          range:${predicate} { dgraph.type }
        }
        `
    }
  }
  query += '}'
  const relations = await runQuery(query)
  for (let item in relations.data) {
    if (relations.data[item].length > 0) {
      if (Array.isArray(relations.data[item][0].range)) {
        predicates[item].range = relations.data[item][0].range[0]['dgraph.type'][0]
      } else {
        if (relations.data[item][0].range['dgraph.type'] !== undefined) {
          predicates[item].range = relations.data[item][0].range['dgraph.type'][0]
        }
      }
    }
  }
  // add entity to relations
  for (let item in o.entities) {
    for (let relation in o.entities[item].relations) {
      if ((predicates[relation] !== undefined) && (predicates[relation].range !== undefined)) {
        o.entities[item].relations[relation].entity = predicates[relation].range
      } else {
        // remove relation
        delete o.entities[item].relations[relation]
      }

    }
  }
  console.log(`Ontology: ${JSON.stringify(o,null,2)}`);
  return o;
}

const getUiconfig = ()=>{
  return uiconfig;
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
            "background-color": style.colors[i]

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
        alias = `${value.label}`
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
  getUiconfig,
  getTypeSchema,
  getTypeBehavior,
  infoSet,
  infoSetLimited,
  buildJaccardQuery}