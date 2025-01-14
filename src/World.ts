import { vec2 } from 'gl-matrix'
import {
    createPositionComponent,
    PositionComponent,
} from './components/PositionComponent'
import { RenderData } from './systems/Renderer'
import { createPlayerWorldData, PlayerData } from './systems/PlayerController'

export const MaxView = 500

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
    }
    time: TimeData
    render: RenderData
    screen: Screen
    player: PlayerData
}

export function createWorldData(
    gl: WebGL2RenderingContext,
    width: number,
    height: number
): World {
    return {
        components: {
            Position: createPositionComponent(),
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
        player: createPlayerWorldData(),
    }
}
