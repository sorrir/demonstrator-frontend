import { connectionStrategies, dia, shapes } from "jointjs";
import React, { useEffect, useRef, MutableRefObject } from "react";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import { RootState } from "../store";
import {
  DebuggingAbstractEvent,
  EnqueueEventMessage,
  FailUnitMessage,
  DisconnectUnitMessage,
  ModifyAbstractStateMessage,
  SendExternalMessage,
} from "@sorrir/sorrir-framework-interface";
import stateTransformers from "../stateTransformers/StateTransformer";
import { parentPort } from "worker_threads";
import { presetPositions } from "./positions";

const ComponentShape = dia.Element.define(
  "sorrir.Component",
  {
    attrs: {
      body: {
        width: "calc(w)",
        height: "calc(h)",
        strokeWidth: 2,
        stroke: "#000000",
        fill: "#FFFFFF",
        cursor: "pointer",
      },
      label: {
        textVerticalAnchor: "middle",
        textAnchor: "middle",
        x: "calc(0.5*w)",
        y: "calc(0.2*h)",
        fontSize: 14,
        fill: "#333333",
      },
      state: {
        textVerticalAnchor: "middle",
        textAnchor: "middle",
        x: "calc(0.5*w)",
        y: "calc(0.4*h)",
        fontSize: 14,
        fill: "#555555",
      },
      operatingMode: {
        textVerticalAnchor: "middle",
        textAnchor: "middle",
        x: "calc(0.5*w)",
        y: "calc(0.6*h)",
        fontSize: 14,
        fill: "#555555",
      },
      transformedState: {
        textVerticalAnchor: "middle",
        textAnchor: "middle",
        x: "calc(0.5*w)",
        y: "calc(0.8*h)",
        fontSize: 14,
        fill: "#777777",
      },
    },
  },
  {
    markup: [
      {
        tagName: "rect",
        selector: "body",
      },
      {
        tagName: "text",
        selector: "label",
      },
      {
        tagName: "text",
        selector: "state",
      },
      {
        tagName: "text",
        selector: "operatingMode",
      },
      {
        tagName: "text",
        selector: "transformedState",
      },
    ],
  }
);

const useConfigurationStateSelector: TypedUseSelectorHook<RootState> =
  useSelector;

const Diagram = (props: {
  sendMessage: (
    message:
      | EnqueueEventMessage
      | FailUnitMessage
      | DisconnectUnitMessage
      | ModifyAbstractStateMessage
      | SendExternalMessage
  ) => void;
  sendEvent: MutableRefObject<
    | ((
        event: string,
        param: string,
        request: boolean,
        sourceUnit: string | undefined
      ) => void)
    | undefined
  >;
  sendError: MutableRefObject<
    ((tag: "DisconnectUnitMessage" | "FailUnitMessage") => void) | undefined
  >;
  modifyAbstractState: MutableRefObject<
    ((path: string | undefined, value: any) => void) | undefined
  >;
  setAbstractState: React.Dispatch<React.SetStateAction<string>>;
  setFsmState: React.Dispatch<React.SetStateAction<string>>;
  setEventList: React.Dispatch<React.SetStateAction<string>>;
  setEventTypes: React.Dispatch<React.SetStateAction<string[]>>;
  setUnits: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const units = useConfigurationStateSelector(
    (state) => state.configurationState.units
  );
  const components = useConfigurationStateSelector(
    (state) => state.configurationState.components
  );
  const connections = useConfigurationStateSelector(
    (state) => state.configurationState.connections
  );
  const canvas = useRef<HTMLDivElement>(null);
  const paperRef = useRef<dia.Paper>();
  const graph = useRef<dia.Graph>();

  const isFirstRun = useRef(true);

  const selectedPort = useRef<SVGElement>();
  const selectedComponent = useRef<dia.Cell>();

  props.sendEvent.current = (
    event: string | undefined,
    param: string,
    request: boolean,
    sourceUnit: string | undefined
  ) => {
    if (selectedComponent.current) {
      try {
        const debuggingEvent: DebuggingAbstractEvent = {
          eventClass: request ? "request" : "oneway",
          param: param ? JSON.parse(param) : undefined,
          type: event ?? "NONE",
        };
        const message: EnqueueEventMessage | SendExternalMessage = !sourceUnit
          ? {
              ts_type: "EnqueueEventMessage",
              unit: selectedComponent.current.attr("unit"),
              component: selectedComponent.current.attr("name"),
              event: debuggingEvent,
              port: selectedPort.current?.textContent ?? undefined,
            }
          : {
              ts_type: "SendExternalMessage",
              unit: sourceUnit,
              targetUnit: selectedComponent.current.attr("unit"),
              targetComponent: selectedComponent.current.attr("name"),
              data: param ? JSON.parse(param) : undefined,
              targetPort: selectedPort.current?.textContent ?? "NONE",
            };
        if (message.ts_type === "EnqueueEventMessage" && !message.port) {
          delete (message as any).port;
        }
        console.log(message);
        props.sendMessage(message);
      } catch (e) {
        alert(e);
      }
    }
  };

  props.sendError.current = (
    ts_type: "DisconnectUnitMessage" | "FailUnitMessage"
  ) => {
    if (selectedComponent.current) {
      const message = {
        ts_type,
        unit: selectedComponent.current.attr("unit"),
      };
      console.log(message);
      props.sendMessage(message);
    }
  };

  props.modifyAbstractState.current = (
    path: string | undefined,
    value: string
  ) => {
    if (selectedComponent.current) {
      const message: ModifyAbstractStateMessage = {
        ts_type: "ModifyAbstractStateMessage",
        unit: selectedComponent.current.attr("unit"),
        component: selectedComponent.current.attr("name"),
        path,
        value,
      };
      console.log(message);
      props.sendMessage(message);
    }
  };

  const portsIn = {
    position: {
      name: "left",
    },
    attrs: {
      portBody: {
        r: 6,
        fill: "#03071E",
        cursor: "pointer",
      },
      label: {
        filter: {
          name: 'dropShadow',
          args: {
              dx: 3,
              dy: 0,
              blur: 2,
              opacity: 1,
              color: "#f8f9fa",
          },
        },
        fontWeight: "bold",
      }
    },
    label: {
      position: {
        name: "left",
      },
      markup: [
        {
          tagName: "text",
          selector: "label",
        },
      ],
    },
    markup: [
      {
        tagName: "circle",
        selector: "portBody",
      },
    ],
  };
  const portsOut = {
    position: {
      name: "right",
    },
    attrs: {
      portBody: {
        r: 6,
        fill: "#03071E",
        cursor: "pointer",
      },
      label: {
        filter: {
          name: 'dropShadow',
          args: {
              dx: -3,
              dy: 0,
              blur: 2,
              opacity: 1,
              color: "#f8f9fa",
          },
        },
        fontWeight: "bold",
      }
    },
    label: {
      position: {
        name: "right",
      },
      markup: [
        {
          tagName: "text",
          selector: "label",
        },
      ],
    },
    markup: [
      {
        tagName: "circle",
        selector: "portBody",
      },
    ],
  };

  useEffect(() => {
    const firstRun = () => {
      isFirstRun.current = false;

      graph.current = new dia.Graph({}, { cellNamespace: shapes });

      const paper = new dia.Paper({
        el: canvas.current as HTMLElement,
        width: "80%",
        height: "100%",
        model: graph.current,
        cellViewNamespace: shapes,
      });
      const defaultStroke = new ComponentShape().attr("body/stroke");
      paper.on("blank:pointerclick", () => {
        if (selectedComponent.current) {
          selectedComponent.current.attr("body/stroke", defaultStroke);
          selectedComponent.current = undefined;
          props.setAbstractState("");
          props.setFsmState("");
          props.setEventList("");
          props.setEventTypes([]);
        }
        if (selectedPort.current) {
          (selectedPort.current.childNodes[0] as SVGElement).style.fill = "";
          (selectedPort.current.childNodes[1] as SVGElement).style.fill = "";
          selectedPort.current = undefined;
        }
        graph.current?.getCells().forEach((cell: dia.Cell) => {
          if (cell instanceof shapes.standard.Link) {
            cell.attr("./opacity", 0.5);
            cell.toBack();
          }
        });
      });
      paper.on(
        "cell:pointerclick",
        (cellView: dia.CellView, evt: dia.Event) => {
          console.log(evt);
          let parent: SVGElement = evt.target.parentElement;
          if (parent instanceof SVGTextElement) {
            parent = parent.parentNode as SVGElement;
          }
          if (selectedPort.current) {
            (selectedPort.current.childNodes[0] as SVGElement).style.fill = "";
            (selectedPort.current.childNodes[1] as SVGElement).style.fill = "";
            selectedPort.current = undefined;
          }
          if (parent.className.baseVal === "joint-port") {
            selectedPort.current = parent;
            (parent.childNodes[0] as SVGElement).style.fill = "#00ff00";
            (parent.childNodes[1] as SVGElement).style.fill = "#00a000";
            props.setEventTypes(
              cellView.model
                .attr("ports")
                .find((p: any) => p.name === parent.textContent).eventTypes
            );
          }
          if (cellView.model instanceof ComponentShape) {
            if (selectedComponent.current) {
              selectedComponent.current.attr("body/stroke", defaultStroke);
            }
            selectedComponent.current = cellView.model;
            selectedComponent.current.attr("body/stroke", "#00ff00");
            props.setAbstractState(
              JSON.stringify(selectedComponent.current.attr("my"), null, 2)
            );
            props.setFsmState(
              selectedComponent.current.attr("state").text ?? "undefined"
            );
            props.setEventList(selectedComponent.current.attr("events"));
            if (!selectedPort.current) {
              const allEventTypes = selectedComponent.current
                .attr("ports")
                .map((p: any) => p.eventTypes)
                .flat();
              const uniqueEventTypes = allEventTypes.filter(
                (p: string, index: number) => allEventTypes.indexOf(p) === index
              );
              props.setEventTypes(uniqueEventTypes);
            }
            graph.current?.getCells().forEach((cell: dia.Cell) => {
              if (cell instanceof shapes.standard.Link) {
                const isConnected =
                  cell.source().id === selectedComponent.current?.id ||
                  cell.target().id === selectedComponent.current?.id;
                if (isConnected) {
                  cell.toFront();
                  cell.attr("./opacity", 1);
                  selectedComponent.current?.toFront();
                } else {
                  cell.attr("./opacity", 0.1);
                }
              } 
              // else {
              //   cell.attr("operatingMode/text", cell.position());
              // }
            });
          }
        }
      );
      // zoom
      let scale = 1.0;
      const rescale = (evt: any, x: number, y: number, delta: number) => {
        if (delta === 1) {
          scale = scale + 0.1;
        } else {
          scale = scale - 0.1;
        }
        paper.scale(scale, scale, 0.5, 0.5);
      };
      const rescale2 = (
        view: any,
        evt: any,
        x: number,
        y: number,
        delta: number
      ) => {
        rescale(evt, x, y, delta);
      };
      paper.on("blank:mousewheel", rescale);
      paper.on("cell:mousewheel link:mousewheel element:mousewheel", rescale2);

      // pan
      let dragStartPosition: { x: number; y: number } | undefined;
      let offset: { x: number; y: number } | undefined;
      paper.on("blank:pointerdown", function (event, x, y) {
        dragStartPosition = { x: x * scale, y: y * scale };
      });
      paper.on("cell:pointerup blank:pointerup element:pointerup", function () {
        dragStartPosition = undefined;
      });
      paper.on("blank:pointermove", (event, x, y) => {
        console.log(x, y);
        if (dragStartPosition !== undefined) {
          graph.current?.translate(
            x * scale - dragStartPosition.x,
            y * scale - dragStartPosition.y
          );
          dragStartPosition = { x: x * scale, y: y * scale };
        }
      });

      paperRef.current = paper;

      paper.options.connectionStrategy = connectionStrategies.pinRelative;
      //paper.options.sorting = dia.Paper.sorting.APPROX;
    };

    const update = () => {
      const positions = new Map<string, { x: number; y: number }>();
      graph.current?.getCells().forEach((cell: dia.Cell) => {
        if (cell instanceof ComponentShape) {
          positions.set(cell.id as string, cell.position());
        }
      });
      graph.current?.clear();
      let numComponents = 0;
      let selectedComponentFound = false;
      let y = 60;
      let x = 100;
      props.setUnits(units);
      for (const c of components) {
        console.log(c);
        let isSelectedComponent = false;
        const height = Math.max(3, Math.ceil(c.ports.length / 2)) * 30;
        if (y + height >= 1000) {
          y = 60 + (Math.floor((x - 100) / 350) % 2) * 20;
          x += 500;
        }
        const id = `${c.unit}:${c.name}`;
        const stateTransformer = stateTransformers.get(id);
        const presetPosition = presetPositions[c.name.startsWith("Consolidator")
        ? `${c.name.match(/Consolidator[0-9]+?/)?.[0]}` : c.name];
        const rect = new ComponentShape({
          id: id,
          position: presetPosition ?? positions.get(id) ?? {
            x: x + (120 + 40) * (numComponents % 2),
            y,
          },
          size: { width: 120, height },
          attrs: {
            label: {
              text: c.name.startsWith("Consolidator")
                ? `${c.unit}:${c.name.match(/Consolidator[0-9]+?/)?.[0]}`
                : id,
            },
            state: {
              text: c.state.fsm,
            },
            operatingMode: {
              text: c.unit !== "ext" ? c.operatingMode : "(external)",
            },
            transformedState: {
              text: stateTransformer ? stateTransformer(c.state) : "",
            },
            events: `[${c.events.toString()}]`,
            ports: c.ports,
            unit: c.unit,
            my: c.state.my,
            name: c.name,
          },
          ports: {
            groups: {
              in: portsIn,
              out: portsOut,
            },
          },
        });
        if (
          c.unit !== "ext" && (c.operatingMode === "__error" ||
          c.operatingMode === "__unreachable")
        ) {
          rect.attr("operatingMode/stroke", "#ff0000");
        }
        y += height + 20;
        if (!selectedComponentFound && selectedComponent.current) {
          if (id === selectedComponent.current.id) {
            selectedComponent.current = rect;
            isSelectedComponent = true;
            selectedComponentFound = true;
          }
        }

        for (const p of c.ports) {
          rect.addPort({
            id: p.name,
            group: connections.some((connection: any) =>
              connection.source.includes(p.name)
            )
              ? "out"
              : "in",
            attrs: {
              label: {
                text: p.name.includes(",") ? p.name.split(",")[1] : p.name,
              },
            },
          });
        }
        graph.current?.addCell(rect);
        numComponents++;
      }
      selectedPort.current = undefined;
      if (!selectedComponentFound) {
        selectedComponent.current = undefined;
        props.setAbstractState("");
        props.setFsmState("");
        props.setEventList("");
        props.setEventTypes([]);
      }

      for (const conn of connections) {
        const connection = new shapes.standard.Link({
          source: {
            id: conn.source[0],
            port: conn.source[1],
            priority: true,
            // anchor: {
            //   name: "right",
            //   args: {
            //     dx: 50,
            //   },
            // },
            connectionPoint: {
              name: "boundary",
            },
          },
          target: {
            id: conn.target[0],
            port: conn.target[1],
            priority: true,
            anchor: {
              name: "perpendicular",
              args: {
                padding: 20,
              },
            },
            connectionPoint: {
              name: "boundary",
            },
          },
          //connector: { name: "smooth", args: { radius: 100 } },
          connector: { name: "rounded", args: { radius: 80 } },
          //connector: { name: "jumpover", args: { size: 2 }},
          router: {
            name: "metro",
            args: {
              padding: 20,
              maximumLoops: 10000,
              maxAllowedDirectionChange: 120,
              startDirections: ["right"],
              endDirections: ["left"],
              step: 40,
              perpendicular: true,
            },
          },
          z: -50,
        });
        connection.attr("./opacity", 0.5);
        graph.current?.addCell(connection);
      }
      if (selectedComponent.current) {
        selectedComponent.current.attr("body/stroke", "#00ff00");
        props.setAbstractState(
          JSON.stringify(selectedComponent.current.attr("my"), null, 2)
        );
        props.setFsmState(
          selectedComponent.current.attr("state").text ?? "undefined"
        );
        props.setEventList(selectedComponent.current.attr("events"));
        const allEventTypes = selectedComponent.current
          .attr("ports")
          .map((p: any) => p.eventTypes)
          .flat();
        const uniqueEventTypes = allEventTypes.filter(
          (p: string, index: number) => allEventTypes.indexOf(p) === index
        );
        props.setEventTypes(uniqueEventTypes);
        graph.current?.getCells().forEach((cell: dia.Cell) => {
          if (cell instanceof shapes.standard.Link) {
            const isConnected =
              cell.source().id === selectedComponent.current?.id ||
              cell.target().id === selectedComponent.current?.id;
            if (isConnected) {
              cell.toFront();
              cell.attr("./opacity", 1);
              selectedComponent.current?.toFront();
            } else {
              cell.attr("./opacity", 0.1);
            }
          }
        });
      }
      //paperRef.current?.scaleContentToFit({ padding: 20 });
    };

    if (isFirstRun.current === true) {
      firstRun();
    } else {
      update();
    }
  }, [components, connections]);

  return <div className="canvas" ref={canvas}></div>;
};

export default Diagram;
