import pandas as pd
from pathlib import Path
import requests

def main(data_dir = Path(), oa_file_list = None, progress = 'done.txt', progress_output = 'done.new.txt', output = 'output.gmt'):
  '''
  Download and extract the data from the latest WikiPathways release
  '''
  try:
    tab = pd.read_html('https://data.wikipathways.org/pfocr/current/')[0]
    latest_human = tab.where(tab['File Name'].str.contains('-gmt-Homo_sapiens.gmt') & ~tab['File Name'].str.contains('chemical')).dropna()['File Name'].values[0]
    if os.path.exists(data_dir / progress):
      with open(data_dir / progress, 'r') as f:
        latest = f.readlines()
    else:
      latest = []
    if latest_human not in latest:
      file = f'https://data.wikipathways.org/pfocr/current/{latest_human}'
      gmt = requests.get(file).text
      with open(data_dir / output, 'w') as f:
        f.write(gmt)
      with open(data_dir / progress_output, 'a') as f:
        f.write(latest_human + '\n')
  except Exception as e:
    print(e)
  
if __name__ == '__main__':
  import os
  from dotenv import load_dotenv; load_dotenv()
  data_dir = Path(os.environ.get('PTH', 'data'))
  main(data_dir)
