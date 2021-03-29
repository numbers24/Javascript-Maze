//maze canvas
var canvas
//mouse canvas
var Mouse
var ctx
var gl

var canvas_size = 1000
/**
 * current cell
 */
var curr
/**
 * "finish line" cell
 */
var finish
/**
 * holds the position of the mouse
 * @type {*[]}
 */
var positions = []

/**
 * creates a randomized maze using the DFS algorithm
 */
class maze{
    constructor(size,rows,cols) {
        this.size = size
        this.rows = rows
        this.cols = cols
        this.mazegrid = []
        this.stack = []
    }

    /**
     * initialize the maze structure
     */
    generate(){
        for(let r = 0; r < this.rows;r++){//for every row
            let row = []
            for(let c = 0; c < this.cols;c++){//for every column
                row.push(new cell(r,c,this)) //push cells into the row
            }
            this.mazegrid.push(row)//push the rows into the grid
        }
        curr = this.mazegrid[0][0]
    }

    /**
     * draw the maze in HTML5
     */
    draw(){
        canvas.width = this.size
        canvas.height = this.size
        canvas.style.background = "white"
        curr.has_visited = true

        //show every cell
        for(let r = 0; r < this.rows;r++)
            for(let c = 0; c < this.cols;c++)
                this.mazegrid[r][c].show()

        //get the next cell as one of the current's neighbors
        let next = curr.getNeighbors()

        if(next){//if there is another neighbor
            next.has_visited=true
            this.stack.push(curr)
            removeWall(curr,next) //remove the wall between current and next
            curr = next
        }
        else if(this.stack.length>0){ //back-tracker: if there are no more neighbors that need to visited, the stack will pop out a cell that wasn't visited
            curr = this.stack.pop()
        }

        if(this.stack.length === 0)
            return
        else this.draw() //recurse until every cell has been visited/ejected from the stack

    }
}

/**
 * an n*n maze is made up of n*n cells
 * each cell has the capacity to hold 4 walls
 */
class cell{
    constructor(row,col,maze){
        this.maze = maze
        this.mazegrid = maze.mazegrid
        this.size = maze.size
        //row index and number of rows
        this.row = row
        this.rows = maze.rows
        //column index and number of columns
        this.col = col
        this.cols = maze.cols
        //has visited and a structure that holds the physicallity behind the walls so the mouse does not phase through
        this.has_visited = false
        this.walls ={
            top : true,
            bottom : true,
            left : true,
            right : true
        }
    }


    /**
     * get the neighbors and return at random a neighbor while the rest will be walled, ignore out of bounds neighbors
     * @returns {undefined|*}
     */
    getNeighbors(){
        let neighbors = []

        //find all four neighbors, ignore undefined
        let top = this.row !== 0 ? this.mazegrid[this.row-1][this.col] :undefined
        let btm = this.row !== this.mazegrid.length - 1 ? this.mazegrid[this.row+1][this.col] :undefined
        let right = this.col !== this.mazegrid.length - 1 ? this.mazegrid[this.row][this.col+1] :undefined
        let left = this.col !== 0 ? this.mazegrid[this.row][this.col-1] :undefined

        //ignore cells that the algorithm has already visited
        if(top && !top.has_visited) neighbors.push(top)
        if(btm && !btm.has_visited) neighbors.push(btm)
        if(right && !right.has_visited) neighbors.push(right)
        if(left && !left.has_visited) neighbors.push(left)

        if(neighbors.length !== 0)
            return neighbors[Math.floor(Math.random()*neighbors.length)]
        else
            return undefined
    }
    //draw wall functions
    drawTopWall(x,y){
        ctx.beginPath()
        ctx.moveTo(x,y)
        ctx.lineTo(x+this.size/this.cols,y)
        ctx.stroke()
    }
    drawBtmWall(x,y){
        ctx.beginPath()
        ctx.moveTo(x,y+this.size/this.rows)
        ctx.lineTo(x+this.size/this.cols,y+this.size/this.rows)
        ctx.stroke()
    }

    drawRightWall(x,y){
        ctx.beginPath()
        ctx.moveTo(x+this.size/this.cols,y)
        ctx.lineTo(x+this.size/this.cols,y+this.size/this.rows)
        ctx.stroke()
    }
    drawLeftWall(x,y){
        ctx.beginPath()
        ctx.moveTo(x,y)
        ctx.lineTo(x,y+this.size/this.rows)
        ctx.stroke()
    }
    //show the maze and every wall
    show(){
        let x = this.col * this.size / this.cols
        let y = this.row * this.size / this.rows

        ctx.strokeStyle = "black"
        ctx.fillStyle = "white"
        ctx.lineWidth = 2

        if(this.walls.top) this.drawTopWall(x,y)
        if(this.walls.bottom) this.drawBtmWall(x,y)
        if(this.walls.right) this.drawRightWall(x,y)
        if(this.walls.left) this.drawLeftWall(x,y)

        if(this.has_visited){
            ctx.fillRect(x+1,y+1,this.size/this.cols - 2, this.size/this.rows - 2)
        }
    }
    //highlight the start and finish cells of the maze
    highlight(color){
        let x = this.col * this.size / this.cols + 1
        let y = this.row * this.size / this.rows + 1
        ctx.fillStyle = color
        ctx.fillRect(x,y,this.size/this.cols -5,this.size/this.rows -5)
    }
}

/**
 * extension of cells
 * a special type of cell that is represented as a movable triangle that can traverse the maze
 */
class mouse extends cell{
    constructor(row,col,maze){
        super(row,col,maze)
        this.mazegrid = maze.mazegrid
        this.walls = this.mazegrid[this.row][this.col].walls
        this.center = vec2(-.95+.10*this.col,.95-.10*this.row)
        this.vertices = [
            vec2(this.center[0]-.02,this.center[1]+.02),
            vec2(this.center[0]+.03,this.center[1]),
            vec2(this.center[0]-.02,this.center[1]-.02),
        ]
        positions.push(this.vertices[0],this.vertices[1],this.vertices[2])
    }
    //draw the mouse
    drawMouse(){
        positions=[]
        positions.push(this.vertices[0],this.vertices[1],this.vertices[2])
        gl.bufferData( gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW )
        render()
    }

    //the rotation methods
    rotateUp(){
        this.center = vec2(-.95+.10*this.col,.95-.10*this.row)
        this.vertices = [
            vec2(this.center[0]+.02,this.center[1]-.02),
            vec2(this.center[0],this.center[1]+.03),
            vec2(this.center[0]-.02,this.center[1]-.02),
        ]
    }
    rotateDown(){
        this.center = vec2(-.95+.10*this.col,.95-.10*this.row)
        this.vertices = [
            vec2(this.center[0]-.02,this.center[1]+.02),
            vec2(this.center[0],this.center[1]-.03),
            vec2(this.center[0]+.02,this.center[1]+.02),
        ]
    }
    rotateLeft(){
        this.center = vec2(-.95+.10*this.col,.95-.10*this.row)
        this.vertices = [
            vec2(this.center[0]+.02,this.center[1]+.02),
            vec2(this.center[0]-.03,this.center[1]),
            vec2(this.center[0]+.02,this.center[1]-.02),
        ]
    }
    rotateRight(){
        this.center = vec2(-.95+.10*this.col,.95-.10*this.row)
        this.vertices = [
            vec2(this.center[0]-.02,this.center[1]+.02),
            vec2(this.center[0]+.03,this.center[1]),
            vec2(this.center[0]-.02,this.center[1]-.02),
        ]
    }
}

/**
 * removes the wall between cells while building the maze
 * @param a
 * @param b
 */
function removeWall(a, b) {
    switch( a.col - b.col){
        case 1:
            a.walls.left = false
            b.walls.right = false
            break
        case -1:
            a.walls.right = false
            b.walls.left = false
    }
    switch(a.row - b.row){
        case 1:
            a.walls.top = false
            b.walls.bottom = false
            break
        case -1:
            a.walls.bottom = false
            b.walls.top = false
    }
}

/**
 * controls the movement of the mouse, by taking inputs from wasd and the arrow keys
 * @param e
 */
function move(e){
    e = e||window.Event
    switch(e.keyCode){
        case 38: //Up Arrow Key
        case 87: //W key
            if(curr.walls.top===false) {
                curr.show()
                curr = new mouse(curr.row-1,curr.col,curr.maze)
            }
            curr.rotateUp() //rotate the mouse
            curr.drawMouse() //draw the mouse in that rotation and position (the mouse could rotate but not move at all)
            break
        case 40: //Down Arrow Key
        case 83: //S Key
            if(curr.walls.bottom===false) {
                curr.show()
                curr = new mouse(curr.row+1,curr.col,curr.maze)
            }
            curr.rotateDown()
            curr.drawMouse()
            break
        case 39: //Right Arrow Key
        case 68: //D key
            if(curr.walls.right===false) {
                curr.show()
                curr = new mouse(curr.row,curr.col+1,curr.maze)
            }
            curr.rotateRight()
            curr.drawMouse()
            break
        case 37: //Left Arrow Key
        case 65: //A key- Left
            if(curr.walls.left===false) {
                curr.show()
                curr = new mouse(curr.row,curr.col-1,curr.maze)
            }
            curr.rotateLeft()
            curr.drawMouse()
            break
    }
    //when the mouse has reached the cheese, you've escaped the maze
    if(curr.row === finish.row && curr.col === finish.col){
        finish.highlight("red")
    }


}
window.onload = function init() {
    canvas = document.getElementById("maze")
    Mouse = document.getElementById("mouse")

    ctx = canvas.getContext("2d")
    gl = Mouse.getContext("webgl2")
    if (!gl) {alert( "WebGL 2.0 isn't available" )}

    //create maze
    let newmaze = new maze(1000, 20, 20)
    newmaze.generate()
    newmaze.draw()
    //place the starting cell
    curr.highlight("green")
    curr = new mouse(curr.col, curr.row, newmaze)
    finish = newmaze.mazegrid[newmaze.rows - 1][newmaze.cols - 1]
    //place the "cheese" cell
    finish.highlight("gold")
    window.addEventListener("keydown", move, true)

    gl.viewport( 0, 0, Mouse.width, Mouse.height )
    gl.clearColor( 0, 0, 0, 0 )

    let program = initShaders( gl, "vertex-shader", "fragment-shader" )
    gl.useProgram(program)

    let bufferId = gl.createBuffer()
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId )
    gl.bufferData( gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW )


    let positionLoc = gl.getAttribLocation(program, "aPosition" )
    gl.vertexAttribPointer( positionLoc, 2, gl.FLOAT, false, 0, 0 )
    gl.enableVertexAttribArray( positionLoc )

    this.render()
}
function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT )
    gl.drawArrays( gl.TRIANGLE_FAN, 0, this.positions.length )
}