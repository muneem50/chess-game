const socket = io()
const chess= new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null
let sourceSquare = null
let playerRole = null

const renderBoard = () =>{
// Keep track of players turn
    const turnIndicator = document.querySelector(".turn-indicator");
    turnIndicator.innerText = chess.turn() === 'w' ? "White's turn" : "Black's turn";
    
    const board = chess.board();
// clear the old used board
    boardElement.innerHTML = "";
    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex)=>{
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowindex + squareindex)%2 === 0 ? "light":"dark"
            );

            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if (square){
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black",
                );
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable && playerRole === chess.turn()){
                        draggedPiece = pieceElement;
                        sourceSquare = {row: rowindex, col: squareindex};
                     
                            // Calculate valid moves
                    const validMoves = chess.moves({
                        square: `${String.fromCharCode(97 + sourceSquare.col)}${8 - sourceSquare.row}`,
                        verbose: true,
                    });
                            // Highlight valid squares
                    validMoves.forEach(move => {
                        const targetSquareElement = document.querySelector(
                            `.square[data-row="${8 - move.to[1]}"][data-col="${move.to[0].charCodeAt(0) - 97}"]`);
                        if (targetSquareElement) {
                            targetSquareElement.classList.add("highlight"); // Add highlight class
                        }});
                    e.dataTransfer.setData("text/plain","")   
                };



                });
                pieceElement.addEventListener("dragend", (e)=>{

                    
                    // Clear highlights
                    const highlightedSquares = document.querySelectorAll(".highlight");
                    highlightedSquares.forEach(square => {
                        square.classList.remove("highlight");
                    });


                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);



            }

            squareElement.addEventListener("dragover", function(e){
                e.preventDefault();
            });

            squareElement.addEventListener("drop", function(e){
                e.preventDefault();
                if (draggedPiece){
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
        
                };

                  // Handle move (make sure to clear highlights before processing)
                    const highlightedSquares = document.querySelectorAll(".highlight");
                    highlightedSquares.forEach(square => {
                        square.classList.remove("highlight");
                    });



                handleMove(sourceSquare, targetSquare);
            }
            });
            boardElement.appendChild(squareElement)
        }); 
    });

    if(playerRole === 'b'){
        boardElement.classList.add("flipped");
    }
    else{
        boardElement.classList.remove("flipped");
    }


};

// In board columns=a,b,c,d,e,f,g,h rows= 1,2,3,4,5,6,7,8
const handleMove = (source, target) =>{
    
    const move ={
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q",
    };
 
    socket.emit("move", move);
};


const getPieceUnicode = (piece) =>{
    const unicodePieces = {
    p:    "♙",
    r:  "♖",
    n:  "♘", 
    b:"♗",
    q:"♕",
    k:"♔",
    
    P: "♟ ",
    R:"♜",
    N:"♞",
    B:"♝",
    Q:"♛",
    K:"♚",

    };
    return unicodePieces[piece.type] || "";
}

socket.on("invalidMove", (message) => {
    message="Invalid Move"
    alert(message); // Show a message for invalid moves
    renderBoard(); // Optionally, re-render the board
});






socket.on("playerRole", function(role){
    playerRole = role;
    renderBoard();
});
socket.on("spectatorRole",function(){
    playerRole= null;
    renderBoard();
});
socket.on("boardState",function(fen){
    // load is use to load next state 
    chess.load(fen);
    renderBoard();
});


socket.on("move",function(move){
    // load is use to load next state 
    chess.move(move);
    renderBoard();

    // Check for checkmate
    if (chess.in_checkmate()) {
        const winner = chess.turn() === 'w' ? "Black" : "White";
        alert(`${winner} wins by checkmate!`);
        // Optionally, you can disable further moves or reset the game
        // socket.emit("resetGame"); // Uncomment if you have a reset game feature
    }
});
renderBoard();