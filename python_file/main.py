import sys
import json
from dispatcher import dispatch

#python側のIO処理のみを担当する

for line in sys.stdin:
    req = json.loads(line)

    try:
        result = dispatch(req)
        res = {
            "type": "response",
            "id": req["id"],
            "data": result,
        }
    except Exception as e:
        res = {
            "type": "error",
            "id": req.get("id"),
            "message": str(e),
        }

    print(json.dumps(res), flush=True)