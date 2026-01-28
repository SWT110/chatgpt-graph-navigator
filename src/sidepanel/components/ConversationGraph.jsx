/**
 * 对话图谱组件
 * 使用 React Flow + QA 树实现可视化
 */
import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
// 注意：不要在这里 import CSS！
// React Flow 的 CSS 在 src/sidepanel/styles/index.css 中通过 @import 引入

import QANode from './QANode';
import StartNode from './StartNode';
import { buildAndLayoutQATree } from '../utils/qaTreeLayout';

// 自定义节点类型
const nodeTypes = {
  qaNode: QANode,
  startNode: StartNode
};

// 边的默认样式
const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  style: {
    strokeWidth: 1.5
  }
};

/**
 * 图谱内部组件（需要 ReactFlow context）
 */
function GraphContent({
  qaTree,
  selectedPath,
  currentNodeId,
  onNodeClick,
  onNodeDoubleClick,
  onNodeContextMenu,
  containerHeight
}) {
  const { fitView, setCenter } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [expandedQNodes, setExpandedQNodes] = useState(new Set());

  // 用于追踪是否应该 fitView（只在数据变化时，不在展开/折叠时）
  const prevQaTreeRef = useRef(null);
  const prevSelectedPathRef = useRef(null);
  const prevCurrentNodeIdRef = useRef(null);
  const prevContainerHeightRef = useRef(0);

  // 展开/折叠回答的处理函数
  const handleExpandAnswer = useCallback((nodeId) => {
    setExpandedQNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // 当容器高度变化时，重新适应视图
  useEffect(() => {
    // 只在容器高度真正变化时才 fitView
    if (containerHeight > 0 && nodes.length > 0 && prevContainerHeightRef.current !== containerHeight) {
      prevContainerHeightRef.current = containerHeight;
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 });
      }, 100);
    }
  }, [containerHeight, fitView, nodes.length]);

  // 当 QA 树、选中路径或展开状态变化时，更新图谱
  useEffect(() => {
    if (!qaTree || !qaTree.root || qaTree.root.questions.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // 检测是否是数据变化（而非仅展开状态变化）
    const isDataChange = prevQaTreeRef.current !== qaTree || prevSelectedPathRef.current !== selectedPath;
    prevQaTreeRef.current = qaTree;
    prevSelectedPathRef.current = selectedPath;

    console.log('[Graph] Building from QA tree...',
      'Q:', qaTree.qNodeMap?.size || 0,
      'A:', qaTree.aNodeMap?.size || 0,
      'Expanded:', expandedQNodes.size,
      'DataChange:', isDataChange
    );

    // 从 QA 树构建并布局
    const { nodes: layoutedNodes, edges: layoutedEdges } = buildAndLayoutQATree(
      qaTree,
      selectedPath,
      'TB',
      expandedQNodes
    );

    // 为节点注入展开回调
    const nodesWithHandlers = layoutedNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onExpandAnswer: handleExpandAnswer
      }
    }));

    console.log('[Graph] Layout complete:',
      nodesWithHandlers.length, 'nodes,',
      layoutedEdges.length, 'edges'
    );

    setNodes(nodesWithHandlers);
    setEdges(layoutedEdges);

    // 只在数据变化时适应视图，展开/折叠时保持当前缩放
    if (isDataChange) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 });
      }, 100);
    }

  }, [qaTree, selectedPath, expandedQNodes, setNodes, setEdges, fitView, handleExpandAnswer]);

  // 当前节点变化时，定位到该节点（只在 currentNodeId 真正变化时）
  useEffect(() => {
    if (!currentNodeId || nodes.length === 0) return;

    // 只在 currentNodeId 真正变化时才定位
    if (prevCurrentNodeIdRef.current === currentNodeId) return;
    prevCurrentNodeIdRef.current = currentNodeId;

    // 尝试找到对应的节点（可能是 q-xxx 或 a-xxx 格式）
    let targetNode = nodes.find(n =>
      n.id === currentNodeId ||
      n.id === `q-${currentNodeId}` ||
      n.id === `a-${currentNodeId}` ||
      n.data?.nodeId === currentNodeId
    );

    if (targetNode) {
      setCenter(targetNode.position.x + 120, targetNode.position.y + 50, {
        zoom: 1,
        duration: 500
      });
    }
  }, [currentNodeId, nodes, setCenter]);

  // 处理节点点击
  const handleNodeClick = useCallback((event, node) => {
    console.log('[Graph] Node clicked:', node.id, node.data?.nodeType);
    // 忽略起始节点的点击
    if (node.data?.nodeType === 'start') return;
    onNodeClick?.(node.data.nodeId, node.data);
  }, [onNodeClick]);

  // 处理节点双击
  const handleNodeDoubleClick = useCallback((event, node) => {
    if (node.data?.nodeType === 'start') return;
    onNodeDoubleClick?.(node.data.nodeId, node.data);
  }, [onNodeDoubleClick]);

  // 处理节点右键
  const handleNodeContextMenu = useCallback((event, node) => {
    if (node.data?.nodeType === 'start') return;
    onNodeContextMenu?.(event, node.data.nodeId, node.data);
  }, [onNodeContextMenu]);

  // MiniMap 节点颜色
  const nodeColor = useCallback((node) => {
    if (node.data?.nodeType === 'start') {
      return '#94a3b8';
    }
    if (node.data?.isSelected) {
      return node.data?.nodeType === 'question' ? '#3b82f6' : '#22c55e';
    }
    return node.data?.nodeType === 'question' ? '#93c5fd' : '#86efac';
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      onNodeDoubleClick={handleNodeDoubleClick}
      onNodeContextMenu={handleNodeContextMenu}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      nodeDragThreshold={5}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={2}
      attributionPosition="bottom-left"
      proOptions={{ hideAttribution: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <Controls
        showZoom={true}
        showFitView={true}
        showInteractive={false}
        position="bottom-right"
      />
      <MiniMap
        nodeColor={nodeColor}
        nodeStrokeWidth={3}
        zoomable
        pannable
        position="top-right"
      />
      <Background variant="dots" gap={20} size={1} color="#e5e7eb" />
    </ReactFlow>
  );
}

/**
 * 对话图谱组件（带 Provider）
 */
function ConversationGraph({
  qaTree,
  selectedPath,
  currentNodeId,
  onNodeClick,
  onNodeDoubleClick,
  onNodeContextMenu
}) {
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(400);

  // 动态计算容器高度
  useEffect(() => {
    const updateHeight = () => {
      const height = window.innerHeight - 56;
      setContainerHeight(Math.max(height, 200));
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="graph-container"
      style={{
        width: '100%',
        height: `${containerHeight}px`,
        minHeight: '200px'
      }}
    >
      <ReactFlowProvider>
        <GraphContent
          qaTree={qaTree}
          selectedPath={selectedPath}
          currentNodeId={currentNodeId}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeContextMenu={onNodeContextMenu}
          containerHeight={containerHeight}
        />
      </ReactFlowProvider>
    </div>
  );
}

export default ConversationGraph;
