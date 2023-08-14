const ontology = {
    entities : {
      "Company" : {
        type:"entity",
        label: "Company.name",
        properties : {
           "Company.name" : {  alias:"name",type:"text", searchable: true, operators:["anyoftext"]},
           "Company.ticker" : { alias:"ticker", type:"text", searchable: true, operators:["eq"]},
           "Company.id" : { alias:"id", type:"text", searchable: true, operators:["eq"]},
           "country" : { alias:"country", type:"text", searchable: false, path:["Company.country","Country.name"], operators:["eq"]},
           "industry" : { type:"text", searchable: false, path:["Company.factsetIndustry","Industry.name"], operators:["eq"]},
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
          "Company.factsetIndustry" : { alias:"industry", entity:"Industry"},
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
          "Investment.OS_0" : { alias:"OS", type:"float", searchable: false},
          "Investment.POS_0" :{ alias:"POS", type:"int", searchable: false},
          "Investment.MKTVAL_0" :{ alias:"MKTVAL", type:"float", searchable: false},
          "Investment.diff_POS_30" : { alias:"diff_POS_30", type:"float", searchable: false}
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
           "Industry.name" : { alias:"name", type:"text", searchable: true, operators:["eq"]}
         },
        relations : {
          "Industry.sector" : { alias:"sector", entity:"Sector", reverse:"Sector.industries"},
          "Industry.companies" : {
            isArray:true,
            entity:"Company",
            label : "companies",
            expand:{order:"orderdesc",sort:"Company.name",first:"10"},
            reverse:"Company.factsetIndustry"
          },
          
        }
      },
      "Sector" : {
        type:"category",
        label:"Sector.name",
        properties : {
           "Sector.name" : { alias:"name",type:"text", searchable: true, operators:["eq"]}
         },
         relations : {
          "Sector.industries" : { isArray:true, entity:"Industry"}
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

/* uiconfig
used for UI related configuration
*/
const uiconfig = {
  logo_url: "https://research.fearnleysecurities.no/images/Capital-Markets_main_logo.png",
  entities : {
    "Company" : {
        expand : {order:"orderdesc",sort:"Company.name",first:"10"},
        sizePerField: 'investors',
        style: {
          "background-color": "rgb(0,67,128)",
          "color": "lightgrey",
          "font-size": "12px"

        }
    },
    "Investor" : {
      expand : {order:"orderdesc",sort:"Investor.name",first:"10"},
      style: {
        "background-color": "rgb(61,140,109)"
      }
    },
    "Country" : {
      expand : {order:"orderdesc",sort:"Country.name",first:"10"},
    },
    "Industry" : {
      expand : {order:"orderdesc",sort:"Industry.name",first:"10"},
    },
    "Sector" : {
      expand : {order:"orderdesc",sort:"Sector.name",first:"10"},
    },
    "InvestorType" : {
      expand : {order:"orderdesc",sort:"InvestorType.name",first:"10"},
    },


  }
}

export  {ontology,uiconfig}
