import { vec2 } from 'gl-matrix'
import { PlayerComponent } from './components/PlayerComponent'
import {
    createPositionComponent,
    PositionComponent,
} from './components/PositionComponent'
import {
    createSpriteComponent,
    SpriteComponent,
} from './components/SpriteComponent'
import { RenderData } from './systems/Renderer'

type TimeData = {
    delta: number
    elapsed: number
    then: number
}
function createTimeData(): TimeData {
    return {
        delta: 0.0,
        elapsed: 0.0,
        then: performance.now(),
    }
}

export type Screen = {
    width: number
    height: number
}

export type World = {
    components: {
        Position: PositionComponent
        Sprite: SpriteComponent
        Player: PlayerComponent
    }
    time: TimeData
    render: RenderData
    screen: Screen
}

export function createWorldData(
    gl: WebGL2RenderingContext,
    width: number,
    height: number
): World {
    return {
        components: {
            Position: createPositionComponent(),
            Sprite: createSpriteComponent(),
            Player: {},
        },
        time: createTimeData(),
        render: {
            gl,
            cameraPos: vec2.create(),
        },
        screen: {
            width,
            height,
        },
    }
}
