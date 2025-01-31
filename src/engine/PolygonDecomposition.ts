import { vec2 } from 'gl-matrix'

function sign(p1: vec2, p2: vec2, p3: vec2) {
    return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0])
}

const intersect = (() => {
    const aDir = vec2.create()
    const bDir = vec2.create()
    return (
        a1: vec2,
        a2: vec2,
        b1: vec2,
        b2: vec2,
        a1Bounded: boolean
    ): boolean => {
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
        return t1 > 0 && t2 > 0 && t2 < 1 && (!a1Bounded || t1 < 1)
    }
})()

export const isInside = (() => {
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
            const p3 = polygon[k]
            const p4 = polygon[k2]
            if (intersect(m, n, p3, p4, false)) {
                ++intersections
            }
        }
        return intersections % 2 === 1
    }
})()

export const isVisible = (() => {
    return (polygon: vec2[], i: number, j: number): [boolean, number] => {
        const p1 = polygon[i]
        const p2 = polygon[j]
        for (let k = 0; k < polygon.length; ++k) {
            const k2 = (k + 1) % polygon.length
            if (k === i || k2 === j || k === j || k2 === i) {
                continue
            }
            const p3 = polygon[k]
            const p4 = polygon[k2]
            if (intersect(p1, p2, p3, p4, true)) {
                return [false, k]
            }
        }
        return [true, 0]
    }
})()

export function slicePolygon(polygon: vec2[], i: number, j: number) {
    if (i < j) {
        return polygon.slice(i, j + 1)
    }
    return [...polygon.slice(i), ...polygon.slice(0, j + 1)]
}

function removeIdenticalPoints(polygon: vec2[]) {
    const result = []
    for (let i = 0; i < polygon.length; ++i) {
        if (
            i === 0 ||
            polygon[i][0] !== polygon[i - 1][0] ||
            polygon[i][1] !== polygon[i - 1][1]
        ) {
            result.push(polygon[i])
        }
    }
    return result
}
function removeCollinearPoints(polygon: vec2[]) {
    const result = []
    for (let i = 0; i < polygon.length; ++i) {
        const p1 = polygon[i]
        const p2 = polygon[(i + 1) % polygon.length]
        const p3 = polygon[(i + 2) % polygon.length]
        const v0 = vec2.subtract(vec2.create(), p2, p1)
        vec2.normalize(v0, v0)
        const v1 = vec2.subtract(vec2.create(), p3, p2)
        vec2.normalize(v1, v1)
        if (vec2.dot(v0, v1) < 0.999) {
            result.push(p2)
        }
    }
    return result
}

function findSignChange(polygon: vec2[]): number[] {
    const indices = []
    const signs: boolean[] = []
    for (let i = 0; i < polygon.length; ++i) {
        const p1 = polygon[i]
        const p2 = polygon[(i + 1) % polygon.length]
        const p3 = polygon[(i + 2) % polygon.length]
        const positive = sign(p1, p2, p3) > 0
        if (indices.length === 0 || signs[signs.length - 1] !== positive) {
            indices.push((i + 1) % polygon.length)
            signs.push(positive)
        }
    }
    if (signs[0] === signs[signs.length - 1]) {
        indices.shift()
    }
    return indices
}

function decomposePolygonInternal(
    polygon: vec2[],
    depth: number,
    shortest: number
): vec2[][] | null {
    console.log(`${depth}`, `\t`.repeat(depth), polygon)
    if (depth > 10) {
        console.log('overda')
    }
    if (polygon.length < 3) {
        throw Error('bad')
    }
    if (polygon.length == 3) {
        return [polygon]
    }
    const indices = findSignChange(polygon)
    if (indices.length === 0) {
        return [polygon]
    }
    if (shortest < 3) {
        return null
    }
    let min: vec2[][] | null = null
    for (const v1 of indices) {
        for (let j = 0; j < polygon.length - 3; ++j) {
            const v2 = (v1 + 2 + j) % polygon.length
            if (!isVisible(polygon, v1, v2)[0]) {
                continue
            }
            if (!isInside(polygon, v1, v2)) {
                continue
            }
            const left = slicePolygon(polygon, v1, v2)
            const right = slicePolygon(polygon, v2, v1)
            const leftPoints = decomposePolygonInternal(
                left,
                depth + 1,
                shortest - 1
            )
            if (leftPoints && leftPoints.length < shortest) {
                const rightPoints = decomposePolygonInternal(
                    right,
                    depth + 1,
                    shortest - leftPoints.length
                )
                if (rightPoints) {
                    const decomposed = [...leftPoints, ...rightPoints]
                    if (!min || decomposed.length < min.length) {
                        min = decomposed
                        shortest = min.length
                    }
                }
            }
        }
    }
    return min
}

export function decomposePolygon(polygon: vec2[]): vec2[][] {
    return (
        decomposePolygonInternal(
            removeCollinearPoints(removeIdenticalPoints(polygon)),
            0,
            999999
        ) || [polygon]
    )
}
