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


const PORT = process.env?.PORT ?? 3008;
const ASSISTANT_ID = process.env?.ASSISTANT_ID ?? "";


const locationFlow =  addKeyword(EVENTS.LOCATION)
.addAnswer("He recibido tu ubicación muchas gracias", null, async (ctx) => {
  const userLatitude = ctx.Latitude;
  const userLongitude = ctx.Longitude;
})

const documentFlow = addKeyword(EVENTS.DOCUMENT)
.addAnswer("Dame un momento para ver tu documento", null, async (ctx, { provider }) => {
  const localPath = await provider.saveFile(ctx, {path:'tmp'})
})

const pagoFlow = addKeyword('pagar')
.addAnswer('dame un momento para generarte un link de pago...')
.addAnswer('¿Cual es tu email?',{capture:true}, async (ctx, {fallBack, flowDynamic}) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const email = ctx.body;
    const phone = ctx.from

    if(!emailRegex.test(email)){
        return fallBack(`Debe ser un mail correcto! esto *${email}* NO es un mail`)
    }

    const link = await handlerStripe(phone, email)
    console.log(link)
    await flowDynamic(`Aqui tienes el link: ${link.url}`)
})


const main = async () => {
  const adapterProvider = createProvider(Provider, {
    accountSid: process.env.ACC_SID, //AC4695aa720b4d700a***************
    authToken: process.env.ACC_TOKEN, //3f6fae09f7a1c3534***************
    vendorNumber: process.env.ACC_VENDOR, //+14155238886
  });

  const adapterDB = new Database({ filename: 'db.json' });

  const { httpServer, handleCtx } = await createBot({
    flow: flows,
    provider: adapterProvider,
    database: adapterDB,
  });

  httpInject(adapterProvider.server);
  httpServer(+PORT);

  adapterProvider.server.post('/v1/messages', handleCtx(async (bot, req, res) => {
    const { number, message } = req.body
    await bot.sendMessage(number, message, {})
    return res.end('send')
}))


const COURSE_ID = process.env.COURSE_ID ?? "";

adapterProvider.server.get('/api/callback', handleCtx(async (bot, req, res)  => {
  const payload = req.query.p;
  const adapterDB = req.db;
  const adapterProvider = req.ws;

  if (!payload) {
    res.send({ data: "Ups algo paso con pago intenta de nuevo!" });
    return;
  }

  const data = decryptData(payload);
  const [phone, status, email] = data.split("__") ?? [
    undefined,
    undefined,
    undefined,
  ];

  if (status === "fail") {
    await bot.sendMessage(phone, "Ups! algo paso con tu pago!", {})
  }else if(status === "success"){
    await bot.sendMessage(phone, "Gracias por tu pago lo hemos recibido", {})
  }

  return res.end(`Email: ${email}, Estatus: ${status}`)
}));

};

main();


