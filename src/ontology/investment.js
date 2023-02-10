const ontology = {
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
            expand:{order:"orderdesc",sort:"OS",first:"10"},
            reverse:"investments"
          },
          "industry" : { entity:"Industry"},
          "country" : { entity:"Country"}
        },
        features : {
          "similar companies" : {
            "algo" :"jaccard-simple",
            "params" : {
              "relation" : "investors",
              "min common" : 1
            }
          }
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
            expand:{order:"orderdesc",sort:"OS",first:"10"},
            reverse:"investors"
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

export  {ontology}
