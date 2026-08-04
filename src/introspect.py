import urllib.request
import json

url = "https://indexer.preview.midnight.network/api/v4/graphql"

query = """
query {
  __type(name: "Contract") {
    name
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}
"""

req = urllib.request.Request(
    url,
    data=json.dumps({"query": query}).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print("Contract Fields:", json.dumps(res, indent=2))
except Exception as e:
    print("Error:", e)
