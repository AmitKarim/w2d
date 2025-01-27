import { createWorld, addEntity, addComponent } from 'bitecs'
import { createWorldData } from './World'
import { updateTime } from './systems/TimeSystem'
import { createRenderFunc } from './systems/Renderer'
import { createPlayerController } from './systems/PlayerController'
import { createEnemyShapeUpdater } from './systems/UpdateEnemyShapes'
import { spawnDiamondSquare } from './components/EnemyComponent'
import { createBulletProcessor } from './systems/ProjectileSystem'

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

    spawnDiamondSquare(
        {
            pos: [32, 12],
            angle: 0,
            health: 100,
            color: [255, 0, 0],
        },
        world
    )

    const renderScene = await createRenderFunc(world, player)
    const updatePlayer = createPlayerController(world, player, canvas)
    const updateEnemies = createEnemyShapeUpdater(world, player)
    const updateBullets = createBulletProcessor(world, player)
    const update = () => {
        updateTime(world)
        updateEnemies()
        updatePlayer()
        updateBullets()
        renderScene()
        requestAnimationFrame(update)
    }
    update()
}

main()
