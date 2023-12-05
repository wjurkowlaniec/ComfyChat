import { useEffect, useState, useCallback, useRef } from "react";
import { useStore } from "../../store";
import { Handle, Position } from "reactflow";
import Container from "../Common/container";
import { MdDelete } from "react-icons/md";
import hljs from "highlight.js";
import { IoIosAdd } from "react-icons/io";

import "highlight.js/styles/atom-one-dark.css"; // Or any other style you prefer

function ChatOutputNode({ id, data }) {
  const containerRef = useRef(null);
  const {
    openAIInstance,
    openAIConfig,
    getHistory,
    updateChildrenPosition,
    onUpdateUserInput,
    deleteCurrentNode,
    createNewInputNode,
  } = useStore(useCallback((state) => state, []));
  const [streamContent, setStreamContent] = useState("");
  const [height, setHeight] = useState(0);

  function escapeHtml(html) {
    return html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function processSingleBacktickLine(line) {
    const regex = /`([^`]+)`/g;
    return (
      "<p class='mt-3 chatoutput nodrag'>" +
      escapeHtml(line).replace(regex, "<span class='font-bold bg-gray-700 p-1 rounded'>$1</span>") +
      "</p>\n"
    );
  }

  function formatStreamContent(text) {
    const backticks = "```";
    let inCodeBlock = false;
    let language = "";
    let formattedText = "";
    let codeContent = "";

    for (const line of text.split("\n")) {
      if (line.startsWith(backticks)) {
        if (inCodeBlock) {
          // End of a code block
          formattedText += `<pre><code class="${language} chatoutput nodrag">${escapeHtml(
            codeContent
          )}</code></pre>\n`;
          inCodeBlock = false;
          codeContent = "";
        } else {
          // Start of a code block
          inCodeBlock = true;
          language = line.substring(backticks.length).trim();
        }
      } else if (inCodeBlock) {
        codeContent += line + "\n";
      } else {
        formattedText += processSingleBacktickLine(line);
      }
    }

    // Handle case where stream ends but code block is not closed
    if (inCodeBlock) {
      formattedText += `<pre><code class="${language} chatoutput nodrag">${escapeHtml(
        codeContent
      )}</code></pre>\n`;
    }

    return formattedText;
  }

  useEffect(() => {
    async function fetchStreamData() {
      try {
        if (!openAIInstance) return;
        if (!openAIConfig || !openAIConfig.engine) return;
        const history = getHistory(data.id);
        console.log("history", history);
        const stream = await openAIInstance.chat.completions.create({
          model: openAIConfig.engine,
          temperature: Number(parseFloat(openAIConfig.temperature)),
          messages: history,
          stream: true,
        });
        let current = "";
        for await (const chunk of stream) {
          let content = chunk.choices[0]?.delta?.content || "";
          setStreamContent((prevContent) => {
            current = prevContent + content;
            return prevContent + content;
          });
        }
        onUpdateUserInput(current, data.id);

        // update node data text
      } catch (error) {
        console.error("Error streaming data:", error);
      }
    }

    fetchStreamData();
  }, []);

  useEffect(() => {
    hljs.highlightAll();
    let newId = parseInt(data.id) + 1;
    newId = newId.toString();
    const height = containerRef.current?.offsetHeight || 0;
    if (height > 520) {
      updateChildrenPosition(newId);
    }

    setHeight(height);
  }, [streamContent]);

  return (
    <Container
      innerRef={containerRef}
      title="Output"
      className="w-[720px] min-h-[520px] overflow-y-scroll flex items-left justify-start overflow-hidden pb-10"
    >
      <div className="absolute top-1 right-1 hover:cursor-pointer">
        <MdDelete fill="red" size={20} onClick={() => deleteCurrentNode(id)} />
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
      <div
        dangerouslySetInnerHTML={{ __html: formatStreamContent(streamContent) }}
        className=" w-full h-full"
      />
      <div className="flex justify-center items-center absolute bottom-0 right-0 w-10 h-10 cursor-pointer">
        <IoIosAdd
          size={30}
          className="hover:cursor-pointer"
          onClick={() => createNewInputNode(id, height)}
        />
      </div>
    </Container>
  );
}

export default ChatOutputNode;
