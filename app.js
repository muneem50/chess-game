const express = require("express");
const http = require("http");
const socket = require("socket.io");
const {Chess} =require("chess.js");
const path = require("path");


const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess= new Chess();

let players = {}
let currentPlayer = "w";

// by this we can use ejs
app.set("view engine","ejs")
// we can use image files
app.use(express.static(path.join(__dirname, "public")))

app.get("/", (req,res) => {
    res.render("index",{title:"Chess.com"});
});

io.on("connection", function(uniquesocket){
    console.log("connected");

    // send current board state
    uniquesocket.emit("board", chess.fen());

    if(!players.white){
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }
    else if(!players.black){
        players.black =uniquesocket.id;
        uniquesocket.emit("playerRole","b");

    }
    else{
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on("disconnect", function(){
        if (uniquesocket.id === players.white){
            delete players.white;
        }
        else if(uniquesocket.id === players.black){
            delete players.black;
        }
    });
    // when a player makes a move
    uniquesocket.on("move", (move)=>{
        try{
            // It will check the move of b and w
            // if(chess.turn() === "w" && uniquesocket.id !== players.white) return; 
            // if(chess.turn() === "b" && uniquesocket.id !== players.black) return;
            
            if (chess.turn() === "w" && uniquesocket.id !== players.white) {
                uniquesocket.emit("invalidMove", "It's white's turn!");
                return;
            }
            if (chess.turn() === "b" && uniquesocket.id !== players.black) {
                uniquesocket.emit("invalidMove", "It's black's turn!");
                return;
            }

            const result = chess.move(move);
            if(result){
                currentPlayer = chess.turn();
                io.emit("move",move);
                io.emit("board",chess.fen());
            }
            else{
                console.log("Invalid move",move)
                // uniquesocket.emit("invalidMove",move)
                uniquesocket.emit("invalidMove", "This move is not valid.");
            
            }
        
        }
        catch(err){
            console.log(err);
            // uniquesocket.emit("Invalid move",move)
            uniquesocket.emit("invalidMove", "An unexpected error occurred.");

        }
    })

});


server.listen(3000, () => {
    console.log("server started at port 3000")
})