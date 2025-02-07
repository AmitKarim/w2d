import { vec2, vec4 } from 'gl-matrix'
import { Debug_DrawLine } from '../Debug_LineDrawingSystem'

export type QuadTree<T> = {
    debugDraw: (cursor?: vec2, visit?: (x: T) => void) => void
    insert: (
        item: T,
        x: number,
        y: number,
        width: number,
        height: number
    ) => void
    query: (x: number, y: number, width: number, height: number) => T[]
}

export function createQuadTree<T>(
    start: vec2,
    size: vec2,
    maxItems: number,
    maxDepth: number
): QuadTree<T> {
    type DividedQuadTreeNode = {
        divided: true
        children: [QuadTreeNode, QuadTreeNode, QuadTreeNode, QuadTreeNode]
        mid: vec2
    }
    type UndividedQuadTreeNode = {
        items: T[]
        itemInfo: Float32Array
        divided: false
    }

    type QuadTreeNode = DividedQuadTreeNode | UndividedQuadTreeNode

    const root: QuadTreeNode = {
        items: [],
        itemInfo: new Float32Array(maxItems * 4),
        divided: false,
    }

    function divideNode(
        node: UndividedQuadTreeNode,
        midX: number,
        midY: number
    ): void {
        const children: [
            UndividedQuadTreeNode,
            UndividedQuadTreeNode,
            UndividedQuadTreeNode,
            UndividedQuadTreeNode,
        ] = [
            {
                items: [],
                divided: false,
                itemInfo: new Float32Array(maxItems * 4),
            },
            {
                items: [],
                divided: false,
                itemInfo: new Float32Array(maxItems * 4),
            },
            {
                items: [],
                divided: false,
                itemInfo: new Float32Array(maxItems * 4),
            },
            {
                items: [],
                divided: false,
                itemInfo: new Float32Array(maxItems * 4),
            },
        ]
        node.items.forEach((x, idx) => {
            if (node.itemInfo[idx * 4] < midX) {
                if (node.itemInfo[idx * 4 + 1] < midY) {
                    children[0].items.push(x)
                    children[0].itemInfo.set(
                        node.itemInfo.slice(idx * 4, idx * 4 + 4),
                        children[0].items.length * 4 - 4
                    )
                } else {
                    children[3].items.push(x)
                    children[3].itemInfo.set(
                        node.itemInfo.slice(idx * 4, idx * 4 + 4),
                        children[3].items.length * 4 - 4
                    )
                }
            } else {
                if (node.itemInfo[idx * 4 + 1] < midY) {
                    children[1].items.push(x)
                    children[1].itemInfo.set(
                        node.itemInfo.slice(idx * 4, idx * 4 + 4),
                        children[1].items.length * 4 - 4
                    )
                } else {
                    children[2].items.push(x)
                    children[2].itemInfo.set(
                        node.itemInfo.slice(idx * 4, idx * 4 + 4),
                        children[2].items.length * 4 - 4
                    )
                }
            }
        })
        const dividedNode: DividedQuadTreeNode = node as any
        dividedNode.divided = true
        dividedNode.children = children
        delete (dividedNode as any).items
        delete (dividedNode as any).itemInfo
    }

    function insertIntoNode(
        node: QuadTreeNode,
        depth: number,
        item: T,
        nodeX: number,
        nodeY: number,
        nodeWidth: number,
        nodeHeight: number,
        itemMinX: number,
        itemMinY: number,
        itemMaxX: number,
        itemMaxY: number
    ): void {
        if (!node.divided) {
            if (depth < maxDepth && node.items.length > maxItems - 1) {
                const midX =
                    node.items
                        .map(
                            (_, idx) =>
                                (node.itemInfo[idx * 4] +
                                    node.itemInfo[idx * 4 + 2]) *
                                0.5
                        )
                        .reduce((a, b) => a + b, 0) / node.items.length
                const midY =
                    node.items
                        .map(
                            (_, idx) =>
                                (node.itemInfo[idx * 4 + 1] +
                                    node.itemInfo[idx * 4 + 3]) *
                                0.5
                        )
                        .reduce((a, b) => a + b, 0) / node.items.length
                divideNode(node, midX, midY)
                ;(node as any).mid = vec2.fromValues(midX, midY)
            } else {
                node.itemInfo[node.items.length * 4] = itemMinX
                node.itemInfo[node.items.length * 4 + 1] = itemMinY
                node.itemInfo[node.items.length * 4 + 2] = itemMaxX
                node.itemInfo[node.items.length * 4 + 3] = itemMaxY
                node.items.push(item)
                return
            }
        }
        if (!node.divided) {
            throw new Error('not possible')
        }
        const midX = node.mid[0]
        const midY = node.mid[1]
        if (itemMinX < midX) {
            if (itemMinY < midY) {
                insertIntoNode(
                    node.children[0],
                    depth + 1,
                    item,
                    nodeX,
                    nodeY,
                    midX - nodeX,
                    midY - nodeY,
                    itemMinX,
                    itemMinY,
                    itemMaxX,
                    itemMaxY
                )
            }
            if (itemMaxY > midY) {
                insertIntoNode(
                    node.children[3],
                    depth + 1,
                    item,
                    nodeX,
                    midY,
                    midX - nodeX,
                    nodeY + nodeHeight - midY,
                    itemMinX,
                    itemMinY,
                    itemMaxX,
                    itemMaxY
                )
            }
        }
        if (itemMaxX > midX) {
            if (itemMinY < midY) {
                insertIntoNode(
                    node.children[1],
                    depth + 1,
                    item,
                    midX,
                    nodeY,
                    nodeX + nodeWidth - midX,
                    midY - nodeY,
                    itemMinX,
                    itemMinY,
                    itemMaxX,
                    itemMaxY
                )
            }
            if (itemMaxY > midY) {
                insertIntoNode(
                    node.children[2],
                    depth + 1,
                    item,
                    midX,
                    midY,
                    nodeX + nodeWidth - midX,
                    nodeY + nodeHeight - midY,
                    itemMinX,
                    itemMinY,
                    itemMaxX,
                    itemMaxY
                )
            }
        }
    }

    function queryFromNode(
        node: QuadTreeNode,
        nodeX: number,
        nodeY: number,
        nodeWidth: number,
        nodeHeight: number,
        queryMinX: number,
        queryMinY: number,
        queryMaxX: number,
        queryMaxY: number,
        dataOut: T[]
    ) {
        if (!node.divided) {
            const items = node.items.filter((_, idx) => {
                if (node.itemInfo[idx * 4 + 2] <= queryMinX) {
                    return false
                }
                if (node.itemInfo[idx * 4] >= queryMaxX) {
                    return false
                }
                if (node.itemInfo[idx * 4 + 3] <= queryMinY) {
                    return false
                }
                if (node.itemInfo[idx * 4 + 1] >= queryMaxY) {
                    return false
                }
                return true
            })
            items.forEach((x) => dataOut.push(x))
            return
        }
        const midX = node.mid[0]
        const midY = node.mid[1]
        if (queryMinX < midX) {
            if (queryMinY < midY) {
                queryFromNode(
                    node.children[0],
                    nodeX,
                    nodeY,
                    midX - nodeX,
                    midY - nodeY,
                    queryMinX,
                    queryMinY,
                    queryMaxX,
                    queryMaxY,
                    dataOut
                )
            }
            if (queryMaxY > midY) {
                queryFromNode(
                    node.children[3],
                    nodeX,
                    midY,
                    midX - nodeX,
                    nodeY + nodeHeight - midY,
                    queryMinX,
                    queryMinY,
                    queryMaxX,
                    queryMaxY,
                    dataOut
                )
            }
        }
        if (queryMaxX > midX) {
            if (queryMinY < midY) {
                queryFromNode(
                    node.children[1],
                    midX,
                    nodeY,
                    nodeX + nodeWidth - midX,
                    midY - nodeY,
                    queryMinX,
                    queryMinY,
                    queryMaxX,
                    queryMaxY,
                    dataOut
                )
            }
            if (queryMaxY > midY) {
                queryFromNode(
                    node.children[2],
                    midX,
                    midY,
                    nodeX + nodeWidth - midX,
                    nodeY + nodeHeight - midY,
                    queryMinX,
                    queryMinY,
                    queryMaxX,
                    queryMaxY,
                    dataOut
                )
            }
        }
    }

    function debugDrawNode(
        node: QuadTreeNode,
        x: number,
        y: number,
        width: number,
        height: number,
        cursor?: vec2,
        visit?: (x: T) => void
    ) {
        if (!node.divided) {
            if (cursor) {
                if (
                    cursor[0] > x &&
                    cursor[0] < x + width &&
                    cursor[1] > y &&
                    cursor[1] < y + height
                ) {
                    node.items.forEach((_x, idx) => {
                        const color = vec4.fromValues(0, 0, 1, 1)
                        const v: [number, number][] = [
                            [
                                node.itemInfo[idx * 4],
                                node.itemInfo[idx * 4 + 1],
                            ],
                            [
                                node.itemInfo[idx * 4 + 2],
                                node.itemInfo[idx * 4 + 1],
                            ],
                            [
                                node.itemInfo[idx * 4 + 2],
                                node.itemInfo[idx * 4 + 3],
                            ],
                            [
                                node.itemInfo[idx * 4],
                                node.itemInfo[idx * 4 + 3],
                            ],
                        ]
                        Debug_DrawLine(v[0], v[1], color)
                        Debug_DrawLine(v[1], v[2], color)
                        Debug_DrawLine(v[2], v[3], color)
                        Debug_DrawLine(v[3], v[0], color)
                    })
                    // console.log(node.items)
                    const v: [number, number][] = [
                        [x, y],
                        [x + width, y],
                        [x + width, y + height],
                        [x, y + height],
                    ]
                    Debug_DrawLine(v[0], v[1], [1, 0, 0, 1])
                    Debug_DrawLine(v[1], v[2], [1, 0, 0, 1])
                    Debug_DrawLine(v[2], v[3], [1, 0, 0, 1])
                    Debug_DrawLine(v[3], v[0], [1, 0, 0, 1])
                }
            }
            return
        }

        const midX = node.mid[0]
        const midY = node.mid[1]
        Debug_DrawLine(
            vec2.fromValues(x, midY),
            vec2.fromValues(x + width, midY),
            [0, 1, 0, 0.8]
        )
        Debug_DrawLine(
            vec2.fromValues(midX, y),
            vec2.fromValues(midX, y + height),
            [0, 1, 0, 0.8]
        )

        debugDrawNode(node.children[0], x, y, midX - x, midY - y, cursor, visit)
        debugDrawNode(
            node.children[1],
            midX,
            y,
            x + width - midX,
            midY - y,
            cursor,
            visit
        )
        debugDrawNode(
            node.children[2],
            midX,
            midY,
            x + width - midX,
            y + height - midY,
            cursor,
            visit
        )
        debugDrawNode(
            node.children[3],
            x,
            midY,
            midX - x,
            y + height - midY,
            cursor,
            visit
        )
    }

    return {
        insert: (
            item: T,
            x: number,
            y: number,
            width: number,
            height: number
        ) =>
            insertIntoNode(
                root,
                0,
                item,
                start[0],
                start[1],
                size[0],
                size[1],
                x,
                y,
                width,
                height
            ),
        query: (x: number, y: number, width: number, height: number): T[] => {
            const dataOut: T[] = []
            queryFromNode(
                root,
                start[0],
                start[1],
                size[0],
                size[1],
                x,
                y,
                width,
                height,
                dataOut
            )
            return dataOut
        },
        debugDraw: (cursor?: vec2, visit?: (x: T) => void) =>
            debugDrawNode(
                root,
                start[0],
                start[1],
                size[0],
                size[1],
                cursor,
                visit
            ),
    }
}
