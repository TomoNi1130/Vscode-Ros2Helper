import logging
import sys
import json
from pathlib import Path

log_path = Path(__file__).parent / "python_test.log"

input_data = json.loads(sys.argv[1])
msg = input_data["msg"]

logging.basicConfig(
    filename=log_path,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

logging.info(f'プログラムが起動しました:msg -> {input_data["msg"]}')