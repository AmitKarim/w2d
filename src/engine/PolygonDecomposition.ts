import { vec2 } from 'gl-matrix'

function sign(p1: vec2, p2: vec2, p3: vec2) {
    return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0])
}

const intersect = (() => {
    const aDir = vec2.create()
    const bDir = vec2.create()
    return (a1: vec2, a2: vec2, b1: vec2, b2: vec2, a1Bounded: boolean): boolean => {
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
        return (!a1Bounded || (Math.abs(t1) > 0 && Math.abs(t1) < 1)) && Math.abs(t2) > 0 && Math.abs(t2) < 1
    }
})()

const isInside = (() => {
    const m = vec2.create()
    const n = vec2.create()
    return (polygon: vec2[], i: number, j: number) => {
        const p1 = polygon[i]
        const p2 = polygon[j]
        vec2.add(m, p1, p2)
        vec2.scale(m, m, 0.5)
        vec2.subtract(n, p2, p1)
        const tmp = n[0]
        n[0] = n[1]
        n[1] = -tmp
        vec2.add(n, m, n)
        let intersections = 0
        for (let k = 0; k < polygon.length; ++k) {
            const k2 = (k + 1) % polygon.length
            if (k == i || k == j || k2 == i || k2 == j) {
                continue
            }
            const p3 = polygon[k]
            const p4 = polygon[k2]
            if (intersect(m, n, p3, p4, false)) {
                ++intersections
            }
        }
        return (intersections % 2) === 1
    }
})()

const isVisible = (() => {
    return (polygon: vec2[], i: number, j: number) => {
    const p1 = polygon[i]
    const p2 = polygon[j]
    for (let k = 0; k < polygon.length; ++k) {
        const k2 = (k + 1) % polygon.length
        if (k === i || k === j || k2 === i || k2 === j) {
            continue
        }
        const p3 = polygon[k]
        const p4 = polygon[(k + 1) % polygon.length]
        if (intersect(p1, p2, p3, p4, true)) {
            return false
        }
    }
    return true
}
})()

function slicePolygon(polygon: vec2[], i: number, j: number) {
    if (i < j) {
        if (j < polygon.length - 1) {
            return polygon.slice(i, j + 1)
        }
        return [...polygon.slice(i), polygon[0]]
    }
    return [...polygon.slice(i), ...polygon.slice(0, j + 1)]
}

// function isConvex(polygon: vec2[]): number {
//     let isPositive = false
//     for (let i = 0; i < polygon.length; ++i) {
//         const p1 = polygon[i]
//         const p2 = polygon[(i + 1) % polygon.length]
//         const p3 = polygon[(i + 2) % polygon.length]

//         const crossProduct = sign(p1, p2, p3)
//         if (i === 0) {
//             isPositive = crossProduct > 0
//         } else if (crossProduct > 0 !== isPositive) {
//             return i
//         }
//     }
//     return polygon.length
// }

export function decomposePolygon(polygon: vec2[]): vec2[][] {
    if (polygon.length == 3) {
        return [polygon]
    }
    let isPositive = false
    let min: vec2[][] | undefined = undefined
    for (let startIdx = 0; startIdx < polygon.length; ++startIdx) {
        for (let i = startIdx; i < polygon.length; i++) {
            const p1 = polygon[i]
            const p2 = polygon[(i + 1) % polygon.length]
            const p3 = polygon[(i + 2) % polygon.length]

            const crossProduct = sign(p1, p2, p3)
            if (i === 0) {
                isPositive = crossProduct > 0
            } else if (crossProduct > 0 !== isPositive) {
                const v1 = (i + 1) % polygon.length
                for (let j = 0; j < polygon.length - 3; ++j) {
                    const v2 = (i + 3 + j) % polygon.length
                    if (!isInside(polygon, v1, v2)) {
                        continue
                    }
                    if (isVisible(polygon, v1, v2)) {
                        const left = slicePolygon(polygon, v1, v2)
                        const right = slicePolygon(polygon, v2, v1)
                        const decomposed = [...decomposePolygon(left), ...decomposePolygon(right)]
                        return decomposed
                        if (!min) {
                            min = decomposed
                        }
                        if (decomposed.length < min.length) {
                            min = decomposed
                        }
                    }
                }
            }
        }
    }
    if (min) {
        return min
    }
    return [polygon]
}
