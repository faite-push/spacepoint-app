export function reorderTree(
  categories: any[],
  sourceId: string,
  destinationId: string,
  sourceIndex: number,
  destinationIndex: number
) {
  const newTree = JSON.parse(JSON.stringify(categories));
  
  // Find source context
  let sourceList = newTree;
  if (sourceId !== "root") {
    const parent = findNode(newTree, sourceId);
    if (parent) sourceList = parent.subcategories;
  }
  
  // Find dest context
  let destList = newTree;
  if (destinationId !== "root") {
    const parent = findNode(newTree, destinationId);
    if (parent) destList = parent.subcategories;
  }
  
  const [moved] = sourceList.splice(sourceIndex, 1);
  destList.splice(destinationIndex, 0, moved);
  
  return newTree;
}

function findNode(nodes: any[], id: string): any {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.subcategories?.length) {
      const found = findNode(node.subcategories, id);
      if (found) return found;
    }
  }
  return null;
}

export function extractSortOrders(categories: any[]) {
  const updates: { id: string; sortOrder: number }[] = [];
  
  function traverse(nodes: any[]) {
    nodes.forEach((node, index) => {
      updates.push({ id: node.id, sortOrder: index });
      if (node.subcategories?.length) {
        traverse(node.subcategories);
      }
    });
  }
  traverse(categories);
  return updates;
}
