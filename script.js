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
  const BRICK_WIDTH = 80;  // Now equal to height since we want squares
  const BRICK_HEIGHT = 80; // Same as width
  const BRICK_GAP = 2;

  // Initialize p5.js sketch
  new p5((p) => {
    p5Instance = p;

    p.setup = () => {
      // Create canvas that fills the container
      const canvasContainer = document.getElementById("canvas-container")
      const canvas = p.createCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight)
      canvas.parent("canvas-container")
      
      // Initialize Matter.js engine
      engine = Engine.create();
      world = engine.world;
      
      // Enable gravity
      engine.world.gravity.y = 1;

      // Create the brick wall
      createIceWall();
    }

    p.draw = () => {
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
    }

    // Handle window resize
    p.windowResize = () => {
      const canvasContainer = document.getElementById("canvas-container")
      p.resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight)
      p.background(30)
    }

    function createIceWall() {
      // Adjust wall properties for squares
      const rows = 7;  // Reduced rows since squares are taller
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
  })
})

