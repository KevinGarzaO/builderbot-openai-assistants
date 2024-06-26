import { createFlow } from "@builderbot/bot";

import { welcomeFlow } from "./welcome.flow";
import { sellerFlow } from "./seller.flow";
import { agendarFlow } from "./agendar.flow";
import { flowConfirm } from "./confirm.flow";

export default createFlow([
    welcomeFlow,
    sellerFlow,
    agendarFlow,
    flowConfirm
])