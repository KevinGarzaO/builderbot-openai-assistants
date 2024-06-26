import { addKeyword, EVENTS } from "@builderbot/bot";
  import { JsonFileDB  as Database } from "@builderbot/database-json";
  import { TwilioProvider as Provider } from "@builderbot/provider-twilio";
  import { toAsk, httpInject } from "@builderbot-plugins/openai-assistants";
  import { typing } from "~/utils/presence";
  

let usuarioNuevo = true;
const ASSISTANT_ID = process.env?.ASSISTANT_ID ?? "";

export const sellerFlow = addKeyword<Provider, Database>(EVENTS.ACTION).addAction(
    async (ctx, { flowDynamic, state, provider }) => {
      await typing(ctx, provider);
      const response = await toAsk(ASSISTANT_ID, ctx.body, state);
      const chunks = response.split(/\n\n+/);
      for (const chunk of chunks) {
        if (usuarioNuevo) {
          await flowDynamic([
            {
              body: chunk.trim().replace("【6:0†source】", ""),
              media: "https://babelink.com.mx/images/Caroline.jpg",
            },
          ]);
          usuarioNuevo = false;
        } else {
          await flowDynamic([{ body: chunk.trim().replace("【6:0†source】", "") }]);
        }
      }
    }
  );
 
