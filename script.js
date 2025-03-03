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
    video = p.createCapture(p.VIDEO);
    video.size(640, 480);
    video.hide();
    handPose.detectStart(video, gotHands);
  }

  // Draw function runs continuously
  p.draw = () => {
    if (video) {
      // Display unflipped video
      p.image(video, 0, 0, p.width, p.height);
    }
    
    for (let i = 0; i < hands.length; i++) {
      let hand = hands[i];
      for (let j = 0; j < hand.keypoints.length; j++) {
        let keypoint = hand.keypoints[j];
        
        // Scale the keypoints to match the canvas dimensions
        let x = p.map(keypoint.x, 0, video.width, 0, p.width);
        let y = p.map(keypoint.y, 0, video.height, 0, p.height);
        
        p.fill(0, 255, 0);
        p.noStroke();
        p.circle(x, y, 10);
      }
    }
    if (!isPlaying) return

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

