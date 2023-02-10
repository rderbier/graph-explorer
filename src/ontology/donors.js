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
            expand:{order:"orderdesc",sort:"count(Project.donations)",first:"10"},
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
           "City.name" : { type:"text", searchable: false}
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
           "State.name" : { type:"text", searchable: false}
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
            entity:"Category"
          },
          "donors" : {
            label : "donors",
            isArray:true,
            entity:"Donor",
            relationNode:{predicate:"Project.donations",entity:"Donation",out_predicate:"Donation.donor"},
            expand:{order:"orderdesc",sort:"Donation.amount",first:"10"},
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
            relationNode:{predicate:"Donor.donations",entity:"Donation",out_predicate:"Donation.project"},
            expand:{order:"orderdesc",sort:"Donation.amount",first:"10"},
            reverse:"donations"
          }
        }
      },
      "Donation" : {
        type:"relation",
        label: "amount",
        properties : {
           "Donation.amount" : { type:"float", searchable: true},
        },
        relations : {
          "Donation.project" : {
            label : "project",
            isArray:false,
            entity:"Project",
            reverse:"Project.donations"
          },
          "Donation.donor" : {
            label : "donor",
            isArray:false,
            entity:"Donor",
            reverse:"Donor.donations"
          }
        }
      },
      "Category" : {
        type:"entity",
        label: "Category.name",
        properties : {
           "Category.name" : { type:"text", searchable: false},
        }
      }


    }
  }

export  {ontology}
