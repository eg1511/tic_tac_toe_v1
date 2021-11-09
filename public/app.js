//Open and connect socket
let url = window.location.origin;
let socket = io.connect(url);

let myTurn = true;
let symbol;

let playerScore = 0;
let opponentScore = 0;


function getBoardState() {
    /* Object refers to an attribute (r0c0, r0c1...) and the "X" or "O" value. */
    let obj = {};
    $(".board button").each(function() {
        obj[$(this).attr("id")] = $(this).text() || "";
    });

    return obj;
}

function gameTied() {
    var state = getBoardState();

    if( 
        state.r0c0 !== "" &&
        state.r0c1 !== "" &&
        state.r0c2 !== "" &&
        state.r1c0 !== "" &&
        state.r1c1 !== "" &&
        state.r1c2 !== "" &&
        state.r2c0 !== "" &&
        state.r2c1 !== "" &&
        state.r2c2 !== ""
    ) {
        return true;
    }
}

function isGameOver() {
    let state = getBoardState();
    let matches = ["XXX", "OOO"]; // This are the string to be declared when the match is over

    // Combinations when win is possible
    let rows = [
        state.r0c0 + state.r0c1 + state.r0c2, //1st line
        state.r1c0 + state.r1c1 + state.r1c2, //2nd line
        state.r2c0 + state.r2c1 + state.r2c2, //3rd line
        state.r0c0 + state.r1c0 + state.r2c0, //1st column
        state.r0c1 + state.r1c1 + state.r2c1, //2nd column
        state.r0c2 + state.r1c2 + state.r2c2, //3rd column
        state.r0c0 + state.r1c1 + state.r2c2, // first diagonal
        state.r0c2 + state.r1c1 + state.r2c0, // second diagonal
    ];

    //Loop through all the rows looking for a match
    for (var i = 0; i< rows.length; i++){
        if (rows[i] === matches[0] || rows[i] === matches[1]) {
            return true;
        }
    }

    return false;

}

function renderTurnMessage() {
    if(!myTurn) {
        $("#message").text("Your opponent's turn");
        $(".board button").attr("disabled", true);
    } else {
        $("#message").text("Your turn.");
        $(".board button").removeAttr("disabled");
    }
}

//TO REVIEW
function makeMove(e) {
    if (!myTurn) {
        return; // Shouldn't happen since the board is disabled
    }

    if ($(this).text().length) {
        return; // If cell is already checked
    }

    socket.emit("make.move", { // Valid move (on client side) -> emit to server
        symbol: symbol,
        position: $(this).attr("id")
    });
}

// Bind event on players move
socket.on("move.made", function(data) {
    $("#" + data.position).text(data.symbol); // Render move

    // If the symbol of the last move was the same as the current player
    // means that now is opponent's turn
    myTurn = data.symbol !== symbol;

    // If game isn't over show who's turn is this
    if (!isGameOver()) { 
        if (gameTied()) {
            $("#message").text("Game Drawn!");
            $(".board button").attr("disabled", true); // Disable board
            console.log ("Opponent Score:" + opponentScore);
            console.log ("Player Score:" + playerScore);
        } else {
        renderTurnMessage();
        }
    } else { // Else show win/lose message
        if (myTurn) {
            $("#message").text("You lost.");
            opponentScore++;
            console.log (opponentScore.data);
            console.log (playerScore.data);
            // updateScores(playerScore, opponentScore);
        } else {
            $("#message").text("You won!");
            playerScore++;
            console.log (playerScore);
            console.log (opponentScore);
        }

        $(".board button").attr("disabled", true); // Disable board
    }
});


// Bind event for game begin
socket.on("game.begin", function(data) {
    symbol = data.symbol; // The server is assigning the symbol
    myTurn = symbol === "X"; // 'X' starts first
    renderTurnMessage();
});


// Bind on event for opponent leaving the game
socket.on("opponent.left", function() {
    $("#message").text("Your opponent left the game.");
    $(".board button").attr("disabled", true);
});

// Binding buttons on the board
$(function() {
  $(".board button").attr("disabled", true); // Disable board at the beginning
  $(".board> button").on("click", makeMove);
});

//Restart
$("#restartGame").click(function() {
    window.location.reload(true);
})

// //Update score
// function updateScores(playerScore, opponentScore) {
// 	document.querySelector("#score #pScore").innerHTML = playerScore;
// 	document.querySelector("#score #oScore").innerHTML = opponentScore;	
// }

window.addEventListener("load", () =>{
    let pScore = playerScore; 
    let oScore = opponentScore;

    let scorePlayer = document.createElement("p");
    scorePlayer.innerHTML = pScore;
    let scoreoPlayer = document.createElement("p");
    scoreoPlayer.innerHTML = oScore;

    let containerDiv = document.getElementById("pScore");
    let containeroDiv = document.getElementById("oScore");
    containerDiv.append(scorePlayer);
    containeroDiv.append(scoreoPlayer);

    scorePlayer.setAttribute("class", "score"); 

    })
