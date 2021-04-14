const GAME_NAME = "OmniMix"
const GAME_VERSION = 1

canvas = document.getElementById("omni_game")
canvas.focus()
ctx = canvas.getContext("2d")

// Resize the screen; game is kept on a Square by default; outside elements are faux drawn
const WBL = 0.9
autoResizeScreen = () => {canvas.width = canvas.height = Math.min(window.innerWidth * WBL, window.innerHeight * WBL)}; autoResizeScreen()

// Scalar Functions
scalarW = (p) => {return canvas.width 	* p}
scalarH = (p) => {return canvas.height 	* p}
ctx.scalarRect = (x,y,w,h) => {ctx.beginPath(); ctx.rect(scalarW(x), scalarH(y), scalarW(w), scalarH(h)); ctx.fill()}
ctx.scalarGrad = (x0,y0,x1,y1) => {return ctx.createLinearGradient(scalarW(x1), scalarH(y0), scalarW(x1), scalarH(y1))}
ctx.scalarMove = (x,y) => {ctx.beginPath(); ctx.moveTo(scalarW(x), scalarH(y))}
ctx.scalarLine = (x,y) => {ctx.beginPath(); ctx.lineTo(scalarW(x), scalarH(y))}
ctx.scalarText = (txt,x,y) => {ctx.beginPath(); ctx.fillText(txt, scalarW(x), scalarH(y)); ctx.fill()}

//
clearScreen = () => {ctx.clearRect(0,0,canvas.width,canvas.height)}; clearScreen()


// General Game Const Stuff
const MAX_BUTTONS = 9
const MAX_TIME_DEPTH = 600000	// Number of MILLISECONDS Scan goes Deep ;) -> Ususally game will divide by (BPM * HiSpeed)
TIMING_WINDOWS = [
	// STANDARD
	[240,120,66,33],	
	
	// Easier
	[250,120,80,33],
	
	// Hard
	[180,80,50,16],
	
	// BRUTAL
	[120,70,35,12]
]

CVAR_TYPES = {INT: 0, STRING: 1, BOOL: 2, PERCENTAGE: 3, FREE: 4}
DEFAULT_CVARS = [
	
	// RANGED NUMBERS (FLOAT)
	[
		["fps_max", 144, 1, 300, "Set maximum framerate"],
		["tracker_diff", 0.08, 0, 0.5, "Set multiplication difference for Odd/Even Columns in Tracker (This is kinda scuffed, so try to avoid ratios above 0.25ish)"],
		["tweak_hispeed", 5, 0.1, 10, "Global Base Scroll Rate of Notes"],
		
	],
	
	// STRINGS, MIN/MAX = Length
	[
		["player_name", GAME_NAME + " player", 1, 20],
	],
	
	// BOOLEANS AND UNBOUNDED NUMBERS
	[
		["autoplay", 0,	"AUTOPLAY AUTOFAILS: ALL NOTES WILL HIT PERFECT; USED FOR DEBUG AND RELAXATION :^)"],
		["cvar_warning", 1, "Warn the user when changing a CVar without boundaries or type checks, such as tracker_colors"],
		["cvar_clamp", 1, "Keep changed values in their ranges (CHANGING NOT RECOMMENDED)"],
		["pop_enabled", 1, "Draw a sprite near notes that pop"],
		["tweak_beamflags", 15, "Draw beams for respective HIT TYPE: (+1 = BAD, +2 = GOOD, +4 = GREAT, +8 = COOL)"],
		["debug_draw", 1, "Draw debug text"],
		["debug_timing_window", 1, "Draw timing window overlay"],
		["focus_warn", 0, "Draw an overlay when not clicked into game"],
		["tweak_ojama1", 0, "Force a default Ojama 1 upon oneself for added challenge"],
		["tweak_ojama2", 0, "Force a default Ojama 2 upon oneself for added challenge"],
		["tweak_ojama1_playflags", 0, "Add conditions for FORCED Ojama1: (0 = ALWAYS on, else Conditional) +1 = Periodically, +2 = On-Miss, +4 = On-Success Chain"],
		["tweak_ojama2_playflags", 0, "Add conditions for FORCED Ojama2: (0 = ALWAYS on, else Conditional) +1 = Periodically, +2 = On-Miss, +4 = On-Success Chain"],
	],
	
	// PERCENTAGE HACKS
	[
		["base_cover", 0, "Multiple of Tracker to cover from Top"],
		["base_hide", 0, "Multiple of Tracker to cover from Bottom"],
		["base_lift", 0, "Multiple of Tracker Lift at Bottom (Affects Note Speed!)"],
		["tracker_dim", 0.6, "How much notes that AREN'T pressed are dimmed by"],
		["tracker_xpos", 0.25, "Where is Tracker on Screen"],
		["tracker_ypos", 0.1, "Where is Tracker on Screen"],
		["tracker_width", 0.5, "How wide Tracker is lolmafo"],
		["tracker_height", 0.5, "How tall tracker is"],
		["note_height", 0.02, "Height of a Note (Notes are drawn bottom-up but this is for precision too)"],
	],

	// FREEHAND: Only Default Value, anything can be set so it's preferred TO NOT Change it - Console gives warning on change
	[
		["binds", ["KeyA","KeyS","KeyD","KeyF","Space","KeyJ","KeyK","KeyL","Semicolon"]],
		
		// TODO: We're using Pop'n Origin Colors, CHANGE THESE
		["column_colors", [
		
			[50,50,50],[70,50,0],[20,50,20],[20,50,70],
			
			[90,20,20],
		
			[20,50,70],[20,50,20],[70,50,0],[50,50,50]
			
		], "Array for Colors of Tracker Columns"],
		
		["note_colors", [
		
			[180,180,180], [220,180,0], [30,120,30], [50,90,190], [200,30,30], [50,90,190], [30,120,30], [220,180,0], [180,180,180]
			
		], "Array for Colors of Tracker Columns"],
		
		
		["beam_colors", 	[ [50,10,250], [200, 0, 0], [200, 170,0], [255,0,255] ], "For each beam type from BAD to COOL, what color shall we use!"]
	]
]

// XXX -> DO NOT USE SETCVAR IN THIS FUNCTION BECAUSE INITIALISATION != SETTING
function resetCFG() {
	if (!localStorage.length || localStorage.getItem("version") != GAME_VERSION) {
		for (var cvartype = 0; cvartype < DEFAULT_CVARS.length; cvartype++) {
			for (cvars of DEFAULT_CVARS[cvartype]) {
				let bData = [cvartype, cvars[1], ...cvars.slice(1)]
				localStorage.setItem(cvars[0], JSON.stringify(bData))
			}
		}
		console.log("LOADED DEFAULT SETTINGS")
	}
}
resetCFG()
getCVar = (name) => {return JSON.parse(localStorage.getItem(name))}
getCValue = (name) => {return getCVar(name)[1]}
getCDesc = (name) => {return getCVar(name)[5]}
setCVar = (name, value) => {

	let cvar = getCVar(name)
	if (cvar) {
		let warning = false
		switch (cvar[0]) {
			
			case CVAR_TYPES.INT:
				localStorage.setItem(name, JSON.stringify([CVAR_TYPES.INT, value.clamp(cvar[3],cvar[4]), ...cvar.slice(2)]))
				break
			
			case CVAR_TYPES.STRING:
				console.log(cvar)
				if (value.length > cvar[3] & value.length < cvar[4]) {localStorage.setItem(name, JSON.stringify([CVAR_TYPES.STRING, value, ...cvar.slice(2)]))}
				else{console.warn("String length out of range: ("+cvar[3]+"=>"+cvar[4]+")")}
				break
			
			case CVAR_TYPES.BOOL:
				console.log("Regardless, booleans set their value because it just checks if Exists/NotZero/Null, etc.")
				localStorage.setItem(name, JSON.stringify([CVAR_TYPES.BOOL, value, ...cvar.slice(2)]))
				break
			
			case CVAR_TYPES.PERCENTAGE:
				if (value < 0 | value > 1) {console.warn("Percentage numbers must be on a 0 -> 1 inclusive range; this has been Clamped")}
				localStorage.setItem(name, JSON.stringify([CVAR_TYPES.PERCENTAGE, value.clamp(0,1), ...cvar.slice(2)]))
				break
		}
	}
	
	else {
		console.warn("CVAR",name,"not found")
	}
}








// Frame Stuff
getFPSInterval = () => {return 1000/ getCValue("fps_max")}
PREV_FRAME_TIME = performance.now() - getFPSInterval()


// EVENT Stuff
EVENT_QUEUE = []
BUTTONS_PRESSED = 0
LONG_NOTES = 0


// BPM Hoodickies
BPM_TABLE = []
initBPMTable = () => {
	let BPM = 1; let inc = 1

	for (var i = 0; i < 248; i++) {
		if ((i+48) % 64 == 0) {
			inc++
		}
		BPM_TABLE.push(Math.floor(BPM))

		BPM += inc > 1 ? inc * 1.26 : inc
		
	}
	BPM_TABLE[247] = 999
}
initBPMTable()

// Number Prototype
Number.prototype.clamp = function(min, max) {return Math.min(Math.max(this, min), max);};
Number.prototype.getBit = function(bit) {let mask = 1 << bit; return (this & mask) != 0}


// XXX -> Use this for anything that needs to update a set percent per second
toPercPerSecond = (amount) => {
	return (amount / 1000) * DELTA_TIME
}

// Array Prototypes
Array.prototype.toHexString = function() {
	let output = ""
	for (var i = this.length - 1; i >= 0; i--) {
		output += this[i].toString(16).padStart(2,0).split("").reverse().join("")
	}
	return "#"+output.split("").reverse().join("")

}



// Beam Vars
BEAMS = []
for (var i = 0; i < 9; i++) {BEAMS.push([0,0])}



class Timeline {
	constructor(arr) {
		this.entries = arr,
		this.start = 0
	}
}





class Timed_Event {
	constructor(time) {
		this.time = time
	}
	
	getTime() {
		return this.time
	}
}

class Event_Note extends Timed_Event {
	constructor(time, notes = 0) {
		super(time)
		this.notes = notes
	}
}


class Event_List {
	constructor(items = []) {
		this.list = items
		this.start = 0
	}
}


var currentSong = {
	

	

	events: {
		
		test: new Event_List([
			new Event_Note(600, 1),
			new Event_Note(1200, 2),
			new Event_Note(1800, 4),
			new Event_Note(2400, 8),
		]),
		
		notes: {
			list: [
				[600, 1],
				// Index 2 sets current "Long Note Combination"
				[1000, 1],
				[2500, 1],
			],
			start: 0,
			past_count: 0,
			scan: 0,			// IN REALITY, WE ACTUALLY USE THIS TO "RESET" THE SONG
			scan_done: 0,		// HACK ADDED BECAUSE SAYING "DONE" BREAKS E V E R Y T H I N G
		},

		
		bpm: {
			current: 0,		// ACTUAL DISPLAYED, ALWAYS STARTS AT 0
			
			// XXX -> FIRST BPM'S TIME IS ALWAYS IGNORED : YOU SHOULD HAVE A ZERO EVENT FOR BASE BPM
			list: [
				[0, 80],
			],
			start: 0,
			scan: 0,
			scan_current: 0,
		},
		
		long_notes: {
			current: 0,
			list: [
				[2000, 30, 50],
			],
			start: 0,
			scan: 0,
			scan_current: 0,
		},
		
		functions: {
			
		},
	},
	
	
	
	time: 0,
	timing_window: 0,
	increment: 0,
	
	
	// CURRENT
	// JUST A HEADS UP: CURRENT MEANS UPCOMING IN A SENSE, IF WE SAY "CURRENT IS IN THE PAST" IT REALLY MEANS: HAS THIS NOTE >> JUST CROSSED << INTO THE PAST?
	get notes() {return this.events.notes},
	get bpm() {return this.events.bpm},
	
	get currentNote() {return this.notes.list[this.notes.start - this.notesDone]},
	get currentDelta() {return this.currentNote[0] - this.time},
	get currentInPast() {return (this.currentDelta < 0) * !(this.notesDone)},

	
	// BPM
	get currentBPM() {return this.bpm.list[this.bpm.start - this.BPMDone]},
	get currentBPMDelta() {return this.currentBPM[0] - this.time},
	get currentBPMInPast() {
		return (this.currentBPMDelta < 0) * !this.BPMDone
	},
	
	
	// OLD/PAST NOTES ONLY
	get oldestIndex() {return this.notes.start - this.notes.past_count},
	get oldestNote() {return this.notes.list[this.oldestIndex]},
	get oldestDelta() {return this.oldestNote[0] - this.time},
	get oldestTooOld() {return this.oldestDelta < -this.theTimingWindow[0]},	// Used for Pop'N Notes
	
	// Tailored Parameters
	get theTimingWindow() {return TIMING_WINDOWS[this.timing_window]},
	get theMaxTiming() {return this.theTimingWindow[0]},				// Maximum Time before notes are hittable
	get theVisualBPM() {return BPM_TABLE[this.bpm.current]},	// What BPM is displayed at bottom/ACTUAL BPM
	
	get totalNotes() {return this.notes.list.length},
	get totalBPM() {return this.bpm.list.length},
	
	
	// DONE Checker
	get songOver() {return this.notesDone && this.notes.past_count == 0},		// THIS IS ACTUALLY OVER/I RAN OUT OF NOTES AND NOTHING IN PAST, WE'RE DONE
	get notesDone() {return this.notes.start >= this.totalNotes},
	get BPMDone() {return this.bpm.start >= this.totalBPM},
	
	get currentHittable() {return this.currentDelta < this.theMaxTiming},
	get maxTimeDepth() {return MAX_TIME_DEPTH / getCValue("tweak_hispeed") / this.theVisualBPM},
	
	get msIncrement() {return 1/this.maxTimeDepth},
	
	incNotes() {
		if (!this.notesDone) {
			this.notes.start++
		}
	},
	
	incBPM() {
		if (!this.BPMDone) {
			this.bpm.current = this.currentBPM[1]
			this.bpm.start++;
		}
	},
	
	
	
	// Moves to nearest absolute time
	tickTo: function (time) {
		this.time = time
		if (!this.BPMDone) {this.doBPMStuff()}
		if (!this.notesDone) {this.doNoteStuff()}
		this.updatePastNotes()	// KEEP THIS OUT OF NOTE STUFF BECAUSE PAST NOTES CAN STILL UPDATE EVEN WHEN SONG IS OVER!!!!
	},
	
	doBPMStuff: function() {
		this.updateVisualBPM()
	},
	
	doNoteStuff: function() {
		this.moveNotesIntoPast()
		this.getFutureNotePos(getCValue("tweak_hispeed"))
	},
	
	// Moves all Future Notes to the Past (IF THEY ARE)
	moveNotesIntoPast: function () {
		while (this.currentInPast) {
			// IF Note is TOO far in the past, we do NOT increment the Past-Note Count	
			if (!this.oldestTooOld) {this.notes.past_count++}
			this.incNotes()
		}
	},
	
	// Set Visual BPM
	updateVisualBPM: function () {
		while (this.currentBPMInPast) {
			this.incBPM()
		}
	},

	// Removes any past notes that are TOO Old
	updatePastNotes: function () {
		if (this.notes.past_count) {
			while (this.oldestTooOld) {
				this.notes.past_count--
				if (!this.notes.past_count) {break}	// Magic hack to ensure that we stop when the song is out of Notes
			}
		}
	},
	
	
	
	// Returns a list of FUTURE Notes until the established Depth
	futureNotesWithin: function(time_depth) {
		var count = 0

		if (!this.notesDone) {
			var scan_time = this.currentNote[0]	// Next Note should begin HERE
			var end_time = this.time + time_depth	// Absolute Time Depth End
			var scan_index = this.notes.start
			var scan_bpm = this.theVisualBPM
			
			while (scan_time < end_time && scan_index < this.totalNotes) {
				scan_index++
				count++
				if (scan_index >= this.totalNotes) {
					break
				}
				else {
					scan_time = this.notes.list[scan_index][0]
				}
			}
		}
		return this.notes.list.slice(this.notes.start, this.notes.start + count)
	},
	
	
	// DOES STUF WITH NOTES
	checkCombo: function(event) {
		
		var time = event[0]
		var combo = event[1]
		var ntype = event[2]
		
		
		if (!this.songOver) {
			// IF CURRENT SONG DELTA LOW, OR THERE ARE NOTES IN THE PAST
			if (this.currentHittable || this.notes.past_count) {
				
				// Get all notes up to the range of current hittable
				var vindow = this.futureNotesWithin(this.theMaxTiming).length
				
				// START AT PAST NOTES FIRST
				for (var i = this.notes.start - this.notes.past_count; i < this.notes.start + vindow; i++) {
					
					// For each Note in the Future, Check ALL Bits within
					var cTime = this.notes.list[i][0]
					var cNote = this.notes.list[i][1]
					
					
					for (var bit = 0; bit < MAX_BUTTONS; bit++) {
						if (cNote.getBit(bit)) {
							
							// NOTE DOWN ONLY
							if (combo.getBit(bit)) {
								
								combo -= 2 ** bit	// Stop combo overlapping to Same Note
								var outcome = this.getTimingOutcome(cTime - this.time)
								BEAMS[bit][0] = outcome
								
								// IF Note is long
								if (this.notes.list[i][2]) {
									console.log(this.notes.list[i][2])
									// Must be greater than BAD to count as a proper held LONG
									if (outcome > 0) {
										LONG_NOTES = BUTTONS_PRESSED
									}
								}
								
								else {
									this.notes.list[i][1] -= 2 ** bit
								}
							}
						}
					}
				}
			}
		}
		
	},
	
	getTimingOutcome: function(delta) {
		
		delta = Math.abs(delta)
		var wc = this.theTimingWindow.length
		while (wc) {
			if (delta < this.theTimingWindow[wc]) {
				break
			}
			wc--
		}
		return wc
	},
	
	
	initScan: function() {
		this.notes.scan = this.notes.start
		this.bpm.scan = this.bpm.start
		this.bpm.scan_current = this.bpm.current
	},
	
	
	
	getFutureNotePos: function(hispeed) {
		
		var scan_list = []
		
		
		if (!this.notesDone) {
			
			// IF BPM AND Hispeed > 0, DRAW NOTES
			if (Math.min(hispeed, this.theVisualBPM) > 0) {

				if (Math.min(this.currentDelta, this.currentBPMDelta) < this.maxTimeDepth) {
					
					// IN A NUTSHELL, WE ACTUALLY USE THE "CURRENT" VALUES AND THEN RESET BACK TO SCAN'S VALUES!
					this.initScan()
					
					var scan_depth = 0
					var scan_time = this.time
					
					while ((scan_depth < 1) & !this.notesDone) {
						
						// IF THE INCOMING NOTE OCCURS BEFORE THE INCOMING BPMCHANGE
						if ((this.currentDelta < this.currentBPMDelta) || this.BPMDone) {	
							scan_depth += this.currentDelta * this.msIncrement
							scan_list.push(scan_depth)
							this.time = this.currentNote[0]
							this.incNotes()
							if (this.notesDone) { break }
						}
						
						// IF THE INCOMING NOTE OCCURS AFTER BPM-CHANGE, WE NEED TO UPDATE INCREMENT ACCORDINGLY
						else {
							scan_depth += this.currentBPMDelta * this.msIncrement
							this.time = this.currentBPM[0]
							this.incBPM()
						}
					}
					this.notes.start = this.notes.scan
					this.bpm.start = this.bpm.scan
					this.bpm.current = this.bpm.scan_current
					this.time = scan_time
					
					
				}
				
			}
		}
		return scan_list
	},
	
}





// RETURNS XPos and WIDTH OF a COLUMN (IN ORDER)
function getColumnDim(id) {
	var column_width = getCValue("tracker_width") / (MAX_BUTTONS+1)
	var noo 	= Math.ceil(id/2)
	var noe 	= Math.floor(id/2)
	var vshort 	= column_width * (1 - getCValue("tracker_diff")) - (((column_width *2) * getCValue("tracker_diff")) / MAX_BUTTONS)		// ODD NUMBERS = SHORT
	var vlong 	= column_width * (1 + getCValue("tracker_diff"))		// EVEN NUMBERS = LONG
	
	let final_x = getCValue("tracker_xpos") + (vlong * noo) + (vshort * noe) + (vlong/2)
	return [final_x, id.getBit(0) ? vshort : vlong]
}
const ERROR_NO_NOTES = "% NO FUTURE EVENTS %"

drawFuncs = {
	debug: function() {
		ctx.fillStyle = "white"
		ctx.textAlign = "right"
		ctx.textBaseline = "top"
		
		let strList = [
			"== DEBUG ENABLED ==",
			GAME_NAME +" V"+GAME_VERSION,
			"Player %NAME",
			
			"",
			
			"== KeyBinds ==",
			"BUTTONS PRESSED: " +BUTTONS_PRESSED,
			"LONG NOTES VALID HELD: " +LONG_NOTES,
			"",
			
			
			
			"== Song Details ==",
			"Song Time: " +currentSong.time,
			"Note Start: " +currentSong.notes.start,
			"Past Notes: " +currentSong.notes.past_count,
			currentSong.currentNote != undefined ? "Next Note: " +JSON.stringify(currentSong.currentNote) : ERROR_NO_NOTES,
			"Next note in..." +(currentSong.notesDone ? ERROR_NO_NOTES : currentSong.currentDelta),
			
			"",
			
			"== BPM Stuff ==",
			"BPM ID " +currentSong.bpm.current +" >> " +currentSong.theVisualBPM,
			"Next BPM in..." +(currentSong.BPMDone ? ERROR_NO_NOTES : currentSong.currentBPMDelta),
			
			"",
			
			"== NoteScan Related ==",
			"HiSpeed: " +getCValue("tweak_hispeed"),
			"Max BASE Scan: " +Math.floor(currentSong.maxTimeDepth) +"ms",
			"Note Fall Speed: " +(currentSong.msIncrement * 1000).toFixed(2) +" Tracker Height/s",
		]
		
		for (str in strList) {
			ctx.scalarText(strList[str], 1, 0.01 + (0.02 * str))
		}
		

	},
	
	
	note: function(combo, pos) {
		for (var bit = 0; bit < MAX_BUTTONS; bit++) {
			if (combo.getBit(bit)) {
				let dim = getColumnDim(bit)
				ctx.fillStyle = getCValue("note_colors")[bit].toHexString()
				ctx.scalarRect(dim[0], getCValue("tracker_ypos") + getCValue("tracker_height") - (pos * getCValue("tracker_height")), dim[1], -(getCValue("tracker_height") * getCValue("note_height")))
			}
		}
		
	},
	

	
	
	tracker: function() {
		ctx.fillStyle = "black"
		ctx.scalarRect(getCValue("tracker_xpos"), getCValue("tracker_ypos"), getCValue("tracker_width"), getCValue("tracker_height"))
	},
	
	timer: function() {
		ctx.fillStyle = "yellow"
		ctx.scalarRect(getCValue("tracker_xpos"), getCValue("tracker_ypos") + getCValue("tracker_height"), getCValue("tracker_width"), 1/96)
	},
	
	judge: function() {
		ctx.fillStyle = "red"
		ctx.scalarRect(getCValue("tracker_xpos"), getCValue("tracker_ypos") + getCValue("tracker_height"), getCValue("tracker_width"), -(getCValue("tracker_height") * getCValue("note_height")))
	},
	
	groove: function() {
		ctx.fillStyle = "blue"
		
	},
	
	song_title: function(id) {
		
		ctx.fillStyle = "grey"
		ctx.scalarRect(getCValue("tracker_xpos"), 0, getCValue("tracker_width"), getCValue("tracker_ypos"))
		ctx.textAlign = "middle"
		ctx.scalarText("TEST", 0.5, getCValue("tracker_ypos")/2)
		
	},
	
	column: function(id) {
		ctx.fillStyle = getCValue("column_colors")[id].toHexString()
		// Get additional Odds and Evens, the formula is: 
		// Divide Number by 2, number of odds = Ceil, evens = Floor
		// TODO: To prevent over/undershooting, the Smaller Length
		let dim = getColumnDim(id)
		ctx.scalarRect(dim[0], getCValue("tracker_ypos"), dim[1], getCValue("tracker_height"))
	},
	
	beam: function(id) {
		if (BEAMS[id][1]) {
			let dim = getColumnDim(id)
			let cw = dim[1]
			let beam_col = getCValue("beam_colors")[BEAMS[id][0]].toHexString()
			let beam_x = dim[0] + (cw * (0.5 * (1-BEAMS[id][1])))
			let grad = ctx.scalarGrad(dim[0] + (cw/2), getCValue("tracker_ypos"), dim[0] + (cw/2), getCValue("tracker_ypos") + getCValue("tracker_height"))
			grad.addColorStop(0.02, "#0000") 
			grad.addColorStop(0.8, beam_col)
			grad.addColorStop(1, "white")
			ctx.fillStyle = grad
			ctx.beginPath()
			ctx.scalarRect(beam_x, getCValue("tracker_ypos"), dim[1] * BEAMS[id][1], getCValue("tracker_height"))
			ctx.fill()
		}
	}
}

canvas.addEventListener("keydown", function(e) {
	e.preventDefault()
	if (!e.repeat) {
		let bit = getCValue("binds").indexOf(e.code)
		let cInd = 2 ** bit
		if (cInd != 0.5) {
			EVENT_QUEUE.push([e.timeStamp, cInd, 0])
			BUTTONS_PRESSED |= cInd
		}
	}
})

canvas.addEventListener("keyup", function(e) {
	e.preventDefault()
	let bit = getCValue("binds").indexOf(e.code)
	let cInd = 2 ** bit
	if (cInd != 0.5) {
		EVENT_QUEUE.push([e.timeStamp, cInd, 1])
		// Magic hack because it just Breaks
		if (BUTTONS_PRESSED & cInd) {BUTTONS_PRESSED -= cInd}
		// HACK THAT RESETS BEAMS TO DEFAULT COLOR
		
		BEAMS[bit][0] = 0
		
	}
})

window.addEventListener("resize", function() {
	autoResizeScreen()
})

function main() {
	requestAnimationFrame(main)
	DELTA_TIME = performance.now() - PREV_FRAME_TIME
	
	// DO EVENTS
	if (EVENT_QUEUE.length) {
		for (event of EVENT_QUEUE) {
			currentSong.tickTo(event[0])
			
			currentSong.checkCombo(event)
		}
		EVENT_QUEUE = []
	}

	
	if (DELTA_TIME > getFPSInterval()) {
		PREV_FRAME_TIME = performance.now()
		clearScreen()
		
		// Tick and Test Song
		currentSong.tickTo(performance.now())
		
		drawFuncs.tracker()
		
		
		
		// Draw stuff 0 to 8
		
		drawFuncs.groove()
		for (var i = 0; i < MAX_BUTTONS; i++) {
			drawFuncs.column(i)
			drawFuncs.beam(i)
		}
		drawFuncs.judge()
		
		// DRAW NOTES TODO: GET THESE WORKING, WE NEED TO TEST THE FUTURE NOTE POS IM TOO TIRED ADD DRAW
		let visible_notes = currentSong.getFutureNotePos(getCValue("tweak_hispeed"))
		if (visible_notes.length) {
			for (var i = 0; i < visible_notes.length; i++) {
				drawFuncs.note(currentSong.notes.list[currentSong.notes.start + i][1], visible_notes[i])
			}
		}
		
		// FOR PAST NOTES
		if (currentSong.notes.past_count) {
			for (var i = 1; i <= currentSong.notes.past_count; i++) {
				drawFuncs.note(currentSong.notes.list[currentSong.notes.start - i][1], 0)
			}
		}
		
		drawFuncs.song_title()
		
		
		// Update BEAMS
		for (beam in BEAMS) {
			if (BUTTONS_PRESSED.getBit(beam)) {BEAMS[beam][1] += toPercPerSecond(12)}
			else {BEAMS[beam][1] -= toPercPerSecond(48)}
			BEAMS[beam][1] = BEAMS[beam][1].clamp(0,1)
		}
		
		// Draw Debug
		if (getCValue("debug_draw")) {
			drawFuncs.debug()
		}
	}
}
main()