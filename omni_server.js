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
			ws.send(new Uint8Array([0,1,2,3,4,5,255]))
			ws.on("message", message => {
				console.log("CLIENT SENT: " +message)
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