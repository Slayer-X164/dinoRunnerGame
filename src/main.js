import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const scene = new THREE.Scene()
scene.background = new THREE.Color('#f0b651')
scene.fog = new THREE.Fog('#f0b651', 0, 30)

// Ground
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(5, 50),
  new THREE.MeshPhongMaterial({ color: '#c9912e', side: THREE.DoubleSide })
)
plane.rotation.x = -Math.PI / 2
scene.add(plane)

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 8)
light.position.set(3, 5, 2)
scene.add(light, new THREE.AmbientLight(0xffffff, 1))

// Camera
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(3, 3, 8)

// Renderer
const canvas = document.querySelector('.webgl_canvas')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// Game state variables
let dino, mixer
let velocityY = 0
let gravity = -0.01
let jumpStrength = 0.25
let obstacles = []
let obstacleTimer = 0
let obstacleDelay = 100
let gameSpeed = 0.1
let score = 0
let gameOver = true

const loader = new GLTFLoader()
const clock = new THREE.Clock()
const scoreDisplay = document.querySelector('.score')
const startBtn = document.querySelector('.start')
const restartBtn = document.querySelector('.restart')
const menu = document.querySelector('.menu')

// Load dino
loader.load('/T-Rex.glb', (gltf) => {
  dino = gltf.scene
  dino.scale.set(0.13, 0.13, 0.13)
  dino.rotation.y = Math.PI
  dino.position.set(0, 0.5, 4)
  scene.add(dino)

  mixer = new THREE.AnimationMixer(dino)
  const clip = THREE.AnimationClip.findByName(gltf.animations, 'Armature|TRex_Run')
  mixer.clipAction(clip).play()
}, undefined, (err) => console.error(err))

// Load obstacle
const generateObstacle = () => {
  loader.load('/Green Cactus.glb', (gltf) => {
    const obs = gltf.scene
    obs.scale.set(3, 3, 3)
    obs.position.set(0, 0.5, -18)
    scene.add(obs)
    obstacles.push(obs)
  }, undefined, (err) => console.error(err))
}

// Handle jump
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && dino && dino.position.y <= 0.51) {
    velocityY = jumpStrength
  }
})

// Start game
startBtn.addEventListener('click', () => {
  resetGame()
  menu.style.display = 'none'
})

// Restart game
restartBtn.addEventListener('click', () => {
  resetGame()
  restartBtn.style.display = 'none'
})

// Reset game state
function resetGame() {
  gameOver = false
  gameSpeed = 0.1
  score = 0
  scoreDisplay.textContent = `Score: ${score}`

  // Reset dino
  if (dino) dino.position.set(0, 0.5, 4)
  velocityY = 0

  // Remove old obstacles
  obstacles.forEach(obs => scene.remove(obs))
  obstacles = []
}
restartBtn.addEventListener('click',()=>{
  console.log('click');
  
  gameOver = false
  gameSpeed = 0.1
  score = 0
  scoreDisplay.textContent = `Score: ${score}`
  dino.position.set(0, 0, 4)
  velocityY = 0

  // Remove existing obstacles
  for (let obs of obstacles) {
    scene.remove(obs)
  }
  obstacles = []
})
// Animate
function animate() {
  requestAnimationFrame(animate)
  if (gameOver) return

  const delta = clock.getDelta()
  if (mixer) mixer.update(delta)

  // Update dino position (jump)
  if (dino) {
    velocityY += gravity
    dino.position.y += velocityY
    if (dino.position.y <= 0.5) {
      dino.position.y = 0.5
      velocityY = 0
    }

    // Collision check
    const dinoBox = new THREE.Box3().setFromObject(dino)
    for (let obs of obstacles) {
      const obsBox = new THREE.Box3().setFromObject(obs)
      if (dinoBox.intersectsBox(obsBox)) {
        gameOver = true
        restartBtn.style.display = 'block'
        return
      }
    }
  }

  // Update obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].position.z += gameSpeed
    if (obstacles[i].position.z > 10) {
      scene.remove(obstacles[i])
      obstacles.splice(i, 1)
    }
  }

  // Spawn new obstacles
  obstacleTimer++
  if (obstacleTimer > obstacleDelay) {
    generateObstacle()
    obstacleTimer = 0
  }

  // Increase speed and score
  if (gameSpeed < 0.4) gameSpeed += 0.0002
  score += Math.floor(gameSpeed * 10)
  scoreDisplay.textContent = `Score: ${score}`

  controls.update()
  renderer.render(scene, camera)
}
animate()
