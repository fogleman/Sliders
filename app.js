// CONSTANTS
var COLORS = [
    "#e1283f",
    "#eb7e28",
    "#5fd14e",
    "#3995cc",
    "#4438c5",
];

var EXTRA = "#7a787d";

var WALL_SIZE = 0.1;
var LINE_SIZE = 0.005;


// Level
function Level(data) {
    _.extend(this, data);
}

Level.prototype.xy = function(index) {
    var x = index % this.width;
    var y = Math.floor(index / this.width);
    return {x: x, y: y};
}


// LevelView
function LevelView(parent, level) {
    this.level = level;
    this.sources = [];
    this.targets = []
    this.extras = [];
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

LevelView.prototype.createWall = function(parent, a, b) {
    var x = (a.x + b.x) / 2 + 0.5;
    var y = (a.y + b.y) / 2 + 0.5;
    var dx = 0;
    var dy = 0;
    if (a.x === b.x) {
        dx = 0.5; // horizontal
    }
    else {
        dy = 0.5; // vertical
    }
    parent.append("line")
        .attr("x1", x - dx)
        .attr("y1", y - dy)
        .attr("x2", x + dx)
        .attr("y2", y + dy)
        .attr("stroke", "black")
        .attr("stroke-width", WALL_SIZE)
        ;
    parent.append("circle")
        .attr("cx", x - dx)
        .attr("cy", y - dy)
        .attr("r", WALL_SIZE / 2)
        .attr("fill", "black");
    parent.append("circle")
        .attr("cx", x + dx)
        .attr("cy", y + dy)
        .attr("r", WALL_SIZE / 2)
        .attr("fill", "black");
}

LevelView.prototype.createBoard = function(parent) {
    var level = this.level;
    var grid = parent.append("g");
    for (var x = 1; x < level.width; x++) {
        grid.append("line")
            .attr("x1", x)
            .attr("y1", 0)
            .attr("x2", x)
            .attr("y2", level.height)
            .attr("stroke", "#7a787d")
            .attr("stroke-width", LINE_SIZE)
            ;
    }
    for (var y = 1; y < level.height; y++) {
        grid.append("line")
            .attr("x1", 0)
            .attr("y1", y)
            .attr("x2", level.width)
            .attr("y2", y)
            .attr("stroke", "#7a787d")
            .attr("stroke-width", LINE_SIZE)
            ;
    }
    var border = parent.append("g");
    border.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", level.width)
        .attr("height", level.height)
        .attr("rx", WALL_SIZE)
        .attr("ry", WALL_SIZE)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", WALL_SIZE)
        ;
    for (var i = 0; i < level.walls.length; i++) {
        var wall = level.walls[i];
        var a = level.xy(wall[0]);
        var b = level.xy(wall[1]);
        this.createWall(parent, a, b);
    }
}

LevelView.prototype.createPiece = function(parent, point, color) {
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

LevelView.prototype.createTarget = function(parent, point, color) {
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
    parent.attr("viewBox", "-1 -1 " + w + " " + h);
    var group = parent.append("g");
    this.createBoard(group);
    // this.createCellLabels(group);
    for (var i = 0; i < level.extras.length; i++) {
        var point = level.xy(level.extras[i]);
        var piece = this.createPiece(group, point, EXTRA);
        this.extras.push(piece);
    }
    for (var i = 0; i < level.sources.length; i++) {
        var point = level.xy(level.sources[i]);
        var color = COLORS[i];
        var piece = this.createPiece(group, point, color);
        this.sources.push(piece);
    }
    for (var i = 0; i < level.targets.length; i++) {
        var point = level.xy(level.targets[i]);
        var color = COLORS[i];
        var target = this.createTarget(group, point, color);
        this.targets.push(target);
    }
    return;
    for (var i = 0; i < level.sources.length; i++) {
        var a = level.xy(level.sources[i]);
        var b = level.xy(level.targets[i]);
        var piece = this.sources[i];
        piece
            .transition()
            .duration(500)
            .attrTween("transform", function() {
                var t1 = "translate(" + a.x + "," + a.y + ")";
                var t2 = "translate(" + b.x + "," + b.y + ")";
                return d3.interpolate(t1, t2);
            })
            ;
    }
}


// main
function main() {
    var level = new Level(levels[0]);
    var view = d3.select("#view");
    var level_view = new LevelView(view, level);
}

main();
