// DOM Elements
const playPauseBtn = document.getElementById("play-pause-btn")
const playPauseText = document.getElementById("play-pause-text")
const playIcon = document.getElementById("play-icon")
const pauseIcon = document.getElementById("pause-icon")
const resetBtn = document.getElementById("reset-btn")
const tabButtons = document.querySelectorAll(".tab-btn")
const tabPanes = document.querySelectorAll(".tab-pane")
const currentYearElement = document.getElementById("current-year")

// Set current year in footer
currentYearElement.textContent = new Date().getFullYear()

// State
let isPlaying = true
let p5Instance = null

// Tab functionality
tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Remove active class from all buttons and panes
    tabButtons.forEach((btn) => btn.classList.remove("active"))
    tabPanes.forEach((pane) => pane.classList.remove("active"))

    // Add active class to clicked button and corresponding pane
    button.classList.add("active")
    const tabId = button.getAttribute("data-tab")
    document.getElementById(tabId).classList.add("active")
  })
})

// Play/Pause functionality
playPauseBtn.addEventListener("click", () => {
  isPlaying = !isPlaying

  if (isPlaying) {
    playPauseText.textContent = "Pause"
    playIcon.classList.add("hidden")
    pauseIcon.classList.remove("hidden")
    if (p5Instance && p5Instance.loop) {
      p5Instance.loop()
    }
  } else {
    playPauseText.textContent = "Play"
    playIcon.classList.remove("hidden")
    pauseIcon.classList.add("hidden")
    if (p5Instance && p5Instance.noLoop) {
      p5Instance.noLoop()
    }
  }
})

// Reset functionality
resetBtn.addEventListener("click", () => {
  window.location.reload()
})

// Matter.js module aliases
const Engine = Matter.Engine;
const Render = Matter.Render;
const World = Matter.World;
const Bodies = Matter.Bodies;

// Create engine and world
let engine;
let world;

// Update these constants at the top
const BRICK_WIDTH = 80;  // Now equal to height since we want squares
const BRICK_HEIGHT = 80; // Same as width
const BRICK_GAP = 2;

// Initialize p5.js sketch
new p5((p) => {
<<<<<<< Updated upstream
  // Store reference to p5 instance
  p5Instance = p

  // Setup function runs once
=======
  p5Instance = p;
  let handPose;
  let video;
  let hands = [];

  p.preload = () => {
    // Load the handPose model
    console.log("Preloading HandPose model...");
    handPose = ml5.handPose();
  }

>>>>>>> Stashed changes
  p.setup = () => {
    // Create canvas that fills the container
    const canvasContainer = document.getElementById("canvas-container")
    const canvas = p.createCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight)
    canvas.parent("canvas-container")
<<<<<<< Updated upstream
    p.background(30)
    p.frameRate(60)
=======
    
    // Initialize Matter.js engine
    engine = Engine.create();
    world = engine.world;
    
    // Enable gravity
    engine.world.gravity.y = 1;

    // Create the brick wall
    createBrickWall();

    //create video capture
    video = p.createCapture({ video: { facingMode: "user" }, audio: false });
    video.size(640, 480);
    video.hide();
    handPose.detectStart(video, gotHands);
>>>>>>> Stashed changes
  }

  p.draw = () => {
<<<<<<< Updated upstream
    if (!isPlaying) return
=======
    p.background(30);
    
    // Update physics engine
    Engine.update(engine);
    
    // Draw all bodies
    p.fill(135, 206, 235); // Light blue color
    p.stroke(100, 149, 237); // Darker blue outline
    p.strokeWeight(2); // Outline thickness
    
    const bodies = Matter.Composite.allBodies(world);
    bodies.forEach(body => {
      p.beginShape();
      body.vertices.forEach(vertex => {
        p.vertex(vertex.x, vertex.y);
      });
      p.endShape(p.CLOSE);
    });
  };

  function lighter(){
    let returnValue = fourFingerClosed(hands, 75);
    let returnthumbValue = thumbClosed(hands, 75);
    if(!returnthumbValue && returnValue){
      return thumbPos(); 
    }
    return null;
  }
>>>>>>> Stashed changes

    p.background(30, 10)

    // Draw some animated circles
    const time = p.millis() * 0.001
    for (let i = 0; i < 5; i++) {
      const size = 50 + Math.sin(time + i) * 20
      const x = p.width * (0.2 + i * 0.15)
      const y = p.height * 0.5 + Math.sin(time * 0.5 + i) * 100

      p.noStroke()
      p.fill(
        127 + 127 * Math.sin(time * 0.3 + i * 0.5),
        127 + 127 * Math.sin(time * 0.4 + i * 0.5),
        127 + 127 * Math.sin(time * 0.5 + i * 0.5),
        200,
      )
      p.ellipse(x, y, size, size)
    }

    // Draw interactive element that follows mouse
    if (p.mouseX > 0 && p.mouseY > 0 && p.mouseX < p.width && p.mouseY < p.height) {
      p.stroke(255)
      p.strokeWeight(2)
      p.noFill()
      p.ellipse(p.mouseX, p.mouseY, 40 + Math.sin(time * 2) * 10)
    }
<<<<<<< Updated upstream
=======
  
    return false; // Default true if keypoints aren't detected
  }

  function fourFingerClosed(hands, threshold) {
    let x5, y5, x8, y8, x12, y12, x9, y9, x16, y16, x13, y13, x20, y20, x17, y17;
  
    for (let i = 0; i < hands.length; i++) {
      let hand = hands[i];
  
      for (let j = 0; j < hand.keypoints.length; j++) {
        let keypoint = hand.keypoints[j];
  
        let mappedX = p.map(keypoint.x, 0, video.width, 0, p.width);
        let mappedY = p.map(keypoint.y, 0, video.height, 0, p.height);
        let finalX = p.width - mappedX; // Mirror adjustment
        
        //index
        if (j === 5) { 
          x5 = finalX; 
          y5 = mappedY;
        } 
        else if (j === 8) { 
          x8 = finalX; 
          y8 = mappedY;
        }
        //middle finger
        else if (j === 12) { 
          x12 = finalX; 
          y12 = mappedY;
        } 
        else if (j === 9) { 
          x9 = finalX; 
          y9 = mappedY;
        }
        //ring finger
        else if (j === 16) { 
          x16 = finalX; 
          y16 = mappedY;
        } 
        else if (j === 13) { 
          x13 = finalX; 
          y13 = mappedY;
        }
        //pinky finger
        else if (j === 20) { 
          x20 = finalX; 
          y20 = mappedY;
        } 
        else if (j === 17) { 
          x17 = finalX; 
          y17 = mappedY;
        }
      }
  
      // If both keypoints are found, check the distance
      if (x5, y5, x8, y8, x12, y12, x9, y9, x16, y16, x13, y13, x20, y20, x17, y17) {
        let indexDistance = p.dist(x5, y5, x8, y8);
        let middleDistance = p.dist(x12, y12, x9, y9);
        let ringDistance = p.dist(x16, y16, x13, y13);
        let pinkyDistance = p.dist(x20, y20, x17, y17);
        console.log(`Distance between keypoints 5 and 8: ${indexDistance}`);
        if(indexDistance <= threshold &&
          middleDistance <= threshold &&
          ringDistance <= threshold &&
          pinkyDistance <= threshold){
          return true;
        }
      }
    }
  
    return false; // Default true if keypoints aren't detected
>>>>>>> Stashed changes
  }

  // Handle window resize
  p.windowResize = () => {
    const canvasContainer = document.getElementById("canvas-container")
    p.resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight)
    p.background(30)
  }

  // Mouse interaction
  p.mousePressed = () => {
    if (p.mouseX > 0 && p.mouseY > 0 && p.mouseX < p.width && p.mouseY < p.height) {
      p.fill(Math.random() * 255, Math.random() * 255, Math.random() * 255)
      p.noStroke()
      p.ellipse(p.mouseX, p.mouseY, 80, 80)
    }
  }
<<<<<<< Updated upstream
=======
  function gotHands(results) {
    // save the output to the hands variable
    hands = results;
  }
  

  function createBrickWall() {
    // Adjust wall properties for squares
    const rows = 12;  // Reduced rows since squares are taller
    const bricksPerRow = 12; // Adjusted for better square layout
    const startX = (p.width - (bricksPerRow * (BRICK_WIDTH + BRICK_GAP))) / 2;
    const startY = p.height - (rows * (BRICK_HEIGHT + BRICK_GAP));

    // Create bricks
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < bricksPerRow; col++) {
        const brick = Bodies.rectangle(
          startX + col * (BRICK_WIDTH + BRICK_GAP),
          startY + row * (BRICK_HEIGHT + BRICK_GAP),
          BRICK_WIDTH,
          BRICK_HEIGHT,
          {
            restitution: 0.5,
            friction: 0.5,
            density: 1
          }
        );
        World.add(world, brick);
      }
    }

    // Create boundaries (ground, left wall, right wall, ceiling)
    const wallThickness = 60;
    
    // Ground (bottom)
    const ground = Bodies.rectangle(
      p.width / 2,
      p.height,
      p.width,
      wallThickness,
      { isStatic: true }
    );

    // Left wall
    const leftWall = Bodies.rectangle(
      0,
      p.height / 2,
      wallThickness,
      p.height,
      { isStatic: true }
    );

    // Right wall
    const rightWall = Bodies.rectangle(
      p.width,
      p.height / 2,
      wallThickness,
      p.height,
      { isStatic: true }
    );

    // Ceiling (top)
    const ceiling = Bodies.rectangle(
      p.width / 2,
      0,
      p.width,
      wallThickness,
      { isStatic: true }
    );

    // Add all boundaries to the world
    World.add(world, [ground, leftWall, rightWall, ceiling]);
  }
>>>>>>> Stashed changes
})

