// DOM Elements
const playPauseBtn = document.getElementById("play-pause-btn")
const playPauseText = document.getElementById("play-pause-text")
const playIcon = document.getElementById("play-icon")
const pauseIcon = document.getElementById("pause-icon")
const resetBtn = document.getElementById("reset-btn")
const tabButtons = document.querySelectorAll(".tab-btn")
const tabPanes = document.querySelectorAll(".tab-pane")
const currentYearElement = document.getElementById("current-year")


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

  // Setup function runs once
  p.setup = () => {
    // Create canvas that fills the container
    const canvasContainer = document.getElementById("canvas-container")
    const canvas = p.createCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight)
    canvas.parent("canvas-container")
    p.background(30)
    p.frameRate(60)
  }

  // Draw function runs continuously
  p.draw = () => {
    
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
      //mousePressed within window
    }
  }
})

