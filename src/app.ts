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

const PORT = process.env?.PORT ?? 3008;
const ASSISTANT_ID = process.env?.ASSISTANT_ID ?? "";
let usuarioNuevo = true;

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME).addAction(
  async (ctx, { flowDynamic, state, provider }) => {
    await typing(ctx, provider);
    const response = await toAsk(ASSISTANT_ID, ctx.body, state);
    const chunks = response.split(/\n\n+/);
    for (const chunk of chunks) {
      if (usuarioNuevo) {
        await flowDynamic([
          {
            body: chunk.trim(),
            media: "https://babelink.com.mx/images/Caroline.jpg",
          },
        ]);
        usuarioNuevo = false;
      } else {
        await flowDynamic([{ body: chunk.trim() }]);
      }
    }
  }
);

const locationFlow =  addKeyword(EVENTS.LOCATION)
.addAnswer("He recibido tu ubicación muchas gracias", null, async (ctx) => {
  const userLatitude = ctx.Latitude;
  const userLongitude = ctx.Longitude;
})

const documentFlow = addKeyword(EVENTS.DOCUMENT)
.addAnswer("Dame un momento para ver tu documento", null, async (ctx, { provider }) => {
  const localPath = await provider.saveFile(ctx, {path:'tmp'})
})

const main = async () => {
  const adapterFlow = createFlow([welcomeFlow, locationFlow, documentFlow]);
  const adapterProvider = createProvider(Provider, {
    accountSid: process.env.ACC_SID, //AC4695aa720b4d700a***************
    authToken: process.env.ACC_TOKEN, //3f6fae09f7a1c3534***************
    vendorNumber: process.env.ACC_VENDOR, //+14155238886
  });

  const adapterDB = new Database({ filename: 'db.json' });

  const { httpServer } = await createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  httpInject(adapterProvider.server);
  httpServer(+PORT);
};

main();
