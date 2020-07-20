const TILE_SIZE = 32;
const MAP_NUM_ROWS = 11;
const MAP_NUM_COLS = 15;

const WINDOW_WIDTH = MAP_NUM_COLS * TILE_SIZE;
const WINDOW_HEIGHT = MAP_NUM_ROWS * TILE_SIZE;

const FOV_ANGLE = 60 * (Math.PI / 180);

const WALL_STRIP_WIDTH = 30;
const NUM_RAYS = WINDOW_WIDTH / WALL_STRIP_WIDTH; // # of rays depends on how thick the columns are and the window width

class Map {
    constructor() {
        this.grid =  [ // define 2d matrix to create grid to render
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];
    }

    /*
    hasWallAt takes in two parameters: the player's new x pixel coordinate and new y pixel coordinate and transforms them to 
    a tile index so that a direct comparison between the player's tile can be made to any tile on the grid
    The pixel coordinates for both x & y are performed by dividing the x & y pixel values by the const TILE_SIZE
    This works because our screen is a grid of pixels that we have broken up into individual "tiles" by taking total tiles and dividing by
    our arbitrary tile size.
    If hasWallAt returns true, 
    */

    hasWallAt(x, y) {
        if (x < 0 || x > WINDOW_WIDTH || y < 0 || y > WINDOW_HEIGHT) {
            return true;
        }
        var mapGridIndexX = Math.floor(x / TILE_SIZE); // transforms player x position into a grid index to compare with the map grid and check for collision
        var mapGridIndexY = Math.floor(y / TILE_SIZE); // transforms player y position into a grid index to compare with the map grid and check for collision
        return this.grid[mapGridIndexY][mapGridIndexX] != 0; // if this is different than zero (1, which means there is a wall) then return true
    }

    render() { // iterates through each row, then each column in every row getting the x, y coord. xcoord = col * tilesize, ycoord = row * tilesize
        for (var i = 0; i < MAP_NUM_ROWS; i++) { // goes row by row
            for (var j = 0; j < MAP_NUM_COLS; j++) { // goes through each column in a row
                var tileX = j * TILE_SIZE; // j * tile size gives the grid y-pos
                var tileY = i * TILE_SIZE; // i * tile size gives the grid x-pos 
                var tileColor = this.grid[i][j] == 1 ? "#222" : "#fff"; // if the x,y coord of the grid are 1 fill with black else fill white
                stroke("#222");
                fill(tileColor); // fill tile color based on whether coord are 1 or not
                rect(tileX, tileY, TILE_SIZE, TILE_SIZE); // rect function takes x-pos, y-pos, width, height params to draw rectangle
            }
        }
    }
}

class Player { // create player class and initialize the attributes
    constructor() {
        this.x = WINDOW_WIDTH / 2; // start player at center of grid
        this.y = WINDOW_HEIGHT / 2; // start player at center of grid
        this.radius = 3;
        this.turnDirection = 0; // -1 left, 1 right
        this.walkDirection = 0; // -1 back, 1 front
        this.rotationAngle = Math.PI / 2;
        this.moveSpeed = 2.0;
        this.rotationSpeed = 0.5 * (Math.PI / 180);

    }
    update() {
        this.rotationAngle += this.turnDirection * this.rotationSpeed; // use turnDirection to see if i'm increasing or decreasing rotation speed
        var moveStep = this.walkDirection * this.moveSpeed; // find out how much distance will be covered
        var newPlayerX = this.x + Math.cos(this.rotationAngle) * moveStep; // get new player x-pos by taking old x-pos and adding the calulated x-component
        var newPlayerY = this.y + Math.sin(this.rotationAngle) * moveStep; // get new player y-pos by taking old y-pos and adding the calculated y-component

        // only set new player position if not colliding with map walls
        // as long as hasWallAt returns false (there is no wall )the player x & y pixel coordinates will update to the calculation made in update
        if (!grid.hasWallAt(newPlayerX, newPlayerY)) {
            this.x = newPlayerX;
            this.y = newPlayerY;
        }

    }
    /*
    Draws the "player" as a red dot at the iniated x & y pixel coordinates and radius
    Also draws a line that goes striaght 
    */
    render() {
        noStroke();
        fill("red");
        circle(this.x,this.y,this.radius);
        /*stroke("red");
        line(this.x,
             this.y,
             this.x + Math.cos(this.rotationAngle) * 30,
             this.y + Math.sin(this.rotationAngle) * 30
         );*/
    }
}

class Ray {
    constructor(rayAngle) {
        this.rayAngle = normalizeAngle(rayAngle); // keep angle between 0 and 2pi
        this.wallHitX = 0; // keep track of the x position of where the ray hit the wall
        this.wallHitY = 0; // keep track of the y position of where the ray hit the wall
        this.distance = 0; // keep track of the distance between the player and the hit wall
        this.wasHitVertical = false;

        this.isRayFacingDown = this.rayAngle > 0 && this.rayAngle < Math.PI; // checks if the ray is facing down because our math for xstep and ystep changes depending
        this.isRayFacingUp = !this.isRayFacingDown; // checks if the ray is facing up because our math for xstep and ystep changes depending

        this.isRayFacingRight = this.rayAngle < 0.5 * Math.PI || this.rayAngle > 1.5 * Math.PI; // checks if the ray is facing right because our math for xstep and ystep changes depending
        this.isRayFacingLeft = !this.isRayFacingRight; // checks if the ray is facing left because our math for xstep and ystep changes depending
    }

    cast(columnID) {
        var xintercept, yintercept;
        var xstep, ystep; 
        ///////////////////////////////////////////
        // HORIZONTAL RAY GRID INTERSECTION CODE
        ///////////////////////////////////////////

        var foundHorzWallHit = false;
        var horzWallHitX = 0;
        var horzWallHitY = 0;

        yintercept = Math.floor(player.y / TILE_SIZE) * TILE_SIZE; // find the y coordinate of the closest horizontal grid intersection
        yintercept += this.isRayFacingDown ? TILE_SIZE : 0; // if rayFacingDown add tileSize to get to the bottom horizontal line

        xintercept = player.x + (yintercept - player.y) / Math.tan(this.rayAngle); // find the x coordinate of the closest horizontal grid intersection

        // Calculate the increment for xstep and ystep
        ystep = TILE_SIZE
        ystep *= this.isRayFacingUp ? -1 : 1;

        xstep = TILE_SIZE / Math.tan(this.rayAngle);
        xstep *= (this.isRayFacingLeft && xstep > 0) ? -1 : 1;
        xstep *= (this.isRayFacingRight && xstep < 0) ? -1 : 1;

        var nextHorzTouchX = xintercept;
        var nextHorzTouchY = yintercept;

        if (this.isRayFacingUp) {
            nextHorzTouchY--;
        }

        // increment xstep and ystep until we find a wall

        while (nextHorzTouchX >= 0 && nextHorzTouchX <= WINDOW_WIDTH && nextHorzTouchY >= 0 && nextHorzTouchY <= WINDOW_HEIGHT)  {
            if (grid.hasWallAt(nextHorzTouchX, nextHorzTouchY)) {
                // WE FOUND A WALL 
                foundHorzWallHit = true;
                horzWallHitX = nextHorzTouchX;
                horzWallHitY = nextHorzTouchY;
                break;
                
            } else {
                nextHorzTouchX += xstep;
                nextHorzTouchY += ystep;
            }
        }

        ///////////////////////////////////////////
        // VERTICAL RAY GRID INTERSECTION CODE
        ///////////////////////////////////////////

        var foundVertWallHit = false;
        var vertWallHitX = 0;
        var vertWallHitY = 0;

        xintercept = Math.floor(player.x / TILE_SIZE) * TILE_SIZE; // find the x coordinate of the closest vertical grid intersection
        xintercept += this.isRayFacingRight ? TILE_SIZE : 0; // if rayFacingDown add tileSize to get to the bottom horizontal line

        yintercept = player.y + (xintercept - player.x) * Math.tan(this.rayAngle); // find the y coordinate of the closest vertical grid intersection

        // Calculate the increment for xstep and ystep
        xstep = TILE_SIZE
        xstep *= this.isRayFacingLeft ? -1 : 1;

        ystep = TILE_SIZE * Math.tan(this.rayAngle);
        ystep *= (this.isRayFacingUp && ystep > 0) ? -1 : 1;
        ystep *= (this.isRayFacingDown && ystep < 0) ? -1 : 1;

        var nextVertTouchX = xintercept;
        var nextVertTouchY = yintercept;

        if (this.isRayFacingLeft) {
            nextVertTouchX--;
        }

        // increment xstep and ystep until we find a wall

        while (nextVertTouchX >= 0 && nextVertTouchX <= WINDOW_WIDTH && nextVertTouchY >= 0 && nextVertTouchY <= WINDOW_HEIGHT) {
            if (grid.hasWallAt(nextVertTouchX, nextVertTouchY)) {
                // WE FOUND A WALL 
                foundVertWallHit = true;
                vertWallHitX = nextVertTouchX;
                vertWallHitY = nextVertTouchY;
                break;

            } else {
                nextVertTouchX += xstep;
                nextVertTouchY += ystep;
            }
        }
         
        // calculate both horizontal and vertical distances and choose the smallest value
        var horzHitDist = (foundHorzWallHit) ? distanceBetweenPoints(player.x, player.y, horzWallHitX, horzWallHitY) : Number.MAX_VALUE;
        var vertHitDist = (foundVertWallHit) ? distanceBetweenPoints(player.x, player.y, vertWallHitX, vertWallHitY) : Number.MAX_VALUE;

        // only store the smallest of the distances
        this.wallHitX = (horzHitDist < vertHitDist) ? horzWallHitX : vertWallHitX;
        this.wallHitY = (horzHitDist < vertHitDist) ? horzWallHitY : vertWallHitY;
        this.distance = (horzHitDist < vertHitDist) ? horzHitDist : vertHitDist;
        this.wasHitVertical = (vertHitDist < horzHitDist);
    }

    render() {
        stroke("blue");
        line (player.x, player.y, this.wallHitX, this.wallHitY);
        }
}

var grid = new Map(); // instantiate new object grid of Map class
var player = new Player(); // instantiate new object player of Player class
var rays = [];

function keyPressed() {
    if (keyCode == UP_ARROW) {
        player.walkDirection = 1;
    } else if (keyCode == DOWN_ARROW) {
        player.walkDirection = -1;
    } else if (keyCode == RIGHT_ARROW) {
        player.turnDirection = 1;
    } else if (keyCode == LEFT_ARROW) {
        player.turnDirection = -1;
    }
}

function keyReleased() {
    if (keyCode == UP_ARROW) {
        player.walkDirection = 0;
    } else if (keyCode == DOWN_ARROW) {
        player.walkDirection =  0;
    } else if (keyCode == RIGHT_ARROW) {
        player.turnDirection = 0;
    } else if (keyCode == LEFT_ARROW) {
        player.turnDirection =  0;
    }
}

// algorithm to cast a ray for each column
function castAllRays() {
    var columnID = 0; // start at column 0 (leftmost column)
    
    // start first ray by substracting half of the FOV
    var rayAngle = player.rotationAngle - (FOV_ANGLE / 2);

    rays = []; // holds all the casted rays

    // loop all columns casting rays
  //for (var i = 0; i < NUM_RAYS; i++) {
    for (var i = 0; i < 1; i ++) {
        var ray = new Ray(rayAngle); // whenever a new ray is created, the passed param is the angle the ray is being created at
        ray.cast(columnID);
        rays.push(ray); // add the ray to the list of rays
        rayAngle += FOV_ANGLE / NUM_RAYS; // get new ray angle by taking the old ray angle and adding the tiny delta between rays given by FOV_ANGLE / NUM_RAYS

        columnID++; // increment the column we are casting a ray to
    }
}

// if angle goes over 2pi, then get the remainder of the angle after dividing by 2pi
// if the angle is negative, add 2pi to the angle to make it positive
function normalizeAngle(angle) {
    angle = angle % (2 * Math.PI);
    if (angle < 0) {
        angle = (2 * Math.PI) + angle;
    }
    return angle;
}

function distanceBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function setup() {
    createCanvas(WINDOW_WIDTH, WINDOW_HEIGHT); 
}

function update() {
    player.update();
    castAllRays(); // per frame, cast all the rays I have in the FOV

}

function draw() {
    update();
    grid.render();
        
    for (ray of rays) { // renders all rays
        ray.render();
    }
    player.render();
    
}
