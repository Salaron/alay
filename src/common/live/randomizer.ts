// This randomizer initially was written by MilesElectric168 in C++
// Was rewritten to Lua by MikuAuahDark
// And rewritten to TS by Salaron

export interface Note {
  timing_sec: number
  effect: number
  notes_attribute: number
  notes_level: number
  effect_value: number
  position: number
}

// For comments-doc refer to: https://github.com/MikuAuahDark/livesim2/blob/over_the_rainbow/game/live/randomizer3.lua
export class Randomizer {
  public notes: Note[]

  private swingPosition: { [level: number]: number } = {}
  private timingTable: { [timing: number]: number } = {}

  private readonly leftPos = [6, 7, 8, 9]
  private readonly centerPos = [5]
  private readonly rightPos = [1, 2, 3, 4]
  private readonly allPos = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  constructor(notes: any[]) {
    this.notes = notes

    this.notes.forEach((note) => {
      if (note.effect > 10) {
        this.swingPosition[note.notes_level] = 0
      }

      if (this.timingTable[note.timing_sec]) {
        this.timingTable[note.timing_sec]++
      } else {
        this.timingTable[note.timing_sec] = 1
      }
    })
  }

  public randomize() {

    let doubleAction = false
    let recentPosition = 0
    let recentTiming = 0
    let releaseTime = 0
    let holdPosition = 0

    this.notes.forEach((note, i) => {
      if (i === 0) {

        if (this.isHold(note) || this.isPaired(note)) {
          note.position = this.getRndPosition(this.centerPos, false)
        } else {
          note.position = this.getRndPosition(this.allPos, true)
        }
      } else {
        const swingPos = this.getSwingPosition(note)

        if (this.isPaired(note)) {

          if (this.isTapSwing(note) && swingPos !== 0) {
            if (swingPos + 1 === 5 || swingPos + 1 > 9) {
              note.position = swingPos - 1
            } else if (swingPos - 1 === 5 || swingPos - 1 < 1) {
              note.position = swingPos + 1
            } else if (swingPos === 5 && note.timing_sec - this.notes[i - 1].timing_sec < 0.001) {

              if (this.notes[i - 1].position < 5) {
                note.position = 6
              } else {
                note.position = 4
              }
            } else {
              note.position = this.getRndPosition([swingPos - 1, swingPos + 1], true)
            }
          } else if (note.timing_sec - this.notes[i - 1].timing_sec < 0.001) {
            // note is paired with previous note and not a swing
            note.position = this.getRndPosition(this.notes[i - 1].position < 5 ? this.leftPos : this.rightPos, true)
          } else if (this.notes[i + 1] && this.isTapSwing(this.notes[i + 1]) && this.swingPosition[this.notes[i + 1].notes_level] !== 0) {
            const nextSwingPos = this.getSwingPosition(this.notes[i + 1])

            if (nextSwingPos < 5) {
              note.position = this.getRndPosition(this.leftPos, true)
            } else if (nextSwingPos > 5) {
              note.position = this.getRndPosition(this.rightPos, true)
            } else {
              note.position = this.getRndPosition(this.centerPos, false)
            }
          } else {
            note.position = this.getRndPosition(this.centerPos, false)
          }
        } else if (note.timing_sec - releaseTime < 0.0025) {
          if (this.isTapSwing(note) && swingPos !== 0) {
            this.moveSwingChain(note, swingPos, true)
          } else if (holdPosition < 5) {
            note.position = this.getRndPosition(this.leftPos, true)
          } else {
            note.position = this.getRndPosition(this.rightPos, true)
          }
        } else if (doubleAction) {
          if (this.isHold(note)) {

            if (note.effect > 10 && swingPos !== 0) {
              this.moveSwingChain(note, swingPos, true)
            } else {
              note.position = this.getRndPosition(this.centerPos, false)
            }
          } else {

            if (this.isTapSwing(note) && swingPos !== 0) {

              this.moveSwingChain(note, swingPos, false)
            } else {
              note.position = this.getRndPosition(this.allPos, true)
            }
          }
        } else if (
          note.timing_sec - recentTiming < 0.02 + 0.001 && (
            !(this.isTapSwing(note)) || (
              this.isTapSwing(note) &&
              swingPos === 0
            )
          )
        ) {
          if (recentPosition < 5) {
            note.position = this.getRndPosition(this.leftPos, true)
          } else if (recentPosition > 5) {
            note.position = this.getRndPosition(this.rightPos, true)
          } else if (recentPosition === 5) {
            note.position = this.getRndPosition(this.centerPos, false)
          }
        } else if (this.isHold(note)) {
          if (note.effect > 10 && swingPos !== 0) {
            this.moveSwingChain(note, swingPos, true)
          } else {
            note.position = this.getRndPosition(this.centerPos, false)
          }
        } else {
          if (this.isTapSwing(note) && swingPos !== 0) {

            this.moveSwingChain(note, swingPos, false)
          } else {
            note.position = this.getRndPosition(this.allPos, true)
          }
        }

        doubleAction = note.timing_sec - recentTiming < 0.001 || note.timing_sec - releaseTime < 0.001 || note.timing_sec + note.effect_value - releaseTime < 0.001
      }

      if (note.timing_sec > releaseTime) {
        releaseTime = 0
        holdPosition = 0
      }

      if (this.isHold(note) && note.timing_sec + note.effect_value > releaseTime) {
        holdPosition = note.position
        releaseTime = note.timing_sec + note.effect_value
      }

      recentTiming = note.timing_sec
      recentPosition = note.position

      if (note.effect > 10) {
        this.swingPosition[note.notes_level] = note.position
      }
    })

    return this.notes
  }

  private getRndPosition(positions: number[], includeInput: boolean) {
    if (!includeInput) {
      positions = this.allPos.filter(pos => !positions.includes(pos))
    }
    return positions[Math.floor(Math.random() * positions.length)]
  }
  private getSwingPosition(note: Note) {
    return this.swingPosition[note.notes_level]
  }

  private isPaired(note: Note) {
    return this.timingTable[note.timing_sec] > 1
  }
  private isTapSwing(note: Note) {
    const a = note.effect / 10
    return a >= 1 && a < 3
  }
  private isHold(note: Note) {
    return note.effect % 10 === 3
  }

  private moveSwingChain(note: Note, swingPos: number, center: boolean) {
    if ((center ? swingPos + 1 === 5 : true) || swingPos + 1 > 9) {
      note.position = swingPos - 1
    } else if ((center ? swingPos + 1 === 5 : true) || swingPos - 1 < 1) {
      note.position = swingPos + 1
    } else {
      note.position = this.getRndPosition([swingPos - 1, swingPos + 1], true)
    }
  }
}
