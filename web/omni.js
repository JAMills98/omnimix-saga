// OmniMix Saga Final
const VERSION = 0
canvas = document.getElementById("omni_game")
ctx = canvas.getContext("2d")

// Resize the screen; game is kept on a Square by default; outside elements are faux drawn
autoResizeScreen = () => {canvas.width = canvas.height = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.9)}
autoResizeScreen()

// Scalar Function
scalarW = (fl) => {return canvas.width * fl}
scalarH = (fl) => {return canvas.height * fl}
ctx.scalarRect = (x,y,w,h) => {ctx.rect(scalarW(x),scalarH(y),scalarW(w),scalarH(h),)}
ctx.scalarGrad = (x0,y0,x1,y1) => {return ctx.createLinearGradient(canvas.width * x1, canvas.height * y0, canvas.width * x1, canvas.height * y1)}
ctx.scalarMove = (x,y) => {ctx.moveTo(scalarW(x), scalarH(y))}
ctx.scalarLine = (x,y) => {ctx.lineTo(scalarW(x), scalarH(y))}
clearScreen = () => {ctx.clearRect(0,0,canvas.width,canvas.height)}


// Establish Socket
const WS = new WebSocket("ws://"+location.host+":443")
WS.binaryType = "arraybuffer"
WS.addEventListener("open", () => {WS.send(new Uint8Array(["ALIVE"]))})

const GAME_NAME = "OmniMix"

// Internal CVAR Stuff
const DEFAULT_CVARS = [
	
	// RANGED NUMBERS
	[
		["fps_max", 75, 1, 300, "Set maximum framerate"],
		["tracker_diff", 0, 0.15, "Set multiplication difference for Odd/Even Columns in Tracker"],
	],
	
	// STRINGS, MIN/MAX = Length
	[
		["player_name", GAME_NAME + " player", 1, 20],
	],
	
	// BOOLEANS
	[
		["cvar_warning", 1, "Warn the user when changing a CVar without boundaries or type checks, such as tracker_colors"],
		["cvar_clamp", 1, "Keep changed values in their ranges (CHANGING NOT RECOMMENDED)"],
		["beams_enabled", 1, "Draw colored beams when user presses a note"],
		["pop_enabled", 1, "Draw a sprite near notes that pop"],
		["tweak_beamflags", 2**4, "Draw beams for respective HIT TYPE: (+1 = BAD, +2 = GOOD, +4 = GREAT, +8 = COOL)"],
	],
	
	// 0->1 FLOATS (PERCENTAGES)
	[
		["base_cover", 0, "Multiple of Tracker to cover from Top"],
		["base_hide", 0, "Multiple of Tracker to cover from Bottom"],
		["base_lift", 0, "Multiple of Tracker Lift at Bottom (Affects Note Speed!)"],
		["tracker_dim", 0.6, "How much notes that AREN'T pressed are dimmed by"],
		["tracker_xpos", 0.25, "Where is Tracker on Screen"],
		["tracker_ypos", 0.1, "Where is Tracker on Screen"],
		["tracker_height", 0.5, "How tall tracker is"],
		["column_width", 0.5/9, "Width of a single column"],
	],

	// FREEHAND: Only Default Value, anything can be set so it's preferred TO NOT Change it - Console gives warning on change
	[
		["binds", ["KeyA","KeyS","KeyD","KeyF","Space","KeyJ","KeyK","KeyL","Semicolon"]],
		["tracker_colors", [[220,200,250],[240,170,0],[0,150,0],[0,120,180],[190,90,40]], "Array for Sequence of Colors to Load on Tracker"],
		["tracker_pointers", [0,1,2,3,4,3,2,1,0], "Array Sequence of what colors to direct to"],
		["beam_colors", 	[ [64,64,224], [192,32,32], [255,255,0], [255,0,255] ], "For each beam type from BAD to COOL, what color shall we use!"]
	]
]


const CVAR_TYPES = {
	INT: 0,
	STRING: 1,
	BOOL: 2,
	PERCENTAGE: 3,
	FREE: 4,
}

// Write Default CVars -> TODO: Needs to Write Proper
var resetCFG;
(resetCFG = function() {
if (!localStorage.length || localStorage.getItem("version") != VERSION) {
	for (var cvartype = 0; cvartype < DEFAULT_CVARS.length; cvartype++) {
		for (cvars of DEFAULT_CVARS[cvartype]) {
			localStorage.setItem(cvars[0], JSON.stringify([cvartype, cvars[1], ...cvars.slice(1)]))
		}
	}
	console.log("LOADED DEFAULT SETTINGS")
}})()

getCVar = (cvar_name) => {
	return JSON.parse(localStorage.getItem(cvar_name))
}

getCValue = (name) => {
	return getCVar(name)[1]
}

getCDesc = (name) => {
	return getCVar(name)[5]
}

setCVar = (name, value) => {

	let cvar = getCVar(name)
	if (cvar) {
		switch (cvar[0]) {
			
			case CVAR_TYPES.INT:
				if (value >= cvar[3] & value <= cvar[4]) {localStorage.setItem(name, JSON.stringify([CVAR_TYPES.INT, value, ...cvar.slice(2)]))}
				else{console.warn("int out of range: ("+cvar[3]+"=>"+cvar[4]+")")}
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
				value < 0 ? value = 0 : 0
				value > 1 ? value = 1 : 0
				localStorage.setItem(name, JSON.stringify([CVAR_TYPES.PERCENTAGE, value, ...cvar.slice(2)]))
				break
			
			case CVAR_TYPES.PERCENTAGE:
				localStorage.setItem(name, JSON.stringify([CVAR_TYPES.FREE, value, ...cvar.slice(2)]))
				if (value < 0 | value > 1) {console.warn("Percentage numbers must be on a 0->1 inclusive range; this has been Clamped")}
				value < 0 ? value = 0 : 0
				value > 1 ? value = 1 : 0
				localStorage.setItem(name, JSON.stringify([CVAR_TYPES.STRING, value, ...cvar.slice(2)]))
				break
		}
	}
	
	else {
		console.warn("CVAR",name,"not found")
	}
}

getFPSInterval = () => {
	return 1000/ getCValue("fps_max")
}

PREV_FRAME_TIME = performance.now() - getFPSInterval()

// BPM is ACTUALLY a hard coded table of 248 values with 8 Reserved Values:
// 248 = Toggle BPM Scramble
// 249 = Toggle BPM Hide
// 250 = Pick a random BPM in 0->247 range
// 251 = Set BPM to Song's Modal BPM
// 252 = Set BPM to Song's Min
// 253 = Set BPM to Song's Max
// 254 = ?
// 255 = ?
BPM_TABLE = []
initBPMTable = () => {
	let BPM = 0; let inc = 1

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


// Use these for EVENT Quee
EVENT_QUEUE = []
BUTTONS_PRESSED = 0


// CURRENT SONG STUFF
class CURRENT_SONG {
	constructor() {
		
	}
	
	// Supplies Events, then Resets the Song
	initEvents(eList) {
		
	}
	
	setBGM(aud) {
		this.BGM = aud
	}
}
CURRENT_SONG = new CURRENT_SONG()

// Use these for Color Rendering
Array.prototype.toHexString = function() {
	let output = ""
	for (var i = this.length - 1; i >= 0; i--) {
		output += this[i].toString(16).padStart(2,0).split("").reverse().join("")
	}
	return "#"+output.split("").reverse().join("")
}
Array.prototype.brightMult = function(mult) {
	let o = []
	for (x of this) {
		let inc = Math.floor(x*mult)
		inc < 0 ? inc = 0 : 0
		inc > 255 ? inc = 255 : 0
		o.push(inc)
	}
	return o
}

// Use these for Bitwise
Number.prototype.getBit = function(bit) {
	let mask = 1 << bit
	return (this & mask) != 0
}

// EVENT LISTENER STUFF
canvas.addEventListener("keydown", function(e) {
	e.preventDefault()
	if (!e.repeat) {
		
		let ind = getCValue("binds").indexOf(e.code)
		if (ind >= 0) {
			BUTTONS_PRESSED |= (2**ind)
			EVENT_QUEUE.push([e.timeStamp, BUTTONS_PRESSED])
		}
	}
})
canvas.addEventListener("keyup", function(e) {
	e.preventDefault()
	let ind = getCValue("binds").indexOf(e.code)
	if (ind >= 0) {
		// TODO: I forgot what to do but I need to remove 2^Bit from the number IF the Bit is True
		BUTTONS_PRESSED -= (2**ind)
		EVENT_QUEUE.push([e.timeStamp, BUTTONS_PRESSED])
	}
})

window.onresize = function(e) {
	autoResizeScreen()
}


drawColumn = (x) => {
	ctx.beginPath()
	ctx.fillStyle = getCValue("tracker_colors")[getCValue("tracker_pointers")[x]].brightMult(1 - (getCValue("tracker_dim") * (1))).toHexString()
	ctx.scalarRect(getCValue("tracker_xpos") + (getCValue("column_width") * x), getCValue("tracker_ypos"), getCValue("column_width"), getCValue("tracker_height"))
	ctx.fill()
}


BEAMS = []
for (var i = 0; i < 9; i++) {
		BEAMS.push([0,3])
}
const HIT_TYPES = {
	BAD: 0,
	GOOD: 1,
	GREAT: 2,
	COOL: 3,
}



// Input the expected amount of Deviation per Second and we apply Delta to it
toPercPerSecond = (amount) => {
	return (amount / 1000) * DELTA_TIME
}


	
drawBeam = (x) => {
	if (BEAMS[x][0]) {
		let beam_color = getCValue("beam_colors")[BEAMS[x][1]].toHexString()
		
		
		
		let xpos = getCValue("tracker_xpos") + (((getCValue("column_width") * x)) + getCValue("column_width")/2)
		let lwidth = (getCValue("column_width") * BEAMS[x][0])/2
		let lheight = getCValue("tracker_height")
		let ypos = getCValue("tracker_ypos")
		
		let beam_grad = ctx.scalarGrad(xpos, 0, xpos, ypos + lheight)
		
		beam_grad.addColorStop(0, beam_color+"33")
		beam_grad.addColorStop(1, beam_color)
		
		
		ctx.fillStyle = beam_grad
		
	
		ctx.beginPath()
		ctx.scalarRect(xpos, ypos, lwidth, lheight)
		ctx.scalarRect(xpos, ypos, -lwidth, lheight)

		ctx.fill()
	}
		
	if (!BUTTONS_PRESSED.getBit(x)) {
		BEAMS[x][0] -= toPercPerSecond(12)
		if (BEAMS[x][0] < 0) {
			BEAMS[x][0] = 0
		}
	}
	else {
		BEAMS[x][0] += toPercPerSecond(80)
		if (BEAMS[x][0] > 1) {
			BEAMS[x][0] = 1
		}
	}
}


// Draw a dark overlay
overlayFade = (perc) => {
	// Fill in with Shade
	ctx.fillStyle = "rgba(100,0,0,"+perc+")"
	ctx.beginPath()
	ctx.scalarRect(0,0, 1,1)
	ctx.fill()
}


// MAIN LOOP
function main() {
	requestAnimationFrame(main)
	

	
	
	// Check Note Interactions
	if (EVENT_QUEUE) {
		for (event of EVENT_QUEUE) {
			console.log(event)
		}
		EVENT_QUEUE = []
	}

	DELTA_TIME = performance.now() - PREV_FRAME_TIME
	if (DELTA_TIME > getFPSInterval()) {
		PREV_FRAME_TIME = performance.now()
		clearScreen()
		
		for (var i = 0; i < 9; i++) {
			drawColumn(i)
			drawBeam(i)
		}
		
		// DRAW FOCUS WARN
		if (document.activeElement != canvas) {
			
			overlayFade(0.6)
			
			// And do ALERT Text
			ctx.fillStyle = "white"
			ctx.beginPath()
			ctx.fillText("CLICK TO FOCUS!", 50, 50)
			ctx.fill()
		}

	}
}

main()