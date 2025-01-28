import { vec2 } from 'gl-matrix'

function sign(p1: vec2, p2: vec2, p3: vec2) {
    return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0])
}

const intersect = (() => {
    const aDir = vec2.create()
    const bDir = vec2.create()
    return (a1: vec2, a2: vec2, b1: vec2, b2: vec2): boolean => {
        vec2.sub(aDir, a2, a1)
        vec2.sub(bDir, b2, b1)
        const denominator = bDir[0] * aDir[1] - aDir[0] * bDir[1]

        if (denominator === 0) {
            return false
        }

        const t1 =
            (bDir[0] * (b1[1] - a1[1]) - bDir[1] * (b1[0] - a1[0])) /
            denominator
        const t2 =
            (aDir[0] * (b1[1] - a1[1]) - aDir[1] * (b1[0] - a1[0])) /
            denominator
        return t1 > 0 && t1 < 1 && t2 > 0 && t2 < 1
    }
})()

function isVisible(polygon: vec2[], i: number, j: number) {
    const p1 = polygon[i]
    const p2 = polygon[j]

    for (let k = 0; k < polygon.length; ++k) {
        if (k === i || k === j) {
            continue
        }
        const p3 = polygon[k]
        const p4 = polygon[(k + 1) % polygon.length]
        if (intersect(p1, p2, p3, p4)) {
            return false
        }
    }
    return true
}

function slicePolygon(polygon: vec2[], i: number, j: number) {
    if (i < j) {
        return polygon.slice(i, j)
    }
    return polygon.slice(i).concat(polygon.slice(0, j))
}

export function decomposePolygon(polygon: vec2[]): vec2[][] {
    if (polygon.length == 3) {
        return [polygon]
    }
    let isPositive = false
    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i]
        const p2 = polygon[(i + 1) % polygon.length]
        const p3 = polygon[(i + 2) % polygon.length]

        const crossProduct = sign(p1, p2, p3)
        if (i === 0) {
            isPositive = crossProduct > 0
        } else if (crossProduct > 0 !== isPositive) {
            let min: vec2[][] | undefined = undefined
            for (let j = 0; j < polygon.length - 3; ++j) {
                if (isVisible(polygon, i, (i + 2 + j) % polygon.length)) {
                    const left = slicePolygon(polygon, i, j)
                    const right = slicePolygon(polygon, j, i)
                    const decomposed = decomposePolygon(left).concat(
                        decomposePolygon(right)
                    )
                    if (!min) {
                        min = decomposed
                    }
                    if (decomposed.length < min.length) {
                        min = decomposed
                    }
                }
                if (min) {
                    return min
                }
            }
        }
    }
    return [polygon]
}
