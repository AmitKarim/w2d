import { vec2 } from 'gl-matrix'
import { RenderData } from './systems/Renderer'
import { createPlayerWorldData, PlayerData } from './systems/PlayerController'
import { ComponentType, defineComponent, Types } from 'bitecs'

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

export enum EnemyType {
    DiamondSquare = 1,
}

export type World = {
    components: {
        Position: ComponentType<{
            pos: ['f32', 3]
            vel: ['f32', 3]
            angle: 'f32'
            angularVelocity: 'f32'
        }>
        Health: ComponentType<{ health: 'f32' }>
        Color: ComponentType<{ color: ['f32', 3] }>
        Shapes: {
            Diamond: ComponentType<{ frame: 'i16' }>
            CrossedDiamond: ComponentType<{ frame: 'i16' }>
        }
        Parent: ComponentType<{ parent: 'eid' }>
        Enemy: ComponentType<{
            spawn_time: 'f32'
            shapes: ['eid', 16]
            num_shapes: 'i16'
            enemy_type: 'i16'
        }>
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
            Position: defineComponent({
                pos: [Types.f32, 3],
                vel: [Types.f32, 3],
                angle: Types.f32,
                angularVelocity: Types.f32,
            }),
            Health: defineComponent({ health: Types.f32 }),
            Color: defineComponent({ color: [Types.f32, 3] }),
            Shapes: {
                Diamond: defineComponent({ frame: Types.i16 }),
                CrossedDiamond: defineComponent({ frame: Types.i16 }),
            },
            Parent: defineComponent({ parent: Types.eid }),
            Enemy: defineComponent({
                spawn_time: Types.f32,
                shapes: [Types.eid, 16],
                enemy_type: Types.i16,
                num_shapes: Types.i16,
            }),
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
