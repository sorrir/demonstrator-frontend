import React, { useEffect, useRef, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import Diagram from "./components/Diagram";
import { useDispatch } from "react-redux";
import { stateUpdate } from "./store";
import { ValidateFunction } from "ajv";
import {
  DebuggingAgentWebSocketConfigurationState,
  FailUnitMessage,
  DisconnectUnitMessage,
  EnqueueEventMessage,
  DebuggingAgentWebSocketInjectMessage,
  ModifyAbstractStateMessage,
  SendExternalMessage,
} from "@sorrir/sorrir-framework-interface";
import installExampleStateTransformers from "./stateTransformers/ExampleStateTransformers";

const App = (props: {
  configurationSchemaValidator: ValidateFunction<unknown>;
}) => {
  const SERVER_URL_DEFAULT = "ws://localhost:3001";

  const TEXT_CONNECT = "Connect";
  const TEXT_DISCONNECT = "Disconnect";
  const TEXT_CONNECTING = "Connecting...";

  const dispatch = useDispatch();

  const [serverURL, setServerURL] = useState(SERVER_URL_DEFAULT);
  const [eventParam, setEventParam] = useState("");
  const [eventRequest, setEventRequest] = useState(false);
  const [eventExternal, setEventExternal] = useState(false);
  const [isConnected, setConnected] = useState(false);
  const [toConnect, setToConnect] = useState(false);
  const [buttonText, setButtonText] = useState(TEXT_CONNECT);
  const [fsmState, setFsmState] = useState("");
  const [abstractState, setAbstractState] = useState("");
  const [eventList, setEventList] = useState("");
  const ws = useRef<WebSocket | null>(null);

  const eventType = useRef<HTMLSelectElement>(null);
  const sourceUnit = useRef<HTMLSelectElement>(null);
  const sourceUnitInput = useRef<HTMLLabelElement>(null);

  const [eventTypes, setEventTypes] = useState([] as string[]);
  const [units, setUnits] = useState([] as string[]);

  const sendEvent =
    useRef<
      (
        event: string | undefined,
        param: string,
        request: boolean,
        sourceUnit: string | undefined
      ) => void
    >();
  const sendError =
    useRef<(tag: "DisconnectUnitMessage" | "FailUnitMessage") => void>();
  const modifyAbstractState =
    useRef<(path: string | undefined, value: any) => void>();

  const updateButtonText = (connected: boolean) =>
    setButtonText(connected ? TEXT_DISCONNECT : TEXT_CONNECT);

  let sequenceNumber = 0;

  const sendInjectMessage = (message: DebuggingAgentWebSocketInjectMessage) => {
    ws.current?.send(JSON.stringify(message));
  };

  const sendMessage = (
    message:
      | EnqueueEventMessage
      | FailUnitMessage
      | DisconnectUnitMessage
      | ModifyAbstractStateMessage
      | SendExternalMessage
  ) => {
    sendInjectMessage({ ...message, sequenceNumber: sequenceNumber++ });
  };

  installExampleStateTransformers();

  useEffect(() => {
    if (toConnect) {
      ws.current = new WebSocket(serverURL);
      ws.current.onopen = () => {
        setConnected(true);
        updateButtonText(true);
      };
      ws.current.onclose = () => {
        setConnected(false);
        setToConnect(false);
        updateButtonText(false);
      };
      ws.current.onerror = (e) => {
        console.log("Connection failed:");
        console.log(e);
      };

      ws.current.onmessage = (e) => {
        const message = JSON.parse(e.data);
        console.log("e", message);

        const valid = props.configurationSchemaValidator(message);
        if (valid === true) {
          dispatch(
            stateUpdate(message as DebuggingAgentWebSocketConfigurationState)
          );
        } else {
          alert(
            "Message received from debugging-server does not conform to schema definition.\nMake sure that you are using compatible versions of the framework and the frontend."
          );
        }
      };

      const wsCurrent = ws.current;

      return () => {
        wsCurrent.close();
      };
    } else {
      if (!toConnect) {
        ws.current?.close();
        setConnected(false);
        updateButtonText(false);
      }
    }
  }, [toConnect]);

  return (
    <div className="App">
      <header className="App-header">
        <p>
          <b>SORRIR Demonstrator GUI</b>
          <br />
          <input
            type="text"
            id="debugging-server-url"
            onChange={(e) => setServerURL(e.target.value)}
            value={serverURL}
          ></input>
          <button
            onClick={() => {
              setToConnect(!isConnected);
              setButtonText(TEXT_CONNECTING);
            }}
          >
            {buttonText}
          </button>
          <br />
          {!eventExternal ? (
            <span>
              Type:
              <select id="event-name" ref={eventType}>
                {eventTypes.map((eventType) => {
                  return (
                    <option key={eventType} value={eventType}>
                      {eventType}
                    </option>
                  );
                })}
              </select>
            </span>
          ) : null}
          <span>Param:</span>
          <input
            type="text"
            id="event-param"
            onChange={(e) => setEventParam(e.target.value)}
            value={eventParam}
          ></input>
          <input
            type="checkbox"
            id="event-request"
            onChange={(e) => setEventRequest(e.target.checked)}
            checked={eventRequest}
          ></input>
          <label>Request</label>
          <input
            type="checkbox"
            id="event-external"
            onChange={(e) => setEventExternal(e.target.checked)}
            checked={eventExternal}
          ></input>
          <label>External</label>
          {eventExternal ? (
            <label ref={sourceUnitInput}>
              Source Unit
              <select id="event-source-unit" ref={sourceUnit}>
                {units.map((unit) => {
                  return (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  );
                })}
              </select>
            </label>
          ) : null}
          <button
            onClick={() => {
              const func = sendEvent.current;
              if (func)
                func(
                  eventType.current?.value,
                  eventParam,
                  eventRequest,
                  sourceUnit.current?.value
                );
            }}
          >
            Send Event
          </button>
          <br />
          <button
            onClick={() => {
              const func = sendError.current;
              if (func) func("FailUnitMessage");
            }}
          >
            Fail Selected Unit
          </button>
          <button
            onClick={() => {
              const func = sendError.current;
              if (func) func("DisconnectUnitMessage");
            }}
          >
            Disconnect Selected Unit
          </button>
        </p>
      </header>
      <main>
        <Diagram
          sendMessage={sendMessage}
          sendEvent={sendEvent}
          sendError={sendError}
          modifyAbstractState={modifyAbstractState}
          setAbstractState={setAbstractState}
          setFsmState={setFsmState}
          setEventList={setEventList}
          setEventTypes={setEventTypes}
          setUnits={setUnits}
        />
        <div className="Sidebar">
          <label>Events:</label>
          <input type="text" value={eventList} readOnly></input>
          <label>FSM:</label>
          <input
            type="text"
            onChange={(e) => setFsmState(e.target.value)}
            value={fsmState}
          ></input>
          <textarea
            value={`${abstractState}`}
            onChange={(e) => setAbstractState(e.target.value)}
          ></textarea>
          <button
            onClick={() => {
              const func = modifyAbstractState.current;
              if (func)
                try {
                  func(undefined, {
                    fsm: fsmState === "undefined" ? undefined : fsmState,
                    my: abstractState ? JSON.parse(abstractState) : undefined,
                  });
                } catch (e) {
                  alert(e);
                }
            }}
          >
            Update State
          </button>
        </div>
      </main>
    </div>
  );
};

export default App;
