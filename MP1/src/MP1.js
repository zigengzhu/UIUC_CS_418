/**
 * @file CS 418 MP1 (Based on HelloAnimation.js)
 * @author Zigeng Zhu <zigeng2@illinois.edu>
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The vertex array object for the triangle */
var vertexArrayObject;

/** @global An object that contains important information for rendering the Illinois logo */
var logo = {
    // Initial vertices for reference when applying offset
    initialVertices: [
        -0.2, 0.5, 0.0,
        -0.4, 0.5, 0.0,
        -0.4, 0.8, 0.0,
        -0.4, 0.8, 0.0,
        0.4, 0.8, 0.0,
        -0.2, 0.5, 0.0,
        -0.2, 0.5, 0.0,
        0.4, 0.5, 0.0,
        0.4, 0.8, 0.0,
        -0.2, 0.5, 0.0,
        0.2, 0.5, 0.0,
        0.2, -0.2, 0.0,
        -0.2, 0.5, 0.0,
        -0.2, -0.2, 0.0,
        0.2, -0.2, 0.0,
        -0.4, -0.2, 0.0,
        -0.4, -0.5, 0.0,
        0.4, -0.5, 0.0,
        0.4, -0.2, 0.0,
        0.4, -0.5, 0.0,
        -0.4, -0.2, 0.0],
    
    currentVertices: [],
    
    color: [232, 74, 39, 1],
    
    // Color Matrix
    colors: [],
    
    rotAngle: 0,
    
    numTriangles: 7,
    
    xoffset : -0.6,

    yoffset : -0.175,

    lastCycleTime : 0.0,

    isReverse : false,
    
    modelViewMatrix: glMatrix.mat4.create()
};

// Fix animation aesthetics and generate color matrix
logo.initialVertices = applyOffset(logo.initialVertices, logo.xoffset, logo.yoffset);  
logo.currentVertices = logo.initialVertices;
logo.colors = toWebGLColor(logo.color, logo.numTriangles);

/* @global Comet object that includes both the background and the moving part. Animation is achieved through changing certain part of the buffer */
var comet = {
    initialVertices: [        
        -1.0, -0.7, 0.0,
        -1.0, -1.0, 0.0,
        -0.6, -0.2, 0.0,
        -1.0, -1.0, 0.0,
        -0.6, -0.2, 0.0,
        0.0, -1.0, 0.0,
        -0.6, -0.2, 0.0,
        0.0, -1.0, 0.0,
        0.0, -0.6, 0.0,
        0.0, -1.0, 0.0,
        0.0, -0.6, 0.0,
        0.5, 0.2, 0.0,
        0.5, 0.2, 0.0,
        0.0, -1.0, 0.0,
        1.0, -1.0, 0.0,
        0.5, 0.2, 0.0,
        1.0, -1.0, 0.0,
        1.0, -0.6, 0.0,
        // part of the star
        -0.6, 0.6, 0.0,
        -0.63, 0.6, 0.0,
        -0.61, 0.61, 0.0,
        -0.6, 0.6, 0.0,
        -0.61, 0.61, 0.0,
        -0.6, 0.65, 0.0,
        -0.6, 0.6, 0.0,
        -0.6, 0.65, 0.0,
        -0.59, 0.61, 0.0,
        -0.6, 0.6, 0.0,
        -0.59, 0.61, 0.0,
        -0.57, 0.6, 0.0,
        
        -0.6, 0.6, 0.0,
        -0.57, 0.6, 0.0,
        -0.59, 0.59, 0.0,
        -0.6, 0.6, 0.0,
        -0.59, 0.59, 0.0,
        -0.6, 0.55, 0.0,
        -0.6, 0.6, 0.0,
        -0.6, 0.55, 0.0,
        -0.61, 0.59, 0.0,
        -0.6, 0.6, 0.0,
        -0.61, 0.59, 0.0,
        -0.63, 0.6, 0.0,
        
        -1.0, 0.8, 0.0,
        -0.62, 0.64, 0.0,
        -0.65, 0.63, 0.0,
        -1.0, 0.8, 0.0,
        -0.65, 0.63, 0.0,
        -0.645, 0.61, 0.0
        ],
        
    
    currentVertices: [],
    
    color: [79, 92, 107, 1],
    
    colors : [],
    
    numTriangles: 6,
    
    xoffset : 0,

    yoffset : 0,

    lastCycleTime : 0.0,
    
    modelViewMatrix: glMatrix.mat4.create()
};
comet.currentVertices = comet.initialVertices;
comet.colors = toWebGLColor(comet.color, comet.numTriangles);

/** @global the current animation on display */
var currentObj = logo;

/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

/**
 * Translates RGBA color to color array for triangles
 * @param {Number} R G B A (0 ~ 255), number of triangles needed to render
 * @return {Array} list containing all color coordinates
 */
function toWebGLColor(colorInput, numTriangles) {
    var color = [colorInput[0]/255.0, colorInput[1]/255.0, colorInput[2]/255.0, colorInput[3]];
    var colorArray = [];
    var i, j;
    for (i = 0; i < numTriangles * 3; i++) {
        for (j = 0; j < 4; j++) {
            colorArray.push(color[j]);
        }
    }
    return colorArray;
}

/**
 * Applies offsets to all of the vertices with respect to its original position
 * @param {Array} verticies {number} Offset on x-axis, Offset on y-axis.
 * @return {Array} the verticies after the offsets have been applied.
 */
function applyOffset(vertices, xoff, yoff) {
    var i;
    var newVertices = [];
    for (i = 0; i < vertices.length; i+= 3) {
        newVertices.push(vertices[i] + xoff);
        newVertices.push(vertices[i + 1] + yoff);
        newVertices.push(0.0);
    }
    return newVertices;
}

/**
 * Applies offsets to part of the vertices with respect to its original position
 * Designated to comet object only since there are both moving parts and background in the matrix.
 * @param Offset on x-axis, Offset on y-axis.
 * @return {Array} the verticies after the offsets have been applied.
 */
function applyCometOffset(xoff, yoff) {
    var i;
    var newVertices = Array.from(comet.initialVertices);
    for (i = 18*3; i < newVertices.length; i+= 3) {
        newVertices[i] += xoff;
        newVertices[i + 1] += yoff;
    }
    return newVertices;
}

/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var context = null;
  context = canvas.getContext("webgl2");
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Loads a shader.
 * Retrieves the source code from the HTML document and compiles it.
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  var shaderSource = shaderScript.text;
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

/**
 * Set up the fragment and vertex shaders.
 */
function setupShaders() {
  // Compile the shaders' source code.
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  // Link the shaders together into a program.
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  // We only use one shader program for this example, so we can just bind
  // it as the current program here.
  gl.useProgram(shaderProgram);
    
  // Query the index of each attribute in the list of attributes maintained
  // by the GPU. 
  shaderProgram.vertexPositionAttribute =
    gl.getAttribLocation(shaderProgram, "aVertexPosition");
  shaderProgram.vertexColorAttribute =
    gl.getAttribLocation(shaderProgram, "aVertexColor");
    
  //Get the index of the Uniform variable as well
  shaderProgram.modelViewMatrixUniform =
    gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
}


/**
 * Set up the buffers to hold the input object's vertex positions and colors.
 * @param object to setup the buffer
 */
function initBuffer(obj) {
    // Create the vertex array object, which holds the list of attributes for
    // the triangle.
   
    vertexArrayObject = gl.createVertexArray();
    gl.bindVertexArray(vertexArrayObject); 

    // Create a buffer for positions, and bind it to the vertex array object.
    vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

    // Populate the buffer with the position data.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.currentVertices), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numberOfItems = obj.currentVertices.length;

    // Binds the buffer that we just made to the vertex position attribute.
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Do the same steps for the color buffer.
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.colors), gl.STATIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = obj.colors.length;  
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                         vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Enable each attribute we are using in the VAO.  
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    // Unbind the vertex array object to be safe.
    gl.bindVertexArray(null);
}


/**
 * Draws a frame to the screen.
 * @param object to draw on the canvas
 */
function draw(obj) {
  // Transform the clip coordinates so the render fills the canvas dimensions.
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

  // Clear the screen.
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Use the vertex array object that we set up.
  gl.bindVertexArray(vertexArrayObject);
    
  // Send the ModelView matrix with our transformations to the vertex shader.
  gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform,
                      false, obj.modelViewMatrix);
    
  // Render the triangle. 
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
  
  // Unbind the vertex array object to be safe.
  gl.bindVertexArray(null);
}

/**
 * Animates the Illinois logo by moving along a sine curve while doing affine rotation at each frame 
 */
 function animate_logo(currentTime) {
  // Read the speed slider from the web page.
     
    gl.clearColor(19/255.0, 41/255.0, 75/255.0, 1.0);
    // Horizontal speed input from HTML
    var speed = document.getElementById("speed").value;
    // Number of oscillations per unit time
    var frequency = document.getElementById("freq").value;
    // Magnitude of the movement
    var amplitude = document.getElementById("amp").value;
    // Convert the time to seconds.
    currentTime *= 0.001;
    // Keeps the logo within the canvas, if hit the boundary, the movement is reversed.
    if (logo.xoffset > 1.6) {
      logo.isReverse = true;
      logo.lastCycleTime = currentTime;
    }
    if (logo.xoffset < -0.6) {
      logo.isReverse = false;
      logo.lastCycleTime = currentTime;
    }
    
    if (logo.isReverse == true) {
      logo.xoffset = 1.6 - (currentTime - logo.lastCycleTime) * speed/3;
    } else {
      logo.xoffset = -0.6 + (currentTime - logo.lastCycleTime) * speed/3;
    }
    // Sine curve with controllable frequency, speed, and amplitude
    logo.yoffset  = Math.sin(frequency * currentTime * speed) * amplitude/10;
    // Apply the offset
    logo.currentVertices = applyOffset(logo.initialVertices, logo.xoffset, logo.yoffset);
    // Affine Rotation
    logo.rotAngle += (currentTime - logo.lastCycleTime) * speed / 3;
    if (logo.rotAngle == 360.0) {logo.rotAngle = 0.0;}
    // If rotation radio button is checked, start rotating the logo
    var rotate = document.getElementsByName("rotation");
    if (rotate[0].checked) {
        glMatrix.mat4.fromZRotation(logo.modelViewMatrix, degToRad(logo.rotAngle));
    } else {
        // If linear is checked, reset the rotated logo
        glMatrix.mat4.fromZRotation(logo.modelViewMatrix, 0);
    }
    
    initBuffer(logo);

    draw(logo);

    requestAnimationFrame(animate_logo);
}

/**
 * Animates the movement of a comet by moving the main object in an elliptical orbit.
 */
function animate_comet(currentTime) {
    gl.clearColor(19/255.0, 41/255.0, 75/255.0, 1.0);
    
    var speed = document.getElementById("speed").value;
    
    currentTime *= 0.001;
    
    comet.xoffset = 0.6 + Math.sqrt(2) * Math.cos(-currentTime*speed);
    comet.yoffset = -1.6 + Math.sqrt(2.3) * Math.sin(-currentTime*speed);
    comet.currentVertices = applyCometOffset(comet.xoffset, comet.yoffset);

    initBuffer(comet);
    
    draw(comet);
    
    requestAnimationFrame(animate_comet);
}

/** Called after every frame to check whether to change the animation */
function obj_switch() {
    var animation = document.getElementsByName("animation");
    // If logo is on display and comet radio button is checked
    if (currentObj == logo && animation[1].checked) {
        currentObj = comet;
        // Reset comet position
        comet.xoffset = 0.0;
        comet.yoffset = 0.0;
        // Start Animation
        initBuffer(comet);
        requestAnimationFrame(animate_comet);
    // If comet is on display and logo radio button is checked
    } else if (currentObj == comet && animation[0].checked) {
        currentObj = logo;
        initBuffer(logo);
        requestAnimationFrame(animate_logo);
    }
    requestAnimationFrame(obj_switch);
}

/**
 * Startup function called from html code to start the program.
 */
 function startup() {
     canvas = document.getElementById("myGLCanvas");
     gl = createGLContext(canvas);
     setupShaders();
     initBuffer(logo);
     requestAnimationFrame(animate_logo);
     obj_switch();
}
