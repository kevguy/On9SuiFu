var game = new Reversi();

var state = 0;

exports.printBoard = function() {
	game.printBoard();
}

exports.Main = function() {
	game.setBlack(new Human("X"));
	game.getBlack().setSymbol("X");
	game.setWhite(new Human("O"));
	game.getWhite().setSymbol("O");
	game.getBlack().setReversi(game);
	game.getWhite().setReversi(game);
	game.setTurn( game.getBlack() );

	// game.startGame();
}

exports.getBoard=function(){
	return game.getBoard();
}

exports.createHuman = function(piece) {
	var human = new Human(piece);
	return human;
}

exports.getTurn = function() {
	return game.getTurn();
}

exports.nextMove = function(row, col) {
	game.printBoard();

	// var state = 0;

	var pos = [row, col];
	// while ( this.boardIsFull() == 0 ) {
		// pos = this.getTurn().nextMove();
		// var row = pos[0];
		// var col = pos[1];
		// print "Player [X|O] places to row $row, col $col\n";

		if ( game.moveIsValid(pos) == 0 ) {
			// This player's round will be "passed" to the opponent

			// print "Row $row, Col $col is invalid! ";
			// print "Player [X|O] passed!\n";

			// Change state
			if (state == 0) {
				state = 1;
			} else if (state == 1) {
				state = 2;
			}

			if (state == 2) {
				// break;
				game.gameEnd();
			}
		} else {

			// Change state
			if (state == 1) {
				state = 0;
			}

			// Update the board by flipping all relevant pieces
			var board = game.getBoard();

			var mySymbol;
			var otherSymbol;
			if ( game.getTurn().getSymbol() == 'X' ) {
				mySymbol = 1;
				otherSymbol = 2;
			} else if ( game.getTurn().getSymbol() == 'O' ) {
				mySymbol = 2;
				otherSymbol = 1;
			}

			var tilesToFlip = [];

			var directions = [
				[0, 1,],	// up
				[1, 1,],	// up right
				[1, 0,],	// right
				[1, -1],	// down right
				[0, -1],	// down
				[-1, -1],	// down left
				[-1, 0],	// left
				[-1, 1],	// up left
			];

			var direction;
			var xDirection;
			var yDirection;
			var x;
			var y;
			var i;
			for (i = 0; i < directions.length; i++) {
				xDirection = directions[i][0];
				yDirection = directions[i][1];

				x = row;
				y = col;
				x = parseInt(x) + parseInt(xDirection);
				y = parseInt(y) + parseInt(yDirection);

				if ( game.isOutOfRange(x, y) == 0 
						&& board[x][y] == otherSymbol) {

					// There is a piece belonging to the other player next to our piece
					x = parseInt(x) + parseInt(xDirection);
					y = parseInt(y) + parseInt(yDirection);
					if ( game.isOutOfRange(x, y) ) {
						continue;
					}

					while (board[x][y] == otherSymbol) {
						x = parseInt(x) + parseInt(xDirection);
						y = parseInt(y) + parseInt(yDirection);

						// Break out of while loop,
						// Then continue in for loop
						if ( game.isOutOfRange(x, y) ) {
							break;
						}
					}

					if ( game.isOutOfRange(x, y) ) {
						continue;
					}

					if (board[x][y] == mySymbol) {
						// There is pieces to flip over
						// Go in the reverse direction until we reach the original space
						// nothing all the tiles along the way
						while (1) {
							x = parseInt(x) - parseInt(xDirection);
							y = parseInt(y) - parseInt(yDirection);
							if (x == row && y == col) {
								break;
							}

							tilesToFlip.push( [x, y] );
						}
					}
				}
			}

			var tile;
			for (i = 0; i< tilesToFlip.length; i++) {
				board[ tilesToFlip[i][0] ][ tilesToFlip[i][1] ] = mySymbol;
			}

			board[row][col] = mySymbol;
		}

		game.printBoard();
		game.toggleTurn();
	// }

	if ( game.boardIsFull() ) {
		game.gameEnd();
	}
}

Reversi.prototype.gameEnd = function() {
	
	// Game end
	var countBlack = this.countPiece(1);
	var countWhite = this.countPiece(2);
	if (countBlack > countWhite) {
		// Black wins
		console.log("Player X wins!");
	} else if (countBlack < countWhite) {
		// White wins
		console.log("Player O wins!");
	} else if (countBlack == countWhite) {
		// Draws
		console.log("Draw game!");
	}
}

exports.printBoard = function() {
	game.printBoard();
}

// Class Reversi
// This class models the Reversi game
function Reversi(playerX, playerO) {

	// Initialize board
	this.board = [
		//0  1  2  3  4  5  6  7
		[ 0, 0, 0, 0, 0, 0, 0, 0, ], // 0
		[ 0, 0, 0, 0, 0, 0, 0, 0, ], // 1
		[ 0, 0, 0, 0, 0, 0, 0, 0, ], // 2
		[ 0, 0, 0, 2, 1, 0, 0, 0, ], // 3
		[ 0, 0, 0, 1, 2, 0, 0, 0, ], // 4
		[ 0, 0, 0, 0, 0, 0, 0, 0, ], // 5
		[ 0, 0, 0, 0, 0, 0, 0, 0, ], // 6
		[ 0, 0, 0, 0, 0, 0, 0, 0, ], // 7
	];
	
	// print "Player X is Human\n";
	// var playerX = new Human("X");
	// var playerX = playerX;
	// this.black = playerX;
	// print "Player O is Human\n";
	// var playerO = new Human("O");
	// var playerO = playerO;
	// this.white = playerO;

	// Association
	// this.black.setReversi(this);
	// this.white.setReversi(this);

	// Player X takes the first turn
	// this.turn = this.black;
}

Reversi.prototype.setBoard = function(board) {
	this.board = board;
}

Reversi.prototype.getBoard = function() {
	return this.board;
}

Reversi.prototype.setBlack = function(black) {
	this.black = black;
}

Reversi.prototype.getBlack = function() {
	return this.black;
}

Reversi.prototype.setWhite = function(white) {
	this.white = white;
}

Reversi.prototype.getWhite = function() {
	return this.white;
}

Reversi.prototype.setTurn = function(turn) {
	this.turn = turn;
}

Reversi.prototype.getTurn = function() {
	return this.turn;
}

Reversi.prototype.toggleTurn = function() {
	if ( this.getTurn() == this.getBlack() ) {
		this.setTurn( this.getWhite() );
	} else if ( this.getTurn() == this.getWhite() ) {
		this.setTurn( this.getBlack() );
	}
}

Reversi.prototype.countPiece = function(piece) {
	var count = 0;
	var board = this.getBoard();
	var row;
	var col;
	for (row = 0; row < 8; row++) {
		for (col = 0; col < 8; col++) {
			if (board[row][col] == piece) {
				count++;
			}
		}
	}
	return count;
}

Reversi.prototype.isOutOfRange = function(row, col) {
	var ourOfRange = 0;

	if (row < 0 || row > 7) {
		ourOfRange = 1;
	} else if (col < 0 || col > 7) {
		ourOfRange = 1;
	}

	return ourOfRange;
}

Reversi.prototype.moveIsValid = function(pos) {
	var row = pos[0];
	var col = pos[1];

	var isValid = 1;

	// Out of range
	if ( this.isOutOfRange(row, col) ) {
		console.log("NOT valid: Out of range");
		return 0;
	}

	// Already occupied
	var board = this.getBoard();
	// console.log("board[" + row + "][" + col + "] = " + board[row][col]);
	if (board[row][col] == 1
			|| board[row][col] == 2) {
		console.log("NOT valid: Already occupied");
		return 0;
	}

	// Cannot flip any opponent's pieces
	var mySymbol;
	var otherSymbol;
	console.log( "this.getTurn() == this.getBlack() = " + (this.getTurn() == this.getBlack() ) );
	console.log( "this.getTurn() == this.getWhite() = " + (this.getTurn() == this.getWhite() ) );
	console.log( "this.getTurn().getSymbol() = " + this.getTurn().getSymbol() );
	if ( this.getTurn().getSymbol() == 'X' ) {
		mySymbol = 1;
		otherSymbol = 2;
	} else if ( this.getTurn().getSymbol() == 'O' ) {
		mySymbol = 2;
		otherSymbol = 1;
	}
	console.log("my symbol = " + mySymbol);
	console.log("other symbol = " + otherSymbol);

	var tilesToFlip = [];

	var directions = [
		[0, 1,],	// up
		[1, 1,],	// up right
		[1, 0,],	// right
		[1, -1],	// down right
		[0, -1],	// down
		[-1, -1],	// down left
		[-1, 0],	// left
		[-1, 1],	// up left
	];

	var direction;
	var xDirection;
	var yDirection;
	var x;
	var y;
	var i;
	for (i = 0; i < directions.length; i++) {
		xDirection = directions[i][0];
		yDirection = directions[i][1];

		x = row;
		y = col;
		x = parseInt(x) + parseInt(xDirection);
		y = parseInt(y) + parseInt(yDirection);
		console.log("row = " + row);
		console.log("col = " + col);
		console.log("x = " + x);
		console.log("y = " + y);
		console.log("x direction = " + xDirection);
		console.log("y direction = " + yDirection);

		console.log("board[" + x + "][" + y + "] = " + board[x][y]);
		if ( this.isOutOfRange(x, y) == 0 
				&& board[x][y] == otherSymbol) {

			// There is a piece belonging to the other player next to our piece
			x = parseInt(x) + parseInt(xDirection);
			y = parseInt(y) + parseInt(yDirection);
			if ( this.isOutOfRange(x, y) ) {
				continue;
			}

			while (board[x][y] == otherSymbol) {
				x = parseInt(x) + parseInt(xDirection);
				y = parseInt(y) + parseInt(yDirection);

				// Break out of while loop,
				// Then continue in for loop
				if ( this.isOutOfRange(x, y) ) {
					break;
				}
			}

			if ( this.isOutOfRange(x, y) ) {
				continue;
			}

			if (board[x][y] == mySymbol) {
				// There is pieces to flip over
				// Go in the reverse direction until we reach the original space
				// nothing all the tiles along the way
				while (1) {
					x = parseInt(x) - parseInt(xDirection);
					y = parseInt(y) - parseInt(yDirection);
					if (x == row && y == col) {
						break;
					}

					tilesToFlip.push( [x, y] );
				}
			}
		}
	}

	// Restore the empty space
	board[row][col] = 0;

	// If no tiles were flipped, this is not a valid move
	if (tilesToFlip.length == 0) {
		console.log("NOT valid: Cannot flip any opponent's pieces");
		return 0;
	}

	return isValid;
}

Reversi.prototype.getValidMoves = function() {
	var validMoves = [];
	var pos = [];
	var row;
	var col;
	for (row = 0; row < 8; row++) {
		for (col = 0; col < 8; col++) {
			pos = [row, col];
			if ( this.moveIsValid(pos) ) {
				validMoves.push( [row, col] );
			}
		}
	}

	return validMoves;
}

Reversi.prototype.boardIsFull = function() {
	var isFull = 0;
	if ( this.countPiece(1) + this.countPiece(2) == 64 ) {
		isFull = 1;
	}
	return isFull;
}

Reversi.prototype.startGame = function() {

}

Reversi.prototype.printBoard = function() {
	var board = this.getBoard();
	var row;
	var col;
	console.log("  0 1 2 3 4 5 6 7");	// col number
	for (row = 0; row < 8; row++) {
		// console.log(row);				// row number
		// console.log(" ");
		/* for (col = 0; col < 8; col++) {
			if (board[row][col] == 0) {
				console.log(".");
			} else if (board[row][col] == 1) {
				console.log("X");
			} else if (board[row][col] == 2) {
				console.log("O");
			}
			console.log(" ");
		} */
		// console.log("\n");
		console.log( row + " " + board[row][0] 
						+ " " + board[row][1]
						+ " " + board[row][2]
						+ " " + board[row][3]
						+ " " + board[row][4]
						+ " " + board[row][5]
						+ " " + board[row][6]
						+ " " + board[row][7] );
	}

	// Player X
	console.log("Player X: " + this.countPiece(1) );
	// Player O
	console.log("Player O: " + this.countPiece(2) );
	console.log(" ");
}
// End of class Reversi

// Class Human
function Human() {
	this.symbol = ".";
}

Human.prototype.setSymbol = function(symbol) {
	this.symbol = symbol;
}

Human.prototype.getSymbol = function() {
	return this.symbol;
}

Human.prototype.setReversi = function(reversi) {
	this.reversi = reversi;
}

Human.prototype.getReversi = function() {
	return this.reversi;
}

Human.prototype.nextMove = function() {
	return [-1, -1];
}
