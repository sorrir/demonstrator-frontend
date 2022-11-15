import { DebuggingAgentWebSocketComponent } from "@sorrir/sorrir-framework-interface";
import stateTransformers from "./StateTransformer";

const installExampleStateTransformers = () => {
    stateTransformers.set('pms', (state: DebuggingAgentWebSocketComponent['state']) : string => {
        let res = '';
        if (state.my) {
            for (const column of state.my.parkingSpaceStatuses) {
                for (const row of column) {
                    for (const level of row) {
                        if (res.length > 0 && res[res.length - 1] !== '\n') {
                            res += ', ';
                        }
                        res += level.isOccupied;
                    }
                    res += '\n';
                }
            }
        }
        return res;
    });
    stateTransformers.set('acs', (state: DebuggingAgentWebSocketComponent['state']) : string => {
        let counter = 0;
        let res = '';
        if (state.my) {
            for (const account of Object.values(state.my.accounts)) {
                if (res.length > 0 && res[res.length - 1] !== '\n') {
                    res += ', ';
                }
                res += (account as any).licensePlates;
                if (counter++ >= 2) {
                    res += '\n';
                    counter = 0;
                }
            }
        }
        return res;
    });
}

export default installExampleStateTransformers;
