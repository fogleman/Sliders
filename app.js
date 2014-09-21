// CONSTANTS
var COLORS = [
    "#e1283f",
    "#eb7e28",
    "#5fd14e",
    "#3995cc",
    "#4438c5",
];

var EXTRA = "#7a787d";
var SELECTED = "#fabe0a";

var WALL_SIZE = 0.1;
var LINE_SIZE = 0.01;
var LEVEL_TRANSITION = 600;

var UP = {dx: 0, dy: -1};
var DOWN = {dx: 0, dy: 1};
var LEFT = {dx: -1, dy: 0};
var RIGHT = {dx: 1, dy: 0};

var DIRECTIONS = [UP, DOWN, LEFT, RIGHT];

var ARROW_KEYS = {
    37: LEFT,
    38: UP,
    39: RIGHT,
    40: DOWN
};


// Level
function Level(number) {
    // level data
    var data = LEVELS[number - 1];
    this.width = data.width;
    this.height = data.height;
    this.goal = data.goal;
    this.walls = data.walls ? data.walls.slice() : [];
    this.pieces = data.pieces ? data.pieces.slice() : [];
    this.targets = data.targets ? data.targets.slice() : [];
    this.hands = data.hands ? data.hands.slice() : [];
    this.shape = data.shape ? data.shape.slice() : undefined;
    this.info = data.info ? data.info : "";
    // other members
    this.number = number;
    this.selection = 0;
    this.moves = 0;
    this.stack = [];
    this.walls = this.walls.concat(this.wallsFromShape());
    console.log(this);
}

Level.prototype.xy = function(index) {
    var x = index % this.width;
    var y = Math.floor(index / this.width);
    return {x: x, y: y};
}

Level.prototype.index = function(x, y) {
    if (x < 0 || x >= this.width) {
        return undefined;
    }
    if (y < 0 || y >= this.height) {
        return undefined;
    }
    return y * this.width + x;
}

Level.prototype.neighbor = function(index, direction) {
    var point = this.xy(index);
    var x = point.x + direction.dx;
    var y = point.y + direction.dy;
    if (x < 0 || x >= this.width) {
        return undefined;
    }
    if (y < 0 || y >= this.height) {
        return undefined;
    }
    return this.index(x, y);
}

Level.prototype.direction = function(a, b) {
    a = this.xy(a);
    b = this.xy(b);
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    return {dx: dx, dy: dy};
}

Level.prototype.distance = function(a, b) {
    a = this.xy(a);
    b = this.xy(b);
    var dx = Math.abs(a.x - b.x);
    var dy = Math.abs(a.y - b.y);
    return dx + dy;
}

Level.prototype.wallsFromShape = function() {
    var walls = [];
    for (var y = 0; y < this.height; y++) {
        for (var x = 0; x < this.width; x++) {
            var index = this.index(x, y);
            if (this.checkShape(index)) {
                continue;
            }
            for (var i = 0; i < 4; i++) {
                var direction = DIRECTIONS[i];
                var neighbor = this.neighbor(index, direction);
                if (neighbor && this.checkShape(neighbor)) {
                    walls.push([index, neighbor])
                }
            }
        }
    }
    return walls;
}

Level.prototype.checkShape = function(index) {
    if (this.shape === undefined) {
        return true;
    }
    var point = this.xy(index);
    return this.shape[point.y].charCodeAt(point.x) !== 46;
}

Level.prototype.hasWall = function(index, direction) {
    var neighbor = this.neighbor(index, direction);
    if (neighbor === undefined) {
        return true;
    }
    for (var i = 0; i < this.walls.length; i++) {
        var wall = this.walls[i];
        if (wall[0] === index && wall[1] === neighbor) {
            return true;
        }
        if (wall[0] === neighbor && wall[1] === index) {
            return true;
        }
    }
    return false;
}

Level.prototype.hasPiece = function(index, direction) {
    var neighbor = this.neighbor(index, direction);
    if (neighbor === undefined) {
        return false;
    }
    for (var i = 0; i < this.pieces.length; i++) {
        if (this.pieces[i] === neighbor) {
            return true;
        }
    }
    return false;
}

Level.prototype.hasHand = function(index) {
    for (var i = 0; i < this.hands.length; i++) {
        if (this.hands[i] === index) {
            return true;
        }
    }
    return false;
}

Level.prototype.computeMove = function(piece, direction) {
    var index = this.pieces[piece];
    var start = index;
    while (true) {
        if (this.hasWall(index, direction)) {
            break;
        }
        if (this.hasPiece(index, direction)) {
            break;
        }
        index = this.neighbor(index, direction);
        if (this.hasHand(index)) {
            break;
        }
    }
    return index !== start ? index : undefined;
}

Level.prototype.canMove = function(piece, direction) {
    return this.computeMove(piece, direction) !== undefined;
}

Level.prototype.doMove = function(piece, direction) {
    var index = this.computeMove(piece, direction);
    if (index === undefined) {
        return;
    }
    this.stack.push({
        piece: piece,
        src: this.pieces[piece],
        dst: index
    });
    this.pieces[piece] = index;
    this.moves++;
}

Level.prototype.undoMove = function() {
    if (this.stack.length == 0) {
        return undefined;
    }
    var move = this.stack.pop();
    this.pieces[move.piece] = move.src;
    this.moves--;
    return move;
}

Level.prototype.complete = function() {
    for (var i = 0; i < this.targets.length; i++) {
        if (this.pieces[i] !== this.targets[i]) {
            return false;
        }
    }
    return true;
}

Level.prototype.pieceAt = function(index) {
    for (var i = 0; i < this.pieces.length; i++) {
        if (this.pieces[i] === index) {
            return i;
        }
    }
    return undefined;
}

Level.prototype.nextSelection = function(previous) {
    var n = previous ? this.pieces.length - 1 : 1;
    this.selection = (this.selection + n) % this.pieces.length;
    return this.selection;
}


// LevelView
function LevelView(parent, level, drag) {
    this.level = level;
    this.drag = drag;
    this.pieces = [];
    this.targets = [];
    this.hands = [];
    this.selection = null;
    this.root = null;
    this.board = null;
    this.createLevel(parent);
}

LevelView.prototype.createCellLabels = function(parent) {
    var level = this.level;
    var n = level.width * level.height;
    for (var i = 0; i < n; i++) {
        var point = level.xy(i);
        parent.append("text")
            .attr("x", point.x + 0.5)
            .attr("y", point.y + 0.58)
            .attr("fill", "#999")
            .attr("text-anchor", "middle")
            .attr("font-size", 0.25)
            .attr("font-weight", "lighter")
            .text(i)
            ;
    }
}

LevelView.prototype.createWall = function(parent, index, direction) {
    var point = this.level.xy(index);
    var x = point.x + direction.dx * 0.5 + 0.5;
    var y = point.y + direction.dy * 0.5 + 0.5;
    var dx = Math.abs(direction.dy) * 0.5;
    var dy = Math.abs(direction.dx) * 0.5;
    parent.append("line")
        .attr("x1", x - dx)
        .attr("y1", y - dy)
        .attr("x2", x + dx)
        .attr("y2", y + dy)
        .attr("stroke", "black")
        .attr("stroke-width", WALL_SIZE)
        .attr("stroke-linecap", "round")
        ;
}

LevelView.prototype.createBoard = function(parent) {
    var level = this.level;
    var background = parent.append("g");
    for (var y = 0; y < level.height; y++) {
        for (var x = 0; x < level.width; x++) {
            if (!level.checkShape(level.index(x, y))) {
                continue;
            }
            background.append("rect")
                .attr("x", x)
                .attr("y", y)
                .attr("width", 1)
                .attr("height", 1)
                .attr("fill", "white")
                ;
        }
    }
    var grid = parent.append("g");
    for (var y = 0; y < level.height; y++) {
        for (var x = 0; x < level.width; x++) {
            if (!level.checkShape(level.index(x, y))) {
                continue;
            }
            grid.append("rect")
                .attr("x", x)
                .attr("y", y)
                .attr("width", 1)
                .attr("height", 1)
                .attr("fill", "none")
                .attr("stroke", "#7a787d")
                .attr("stroke-width", LINE_SIZE)
                .attr("opacity", 0.25)
                ;
        }
    }
    for (var y = 0; y < level.height; y++) {
        for (var x = 0; x < level.width; x++) {
            var index = level.index(x, y);
            if (!level.checkShape(index)) {
                continue;
            }
            for (var i = 0; i < 4; i++) {
                var direction = DIRECTIONS[i];
                if (level.neighbor(index, direction) === undefined) {
                    this.createWall(parent, index, direction);
                }
            }
        }
    }
    for (var i = 0; i < level.walls.length; i++) {
        var wall = level.walls[i];
        var direction = level.direction(wall[0], wall[1]);
        this.createWall(parent, wall[0], direction);
    }
}

LevelView.prototype.createSelection = function(parent, index) {
    var point = this.level.xy(index);
    var selection = parent.append("g");
    selection.append("circle")
        .attr("cx", 0.5)
        .attr("cy", 0.5)
        .attr("r", 0.42)
        .attr("fill", SELECTED)
        .attr("opacity", 0.5)
        ;
    selection
        .attr("transform", "translate(" + point.x + "," + point.y + ")")
        ;
    return selection;
}

LevelView.prototype.createPiece = function(parent, index, color) {
    var point = this.level.xy(index);
    var piece = parent.append("g");
    piece.append("circle")
        .attr("cx", 0.5)
        .attr("cy", 0.5)
        .attr("r", 0.35)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("stroke-width", 0.05)
        ;
    piece.append("circle")
        .attr("cx", 0.5)
        .attr("cy", 0.5)
        .attr("r", 0.275)
        .attr("fill", color)
        ;
    piece
        .attr("transform", "translate(" + point.x + "," + point.y + ")")
        ;
    piece.call(this.drag);
    return piece;
}

LevelView.prototype.createTarget = function(parent, index, color) {
    var point = this.level.xy(index);
    var target = parent.append("g");
    for (var r = 0.25; r > 0; r -= 0.125) {
        target.append("circle")
            .attr("cx", 0.5)
            .attr("cy", 0.5)
            .attr("r", r)
            .attr("fill", "white")
            .attr("stroke", color)
            .attr("stroke-width", 0.08)
            ;
    }
    target
        .attr("transform", "translate(" + point.x + "," + point.y + ")")
        ;
    return target;
}

LevelView.prototype.createHand = function(parent, index) {
    var point = this.level.xy(index);
    var hand = parent.append("g");
    hand.append("path")
        .attr("fill", "#333")
        .attr("d", "m 538.85352,405.667 c -16.677,-3.849 -32.306,-34.462 -58.104,-61.966 l 0,58.093 0,28.774 0,158.262 c 0,13.448 -10.901,24.35 -24.349,24.35 l -2.663,0 c -13.448,0 -24.35,-10.902 -24.35,-24.35 l 0,-158.262 -10.436,0 0,209.292 c 0,13.448 -10.902,24.349 -24.35,24.349 l -2.665,0 c -13.448,0 -24.349,-10.901 -24.349,-24.349 l 0,-209.292 -8.124,0 0,177.69 c 0,13.448 -10.902,24.349 -24.35,24.349 l -2.664,0 c -13.449,0 -24.35,-10.901 -24.35,-24.349 l 0,-177.69 -6.641,0 0,130.04 c 0,13.449 -10.901,24.35 -24.349,24.35 l -2.665,0 c -13.447,0 -24.349,-10.901 -24.349,-24.35 l 0,-130.04 -0.099,0 0,-172.65 c 0,0 0,-102.927 115.378,-102.927 71.961,0 102.437,33.608 111.897,56.55 0.084,0.147 71.552,124.971 86.483,153.73 14.942,28.775 -3.32,45.375 -24.901,40.396")
        ;
    var scale = 1 / 1024;
    hand
        .attr("transform", "translate(" + point.x + "," + point.y + ") translate(0.6 0.4) scale(" + -scale + " " + scale + ") rotate(180) translate(-512 -512)")
        ;
    return hand;
}

LevelView.prototype.createInfo = function(parent) {
    var info = parent.append("g");
    info.append("text")
        .attr("x", this.level.width / 2)
        .attr("y", this.level.height + 0.5)
        .attr("font-size", 0.25)
        .attr("fill", "#333")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .text(this.level.info)
        ;
    return info;
}

LevelView.prototype.createLevel = function(parent) {
    var level = this.level;
    var w = level.width + 1;
    var h = level.height + 2;
    parent
        .transition()
        .delay(LEVEL_TRANSITION / 2)
        .duration(0)
        .attr("viewBox", "-0.5 -1 " + w + " " + h);
    var root = parent.append("g");
    var board = root.append("g");
    this.createBoard(board);
    if (SHOW_LABELS) {
        this.createCellLabels(board);
    }
    for (var i = 0; i < level.hands.length; i++) {
        var index = level.hands[i];
        var hand = this.createHand(board, index);
        this.hands.push(hand);
    }
    for (var i = 0; i < level.targets.length; i++) {
        var index = level.targets[i];
        var color = COLORS[i];
        var target = this.createTarget(board, index, color);
        this.targets.push(target);
    }
    this.selection = this.createSelection(board, level.pieces[0]);
    for (var i = 0; i < level.pieces.length; i++) {
        var index = level.pieces[i];
        var color = i < level.targets.length ? COLORS[i] : EXTRA;
        var piece = this.createPiece(board, index, color);
        piece.datum(i);
        this.pieces.push(piece);
    }
    this.createInfo(board);
    this.root = root;
    this.board = board;
}

LevelView.prototype.slideIn = function(reverse) {
    var x = reverse ? -20 : 20;
    this.root
        .attr("transform", "translate(" + x + ", 0)");
    this.root
        .transition()
        .duration(LEVEL_TRANSITION)
        .attr("transform", "translate(0, 0)");
        ;
}

LevelView.prototype.slideOut = function(reverse) {
    var x = reverse ? 20 : -20;
    this.root
        .attr("transform", "translate(0, 0)");
    this.root
        .transition()
        .duration(LEVEL_TRANSITION)
        .attr("transform", "translate(" + x + ", 0)")
        .remove()
        ;
}

LevelView.prototype.setSelection = function(piece) {
    var index = this.level.pieces[piece];
    var point = this.level.xy(index);
    this.selection
        .attr("transform", "translate(" + point.x + "," + point.y + ")");
}

LevelView.prototype.doMove = function(piece, a, b) {
    var n = this.level.distance(a, b);
    var point = this.level.xy(b);
    var views = [this.pieces[piece]];
    if (piece === this.level.selection) {
        views.push(this.selection);
    }
    for (var i = 0; i < views.length; i++) {
        var view = views[i];
        view
            .transition()
            .ease("quad-in-out")
            .duration(100 + 100 * n)
            .attr("transform", "translate(" + point.x + "," + point.y + ")")
            ;
    }
}

LevelView.prototype.doWin = function() {
    this.board
        .transition()
        .delay(500)
        .duration(0)
        .attr("opacity", 0.4)
        ;
    this.root.append("text")
        .attr("x", this.level.width / 2)
        .attr("y", this.level.height / 2)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 0)
        .attr("stroke-linejoin", "round")
        .attr("text-anchor", "middle")
        .attr("font-size", 0)
        .text("Win!")
        .transition()
        .delay(500)
        .duration(500)
        .ease("bounce")
        .attr("font-size", 3)
        .attr("stroke-width", 0.1)
        .attr("y", this.level.height / 2 + 1)
        ;
    this.root.append("text")
        .attr("x", this.level.width / 2)
        .attr("y", this.level.height / 2)
        .attr("fill", COLORS[3])
        .attr("text-anchor", "middle")
        .attr("font-size", 0)
        .text("Win!")
        .transition()
        .delay(500)
        .duration(500)
        .ease("bounce")
        .attr("font-size", 3)
        .attr("y", this.level.height / 2 + 1)
        ;
}


// Controller
function Controller(parent) {
    var view = d3.select("#view");
    view.attr("preserveAspectRatio", "xMidYMid meet");
    view.attr("viewBox", "-1 -1 9 9");
    this.bindEvents();
    this.onHashChange();
}

Controller.prototype.bindEvents = function() {
    var view = d3.select("#view");
    var body = d3.select("body");
    var self = this;
    d3.select(window).on("hashchange", function() {
        self.onHashChange();
    });
    body.on("keydown", function() {
        var code = d3.event.keyCode;
        if (d3.event.ctrlKey || d3.event.altKey || d3.event.metaKey) {
            return;
        }
        else if (code === 9) { // tab
            self.nextSelection(d3.event.shiftKey);
        }
        else if (d3.event.shiftKey) {
            return;
        }
        else if (code == 85) { // U
            self.undoMove();
        }
        else if (code == 82) { // R
            self.restartLevel();
        }
        else if (code === 80) { // P
            self.nextLevel(true);
        }
        else if (code === 78) { // N
            self.nextLevel(false);
        }
        else if (ARROW_KEYS.hasOwnProperty(code)) {
            var direction = ARROW_KEYS[code];
            self.moveSelectedPiece(direction);
        }
        else {
            return;
        }
        d3.event.preventDefault();
    });
    this.dragData = {};
    this.drag = d3.behavior.drag()
        .on("dragstart", function() {
            d3.event.sourceEvent.stopPropagation();
            var i = d3.select(this).datum();
            self.dragData[i] = {
                start: null,
                end: null
            };
            self.levelView.setSelection(i);
            self.level.selection = i;
        })
        .on("drag", function() {
            var i = d3.select(this).datum();
            var point = {x: d3.event.x, y: d3.event.y};
            self.dragData[i].start = self.dragData[i].start || point;
            self.dragData[i].end = point;
        })
        .on("dragend", function() {
            var i = d3.select(this).datum();
            var start = self.dragData[i].start;
            var end = self.dragData[i].end;
            delete self.dragData[i];
            if (start === null || end === null) {
                return;
            }
            var dx = end.x - start.x;
            var dy = end.y - start.y;
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d < 0.1) {
                return;
            }
            if (Math.abs(dx) > Math.abs(dy)) {
                dx = dx < 0 ? -1 : 1;
                dy = 0;
            }
            else {
                dy = dy < 0 ? -1 : 1;
                dx = 0;
            }
            direction = {dx: dx, dy: dy};
            self.movePiece(i, direction);
        })
        ;
}

Controller.prototype.setLabels = function() {
    var best = this.getBest(this.level.number);
    if (best === 0) {
        best = "-";
    }
    else {
        var delta = best - this.level.goal;
        if (delta === 0) {
            best = '<span class="glyphicon glyphicon-star"></span>';
        }
        else {
            best = "+" + delta;
        }
    }
    d3.select("#label-level").text(this.level.number);
    d3.select("#label-goal").text(this.level.goal);
    d3.select("#label-best").html(best);
    d3.select("#label-moves").text(this.level.moves);
}

Controller.prototype.loadLevel = function(number) {
    var old = this.levelView;
    var reverse = false;
    if (old) {
        if (old.level.number > number) {
            reverse = true;
        }
        old.slideOut(reverse);
    }
    var view = d3.select("#view");
    this.level = new Level(number);
    this.levelView = new LevelView(view, this.level, this.drag);
    this.levelView.slideIn(reverse);
    this.setLabels();
}

Controller.prototype.restartLevel = function() {
    this.loadLevel(this.level.number);
}

Controller.prototype.nextLevel = function(previous) {
    var n = previous ? -1 : 1;
    var number = this.level.number + n;
    number = Math.max(1, number);
    number = Math.min(LEVELS.length, number);
    window.location.hash = "" + number;
}

Controller.prototype.onHashChange = function() {
    number = parseInt(window.location.hash.substring(1));
    number = isNaN(number) ? 1 : number;
    this.loadLevel(number);
}

Controller.prototype.nextSelection = function(previous) {
    var selection = this.level.nextSelection(previous);
    this.levelView.setSelection(selection);
}

Controller.prototype.undoMove = function() {
    var move = this.level.undoMove();
    if (move !== undefined) {
        this.levelView.doMove(move.piece, move.dst, move.src);
    }
    this.setLabels();
}

Controller.prototype.movePiece = function(piece, direction) {
    if (!this.level.canMove(piece, direction)) {
        return;
    }
    var a = this.level.pieces[piece];
    var b = this.level.computeMove(piece, direction);
    this.level.doMove(piece, direction);
    this.levelView.doMove(piece, a, b);
    if (this.level.complete()) {
        this.onComplete();
    }
    this.setLabels();
}

Controller.prototype.moveSelectedPiece = function(direction) {
    var piece = this.level.selection;
    this.movePiece(piece, direction);
}

Controller.prototype.getBest = function(number) {
    var key = "best" + number;
    var moves = parseInt(localStorage[key]);
    moves = isNaN(moves) ? 0 : moves;
    return moves;
}

Controller.prototype.setBest = function(number, moves) {
    var best = this.getBest(number);
    if (best !== 0 && best <= moves) {
        return;
    }
    var key = "best" + number;
    localStorage[key] = moves;
}

Controller.prototype.onComplete = function() {
    this.setBest(this.level.number, this.level.moves);
    this.levelView.doWin();
    var self = this;
    setTimeout(function() {
        self.nextLevel();
    }, 2000);
}

var controller = new Controller();

function menuUndo() {
    controller.undoMove();
}

function menuRestart() {
    controller.restartLevel();
}

function menuLevels() {
}

function menuPrevious() {
    controller.nextLevel(true);
}

function menuNext() {
    controller.nextLevel(false);
}

function menuAbout() {
}
