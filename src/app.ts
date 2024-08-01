import "dotenv/config";

import {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
  EVENTS,
} from "@builderbot/bot";
import { JsonFileDB  as Database } from "@builderbot/database-json";
import { TwilioProvider as Provider } from "@builderbot/provider-twilio";
import { toAsk, httpInject } from "@builderbot-plugins/openai-assistants";
import { typing } from "./utils/presence";
import { handlerStripe } from "../services/stripe";
import { decryptData } from "utils/hash";
import flows from "flows";


const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAction(async (ctx, { flowDynamic,  state, provider }) => {
        await typing(ctx, provider)
        const response = await toAsk(ASSISTANT_ID, ctx.body, state)
       const chunks = response.split(/\n\n+/);
for (const chunk of chunks) {
    await flowDynamic([{ body: chunk.trim() }]);
}
    })

const main = async () => {
  const adapterProvider = createProvider(Provider, {
    accountSid: process.env.ACC_SID, //AC4695aa720b4d700a***************
    authToken: process.env.ACC_TOKEN, //3f6fae09f7a1c3534***************
    vendorNumber: process.env.ACC_VENDOR, //+14155238886
  });

    const { httpServer, handleCtx } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    httpInject(adapterProvider.server)
    httpServer(+PORT)
}

