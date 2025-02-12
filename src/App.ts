import { createWorld, addEntity, addComponent } from 'bitecs'
import { createWorldData } from './World'
import { updateTime } from './systems/TimeSystem'
import { createRenderFunc } from './systems/Renderer'
import { createPlayerController } from './systems/PlayerController'
import { createEnemyShapeUpdater } from './systems/UpdateEnemyShapes'
import { createBulletProcessor } from './systems/ProjectileSystem'
import { createCollisionSystem } from './systems/CollisionSystem'
import { createCameraSystem } from './systems/CameraController'
import {
    createEnemyWaveSystem,
    createNextWave,
    getWaveComplete,
    getWaveLevel,
} from './systems/EnemyWaveSystem'

async function main() {
    let canvas = document.getElementById('canvas') as HTMLCanvasElement
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    let context = canvas.getContext('webgl2')
    if (!context) {
        return
    }
    const world = createWorld(
        createWorldData(context, canvas.width, canvas.height)
    )

    const player = addEntity(world)
    addComponent(world, world.components.Position, player)

    const renderScene = await createRenderFunc(world, player)
    const updatePlayer = createPlayerController(world, player, canvas)
    const updateEnemies = createEnemyShapeUpdater(world, player)
    const updateBullets = createBulletProcessor(world, player)
    const updateCollisions = createCollisionSystem(world, player)
    const updateCamera = createCameraSystem(world, player)
    const waveUpdater = createEnemyWaveSystem(world)
    const update = async () => {
        waveUpdater()
        if (getWaveComplete()) {
            createNextWave(getWaveLevel() + 1, world)
        }
        updateTime(world)
        updatePlayer()
        await Promise.all([updateBullets(), updateEnemies(), updateCamera()])
        updateCollisions()
        renderScene()
        requestAnimationFrame(update)
    }
    await update()
}

main()
