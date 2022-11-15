import { DebuggingAgentWebSocketComponent } from "@sorrir/sorrir-framework-interface";

const stateTransformers = new Map<string, (state: DebuggingAgentWebSocketComponent['state']) => string>();

export default stateTransformers;
