import { vec2 } from 'gl-matrix'

function projectPolygon(axis: vec2, polygon: vec2[]): [number, number] {
    let min = vec2.dot(axis, polygon[0])
    let max = min
    for (let i = 1; i < polygon.length; i++) {
        const projection = vec2.dot(axis, polygon[i])
        if (projection < min) {
            min = projection
        } else if (projection > max) {
            max = projection
        }
    }
    return [min, max]
}

function overlap(
    [minA, maxA]: [number, number],
    [minB, maxB]: [number, number]
): boolean {
    return maxA >= minB && maxB >= minA
}

function getAxes(polygon: vec2[]): vec2[] {
    const axes: vec2[] = []
    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i]
        const p2 = polygon[(i + 1) % polygon.length]
        const edge = vec2.subtract(vec2.create(), p2, p1)
        const normal = vec2.fromValues(-edge[1], edge[0])
        vec2.normalize(normal, normal)
        axes.push(normal)
    }
    return axes
}

export function checkCollision(p1: vec2[], p2: vec2[]): boolean {
    const axes1 = getAxes(p1)
    const axes2 = getAxes(p2)

    for (const axis of [...axes1, ...axes2]) {
        const projection1 = projectPolygon(axis, p1)
        const projection2 = projectPolygon(axis, p2)
        if (!overlap(projection1, projection2)) {
            return false
        }
    }
    return true
}
