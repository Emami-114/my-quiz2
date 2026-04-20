

import requests
import pathlib

for url in pathlib.Path("urls.txt").read_text().split("\n"):
    response = requests.get(url)
    if response.status == 401:
        print("URL accessible")