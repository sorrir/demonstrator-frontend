import { configureStore } from "@reduxjs/toolkit";
import { DebuggingAgentWebSocketConfigurationState } from "@sorrir/sorrir-framework-interface";

export type Action =
  | {
      type: "noop";
    }
  | {
      type: "stateUpdate";
      newState: DebuggingAgentWebSocketConfigurationState;
    };

export type RootState = { configurationState: DebuggingAgentWebSocketConfigurationState };

const initialState: DebuggingAgentWebSocketConfigurationState = {
  components: [],
  connections: [],
  units: []
};

// Use the initialState as a default value
export const reducer = (state = initialState, action: Action) => {
  // The reducer normally looks at the action type field to decide what happens
  switch (action.type) {
    case "noop":
      return state;
    case "stateUpdate":
      return action.newState;
    default:
      return state;
  }
};

export const noop = () => {
  return { type: "noop" };
};

export const stateUpdate = (newState: DebuggingAgentWebSocketConfigurationState): Action => {
  return {
    type: "stateUpdate",
    newState: newState,
  };
};

export default configureStore({
  reducer: {
    configurationState: reducer,
  },
});
