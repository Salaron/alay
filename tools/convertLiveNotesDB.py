import sys
import os
import sqlite3
import json

if (len(sys.argv) != 3):
  print("Usage:", sys.argv[0], "path/to/sv_live_notes.db_", "path/to/live.db_")
  exit()

liveDB = sqlite3.connect(sys.argv[2])
liveDB.row_factory = sqlite3.Row
curLive = liveDB.cursor()
liveNotesDB = sqlite3.connect(sys.argv[1])
liveNotesDB.row_factory = sqlite3.Row
curNotes = liveNotesDB.cursor()

# get live setting ids list
curNotes.execute("SELECT DISTINCT live_setting_id FROM live_note")
lives = curNotes.fetchall()

# in case a new table already exists -- drop it
curNotes.execute("DROP TABLE IF EXISTS `live_notes`")

# and create it
curNotes.execute("""CREATE TABLE "live_notes" (
	"notes_setting_asset"	TEXT NOT NULL UNIQUE,
	"json"	TEXT NOT NULL,
	PRIMARY KEY("notes_setting_asset")
);""")

for live in lives:
  print("Processing live setting id #" + str(live["live_setting_id"]))
  curLive.execute("SELECT notes_setting_asset FROM live_setting_m WHERE live_setting_id = " + str(live["live_setting_id"]))
  liveSetting = curLive.fetchone()
  curNotes.execute("SELECT * FROM live_note WHERE live_setting_id = " + str(live["live_setting_id"]) + " ORDER BY timing_sec ASC")
  notes = curNotes.fetchall()
  insertData = []
  for note in notes:
    insertData.append({
    "timing_sec": note["timing_sec"],
    "notes_attribute": note["notes_attribute"],
    "notes_level": note["notes_level"],
    "effect": note["effect"],
    "effect_value": note["effect_value"],
    "position": note["position"]
  })
  try:
    curNotes.execute("INSERT INTO live_notes (notes_setting_asset, json) VALUES (?, ?)", (
      liveSetting["notes_setting_asset"],
      json.dumps(insertData, separators=(',',':'))
    ))
  except sqlite3.IntegrityError:
    pass

# remove old table
curNotes.execute("DROP TABLE IF EXISTS `live_note`")
liveNotesDB.commit()
liveNotesDB.close()