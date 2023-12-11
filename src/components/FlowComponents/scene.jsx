import { useState, useEffect, useCallback } from "react";
import ReactFlow, { useReactFlow, Background, Panel } from "reactflow";
import { storeManager, useConfigStore } from "../../store";
import { FaGithub } from "react-icons/fa";
import "reactflow/dist/style.css";

import ApiKeyNode from "./apiKey";
import UserInputNode from "./userInput";
import SystemMessageInput from "./systemMessageInput";
import Controls from "./controls";
import ChatOutputNode from "./chatOutput";
import History from "../Common/history";

const selectedSelector = (state) => ({
  selectedStoreId: state.selectedStoreId,
  setSelectedStoreId: state.setSelectedStoreId,
});

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  openAIConfig: state.openAIConfig,
  createOpenAIInstance: state.createOpenAIInstance,
  deleteChatNode: state.deleteChatNode,
  resetStore: state.resetStore,
});

const nodeTypes = {
  userInput: UserInputNode,
  systemMessage: SystemMessageInput,
  chatOutput: ChatOutputNode,
  apiKey: ApiKeyNode,
};

function Flow() {
  const { fitView, setViewport, getViewport } = useReactFlow();
  const { apiKey, createOpenAIInstance, openAIInstance } = useConfigStore(
    (state) => state
  );
  const { selectedStoreId, setSelectedStoreId } =
    useConfigStore(selectedSelector);
  const store = storeManager.getSelectedStore();
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    deleteChatNode,
    resetStore,
  } = store(selector, (state, next) => {
    return (
      state.nodes === next.nodes &&
      state.edges === next.edges &&
      state.defaultTemperature === next.defaultTemperature &&
      state.onNodesChange === next.onNodesChange &&
      state.onEdgesChange === next.onEdgesChange &&
      state.onConnect === next.onConnect &&
      state.openAIConfig === next.openAIConfig &&
      state.createOpenAIInstance === next.createOpenAIInstance &&
      state.deleteChatNode === next.deleteChatNode &&
      state.resetStore === next.resetStore
    );
  });
  const [currentNodeLength, setCurrentNodeLength] = useState(nodes?.length);

  useEffect(() => {
    if (nodes.length === currentNodeLength) return;
    const sliceSize = nodes.length < currentNodeLength ? -3 : -2;
    setCurrentNodeLength(nodes.length);
    fitView({
      nodes: nodes.slice(sliceSize),
      duration: 500,
    });
  }, [nodes, currentNodeLength, fitView]);

  useEffect(() => {
    if (!apiKey || apiKey.length === 0 || !selectedStoreId || !!openAIInstance)
      return;
    async function createInstance() {
      await createOpenAIInstance(apiKey);
    }
    createInstance();
  }, [apiKey, createOpenAIInstance, openAIInstance, selectedStoreId]);

  const updateScene = (id) => {
    setSelectedStoreId(id);
  };

  const createNewChatPage = () => {
    storeManager.createNewStore();
  };

  const onNodesDelete = (nodesDeleted) => {
    deleteChatNode(nodesDeleted, nodes, edges);
  };

  const handleKeyPress = useCallback(
    (e) => {
      if (e.ctrlKey && e.code === "Space") {
        const lastNode = nodes[nodes.length - 1]; // Assuming the last node is at the end of the array

        console.log(lastNode);
        // Calculate the bottom Y of the last node
        const nodeBottom = lastNode.position.y + lastNode.height;
        const x = window.innerWidth / 2 - lastNode.width;

        // Get the current viewport
        const viewport = getViewport();

        // Calculate the height of the viewport in flow coordinates
        const viewportHeightInFlowCoords = window.innerHeight;

        // Calculate the desired new Y position of the viewport
        // This will align the bottom of the viewport with the bottom of the last node
        const newY = viewportHeightInFlowCoords - nodeBottom;

        // Apply the adjustment if there is a significant change
        if (Math.abs(viewport.y - newY) > 1) {
          setViewport({ x, y: newY, zoom: 1 }, { duration: 200 });
        }
      }
    },
    [getViewport, nodes, setViewport]
  );

  // listen for keypresses control + space and focus one the last node
  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <div className="w-screen h-screen" key={selectedStoreId}>
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
        maxZoom={1.2}
        zoomActivationKeyCode="Space"
      >
        <Panel position="top-left opacity-50">
          <div className="flex justify-center items-start space-y-2 w-full mb-2 flex-col hover:opacity-80 transition-opacity duration-300 ease-in-out">
            <div
              className="flex items-center cursor-pointer font-bold"
              onClick={createNewChatPage}
            >
              <img
                src={"./logo.png"}
                alt="logo"
                className="w-7 rounded-full  mr-2 -ml-1 bg-gray-600 p-1"
              />
              <p className="text-white">New chat +</p>
            </div>
          </div>
          <History
            updateScene={updateScene}
            currentId={selectedStoreId}
            resetStore={resetStore}
          />
        </Panel>

        <Panel position="top-right opacity-50">
          <div className="flex justify-center items-start space-y-2 w-full h-2 flex-col">
            <div className="flex items-center">
              <img src={"./logo.png"} alt="logo" className="w-6 mr-2 -ml-1" />
              <p className="text-white text-sm">ComfyChat</p>
            </div>
          </div>
        </Panel>

        <Panel position="bottom-right">
          <div className="flex justify-center items-start space-y-2 w-full h-1 flex-col">
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
        <Panel position="bottom-left">
          <Controls resetStore={resetStore} />
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default Flow;
