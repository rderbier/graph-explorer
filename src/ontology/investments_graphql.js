const ontology = {
    entities : {
      "Company" : {
        type:"entity",
        label: "Company.name",
        properties : {
           "Company.name" : {  alias:"name",type:"text", searchable: true, operators:["anyoftext"]},
           "Company.ticker" : { type:"text", searchable: true, operators:["eq"]},
           "Company.factsetid" : { type:"text", searchable: true, operators:["eq"]},
           "country" : { type:"text", searchable: true, path:["Company.country","Country.name"], operators:["eq"]},
           "industry" : { type:"text", searchable: true, path:["Company.industry","Industry.name"], operators:["eq"]},
        },
        relations : {
          "investors" : {
            isArray:true,
            entity:"Investor",
            label : "investors",
            relationNode:{alias:"investor",predicate:"Company.investments",entity:"Investment",out_predicate:"Investment.investor"},
            expand:{order:"orderdesc",sort:"Investment.OS_0",first:"10"},
            reverse:"investments"
          },
          "Company.industry" : { entity:"Industry"},
          "Company.country" : { entity:"Country"}
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
        label: "Investor.name",
        properties : {
           "Investor.name" : { alias:"name", type:"text", searchable: true, operators:["anyoftext"]}
        },
        relations : {
          "investments" : {
            isArray:true,
            entity:"Company",
            relationNode:{predicate:"Investor.invest",entity:"Investment",out_predicate:"Investment.company"},
            expand:{order:"orderdesc",sort:"Investment.OS_0",first:"10"},
            reverse:"investors"
          },
          "type" : { entity:"InvestorType"}
        }
      },
      "Country" : {
        type:"category",
        label: "Country.name",
        properties : {
           "Country.name" : { alias:"name", type:"text", searchable: true, operators:["anyoftext"]}
         },
         relations : {}
      },
      "Industry" : {
        type:"category",
        parent:"Sector",
        label: "Industry.name",
        properties : {
           "Industry.name" : { alias:"name", type:"text", searchable: true, operators:["anyoftext"]}
         },
        relations : {
          "sector" : { entity:"Sector"}
        }
      },
      "Sector" : {
        type:"category",
        label:"Sector.name",
        properties : {
           "Sector.name" : { alias:"name",type:"text", searchable: true, operators:["anyoftext"]}
         },
         relations : {}
      },
      "InvestorType" : {
        type:"category",
        properties : {
           "name" : { type:"text", searchable: true, operators:["anyoftext"]}
         }
      }
    }
  }

/* uiconfig
used for UI related configuration
*/
const uiconfig = {
  entities : {
    "Company" : {
        expand : {order:"orderdesc",sort:"Company.name",first:"10"},
        sizePerField: 'investors'
    },
    "Investor" : {
      expand : {order:"orderdesc",sort:"Investor.name",first:"10"},
    },
    "Country" : {
      expand : {order:"orderdesc",sort:"Country.name",first:"10"},
    },
    "Industry" : {
      expand : {order:"orderdesc",sort:"Industry.name",first:"10"},
    },
    "InvestorType" : {
      expand : {order:"orderdesc",sort:"InvestorType.name",first:"10"},
    },


  }
}

export  {ontology,uiconfig}
