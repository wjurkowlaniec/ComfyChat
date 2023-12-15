import { useCallback, useState, useRef, useEffect } from "react";
import { storeManager, useConfigStore } from "../../store";
import { Handle, Position } from "reactflow";
import Container from "../Common/container";
import TextArea from "../Common/textarea";
import { IoMdSend } from "react-icons/io";
import PropTypes from "prop-types";
import { voices, languages } from "../../store/constants";
import Dropdown from "../Common/dropdown";
import TextInput from "../Common/text";

function TTSInput({ id, data }) {
  const nodeRef = useRef(null);
  const store = storeManager.getSelectedStore();
  const { openAIInstance, voice, updateStore, language, speed } = useConfigStore(
    ({ openAIInstance, voice, updateStore, language, speed }) => ({
      openAIInstance,
      voice,
      updateStore,
      speed,
      language,
    })
  );
  const { onDataTextUpdate, onUserInputSend } = store(
    useCallback(({ onDataTextUpdate, onUserInputSend }) => {
      return {
        onDataTextUpdate,
        onUserInputSend,
      };
    }, [])
  );

  const [text, setText] = useState(data.text);
  const [wordCount, setWordCount] = useState(0);

  const onChange = (e) => {
    setText(e.target.value);
    onDataTextUpdate(e.target.value, id);
  };

  function countWords(text) {
    return text.trim().split(/\s+/).length;
  }

  useEffect(() => {
    if (!data?.text?.length) {
      setWordCount(0);
      return;
    }
    setWordCount(countWords(data.text));
  }, [data.text]);

  const onEnter = (e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      openAIInstance &&
      text.trim().length > 0
    ) {
      // get the width and height via bounding client rect
      const height = nodeRef.current.getBoundingClientRect().height;
      onUserInputSend(id, height);
    }
  };

  const placeHolderText = openAIInstance
    ? `The text to be spoken`
    : "Please add an API key";

  return (
    <Container title="Input" innerRef={nodeRef} id={id} className="w-[800px]">
      <TextArea
        id={id}
        disabled={!openAIInstance}
        label=""
        placeholder={placeHolderText}
        value={text}
        rows={16}
        cols={65}
        name="text"
        onChange={onChange}
        onKeyDown={onEnter}
        autoFocus={true}
      />
      <div className="flex space-x-4">
        <div className="w-1/3">
          <Dropdown
            onClick={() => {}}
            label="Voice"
            type="text"
            disabled={!openAIInstance}
            options={voices}
            name="voice"
            value={voice}
            onChange={(e) => {
              updateStore("voice", e.target.value);
            }}
          />
          <span className="text-xs text-gray-400">
            You can hear the voices{" "}
            <a
              href="https://platform.openai.com/docs/guides/text-to-speech/voice-options"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500"
            >
              here
            </a>
            .
          </span>
        </div>
        <div className="w-1/3">
          <Dropdown
            onClick={() => {}}
            label="Output Language"
            type="text"
            disabled={!openAIInstance}
            options={Object.keys(languages)}
            name="language"
            value={language}
            onChange={(e) => {
              updateStore("language", e.target.value);
            }}
          />
        </div>
        <div className="w-1/3">
          <TextInput
            label="Speed (0.25-4.0)"
            onChange={(e) => {
              updateStore(e.target.name, e.target.value);
            }}
            value={speed}
            name="speed"
            type="number"
            min="0.25"
            max="4"
          />
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center justify-center w-full">
        <div className="flex w-full justify-end pt-4 items-center space-x-2">
          <p className="text-gray-500 text-sm mr-2">Word Count: {wordCount}</p>

          <IoMdSend
            className="text-2xl text-gray-500 cursor-pointer"
            onClick={() =>
              onUserInputSend(
                id,
                nodeRef?.current?.getBoundingClientRect().width
              )
            }
          />
        </div>
      </div>
    </Container>
  );
}

TTSInput.propTypes = {
  data: PropTypes.shape({
    text: PropTypes.string,
    id: PropTypes.string,
    quantity: PropTypes.number,
  }),
  id: PropTypes.string,
};

export default TTSInput;
