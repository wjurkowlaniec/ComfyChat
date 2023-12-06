import { useState, useCallback, useMemo, useEffect } from "react";
import ReactFlow, {
  useReactFlow,
  Background,
  Controls,
  Panel,
} from "reactflow";
import { useStore } from "../../store";
import { FaGithub } from "react-icons/fa";
import "reactflow/dist/style.css";

import OpenAIConfigNode from "./openaiConfig";
import UserInputNode from "./userInput";
import SystemMessageInput from "./systemMessageInput";
import ChatOutputNode from "./chatOutput";

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  openAIConfig: state.openAIConfig,
  createOpenAIInstance: state.createOpenAIInstance,
  deleteChatNode: state.deleteChatNode,
});

function Flow() {
  const { fitView } = useReactFlow();
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    deleteChatNode,
    openAIConfig,
    createOpenAIInstance,
  } = useStore(selector, (state, next) => {
    return (
      state.nodes === next.nodes &&
      state.edges === next.edges &&
      state.onNodesChange === next.onNodesChange &&
      state.onEdgesChange === next.onEdgesChange &&
      state.onConnect === next.onConnect &&
      state.openAIConfig === next.openAIConfig &&
      state.createOpenAIInstance === next.createOpenAIInstance &&
      state.deleteChatNode === next.deleteChatNode
    );
  });
  const [currentNodeLength, setCurrentNodeLength] = useState(nodes.length);

  // fitview when nodes change
  useEffect(() => {
    if (nodes.length === currentNodeLength) return;

    // if less than previous, fitview last three nodes
    if (nodes.length < currentNodeLength) {
      const lastThreeNodes = nodes.slice(-3);
      fitView({
        nodes: lastThreeNodes,
        duration: 500,
      });
      setCurrentNodeLength(nodes.length);
      return;
    }

    setCurrentNodeLength(nodes.length);
    const lastTwoNodes = nodes.slice(-2);
    fitView({
      nodes: lastTwoNodes,
      duration: 500,
    });
  }, [nodes]);

  useEffect(() => {
    if (
      !openAIConfig ||
      !openAIConfig.apiKey ||
      openAIConfig.apiKey.length === 0 ||
      openAIConfig.engine.length === 0
    )
      return;
    async function createInstance() {
      await createOpenAIInstance();
    }
    createInstance();
  }, []);

  const nodeTypes = useMemo(
    () => ({
      openAIConfig: OpenAIConfigNode,
      userInput: UserInputNode,
      systemMessageInput: SystemMessageInput,
      chatOutput: ChatOutputNode,
    }),
    []
  );

  const onNodesDelete = (nodesDeleted) => {
    deleteChatNode(nodesDeleted, nodes, edges);
  };

  return (
    <div className="w-screen h-screen">
      <ReactFlow
        panOnScroll
        onNodesDelete={onNodesDelete}
        nodeTypes={nodeTypes}
        nodes={nodes}
        onNodesChange={onNodesChange}
        edges={edges}
        onEdgesChange={onEdgesChange}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        minZoom={0.1}
        maxZoom={1}
        zoomActivationKeyCode="Shift"
      >
        <Panel position="top-left">
          <div className="flex justify-center items-start space-y-2 w-full h-12 flex-col">
            <div className="flex items-center">
              <img src={"./logo.png"} alt="logo" className="w-6 mr-2 -ml-1" />
              <p className="text-white text-sm">ComfyChat</p>
            </div>
            <a
              href="https://github.com/felri/ComfyChat"
              target="_blank"
              rel="noreferrer"
              className="flex items-center text-white decoration-none hover:text-white"
            >
              <FaGithub className="mr-2 text-sm" />
              <p className="text-white text-sm hover:underline">Github</p>
            </a>
          </div>
        </Panel>

        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default Flow;
