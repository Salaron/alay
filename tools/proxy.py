""" 
A proxy to collect live json data from the game requests and save it into the database directly.
It's better to use terminal with UTF-8 support because of Kanji symbols.
"""

import json
import requests
import sqlite3
import traceback
import zlib
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler

HOST = "prod-jp.lovelive.ge.klabgames.net"

liveNotesDB = None
liveDB = None
missingLives = []
def getDifficultyStringById(diffId):
  if diffId == 1: return "Easy"
  if diffId == 2: return "Normal"
  if diffId == 3: return "Hard"
  if diffId == 4: return "Expert"
  if diffId == 5: return "Expert"
  if diffId == 6: return "Master"

def getGroupName(memberCategory):
  if memberCategory == 1: 
    return "µ's"
  if memberCategory == 2: 
    return "Aqours"
  if memberCategory == 3:
    return "Nijigasaki"

class ProxyHandler(BaseHTTPRequestHandler):
  def log_message(self, format, *args):
    """ Disable logging """
    return

  def parse_headers(self):
    heqHeaders = {}
    for line in self.headers._headers:
      if len(line) == 2:
        if line[0] == "Host":
          line = ("Host", HOST) # rewrite host header
        heqHeaders[line[0]] = line[1]
    return heqHeaders

  def do_GET(self):
    """ WebView request """
    self.do_POST(webview = True)

  def do_POST(self, webview = False):
    """ Game API request """
    try:
      resp = None
      if webview == False:
        body = self.rfile.read(int(self.headers['Content-Length']))
        resp = requests.post(f"http://{HOST}{self.path}", headers = self.parse_headers(), data = body, stream = True)
      else:
        resp = requests.get(f"http://{HOST}{self.path}", headers = self.parse_headers(), stream = True)
      self.send_response(200)
      for key in resp.headers:
        self.send_header(key, resp.headers[key])
      self.end_headers()
      self.wfile.write(resp.raw.data)
      self.send_error(200) # idk why but w/o this it won't work. probably python's bug

      serverResponse = json.loads(zlib.decompress(resp.raw.data, zlib.MAX_WBITS + 32))
      if self.path.find("/main.php/live/play") == 0:
        self._handleLiveResponse(serverResponse)
      if self.path.find("/main.php/api") == 0:
        self._handleAPIResponse(serverResponse)
    except:
      self.send_error(500)
      print(traceback.format_exc())

  def _handleAPIResponse(self, serverResponse):
    # TODO: parse API response that contains available lives
    pass

  def _handleLiveResponse(self, serverResponse):
    if serverResponse["status_code"] != 200:
      raise "Status code is not 200"
    liveInfo = serverResponse["response_data"]["live_list"][0]["live_info"]
    notesCur = liveNotesDB.cursor()
    liveCur = liveDB.cursor()

    liveCur.execute(f"""
    SELECT
      setting.live_setting_id, notes_setting_asset, member_category, name, difficulty
    FROM 
      live_setting_m as setting 
        JOIN live_track_m ON setting.live_track_id = live_track_m.live_track_id 
        INNER JOIN (
          SELECT
            live_setting_id, live_difficulty_id, capital_type, capital_value,
            c_rank_complete, b_rank_complete, a_rank_complete, s_rank_complete
          FROM special_live_m
          UNION
          SELECT
            live_setting_id, live_difficulty_id, capital_type, capital_value,
            c_rank_complete, b_rank_complete, a_rank_complete, s_rank_complete
          FROM normal_live_m
        ) as difficulty ON setting.live_setting_id = difficulty.live_setting_id
    WHERE live_difficulty_id = {liveInfo["live_difficulty_id"]}""")
    data = liveCur.fetchone()
    if data != None:
      notesCur.execute(f"""DELETE FROM live_notes WHERE notes_setting_asset = '{data["notes_setting_asset"]}'""")
      notesCur.execute("INSERT INTO live_notes (notes_setting_asset, json) VALUES (?, ?)", (
        data["notes_setting_asset"],
        json.dumps(liveInfo["notes_list"], separators=(',',':'), indent=None)
      ))
      print(f"""{getGroupName(data["member_category"])} — {data["name"]} ({getDifficultyStringById(data["difficulty"])}) was saved to the database.""")
      liveNotesDB.commit()

if __name__ == "__main__":
  # Parse arguments
  p = argparse.ArgumentParser(formatter_class=argparse.RawDescriptionHelpFormatter)
  p.add_argument("-port", type=int, default=80, help="Use a specific port for proxy (default: %(default)s)")
  p.add_argument("-host", default="0.0.0.0", help="Spicify address for proxy. By default proxy listen all interfaces.")
  # TODO: log request and response into file
  p.add_argument("-log", help="Write requests & response into file.", action="store_true")
  args = p.parse_args()
  # Connect to the database
  liveNotesDB = sqlite3.connect("../db/sv_live_notes.db_")
  liveNotesDB.row_factory = sqlite3.Row
  liveNotesCur = liveNotesDB.cursor()

  liveDB = sqlite3.connect("../db/live.db_")
  liveDB.row_factory = sqlite3.Row
  liveCur = liveDB.cursor()

  liveNotesCur.execute("SELECT notes_setting_asset FROM live_notes")
  availableSettings = []
  for n in liveNotesCur.fetchall():
    availableSettings.append(str(n["notes_setting_asset"]))
  
  liveCur.execute("""
  SELECT 
    live_setting_id, notes_setting_asset, member_category, name, difficulty
  FROM 
    live_setting_m JOIN live_track_m ON live_setting_m.live_track_id = live_track_m.live_track_id
  WHERE notes_setting_asset NOT IN('{0}') GROUP BY notes_setting_asset""".format("','".join(availableSettings)))
  missingLives = liveCur.fetchall()
  if len(missingLives) == 0:
    print("Notes database is up-to-date")

  for live in missingLives:
    print(f'Live #{live["live_setting_id"]}: {getGroupName(live["member_category"])} — {live["name"]} ({getDifficultyStringById(live["difficulty"])})')

  httpd = HTTPServer((args.host, args.port), ProxyHandler)
  try:
    print(f"Proxy listening on {args.host}:{args.port}")
    httpd.serve_forever()
  except KeyboardInterrupt:
    pass
  httpd.server_close()