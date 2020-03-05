import sys
import os
import sqlite3
import json

if (len(sys.argv) != 2):
  print("Usage:", sys.argv[0], "path/to/sv_custom_live.db_")
  exit()

customLiveDB = sqlite3.connect(sys.argv[1])
customLiveDB.row_factory = sqlite3.Row
cur = customLiveDB.cursor()

# get custom live ids
cur.execute("SELECT DISTINCT custom_live_id FROM custom_live_notes")
lives = cur.fetchall()

# create temporary table
cur.execute("DROP TABLE IF EXISTS `temp1234`")
cur.execute("""CREATE TABLE "temp1234" (
	"custom_live_id"	INTEGER NOT NULL,
	"json"	TEXT NOT NULL,
	PRIMARY KEY("custom_live_id")
);""")

for live in lives:
  print("Processing custom live id #" + str(live["custom_live_id"]))
  cur.execute("SELECT * FROM custom_live_notes WHERE custom_live_id = " + str(live["custom_live_id"]) + " ORDER BY timing_sec ASC")
  notes = cur.fetchall()
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
  cur.execute("INSERT INTO temp1234 (custom_live_id, json) VALUES (?, ?)", (
    live["custom_live_id"],
    json.dumps(insertData)
  ))

cur.execute("DROP TABLE custom_live_notes")
cur.execute("ALTER TABLE temp1234 RENAME TO custom_live_notes")
customLiveDB.commit()
customLiveDB.close()