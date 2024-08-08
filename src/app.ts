import "dotenv/config"

import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { TwilioProvider  as Provider } from '@builderbot/provider-twilio'
import { toAsk, httpInject } from "@builderbot-plugins/openai-assistants"
import { typing } from "./utils/presence"
import ChatwootClass from "services/class/chatwoot"
import { handlerMessage } from "services/class/botWrapper"

const PORT = process.env?.PORT ?? 3008
const ASSISTANT_ID = process.env?.ASSISTANT_ID ?? ''
let chunks: string[]
let idAssigned: null
let phone: null

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAction(async (ctx, { flowDynamic,  state, provider }) => {
        if(phone !== undefined){
            await typing(ctx, provider)
            const response = await toAsk(ASSISTANT_ID, ctx.body, state)
            chunks = response.split(/\n\n+/);

            if((idAssigned === null || idAssigned === undefined) && ctx.from.includes(phone)){
                for (const chunk of chunks) {
                    await flowDynamic([{ body: chunk.trim() }]);
                    await handlerMessage({
                        phone: ctx.from,
                        name: ctx.name,
                        message: chunk.trim(),
                        attachment: [],
                        mode: 'outgoing'
                    }, chatwoot)
                }
            }else if((idAssigned !== null || idAssigned !== undefined) && !ctx.from.includes(phone)){
                for (const chunk of chunks) {
                    await flowDynamic([{ body: chunk.trim() }]);
                    await handlerMessage({
                        phone: ctx.from,
                        name: ctx.name,
                        message: chunk.trim(),
                        attachment: [],
                        mode: 'outgoing'
                    }, chatwoot)
                }
            }
        }else if(phone === undefined){
            await typing(ctx, provider)
            const response = await toAsk(ASSISTANT_ID, ctx.body, state)
            chunks = response.split(/\n\n+/);

            for (const chunk of chunks) {
                await flowDynamic([{ body: chunk.trim() }]);
                await handlerMessage({
                    phone: ctx.from,
                    name: ctx.name,
                    message: chunk.trim(),
                    attachment: [],
                    mode: 'outgoing'
                }, chatwoot)
            }
        }
       


    })


    const chatwoot = new ChatwootClass({
        account: process.env.CHATWOOT_ACCOUNT_ID,
        token: process.env.CHATWOOT_TOKEN,
        endpoint: process.env.CHATWOOT_ENDPOINT
    })


const main = async () => {
    const adapterFlow = createFlow([welcomeFlow])
    const adapterProvider = createProvider(Provider, {
        accountSid: process.env.ACC_SID, //AC4695aa720b4d700a***************
        authToken: process.env.ACC_TOKEN, //3f6fae09f7a1c3534***************
        vendorNumber: process.env.ACC_VENDOR, //+14155238886
    })

    adapterProvider.on('message', async (payload) => {
            try {

                const attachment = []
                /**
                 * Determinar si el usuario esta enviando una imagen o video o fichero
                 * luego puedes ver los fichero en http://localhost:3001/file.pdf o la extension
                 */
                /**
                if (payload?.body.includes('_event_')) {
                    const mime = payload?.message?.imageMessage?.mimetype ?? payload?.message?.videoMessage?.mimetype ?? payload?.message?.documentMessage?.mimetype;
                    const extension = mimeType.extension(mime);
                    const buffer = await downloadMediaMessage(payload, "buffer");
                    const fileName = `file-${Date.now()}.${extension}`
                    const pathFile = `${process.cwd()}/public/${fileName}`
                    await fs.writeFile(pathFile, buffer);
                    console.log(`[FIECHERO CREADO] http://localhost:3001/${fileName}`)
                    attachment.push(pathFile)
                }
                */
                await handlerMessage({
                    phone: payload.from,
                    name: payload.name,
                    message: payload.body,
                    attachment,
                    mode: 'incoming'
                }, chatwoot)
            } catch (err) {
                console.log('ERROR', err)
            }
    })


    const adapterDB = new Database()

    const bot = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB
    });

    const { handleCtx, httpServer } = bot;

    adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia, name } = req.body
            
            await handlerMessage({
                phone: number,
                name: name,
                message: message,
                attachment: [],
                mode: 'outgoing'
            }, chatwoot)

            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    adapterProvider.server.post('/v1/chatwoot',
        handleCtx(async (bots, req, res) => {
            const body = req.body;
        const attachments = body?.attachments
        try {
            const mapperAttributes = body?.changed_attributes?.map((a) => Object.keys(a)).flat(2)

            /**
             * Esta funcion se encarga de agregar o remover el numero a la blacklist
             * eso quiere decir que podemos hacer que el chatbot responda o no
             * para que nos sirve, para evitar que el chatbot responda mientras
             * un agente humano esta escribiendo desde chatwoot
             */
            if (body?.event === 'conversation_updated' && mapperAttributes.includes('assignee_id')) {
                const _phone = body?.meta?.sender?.phone_number.replace('+', '')
                phone = _phone; 
                idAssigned = body?.changed_attributes[0]?.assignee_id?.current_value ?? null
               
                
                if(idAssigned){
                    bots.blacklist.add(phone)
                }else{
                    bots.blacklist.remove(phone)
                }
                res.end('ok')
                return
            }

            /**
             * La parte que se encarga de determinar si un mensaje es enviado al whatsapp del cliente
             */
            const checkIfMessage = body?.private == false && body?.event == "message_created" && body?.message_type === "outgoing" && body?.conversation?.channel.includes("Channel::Api")
            if (checkIfMessage) {
                const phone = body.conversation?.meta?.sender?.phone_number.replace('+', '')
                const content = body?.content ?? '';

                const file = attachments?.length ? attachments[0] : null;
                if (file) {
                    console.log(`Este es el archivo adjunto...`, file.data_url)
                    await bots.sendMessage(
                        `${phone}@c.us`,
                        file.data_url,
                        content,
                    );
                    res.end('ok')
                    return
                }
        


                /**
                 * esto envia un mensaje de texto al ws
                 */
                await bots.sendMessage(
                    `${phone}`,
                    content,
                    {}
                );

                res.end('ok');
                return;
               
            }

            res.end('ok')
        } catch (error) {
            console.log(error)
            return res.status(405).send('Error')
        }
        })
    )

    httpInject(adapterProvider.server)
    httpServer(+PORT)
}

main()
