# !pip install pandas pydgraph python_graphql_client multiprocess
import sys
import pandas as pd
import numpy as np
import re
# import multiprocess as mp
import json
import os

import pydgraph

csvdir = sys.argv[1]

assert "DGRAPH_GRPC" in os.environ, "DGRAPH_GRPC must be defined"

# to upload to a self-hosted env, unset ADMIN_KEY and set DGRAPH_GRPC
def getClient():
    if "DGRAPH_ADMIN_KEY" in os.environ:
      dgraph_grpc = os.environ["DGRAPH_GRPC"]
      APIAdminKey = os.environ["DGRAPH_ADMIN_KEY"]
      client_stub = pydgraph.DgraphClientStub.from_cloud(dgraph_grpc,APIAdminKey )
      print("cloud client")
    else:
        dgraph_grpc = os.environ["DGRAPH_GRPC"]
        client_stub = pydgraph.DgraphClientStub(dgraph_grpc)
        print("local client "+dgraph_grpc)
    client = pydgraph.DgraphClient(client_stub)
    return client





sliceSize = 10000 # mutate every sliceSize RDF lines


_predicate = ""
_template = ""

def readXidMapFromDgraph(client,predicate = "xid"):
  # xid from dgraph by batch (pagination)
  # return a map of xid -> uid

  xidmap = dict({})
  txn = client.txn(read_only=True)
  batch = 10000
  after = ""
  try:
    # Run query.
    while True:
      query = """
        {
           xidmap(func: has(xid),first:"""+str(batch)+after+"""){
            """+predicate+""" uid
          }
        }
        """
      res = txn.query(query)
      data = json.loads(res.json)
      for e in data['xidmap']:
            xidmap["<"+e[predicate]+">"]="<"+e['uid']+">"
      if (len(data['xidmap']) < batch):
        break
      after = ",after:"+data['xidmap'][-1]['uid']
  finally:
    txn.discard()
  return xidmap

re_blank_bracket = re.compile(r"(<_:\S+>)")
re_blank_subject = re.compile(r"^\s*<(_:\S+)>") # used for match subject
re_blank_node = re.compile(r"<(_:\S+)>") # used for findall
re_tripple = re.compile(r"(<\S+>)\s+(<\S+>)\s+(.*)\s+([.*])$")


def allocate_uid(client,body,xidmap):
    r = re.findall(re_blank_node,body)
    if len(r) > 0:
        blank = set(r)
        # upsert

        query_list = ["{"]
        nquad_list = []
        blank_map = {}
        for idx,n in enumerate(blank):
            blank_map[f'u_{idx}']=n
            query_list.append(f'u_{idx} as u_{idx}(func: eq(xid, "{n}")) {{uid}}')
            nquad_list.append(f'uid(u_{idx}) <xid> "{n}" .')
        query_list.append("}")
        query = "\n".join(query_list)
        nquads = "\n".join(nquad_list)
        txn = client.txn()
        try:
            mutation = txn.create_mutation(set_nquads=nquads)
            request = txn.create_request(query=query, mutations=[mutation])
            res = txn.do_request(request)
            txn.commit()
            #  new uid for xid are in res.uids
            #  existing uid for xid are res.json payload
            for n in res.uids:
                idx = n[n.index("(")+1:n.index(")")]
                xidmap["<"+blank_map[idx]+">"]="<"+res.uids[n]+">"

            queries = json.loads(res.json)
            for idx in queries:
                if len(queries[idx]) > 0:
                  xidmap["<"+blank_map[idx]+">"]="<"+queries[idx][0]['uid']+">"
        finally:
            txn.discard()





def substituteXid(match_obj,xidmap):
  bn = match_obj.groups()[0]
  if bn in xidmap:
    return xidmap[bn]
  else:
    # newXid[bn]=""
    return bn

def mutate_rdf(nquads):
    ret = {}
    if len(nquads) > 0:
        client = getClient()
        print("mutate rdf \n")
        body = "\n".join(nquads)

        tries = 3
        for i in range(tries):
            txn = client.txn()
            try:
                res = txn.mutate(set_nquads=body)
                txn.commit()
                ret["nquads"] = len(nquads),
                ret["total_ns"]= res.latency.total_ns
            except pydgraph.errors.AbortedError as err:
                print("AbortedError %s" % i)
                continue
            except Exception as inst:
                print(type(inst))    # the exception type
                print(inst.args)     # arguments stored in .args
                print(inst)
                break
            finally:
                txn.discard()
            break


    return ret
def split_mutate(client,body,xidmap):
    b2 = re_blank_bracket.sub(lambda match_obj: substituteXid(match_obj,xidmap), body)
    allocate_uid(client,b2,xidmap)
    body = re_blank_bracket.sub(lambda match_obj: substituteXid(match_obj,xidmap), b2)
    # no more blank node at this point
    #cpu_count = mp.cpu_count()
    nquads = body.split("\n")
    all_res = mutate_rdf(nquads)
    print(all_res)
    
    # multiprocess approach
    #cpu_count = 1
    # split = np.array_split(nquads, cpu_count)
    # we may split in the middle of a predicate list
    # this may cause AbortedTransaction
    # We handle this by retrying the transaction
    # we may do better by not splitting in list-> to do

    #with mp.Pool(cpu_count) as pool:
    #  all_res = pool.map(mutate_rdf, split)
    #  print(all_res)




def add_to_rdfBuffer(rdf,rdfBuffer, func, isList = False):
  rdfBuffer.append(rdf)
  if len(rdfBuffer) > sliceSize and isList == False :
    # substitute xidmap. xidmap is updated by the mutation
    # must be done in single thread as new xidmap is used for next data chunck
    func("\n".join(rdfBuffer))
    rdfBuffer.clear()
def flush_rdfBuffer(rdfBuffer,func):
  if len(rdfBuffer) > 0:
    func("\n".join(rdfBuffer))
    rdfBuffer.clear()

def rdfmap_to_rdf(rdfMap,func):
  rdfBuffer = []
  for k in rdfMap:
    if type(rdfMap[k]) is list:
      for e in rdfMap[k]:
        line = k+" "+e+" ."
        add_to_rdfBuffer(line,rdfBuffer, func, True)
    else:
      line = k+" "+rdfMap[k]+" ."
      add_to_rdfBuffer(line,rdfBuffer, func)
  flush_rdfBuffer(rdfBuffer,func)

def rdfmap_to_dgraph(rdfMap,xidmap,client):
    f = lambda body: split_mutate(client,body,xidmap)
    rdfmap_to_rdf(rdfMap,f)
    return xidmap
def rdfmap_to_file(rdfMap,xidmap,filehandle = sys.stdout):
    f = lambda body:  filehandle.write(re_blank_bracket.sub(lambda match_obj: substituteXid(match_obj,xidmap), body))
    rdfmap_to_rdf(rdfMap,f)
    return xidmap




def addRdfToMap(rdfMap,rdf):
  # applying the template to many tabular data lines may lead to the creatio of the same predicate many time
  # e.g: if many line refer to a country object with a country code.
  # we maintain the map of <node id> <predicate> for non list predicates so we can remove duplicates
  # sending several times the the same RDF would not affect the data but this is done to improve performance
  #m = re.match(r"(<\S+>)\s+(<\S+>)\s+(.*)\s+([.*])$",rdf)
  if not "\"nan\"" in rdf:
    m = re_tripple.match(rdf)
    if m:
      parts=m.groups()
      key = parts[0]+" "+parts[1]
      if parts[-1] == "*":
        if key in rdfMap:
          rdfMap[key].append(parts[2])
        else:
          rdfMap[key] = [parts[2]]
      else:
        rdfMap[key] = parts[2]


def substitute(match_obj,row):
    # substitute is used by substituteInTemplate
    # receive the reg exp matching object and return the value to substitute
    # the matching object is in the form <column name>,<function>
    # substitute by the value in row map and apply function if present
    if match_obj.group() is not None:
        fieldAndFunc = match_obj.group(0)[1:-1].split(",")
        field = fieldAndFunc[0]
        val = str(row[field]).replace('"', r'\"').replace('\n', r'\n')
        if len(fieldAndFunc) > 1:
          func = fieldAndFunc[1]
          if func == "nospace":
             val=val.replace(" ","_")
          elif func == "toUpper":
             val=val.upper()
          elif func == "toLower":
             val=val.lower()
          else:
            raise ValueError('unsupported function '+func)
        return val
re_column = re.compile(r"(\[[\w .,|]+\])")
def substituteInTemplate(template,row):
  # substitute all instances of [<column name>,<function>] in the template by corresponding value from the row map
  return re_column.sub(lambda match_obj: substitute(match_obj,row), template)

def transformDataFrame(df,template):
  rdfMap = {}
  for index, row in df.iterrows():
    # for each tabular row we evalute all line of the RDF remplate
      for rdftemplate in iter(template.splitlines()):
        if (not rdftemplate.startswith('#')):
          rdf = substituteInTemplate(rdftemplate,row)
          addRdfToMap(rdfMap,rdf)
  return rdfMap

def transformDataFrameChunk(df):
  rdfMap = {}
  for index, row in df.iterrows():
    # for each tabular row we evalute all line of the RDF remplate
      for rdftemplate in iter(_template.splitlines()):
        if (not rdftemplate.startswith('#')):
          rdf = substituteInTemplate(rdftemplate,row)
          addRdfToMap(rdfMap,rdf)
  return rdfMap
def df_to_rdfmap(df,template):
  
  # rdfMap will contains key = subject predicate ; value = object
  # example:
  #   key '<_:3150-JP> <dgraph.type>'
  #   of rdfmap['<_:3150-JP> <dgraph.type>'] : '"Company"'

  rdfMap = transformDataFrame(df,template)
  # multiprocess approach
  # rdfMap = {}
  #  global _template
  # _template = template
  # cpu_count = mp.cpu_count()
  # need to solve predicate list to use multi threading.

  # splitint in N groups N = number of CPU
  # heuristic, may require more testing to find the best value.
  #df_split = np.array_split(df, cpu_count)
  #with mp.Pool(cpu_count) as pool:
  #  allRdfMaps = pool.imap_unordered(transformDataFrameChunk, df_split)
  #  for chunkMap in allRdfMaps:
  #      rdfMap.update(chunkMap)
  return rdfMap



def df_to_dgraph(df,template,client,xidpredicate="xid", xidmap = None):
  if xidmap is None:
      xidmap = readXidMapFromDgraph(client,xidpredicate)
  rdfMap = df_to_rdfmap(df,template)
  return rdfmap_to_dgraph(rdfMap,xidmap,client)
def df_to_rdffile(df,template,client = None, xidpredicate="xid",xidmap = {}, filehandle = sys.stdout):
    if xidmap is None:
      if client is not None:
         xidmap = readXidMapFromDgraph(client,xidpredicate)
    rdfMap = df_to_rdfmap(df,template)
    return rdfmap_to_file(rdfMap,xidmap,filehandle)

# Delete data
gclient = getClient()

op = pydgraph.Operation(drop_op="DATA")
res = gclient.alter(op)
print("data deleted")
print(res)
# Get XIDMAP
xidpredicate="xid"
xidmap = readXidMapFromDgraph(gclient,xidpredicate)
# iterate over files in
# that directory
# get CSV file and associated template file
# load to dgraph and update the xidmap
for filename in os.listdir(csvdir):
    f = os.path.join(csvdir, filename)
    if os.path.isfile(f) and filename.endswith('.csv'):
        print(f)
        base = os.path.splitext(f)[0]
        templatefilename = base + '.template'
        if os.path.isfile(templatefilename):
            template_file = open(templatefilename, "r")
            template = template_file.read()
            template_file.close()
            df = pd.read_csv(f, keep_default_na = True)
#
# transform the dataframe and load to dgraph
#
            xidmap = df_to_dgraph(df,template,gclient,xidpredicate,xidmap)
            # df_to_rdffile(df,template) 
            # use df_to_rdffile(df,template) to create an RDF file if needed.
