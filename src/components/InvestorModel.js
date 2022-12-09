
const model = {
  "nodes" : {
    "InvestorType" : {
      isCategory : true
    },
    "Sector" : {
      isCategory : true
    },
    "Industry" : {
      isCategory : true
    },
    "Company" : {
      relations : [
        { label: "investors", target:"Investor", path:["~in","investor"]},
        { target:"Industry", path:["industry"]},
        { target:"Country", path:["in"], label: "is in"}
      ]
    },
    "Investor" : {
      relations : [
         { label: "owns", target:"Company", path:["~investor","in"]}
      ]
    },
    "Country":{}
  }
}

  }
{ group:"nodes", data:{ id:"InvestorType", name:"InvestorType", "dgraph.type":"type"}, classes: ['category'] },
{ group:"nodes", data:{ id:"Sector", name:"Sector", "dgraph.type":"type"}, classes: ['category'] },
{ group:"nodes", data:{ id:"Industry", name:"Industry", "dgraph.type":"type"}, classes: ['category'] },
{ group:"nodes", data:{ id:"Company", name:"Company", "dgraph.type":"type"}, classes: ['typeCompany'] },
{ group:"nodes", data:{ id:"Investor", name:"Investor", "dgraph.type":"type"}, classes: ['typeInvestor'] },
{ group:"nodes", data:{ id:"Country", name:"Country", "dgraph.type":"type"}, classes: ['typeCountry'] },



{ group:"edges", data: { source: 'Company', target: 'Investor', label: 'investors' },classes: ['reverse'] },
{ group:"edges", data: { source: 'Investor', target: 'Company', label: 'owns' },classes: ['reverse'] },
{ group:"edges", data: { source: 'Company', target: 'Industry' }},
{ group:"edges", data: { source: 'Company', target: 'Country', label: 'is in' }},
{ group:"edges", data: { source: 'Industry', target: 'Sector'}},
{ group:"edges", data: { source: 'Investor', target: 'InvestorType' }}
export default {runQuery, setEndpoint}
