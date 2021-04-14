// Omnimix Saga Socket Server
fs = require("fs")
express = require("express")
path = require("path")
WebSocket = require("ws")


app = express()
pub = path.join(__dirname, "./web")
http = require("http").Server(app)	// TODO: Make this HTTPS/WSS Later
app.use(express.static(pub))
app.get("/",function(req,res) {
	res.sendFile(path.join(pub, "index.html"))
})

http.listen(80)

const GAME_VERSION = 1

class ServerSocket extends WebSocket.Server {
	constructor(game) {
		super({port: 443,
			httpServer:http,
			binaryType: "arraybuffer",
			maxReceivedFrameSize: 128,
		})
		this.initEvents()
	}
	
	
	initEvents() {
		this.on("connection", ws => {
			// Swap Modus to Version Read, then send Version Number
			ws.send(new Uint8Array([15,0,GAME_VERSION]))
			ws.on("message", message => {
				console.log("CLIENT SENT: " +new Uint8Array(message))
			})
		})
		
	}
}

class TheGame {
	constructor() {
		this.sv = new ServerSocket(this)
	}
	
	getSocket() {
		return this.sv
	}
	
}

TheGame = new TheGame()

console.log("SERVER LOAD SUCCESS")