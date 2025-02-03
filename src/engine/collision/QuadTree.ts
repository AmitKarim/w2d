import { vec2 } from 'gl-matrix'
import { Debug_DrawLine } from '../Debug_LineDrawingSystem'

export type QuadTree<T> = {
    debugDraw: () => void
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
        itemX: number,
        itemY: number,
        itemWidth: number,
        itemHeight: number
    ): void {
        if (!node.divided) {
            if (depth < maxDepth && node.items.length > maxItems - 1) {
                divideNode(
                    node,
                    nodeX + nodeWidth / 2.0,
                    nodeY + nodeHeight / 2.0
                )
            } else {
                node.itemInfo[node.items.length * 4] = itemX
                node.itemInfo[node.items.length * 4 + 1] = itemY
                node.itemInfo[node.items.length * 4 + 2] = itemWidth
                node.itemInfo[node.items.length * 4 + 3] = itemHeight
                node.items.push(item)
                return
            }
        }
        if (!node.divided) {
            throw new Error('not possible')
        }
        const halfWidth = nodeWidth / 2.0
        const halfHeight = nodeHeight / 2.0
        const midX = nodeX + halfWidth
        const midY = nodeY + halfHeight
        if (itemX < midX) {
            if (itemY < midY) {
                insertIntoNode(
                    node.children[0],
                    depth + 1,
                    item,
                    nodeX,
                    nodeY,
                    halfWidth,
                    halfHeight,
                    itemX,
                    itemY,
                    itemWidth,
                    itemHeight
                )
            }
            if (itemY + itemHeight > midY) {
                insertIntoNode(
                    node.children[3],
                    depth + 1,
                    item,
                    nodeX,
                    nodeY + halfHeight,
                    halfWidth,
                    halfHeight,
                    itemX,
                    itemY,
                    itemWidth,
                    itemHeight
                )
            }
        }
        if (itemX + itemWidth > midX) {
            if (itemY < midY) {
                insertIntoNode(
                    node.children[1],
                    depth + 1,
                    item,
                    nodeX + halfWidth,
                    nodeY,
                    halfWidth,
                    halfHeight,
                    itemX,
                    itemY,
                    itemWidth,
                    itemHeight
                )
            }
            if (itemY + itemHeight > midY) {
                insertIntoNode(
                    node.children[2],
                    depth + 1,
                    item,
                    nodeX + halfWidth,
                    nodeY + halfHeight,
                    halfWidth,
                    halfHeight,
                    itemX,
                    itemY,
                    itemWidth,
                    itemHeight
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
        queryX: number,
        queryY: number,
        queryWidth: number,
        queryHeight: number,
        dataOut: T[]
    ) {
        if (!node.divided) {
            const items = node.items.filter((_, idx) => {
                if (
                    node.itemInfo[idx * 4] + node.itemInfo[idx * 4 + 2] <=
                    queryX
                ) {
                    return false
                }
                if (node.itemInfo[idx * 4] >= queryX + queryWidth) {
                    return false
                }
                if (
                    node.itemInfo[idx * 4 + 1] + node.itemInfo[idx * 4 + 3] <=
                    queryY
                ) {
                    return false
                }
                if (node.itemInfo[idx * 4 + 1] >= queryY + queryHeight) {
                    return false
                }
                return true
            })
            items.forEach((x) => dataOut.push(x))
            return
        }
        const halfWidth = nodeWidth / 2.0
        const halfHeight = nodeHeight / 2.0
        const midX = nodeX + halfWidth
        const midY = nodeY + halfHeight
        if (queryX < midX) {
            if (queryY < midY) {
                queryFromNode(
                    node.children[0],
                    nodeX,
                    nodeY,
                    halfWidth,
                    halfHeight,
                    queryX,
                    queryY,
                    queryWidth,
                    queryHeight,
                    dataOut
                )
            }
            if (queryY + queryHeight > midY) {
                queryFromNode(
                    node.children[3],
                    nodeX,
                    nodeY + halfHeight,
                    halfWidth,
                    halfHeight,
                    queryX,
                    queryY,
                    queryWidth,
                    queryHeight,
                    dataOut
                )
            }
        }
        if (queryX + queryWidth > midX) {
            if (queryY < midY) {
                queryFromNode(
                    node.children[1],
                    nodeX + halfWidth,
                    nodeY,
                    halfWidth,
                    halfHeight,
                    queryX,
                    queryY,
                    queryWidth,
                    queryHeight,
                    dataOut
                )
            }
            if (queryY + queryHeight > midY) {
                queryFromNode(
                    node.children[2],
                    nodeX + halfWidth,
                    nodeY + halfHeight,
                    halfWidth,
                    halfHeight,
                    queryX,
                    queryY,
                    queryWidth,
                    queryHeight,
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
        height: number
    ) {
        if (!node.divided) {
            return
        }
        const halfWidth = width / 2.0
        const halfHeight = height / 2.0
        Debug_DrawLine(
            vec2.fromValues(x, y + halfHeight),
            vec2.fromValues(x + width, y + halfHeight),
            [0, 1, 0, 0.8]
        )
        Debug_DrawLine(
            vec2.fromValues(x + halfWidth, y),
            vec2.fromValues(x + halfWidth, y + height),
            [0, 1, 0, 0.8]
        )

        debugDrawNode(node.children[0], x, y, halfWidth, halfHeight)
        debugDrawNode(node.children[1], x + halfWidth, y, halfWidth, halfHeight)
        debugDrawNode(
            node.children[2],
            x + halfWidth,
            y + halfHeight,
            halfWidth,
            halfHeight
        )
        debugDrawNode(
            node.children[3],
            x,
            y + halfHeight,
            halfWidth,
            halfHeight
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
        debugDraw: () =>
            debugDrawNode(root, start[0], start[1], size[0], size[1]),
    }
}
