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

// Initialize p5.js sketch
new p5((p) => {
  // Store reference to p5 instance
  p5Instance = p
  let handPose;
  let video;
  let hands = [];
  p.preload = () => {
    // Load the handPose model
    console.log("Preloading HandPose model...");
    handPose = ml5.handPose();
  }
  // Setup function runs once
  p.setup = () => {
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
  }

  // Draw function runs continuously
  p.draw = () => {
    p.background(30);
    
    if (video) {
      // Flip the video horizontally
      p.push();
      p.translate(p.width, 0);
      p.scale(-1, 1);
      p.image(video, 0, 0, p.width, p.height);
      p.pop();
      console.log(lighter());
      // for (let i = 0; i < hands.length; i++) {
      //   let hand = hands[i];
  
      //   for (let j = 0; j < hand.keypoints.length; j++) {
      //     let keypoint = hand.keypoints[j];
  
      //     // Map keypoints to the canvas
      //     let mappedX = p.map(keypoint.x, 0, video.width, 0, p.width);
      //     let mappedY = p.map(keypoint.y, 0, video.height, 0, p.height);
      //     let finalX = p.width - mappedX; // Flip to match mirrored video
          
      //     p.fill(255, 0, 255);
      //     p.noStroke();
      //     p.circle(finalX, mappedY, 10);
      //   }
      // }
    }
  };
  function lighter(){
    let returnValue = fourFingerClosed(hands, 75);
    let returnthumbValue = thumbClosed(hands, 75);
    if(!returnthumbValue && returnValue){
      return thumbPos(); 
    }
    return null;
  }

  function thumbPos(){
    let x4, y4, x11, y11;
  
    for (let i = 0; i < hands.length; i++) {
      let hand = hands[i];
  
      for (let j = 0; j < hand.keypoints.length; j++) {
        let keypoint = hand.keypoints[j];
  
        let mappedX = p.map(keypoint.x, 0, video.width, 0, p.width);
        let mappedY = p.map(keypoint.y, 0, video.height, 0, p.height);
        let finalX = p.width - mappedX; // Mirror adjustment
        
        //index
        if (j === 4) { 
          x4 = finalX; 
          y4 = mappedY;
        } 
      }
  
      // If both keypoints are found, check the distance
      if (x4, y4) {
        return { x: x4, y: y4 };
      }
      return null;
    }
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
        
        //index
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
  function gotHands(results) {
    // save the output to the hands variable
    hands = results;
  }
  
})

