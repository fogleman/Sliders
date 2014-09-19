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
    _.extend(this, levels[number]);
    this.number = number;
    this.selection = 0;
    this.moves = 0;
    this.stack = [];
    this.walls = this.walls.concat(this.wallsFromShape());
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
function LevelView(parent, level) {
    this.level = level;
    this.pieces = [];
    this.targets = [];
    this.selection = null;
    this.root = null;
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

LevelView.prototype.createLevel = function(parent) {
    var level = this.level;
    var w = level.width + 2;
    var h = level.height + 2;
    parent
        .transition()
        .delay(LEVEL_TRANSITION / 2)
        .duration(0)
        .attr("viewBox", "-1 -1 " + w + " " + h);
    var group = parent.append("g");
    this.createBoard(group);
    // this.createCellLabels(group);
    for (var i = 0; i < level.targets.length; i++) {
        var index = level.targets[i];
        var color = COLORS[i];
        var target = this.createTarget(group, index, color);
        this.targets.push(target);
    }
    this.selection = this.createSelection(group, level.pieces[0]);
    for (var i = 0; i < level.pieces.length; i++) {
        var index = level.pieces[i];
        var color = i < level.targets.length ? COLORS[i] : EXTRA;
        var piece = this.createPiece(group, index, color);
        this.pieces.push(piece);
    }
    this.root = group;
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


// Controller
function Controller(parent) {
    this.bindEvents();
    this.hashChange();
}

Controller.prototype.bindEvents = function() {
    var view = d3.select("#view");
    var body = d3.select("body");
    var self = this;
    d3.select(window).on("hashchange", function() {
        self.hashChange();
    });
    body.on("keydown", function() {
        var code = d3.event.keyCode;
        if (code === 9) { // tab
            d3.event.preventDefault();
            self.nextSelection(d3.event.shiftKey);
        }
        if (code == 85) { // u
            d3.event.preventDefault();
            self.undoMove();
        }
        if (ARROW_KEYS.hasOwnProperty(code)) {
            d3.event.preventDefault();
            var direction = ARROW_KEYS[code];
            self.moveSelectedPiece(direction);
        }
        if (code === 189) { // minus
            d3.event.preventDefault();
            self.nextLevel(true);
        }
        if (code === 187) { // plus
            d3.event.preventDefault();
            self.nextLevel(false);
        }
    });
    view.on("mousedown", function() {
        var point = d3.mouse(this);
        self.mouseDown(point[0], point[1]);
    });
    view.on("mouseup", function() {
        var point = d3.mouse(this);
        self.mouseUp(point[0], point[1]);
    });
    view.on("touchstart", function() {
        var point = d3.touch(this);
        self.mouseDown(point[0], point[1]);
    });
    view.on("touchend", function() {
        var point = d3.touch(this);
        self.mouseUp(point[0], point[1]);
    });
}

Controller.prototype.setLabels = function() {
    d3.select("#label-level").text(this.level.number + 1);
    d3.select("#label-par").text(this.level.par);
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
    this.levelView = new LevelView(view, this.level);
    this.levelView.slideIn(reverse);
    this.drag = null;
    this.setLabels();
}

Controller.prototype.nextLevel = function(previous) {
    var n = previous ? -1 : 1;
    var number = this.level.number + n;
    number = Math.max(0, number);
    number = Math.min(levels.length - 1, number);
    window.location.hash = "" + number;
}

Controller.prototype.hashChange = function() {
    number = parseInt(window.location.hash.substring(1));
    number = isNaN(number) ? 0 : number;
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
    this.setLabels();
}

Controller.prototype.moveSelectedPiece = function(direction) {
    var piece = this.level.selection;
    this.movePiece(piece, direction);
}

Controller.prototype.mouseDown = function(x, y) {
    var index = this.level.index(Math.floor(x), Math.floor(y));
    var piece = this.level.pieceAt(index);
    if (piece !== undefined) {
        this.drag = {x: x, y: y, piece: piece};
        this.levelView.setSelection(piece);
        this.level.selection = piece;
    }
    else {
        this.drag = null;
    }
}

Controller.prototype.mouseUp = function(x, y) {
    if (!this.drag) {
        return;
    }
    var dx = x - this.drag.x;
    var dy = y - this.drag.y;
    var piece = this.drag.piece;
    this.drag = null;
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
    this.movePiece(piece, direction);
}

// main
function main() {
    new Controller();
}

main();
