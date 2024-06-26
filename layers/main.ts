import { BotContext, BotMethods } from "@builderbot/bot/dist/types"
import { ChatGPTClass } from './../chatgpt.class';
import AIClass from "../services/ai"
import { getHistoryParse } from "~/utils/handleHistory";
import { sellerFlow } from "flows/seller.flow";
import { agendarFlow } from "flows/agendar.flow";

const PROMPT_DISCRIMINATOR = `Eres un profesional experto en análisis de intención del usuario. Tu tarea es identificar la intención del usuario basándote en el historial de conversación {HISTORY} y devolver únicamente una de las siguientes palabras: "Hablar", "Agendar", "Reagendar" o "Cancelar".

Las intenciones se definen de la siguiente manera:

"Hablar": El usuario desea informarse sobre nuestros servicios o productos.
"Agendar": El usuario desea agendar una nueva cita.
"Reagendar": El usuario desea cambiar la fecha o hora de una cita ya programada.
"Cancelar": El usuario desea cancelar una cita previamente agendada.
Instrucciones detalladas:

Analiza el historial de conversación {HISTORY}.
Identifica palabras clave y frases que indiquen la intención del usuario.
Considera las respuestas afirmativas a preguntas directas sobre agendar citas como indicativo de la intención de agendar.
Devuelve únicamente una de las palabras: "Hablar", "Agendar", "Reagendar" o "Cancelar" según corresponda.
Ejemplo de análisis paso a paso:

Si el usuario pregunta por información general sobre servicios o productos, devuelve "Hablar".
Si el usuario expresa interés en fijar una fecha para una cita o responde afirmativamente a una pregunta sobre agendar una cita, devuelve "Agendar".
Si el usuario menciona cambiar la fecha o la hora de una cita existente, devuelve "Reagendar".
Si el usuario menciona cancelar una cita previamente agendada, devuelve "Cancelar".`

const ChatGPTInstance = new ChatGPTClass()

export default async (_: BotContext, { state, gotoFlow, extensions }: BotMethods) => {
    const ai = extensions.ai as AIClass
    const history = getHistoryParse(state)
    const prompt = PROMPT_DISCRIMINATOR.replace('{HISTORY}', history)
    const response =  await ChatGPTInstance.handleMsgChatGPT(_, prompt)
    const prediction = await response.text 
    console.log(prediction)

    if (prediction.includes('Hablar')) return gotoFlow(sellerFlow)
    if (prediction.includes('Agendar')) return gotoFlow(agendarFlow)
}