const ontology = {
    entities : {
      "School" : {
        type:"entity",
        label: "School.name",
        properties : {
           "School.name" : { type:"text", searchable: true, operators:["allofterms"]},
           "School.type" : { type:"text", searchable: true, operators:["eq"]}
        },
        relations : {
          "School.projects" : {
            label : "projects",
            isArray:true,
            entity:"Project",
            expand:{order:"orderdesc",sort:"count(~donation_project)",first:"10"},
            reverse:"Project.school"
          },
          "School.city" : {
            label : "city",
            isArray:false,
            entity:"City"
          }
        }
      },
      "City" : {
        type:"entity",
        label: "City.name",
        properties : {
           "City.name" : { type:"text", searchable: true, operators:["allofterms"]}
        },
        relations : {
          "City.state" : {
            label : "state",
            isArray:false,
            entity:"State"
          }
        }
      },
      "State" : {
        type:"entity",
        label: "State.name",
        properties : {
           "State.name" : { type:"text", searchable: true, operators:["allofterms"]}
        }
      },
      "Project" : {
        type:"entity",
        label: "Project.title",
        properties : {
           "Project.title" : { type:"text", searchable: true, operators:["allofterms"]},
           "Project.grade" : { type:"text", searchable: true, operators:["eq"]},
           "Project.status" : { type:"text", searchable: true, operators:["eq"]}
        },
        relations : {
          "Project.school" : {
            label : "school",
            isArray:false,
            entity:"School",
            reverse:"School.projects"
          },
          "Project.category" : {
            label : "category",
            isArray:false,
            entity:"Category",
            reverse:"~Project.category"
          },
          "donors" : {
            label : "donors",
            isArray:true,
            entity:"Donor",
            relationNode:{predicate:"~donation_project",entity:"Donation",out_predicate:"donation_donor"},
            expand:{order:"orderdesc",sort:"amount",first:"10"},
            reverse:"donations"

          }
        }
      },
      "Donor" : {
        type:"entity",
        label: "Donor.name",
        properties : {
           "Donor.name" : { type:"text", searchable: true, operators:["allofterms"]},
        },
        relations : {
          "projects" : {
            label : "projects",
            isArray:true,
            entity:"Project",
            relationNode:{predicate:"~donation_donor",entity:"Donation",out_predicate:"donation_project"},
            expand:{order:"orderdesc",sort:"amount",first:"10"},
            reverse:"donations"
          }
        }
      },
      "Donation" : {
        type:"relation",
        label: "amount",
        properties : {
           "amount" : { type:"float", searchable: true},
        },
        relations : {
          "donation_project" : {
            label : "project",
            isArray:false,
            entity:"Project"
          },
          "donation_donor" : {
            label : "donor",
            isArray:false,
            entity:"Donor"
          }
        }
      },
      "Category" : {
        type:"entity",
        label: "Category.name",
        properties : {
           "Category.name" : { type:"text", searchable: true, operators:["eq"]},
        },
        relations : {
          "~Project.category" : {
            label : "projects",
            isArray:true,
            entity:"Project"
          }
        }
      }


    }
  }

export  {ontology}
