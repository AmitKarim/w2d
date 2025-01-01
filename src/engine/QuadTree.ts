// import { Vec2 } from './Vec2'

// const MAX_ENTITIES_PER_NODE = 20

// type QuadTreeNode = {
//     position: Vec2
//     extent: Vec2
// } & (
//     | {
//           hasChildren: false
//           entities: number[]
//       }
//     | {
//           hasChildren: true
//           topRight: QuadTreeNode
//           topLeft: QuadTreeNode
//           bottomRight: QuadTreeNode
//           bottomLeft: QuadTreeNode
//       }
// )

// export type QuadTree = {
//     root: QuadTreeNode
//     entityMap: Record<number, QuadTreeNode>
//     mapExtent: number
// }

// function insertEntityRecursively(entityID: number, pos: Vec2, node: QuadTreeNode): QuadTreeNode {
//      if (node.hasChildren) {
//         const midPointX = node.position.x + node.extent.x / 2
//         const midPointY = node.position.y + node.extent.y / 2
//         if (pos.x < midPointX) {
//              if (pos.y < midPointY) {
//                 return insertEntityRecursively(entityID, pos, node.bottomLeft)
//              }
//              return insertEntityRecursively(entityID, pos, node.topLeft)
//         }
//         if (pos.y < midPointY) {
//             return insertEntityRecursively(entityID, pos, node.bottomRight)
//         }
//         return insertEntityRecursively(entityID, pos, node.topRight)
//      }
//      if (node.entities.length != MAX_ENTITIES_PER_NODE) {
//         node.entities.push(entityID)
//         return node
//      }
//      const topLeft: QuadTreeNode = {
//         position: {
//             x: node.position.x,
//             y: node.position.y + node.extent.y / 2
//         },
//         extent: {
//             x: node.extent.x / 2,
//             y: node.extent.y / 2,
//         },
//         hasChildren: false,
//         entities: []
//      }
//      const topRight: QuadTreeNode = {
//         position: {
//             x: node.position.x + node.extent.x / 2,
//             y: node.position.y + node.extent.y / 2,
//         },
//         extent: {
//             x: node.extent.x / 2,
//             y: node.extent.y / 2,
//         },
//         hasChildren: false,
//         entities: []
//      }
//      const bottomLeft: QuadTreeNode = {
//         position: {
//             x: node.position.x,
//             y: node.position.y,
//         },
//         extent: {
//             x: node.extent.x / 2,
//             y: node.extent.y / 2,
//         },
//         hasChildren: false,
//         entities: []
//      }
//      const bottomRight: QuadTreeNode = {
//         position: {
//             x: node.position.x + node.extent.x / 2,
//             y: node.position.y,
//         },
//         extent: {
//             x: node.extent.x / 2,
//             y: node.extent.y / 2,
//         },
//         hasChildren: false,
//         entities: [],
//      }
//      for (e of node.entities) {

//      }
// }

// function updateEntity(position: Vec2, entityID: number, tree: QuadTree) {
//     const currentNode = tree.entityMap[entityID]
//     if (currentNode) {
//         if (
//             position.x >= currentNode.position.x &&
//             position.x <= currentNode.position.x + currentNode.extent.x &&
//             position.y >= currentNode.position.y &&
//             position.y <= currentNode.position.y + currentNode.extent.y
//         ) {
//             return
//         }
//         if (currentNode.hasChildren) {
//             throw Error('Impossible for current node to have children')
//         }
//         const entityIdx = currentNode.entities.findIndex((x) => x == entityID)
//         if (entityIdx == -1) {
//             throw Error("Failed to find entity in quad tree node")
//         }
//         currentNode.entities.splice(entityIdx)
//     }
//     insertEntityRecursively(entityID, position, tree.root)
// }
