import { createWorld, addEntity, addComponent } from 'bitecs'
import { createWorldData } from './World'
import { createPositionUpdateSystem } from './systems/PositionUpdateSystem'
import { updateTime } from './systems/TimeSystem'
import { addPositionComponent } from './components/PositionComponent'
import { createRenderFunc } from './systems/Renderer'

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
    addComponent(world, world.components.Player, player)
    addComponent(world, world.components.Sprite, player)
    world.components.Sprite.width[player] = 0.1
    world.components.Sprite.height[player] = 0.1

    const updateEntityPositions = createPositionUpdateSystem(world)
    const renderScene = await createRenderFunc(world)
    const update = () => {
        updateTime(world)
        updateEntityPositions(world)
        renderScene()
        requestAnimationFrame(update)
    }
    update()
}

main()
