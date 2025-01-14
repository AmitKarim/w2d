import { createWorld, addEntity } from 'bitecs'
import { createWorldData } from './World'
import { createPositionUpdateSystem } from './systems/PositionUpdateSystem'
import { updateTime } from './systems/TimeSystem'
import { addPositionComponent } from './components/PositionComponent'
import { createRenderFunc } from './systems/Renderer'
import { createPlayerController } from './systems/PlayerController'

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
    addPositionComponent(player, world)

    const updateEntityPositions = createPositionUpdateSystem(world)
    const renderScene = await createRenderFunc(world, player)
    const updatePlayer = createPlayerController(world, player, canvas)
    const update = () => {
        updateTime(world)
        updatePlayer()
        updateEntityPositions(world)
        renderScene()
        requestAnimationFrame(update)
    }
    update()
}

main()
