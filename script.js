// Wait for DOM to load before accessing elements
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const playPauseBtn = document.getElementById("play-pause-btn")
  const playPauseText = document.getElementById("play-pause-text")
  const playIcon = document.getElementById("play-icon")
  const pauseIcon = document.getElementById("pause-icon")
  const resetBtn = document.getElementById("reset-btn")
  const tabButtons = document.querySelectorAll(".tab-btn")
  const tabPanes = document.querySelectorAll(".tab-pane")
  const currentYearElement = document.getElementById("current-year")

  // Set current year in footer only if the element exists
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear()
  }

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
  const BRICK_WIDTH = 90;  // Now equal to height since we want squares
  const BRICK_HEIGHT = 90; // Same as width
  const BRICK_GAP = 2;

  // At the top with other variables
  let iceTexture;
  let maskBuffer;

  //fistPump Elements
  let fistEllipse = null;
  let shiftedFistEllipse = null;
  let waitingForInitialHit = false;
  let fistDetectedFrames = 0;
  let fistLostFrames = 0;
  const detectionThreshold = 10;
  const lossThreshold = 15;

  //gif
  var gifImage;
  // Add this with other state variables at the top
  let breakSound;
  let crackSound;

  // Add these with other state variables at the top
  let brokenBlockCount = 0;
  let blocksBrokenToWin = 100;
  let totalBrokenBlocks = 0;
  const BLOCKS_TO_SPAWN = 15;

  // Initialize p5.js sketch
  new p5((p) => {
    p5Instance = p;
    let handPose;
    let video;
    let hands = [];
    let bodyNeighbors = [];

    p.preload = () => {
      // Load the handPose model
      console.log("Preloading HandPose model...");
      handPose = ml5.handPose();
      
      // Load the ice texture
      console.log('Starting to load ice texture...');
      iceTexture = p.loadImage('assets/ice-texture.png', 
        () => console.log('Ice texture loaded successfully'),
        (err) => console.error('Failed to load ice texture:', err)
      );
      gifImage = p.loadImage("https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExYzhkMjNscnpnajJxMmNyc3RkbzgzYWZ1MHE4azlhbGpqNXVkbTNrNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/f7H1pKwP9sShX5pW6R/giphy.gif");
    }

    p.setup = () => {
      // Add this with your other sound load
      breakSound = p.loadSound('assets/breaksound.mp3', 
        () => console.log('Break sound loaded successfully'),
        (err) => console.error('Failed to load break sound:', err)
      );
      
      crackSound = p.loadSound('assets/crack.mp3',
        () => console.log('Crack sound loaded successfully'),
        (err) => console.error('Failed to load crack sound:', err)
      );

      // Create canvas that fills the container
      const canvasContainer = document.getElementById("canvas-container")
      const canvas = p.createCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight)
      canvas.parent("canvas-container")
      p.background(30)
      p.frameRate(60)
      //create video capture
      video = p.createCapture({ video: { facingMode: "user" }, audio: false });
      video.size(640, 480);
      video.hide();
      handPose.detectStart(video, gotHands);
      
      // Initialize Matter.js engine
      engine = Engine.create();
      world = engine.world;
      
      // Enable gravity
      engine.world.gravity.y = 1;

      // Create the brick wall
      createIceWall();

      // Create an offscreen graphics buffer for the mask
      maskBuffer = p.createGraphics(p.width, p.height);
    }

    p.draw = () => {
      p.background(30);

      
      // Check if texture is loaded before using it
      if (!iceTexture || !iceTexture.width) {
        console.log('Waiting for texture to load...');
        return;
      }

      if (video) {
        // Flip the video horizontally
        p.push();
        p.translate(p.width, 0);
        p.scale(-1, 1);
        p.image(video, 0, 0, p.width, p.height);
        p.pop();
      }

      // Add mouse hold check here
      if (p.mouseIsPressed && 
          p.mouseX > 0 && 
          p.mouseY > 0 && 
          p.mouseX < p.width && 
          p.mouseY < p.height) {
            console.log({x: p.mouseX, y: p.mouseY});
            //console.log({x: p.width/2, y: p.height/2})
        //eraseCheck({x: p.mouseX, y: p.mouseY}, "fistPump");
      }

      
      // Clear the mask buffer at the start of each frame
      maskBuffer.clear();
      if (gifImage) {
        maskBuffer.image(gifImage, 0, 0, maskBuffer.width-25, maskBuffer.height-25);
      } else {
        maskBuffer.background(0); // Fallback black background
      } // Black background (masked out)
      
      const bodies = Matter.Composite.allBodies(world);
      bodies.forEach(body => {
        if (body.isStatic) {
          // Draw static bodies (walls and ground) to the mask buffer
          maskBuffer.fill(255); // White for visible areas
          maskBuffer.stroke(0); // Black outline
          maskBuffer.strokeWeight(1);
          maskBuffer.beginShape();
          body.vertices.forEach(vertex => {
            maskBuffer.vertex(vertex.x, vertex.y);
          });
          maskBuffer.endShape(maskBuffer.CLOSE);
        } else {
          // For ice blocks, draw to mask buffer as before
          maskBuffer.fill(255);
          maskBuffer.stroke(0);
          maskBuffer.strokeWeight(1);
          maskBuffer.beginShape();
          body.vertices.forEach(vertex => {
            maskBuffer.vertex(vertex.x, vertex.y);
          });
          maskBuffer.endShape(maskBuffer.CLOSE);
        }
      });
      
      // Draw the ice texture first
      p.image(iceTexture, 0, 0, p.width, p.height);
      
      // Update physics engine
      Engine.update(engine);
      
      // Draw all bodies
      p.fill(135, 206, 235); // Light blue color
      p.stroke(100, 149, 237); // Darker blue outline
      p.strokeWeight(2); // Outline thickness
      
      if (fistEllipse) {
        p.push();
        p.fill(255, 0, 0, 150); // Red with transparency
        p.ellipse(fistEllipse.x, fistEllipse.y, 400, 50);
        p.pop();
      }
      if (shiftedFistEllipse) {
        p.push();
        p.fill(0, 255, 0, 150); // Green with transparency
        p.ellipse(shiftedFistEllipse.x, shiftedFistEllipse.y, 400, 50);
        p.pop();
      }

      if (fistMade()) {
        fistDetectedFrames++;
        fistLostFrames = 0;
        if (fistDetectedFrames >= detectionThreshold) {
          const middleKnucklePos = fingerPos(9);
          if (middleKnucklePos && !fistEllipse) {
            fistEllipse = { x: middleKnucklePos.x, y: middleKnucklePos.y };
            shiftedFistEllipse = { x: middleKnucklePos.x, y: Math.max(middleKnucklePos.y - 250, 0) };
            waitingForInitialHit = false;
          }
        }
      } else {
        if (fistEllipse) {
          fistLostFrames++;
          if (fistLostFrames > lossThreshold) {
            fistEllipse = null;
            shiftedFistEllipse = null;
            fistDetectedFrames = 0;
          }
        } else {
          fistDetectedFrames = 0;
          fistLostFrames = 0;
        }
      }

      if (!waitingForInitialHit && shiftedFistEllipse && checkFistCollision(shiftedFistEllipse)) {
        waitingForInitialHit = true;
        shiftedFistEllipse = null;
        console.log("Fist pump detected!");
        eraseCheck({x: 0, y: 0}, "fistPump")
      } else if (waitingForInitialHit && fistEllipse && checkFistCollision(fistEllipse)) {
        waitingForInitialHit = false;
        shiftedFistEllipse = { x: fistEllipse.x, y: Math.max(fistEllipse.y - 250, 0) };
        console.log("Fist reset!");
      }

      // Apply the mask to all bodies including walls
      p.push();
      p.blendMode(p.MULTIPLY);
      p.image(maskBuffer, 0, 0);
      p.pop();

      // Draw cracks on top after masking
      bodies.forEach(body => {
        if (!body.isStatic && body.breakable) {
          // Draw the cracks
          if (!body.crackPattern) {
            body.crackPattern = generateCrackPattern(body.vertices);
          }

          p.stroke(255);
          p.strokeWeight(1);

          // Draw cracks based on breakage thresholds
          if (body.breakage <= 100) {
            drawCrackPattern(body.crackPattern[1], p, 0.5, body);
          }
          if (body.breakage <= 80) {
            drawCrackPattern(body.crackPattern[2], p, 0.6, body);
          }
          if (body.breakage <= 60) {
            drawCrackPattern(body.crackPattern[3], p, 0.7, body);
          }
          if (body.breakage <= 40) {
            drawCrackPattern(body.crackPattern[4], p, 0.8, body);
          }
          if (body.breakage <= 20) {
            drawCrackPattern(body.crackPattern[5], p, 0.9, body);
          }
          if (body.breakage <= 10) {
            drawCrackPattern(body.crackPattern[6], p, 1.0, body);
          }
        }
      });
      
      if (lighter() !== null) {
        eraseCheck(lighter(), "lighter");
      }
      if (pinchDetect(100) !== null) {
        //console.log(pinchDetect());
        eraseCheck(pinchDetect(), "pinch");
        // console.log(pinchDetect(), "pinch");
      }
      handPointCircles()
    }

    function checkAndPlayCrack(body) {
      let newCrackLevel = 0;
      if (body.breakage <= 100) newCrackLevel = 1;
      if (body.breakage <= 80) newCrackLevel = 2;
      if (body.breakage <= 60) newCrackLevel = 3;
      if (body.breakage <= 40) newCrackLevel = 4;
      if (body.breakage <= 20) newCrackLevel = 5;
      if (body.breakage <= 10) newCrackLevel = 6;
      
      // Only play sound for even-numbered levels (2, 4, 6)
      if (newCrackLevel > body.crackLevel && newCrackLevel % 2 === 0) {
        crackSound.play();
      }
      body.crackLevel = newCrackLevel;
    }
    
    
    function eraseCheck({x: xCheck, y: yCheck}, eraseType) {
      let bodiesFound = Matter.Query.point(Matter.Composite.allBodies(world), {x: xCheck, y: yCheck});
      
      if (bodiesFound.length > 0 && eraseType == "lighter" && bodiesFound[0].breakable) {
        if (bodiesFound[0].breakage > 0) {
          bodiesFound[0].breakage -= 1;
          checkAndPlayCrack(bodiesFound[0]);
        } else {
          Matter.World.remove(world, bodiesFound[0]);
          breakSound.play();
          checkBlockCount();
        }
      }
      
      if (bodiesFound.length > 0 && bodiesFound[0].breakable && eraseType === "pinch") {
        Matter.World.remove(world, bodiesFound[0]);
        breakSound.play();
        checkBlockCount();
      }
      
      //  Remove length+break checks for final punch if single instance given
      if (eraseType == "fistPump") {
        console.log(BRICK_WIDTH);
        console.log(BRICK_HEIGHT);
        for (let col = -4*BRICK_WIDTH; col <= 4*BRICK_WIDTH; col += BRICK_WIDTH) {
          console.log("bodyHere");
          for (let row = -4*BRICK_HEIGHT; row <= 4*BRICK_HEIGHT; row += BRICK_HEIGHT) {
            // Handles breakage of each block in 11x11 grid
            let tempBodies = Matter.Query.point(Matter.Composite.allBodies(world), {x: p.width/2 + col, y: p.height/2 + row}) //{x: xCheck+col, y: yCheck+row})
            if (tempBodies.length > 0) {
              // Left/Right edges
              if (((col == -4*BRICK_WIDTH ) || (col == 4*BRICK_WIDTH )) && row == 0 && tempBodies[0].breakable) {
                breaker(tempBodies[0], 25);
              }
              //  Second col + mirror
              else if (((col == -3*BRICK_WIDTH ) || (col == 3*BRICK_WIDTH )) && tempBodies[0].breakable) {
                if ((row == -BRICK_HEIGHT ) || (row == BRICK_HEIGHT )) {
                  breaker(tempBodies[0], 25);
                }
                else if (row == 0) {
                  breaker(tempBodies[0], 50);
                }
              }
              //  Third col + mirror
              else if (((col == -2*BRICK_WIDTH ) || (col == 2*BRICK_WIDTH )) && tempBodies[0].breakable) {
                if ((row == -2*BRICK_HEIGHT ) || (row == 2*BRICK_HEIGHT )) {
                  breaker(tempBodies[0], 25);
                }
                else if ((row == -BRICK_HEIGHT ) || (row == BRICK_HEIGHT )) {
                  breaker(tempBodies[0], 50);
                }
                else if (row == 0) {
                  breaker(tempBodies[0], 75);
                }
              }
              // Fourth col + mirror
              else if (((col == -BRICK_WIDTH ) || (col == BRICK_WIDTH )) && tempBodies[0].breakable) {
                if ((row == -3*BRICK_HEIGHT ) || (row == 3*BRICK_HEIGHT )) {
                  breaker(tempBodies[0], 25);
                }
                else if ((row == -2*BRICK_HEIGHT ) || (row == 2*BRICK_HEIGHT )) {
                  breaker(tempBodies[0], 50);
                }
                else if ((row == -BRICK_HEIGHT ) || (row == BRICK_HEIGHT )) {
                  breaker(tempBodies[0], 75);
                }
                else if (row == 0) {
                  Matter.World.remove(world, tempBodies[0]);
                  checkBlockCount();
                }
              }
              // Center col
              else if (col == 0 && tempBodies[0].breakable) {
                if ((row == -4*BRICK_HEIGHT ) || (row == 4*BRICK_HEIGHT )) {
                  breaker(tempBodies[0], 25);
                }
                else if ((row == -3*BRICK_HEIGHT ) || (row == 3*BRICK_HEIGHT )) {
                  breaker(tempBodies[0], 50);
                }
                else if ((row == -2*BRICK_HEIGHT ) || (row == 2*BRICK_HEIGHT )) {
                  breaker(tempBodies[0], 75);
                }
                else if ((row == -BRICK_HEIGHT ) || (row == BRICK_HEIGHT ) || (row == 0)) {
                  Matter.World.remove(world, tempBodies[0]);
                  checkBlockCount();
                }
              }
            }
          }
        }
      }
    }

    function breaker(iceCube, breakage) {
      if (iceCube.breakage > breakage){
        checkAndPlayCrack(iceCube);
        iceCube.breakage -= breakage;
      }
      else{
        Matter.World.remove(world, iceCube);
        checkBlockCount();
        breakSound.play();
      }
    }

    //handWireFrame
    function handPointCircles(){
      for (let i = 0; i < hands.length; i++) {
          let hand = hands[i];
    
          for (let j = 0; j < hand.keypoints.length; j++) {
            let keypoint = hand.keypoints[j];
    
            // Map keypoints to the canvas
            let mappedX = p.map(keypoint.x, 0, video.width, 0, p.width);
            let mappedY = p.map(keypoint.y, 0, video.height, 0, p.height);
            let finalX = p.width - mappedX; // Flip to match mirrored video
            
            p.fill(255, 0, 255);
            p.noStroke();
            p.circle(finalX, mappedY, 10);
          }
        }
    };

    //Gestures

    function lighter() {
      let fingersClosed = fourFingersDown(hands, 75);  
      let thumbIsClosed = thumbClosed(hands, 75);  
    
      if (fingersClosed && !thumbIsClosed) {  
        const thumbPosition = fingerPos(4);  // Get thumb position
        if (thumbPosition !== null) { 
          p.textSize(80);
          p.textAlign(p.CENTER, p.CENTER);
          p.text("🔥", thumbPosition.x, thumbPosition.y);  
          return {x: thumbPosition.x, y: thumbPosition.y};
        }
      }
    
      return null;  
    }

    let pinchReset = true;

    function pinchDetect() {
      let threshold = 30;
      const thumbPosition = fingerPos(4);  // Thumb tip
      const indexPosition = fingerPos(8);  // Index tip

      let fingersClosed = threeFingersDown(hands, 100);
      let indexDown = fourFingersDown(hands, 100);
      
      if (fingersClosed && thumbPosition && indexPosition && !indexDown) {
        let pinchDistance = p.dist(thumbPosition.x, thumbPosition.y, indexPosition.x, indexPosition.y);
        //console.log("Pinch Distance:", pinchDistance);

        // if (pinchReset) {
        //   threshold = 50;
        // }
        // else{
        //   threshold = 80;
        // }
        // console.log(pinchReset);

        if (pinchDistance <= threshold) {
          pinchReset = false;  // Prevent repeated erasing
          //console.log("pinch");
          //console.log({x: thumbPosition.x, y: thumbPosition.y});
          return {x: thumbPosition.x, y: thumbPosition.y};
          
        }
        else if(pinchDistance > threshold){
          //console.log("unpinch");
          //console.log({x: thumbPosition.x, y: thumbPosition.y});
          pinchReset = true;  // Reset when fingers are apart
        }
      }
      return {x: 0, y: 0}; 
      //console.log("zep")
    }
    function checkFistCollision(ellipsePos) {
      const middleKnucklePos = fingerPos(9);
      if (!middleKnucklePos) return false;
      return Math.abs(middleKnucklePos.y - ellipsePos.y) < 50;
    }

    function fistMade() {
      return fourFingersDown(hands, 50) && thumbClosed(hands, 50);
    }

    function fingerPos(fingerIndex) {
      let x = null, y = null;
    
      for (let i = 0; i < hands.length; i++) {
        let hand = hands[i];
    
        for (let j = 0; j < hand.keypoints.length; j++) {
          let keypoint = hand.keypoints[j];
    
          let mappedX = p.map(keypoint.x, 0, video.width, 0, p.width);
          let mappedY = p.map(keypoint.y, 0, video.height, 0, p.height);
          let finalX = p.width - mappedX; // Mirror adjustment

          if (j === fingerIndex) { // Get the position of the requested finger
            x = finalX;
            y = mappedY;
          }
    
        // If both keypoints are found, check the distance
          if (x, y) {
            return {x: x, y: y};
          }
        }
      }
    
      return x !== null && y !== null ? { x, y } : null;
    }

    function thumbClosed(hands, threshold) {
      let x4, y4, x11, y11;
    
      for (let i = 0; i < hands.length; i++) {
        let hand = hands[i];
    
        for (let j = 0; j < hand.keypoints.length; j++) {
          let keypoint = hand.keypoints[j];
    
          let mappedX = p.map(keypoint.x, 0, video.width, 0, p.width);
          let mappedY = p.map(keypoint.y, 0, video.height, 0, p.height);
          let finalX = p.width - mappedX; // Mirror adjustment
          
          if (j === 4) { 
            x4 = finalX; 
            y4 = mappedY;
          } 
          else if (j === 11) { 
            x11 = finalX; 
            y11 = mappedY;
          }
        }
    
        // If both keypoints are found, check the distance
        if (x4, y4, x11, y11) {
          let thumbDistance = p.dist(x4, y4, x11, y11);
          if(thumbDistance <= threshold){
            return true;
          }
        }
      }
    
      return false;
    }
    function fourFingersDown(hands, threshold) {
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
          //console.log(`Distance between keypoints 5 and 8: ${indexDistance}`);
          if(indexDistance <= threshold &&
            middleDistance <= threshold &&
            ringDistance <= threshold &&
            pinkyDistance <= threshold){
            return true;
          }
        }
      }
    
      return false; // Default true if keypoints aren't detected
    }

    function threeFingersDown(hands, threshold){
      let x12, y12, x9, y9, x16, y16, x13, y13, x20, y20, x17, y17;
    
      for (let i = 0; i < hands.length; i++) {
        let hand = hands[i];
    
        for (let j = 0; j < hand.keypoints.length; j++) {
          let keypoint = hand.keypoints[j];
    
          let mappedX = p.map(keypoint.x, 0, video.width, 0, p.width);
          let mappedY = p.map(keypoint.y, 0, video.height, 0, p.height);
          let finalX = p.width - mappedX; // Mirror adjustment
          
          //middle finger
          if (j === 12) { 
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
        if (x12, y12, x9, y9, x16, y16, x13, y13, x20, y20, x17, y17) {
          let middleDistance = p.dist(x12, y12, x9, y9);
          let ringDistance = p.dist(x16, y16, x13, y13);
          let pinkyDistance = p.dist(x20, y20, x17, y17);
          //console.log(`Distance between keypoints 5 and 8: ${indexDistance}`);
          if(
            middleDistance <= threshold &&
            ringDistance <= threshold &&
            pinkyDistance <= threshold){
            return true;
          }
        }
      }
    
      return false; // Default true if keypoints aren't detected
    }
  
    
    // Handle window resize
    p.windowResize = () => {
      const canvasContainer = document.getElementById("canvas-container")
      p.resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight)
      p.background(30)
    }

    function gotHands(results) {
      // save the output to the hands variable
      hands = results;
    }

    function createIceWall() {
      // Adjust wall properties for squares
      const rows = 11;  // Reduced rows since squares are taller
      const bricksPerRow = 12; // Adjusted for better square layout
      const startX = (p.width - (bricksPerRow * (BRICK_WIDTH + BRICK_GAP))) / 2;
      const startY = p.height - (rows * (BRICK_HEIGHT + BRICK_GAP));

      // Create bricks
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < bricksPerRow; col++) {
          const brick = Bodies.rectangle(
            startX + col * (BRICK_WIDTH + BRICK_GAP) + p.random(-5, 5) + 45,
            startY + row * (BRICK_HEIGHT + BRICK_GAP),
            BRICK_WIDTH,
            BRICK_HEIGHT,
            {
              restitution: 0.5,
              friction: 0.5,
              density: 1,
              breakable: true,
              breakage: 100,
              crackLevel: 0  // Add this to track current crack pattern
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
        { isStatic: true,
          breakable: false
         }
      );

      // Left wall
      const leftWall = Bodies.rectangle(
        0,
        p.height / 2,
        wallThickness,
        p.height,
        { isStatic: true,
          breakable: false
         }
      );

      // Right wall
      const rightWall = Bodies.rectangle(
        p.width,
        p.height / 2,
        wallThickness,
        p.height,
        { isStatic: true,
          breakable: false
         }
      );

      // Ceiling (top)
      const ceiling = Bodies.rectangle(
        p.width / 2,
        0,
        p.width,
        wallThickness,
        { isStatic: true,
          breakable: false
         }
      );

      // Add all boundaries to the world
      World.add(world, [ground, leftWall, rightWall]);
    }

    function generateCrackPattern(vertices) {
      // Generate relative to block size rather than absolute coordinates
      let patterns = [];
      
      for (let i = 0; i < 10; i++) {  // Increased to 10 patterns for each 10-point interval
        let pattern = [];
        let numCracks = 2 + i;  // More cracks for each stage
        
        for (let j = 0; j < numCracks; j++) {
          let angle = (j * Math.PI * 2 / numCracks) + (Math.random() * 0.5 - 0.25);
          let length = 0.3 + (i * 0.05); // Length increases more gradually
          
          let crack = {
            start: { x: 0, y: 0 }, // Center point
            end: {
              x: Math.cos(angle) * length,
              y: Math.sin(angle) * length
            },
            branches: []
          };
          
          // Add branches with relative coordinates
          let numBranches = Math.floor(i/2) + 1; // More gradual increase in branches
          for (let k = 0; k < numBranches; k++) {
            let branchStart = {
              x: Math.cos(angle) * (length * 0.5),
              y: Math.sin(angle) * (length * 0.5)
            };
            let branchAngle = angle + (Math.random() * 0.8 - 0.4);
            let branchLength = length * 0.4;
            
            crack.branches.push({
              start: branchStart,
              end: {
                x: branchStart.x + Math.cos(branchAngle) * branchLength,
                y: branchStart.y + Math.sin(branchAngle) * branchLength
              }
            });
          }
          
          pattern.push(crack);
        }
        patterns.push(pattern);
      }
      
      return patterns;
    }

    function drawCrackPattern(pattern, buffer, alpha, body) {
      buffer.stroke(255, 255, 255, 255 * alpha);
      buffer.strokeWeight(1);
      
      let centerX = (body.vertices[0].x + body.vertices[2].x) / 2;
      let centerY = (body.vertices[0].y + body.vertices[2].y) / 2;
      let width = BRICK_WIDTH;
      
      pattern.forEach(crack => {
        let startX = centerX + crack.start.x * width;
        let startY = centerY + crack.start.y * width;
        let endX = centerX + crack.end.x * width;
        let endY = centerY + crack.end.y * width;
        
        buffer.line(startX, startY, endX, endY);
        
        crack.branches.forEach(branch => {
          let branchStartX = centerX + branch.start.x * width;
          let branchStartY = centerY + branch.start.y * width;
          let branchEndX = centerX + branch.end.x * width;
          let branchEndY = centerY + branch.end.y * width;
          
          buffer.line(branchStartX, branchStartY, branchEndX, branchEndY);
        });
      });
    }

    // Add this function to create a new row
    function spawnNewRow() {
      const bricksPerRow = 12; // Match your existing wall width
      const startX = (p.width - (bricksPerRow * (BRICK_WIDTH + BRICK_GAP))) / 2;
      
      for (let col = 0; col < bricksPerRow; col++) {
        const brick = Bodies.rectangle(
          startX + col * (BRICK_WIDTH + BRICK_GAP) + p.random(-5, 5) + 45,
          0, // At the top of the screen
          BRICK_WIDTH,
          BRICK_HEIGHT,
          {
            restitution: 0.5,
            friction: 0.5,
            density: 1,
            breakable: true,
            breakage: 100,
            crackLevel: 0
          }
        );
        World.add(world, brick);
      }
    }

    // Add this function to check block count and spawn new row
    function checkBlockCount() {
      brokenBlockCount++;
      totalBrokenBlocks++;
      if (brokenBlockCount >= BLOCKS_TO_SPAWN && totalBrokenBlocks < blocksBrokenToWin) {
        spawnNewRow();
        brokenBlockCount = 0;
        console.log("totalBrokenBlocks: " + totalBrokenBlocks);
      }
    }
  })
})


function generateCrackPattern(vertices) {
  // Generate relative to block size rather than absolute coordinates
  let patterns = [];
  
  for (let i = 0; i < 10; i++) {  // Increased to 10 patterns for each 10-point interval
    let pattern = [];
    let numCracks = 2 + i;  // More cracks for each stage
    
    for (let j = 0; j < numCracks; j++) {
      let angle = (j * Math.PI * 2 / numCracks) + (Math.random() * 0.5 - 0.25);
      let length = 0.3 + (i * 0.05); // Length increases more gradually
      
      let crack = {
        start: { x: 0, y: 0 }, // Center point
        end: {
          x: Math.cos(angle) * length,
          y: Math.sin(angle) * length
        },
        branches: []
      };
      
      // Add branches with relative coordinates
      let numBranches = Math.floor(i/2) + 1; // More gradual increase in branches
      for (let k = 0; k < numBranches; k++) {
        let branchStart = {
          x: Math.cos(angle) * (length * 0.5),
          y: Math.sin(angle) * (length * 0.5)
        };
        let branchAngle = angle + (Math.random() * 0.8 - 0.4);
        let branchLength = length * 0.4;
        
        crack.branches.push({
          start: branchStart,
          end: {
            x: branchStart.x + Math.cos(branchAngle) * branchLength,
            y: branchStart.y + Math.sin(branchAngle) * branchLength
          }
        });
      }
      
      pattern.push(crack);
    }
    patterns.push(pattern);
  }
  
  return patterns;
}

function drawCrackPattern(pattern, p, alpha, body) {
  p.stroke(255, 255, 255, 255 * alpha);
  p.strokeWeight(1);
  
  // Get block center and size
  let centerX = (body.vertices[0].x + body.vertices[2].x) / 2;
  let centerY = (body.vertices[0].y + body.vertices[2].y) / 2;
  let width = 90;
  
  pattern.forEach(crack => {
    // Transform relative coordinates to actual position
    let startX = centerX + crack.start.x * width;
    let startY = centerY + crack.start.y * width;
    let endX = centerX + crack.end.x * width;
    let endY = centerY + crack.end.y * width;
    
    // Draw main crack
    p.line(startX, startY, endX, endY);
    
    // Draw branches
    crack.branches.forEach(branch => {
      let branchStartX = centerX + branch.start.x * width;
      let branchStartY = centerY + branch.start.y * width;
      let branchEndX = centerX + branch.end.x * width;
      let branchEndY = centerY + branch.end.y * width;
      
      p.line(branchStartX, branchStartY, branchEndX, branchEndY);
    });
  });
}

// // Play/Pause functionality
// playPauseBtn.addEventListener("click", () => {
//   isPlaying = !isPlaying

//   if (isPlaying) {
//     playPauseText.textContent = "Pause"
//     playIcon.classList.add("hidden")
//     pauseIcon.classList.remove("hidden")
//     if (p5Instance && p5Instance.loop) {
//       p5Instance.loop()
//     }
//   } else {
//     playPauseText.textContent = "Play"
//     playIcon.classList.remove("hidden")
//     pauseIcon.classList.add("hidden")
//     if (p5Instance && p5Instance.noLoop) {
//       p5Instance.noLoop()
//     }
//   }
// })

// // Reset functionality
// resetBtn.addEventListener("click", () => {
//   window.location.reload()
// })