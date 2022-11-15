import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import Ajv from "ajv";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import store from "./store";
import { DebuggingAgentWebSocketConfigurationStateJSONSchema } from "@sorrir/sorrir-framework-interface";

const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
const validate = ajv.compile(DebuggingAgentWebSocketConfigurationStateJSONSchema);

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App configurationSchemaValidator={validate} />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
