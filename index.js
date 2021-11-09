//Initialize the express 'app' object
let express = require("express");
let app = express();
app.use("/", express.static("public"));
app.use("/", express.static("node_modules"));




//Initialize the actual HTTP server
let http = require("http");
let server = http.createServer(app);
let port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log("Server listening at port: " + port);
});

//Initialize socket.io
let io = require('socket.io');
io = new io.Server(server);
let clients = {};

let fs = require("fs");


//establish call to index.html
app.get("/", (req, res) =>{
    let stream = fs.createReadStream(__dirname + "/public/index.html");
    stream.pipe(res);
});

let players = {};  //id generated by socket, opponent is another id with a symbol X or O
let unmatched; //variable to pair players

// Client connections
io.sockets.on("connection", function(socket){
    let id = socket.id;

    //Add client to socket
    console.log("New client connection. ID", socket.id);
    clients[socket.id] = socket;

    //Diconnect function
    socket.on("disconnect", () =>{
        console.log("Client disconnected. ID: ", socket.id);
        delete clients[socket.id];
        socket.broadcast.emit("clientdisconnect", id);
    });

    //Function to initialize player object
    join(socket);

    //When the current player has an opponent the game can begin. Event game.begin sent to client with the symbol to use
    if (opponentOf(socket)) {
        socket.emit("game.begin", {
            symbol: players[socket.id].symbol
        });

        opponentOf(socket).emit("game.begin",{
            symbol: players[opponentOf(socket).id].symbol
        });
    }

    //Event player moves make.move
    socket.on("make.move", function(data){
        
        //Event move can't be done dure to no opponent
        if(!opponentOf(socket)) {
            return;
        }

        //Validate that the moves can be done
        socket.emit("move.made", data); // Emit for player making the move
        opponentOf(socket).emit("move.made", data); // Emit for opponent
    });

    //Event inform player opponent has left
    socket.on("disconnect", function() {
        if (opponentOf(socket)) {
            opponentOf(socket).emit("opponent.left");
        }
    });
});

function join(socket) {
    players[socket.id] = {
        opponent: unmatched,
        symbol: "X",
        socket: socket
    };

    //Unmatched means contains a socket.id of waiting player
    //then current socket is player 2

    if (unmatched) {
        players[socket.id].symbol = "0";
        players[unmatched].opponent = socket.id;
        unmatched = null;
    } else {
        // If unmatched is not defined, the current player is player 1 and waiting for an opponent
        unmatched = socket.id;
    }
}

//Function provides socket of the opponent
function opponentOf(socket) {
    if (!players[socket.id].opponent) {
        return;
    }
    return players[players[socket.id].opponent].socket;
}