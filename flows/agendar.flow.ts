/* eslint-disable builderbot/func-prefix-endflow-flowdynamic */
import { addKeyword, EVENTS } from "@builderbot/bot";
import { getHistoryParse, handleHistory } from "~/utils/handleHistory";
import { addMinutes, isWithinInterval, format, parse, addHours } from "date-fns";
import { getCurrentCalendar } from "services/calendar";
import { generateTimer } from "~/utils/generateTimer";
import { ChatGPTClass } from './../chatgpt.class';
import { flowConfirm } from "./confirm.flow";
import moment from 'moment';
import { obtenerProximaHoraDisponible, consultarHoraDisponible } from "~/utils/agendar";
import { getFullCurrentDate } from "~/utils/currentDate";

const ChatGPTInstance = new ChatGPTClass();

const DURATION_MEET = process.env.DURATION_MEET ?? 60

const PROMPT_FECHA_CITA = `
Eres un asistente profesional de atención al cliente. Tu tarea es extraer la fecha y hora de la cita que el cliente mencionó en su último mensaje del historial de conversación. La fecha y hora deben estar en el formato "yyyy/MM/dd HH:mm:ss". La fecha y hora actuales son: {FECHA_HORA}. A continuación, se presenta el último mensaje del cliente:

{HISTORIAL}

Indica la fecha y hora de la cita en el formato requerido.

"{respuesta en formato: yyyy/MM/dd HH:mm:ss}"`

const generatePromptFilter = (history: string) => {
    const nowDate = getFullCurrentDate();
    const mainPrompt = PROMPT_FECHA_CITA
        .replace('{HISTORIAL}', history)
        .replace('{FECHA_HORA}', nowDate);

    return mainPrompt;
}

export const agendarFlow = addKeyword(EVENTS.ACTION).addAction(async (_, { extensions, state, flowDynamic, endFlow }) => {
    await flowDynamic('Dame un momento para consultar la agenda...');
    const history = getHistoryParse(state);
    const list = await getCurrentCalendar()
    const listParse = list.map(({ start }) =>  (moment(addHours(start, 6), 'YYYY-MM-DD HH:mm')));

    const response = await ChatGPTInstance.handleMsgChatGPT(_, generatePromptFilter(history))
    const _message = await response.text.replace("**", "*")
    console.log("_message: ", _message)
    const _desiredDate  = parse(_message, 'yyyy/MM/dd HH:mm:ss', new Date());
    const fechaConsulta = moment(_desiredDate)
    console.log("fechaConsulta: ", fechaConsulta)

    // Define los días laborales y bloques horarios
    const diasLaborales = [1, 3, 5]; // Lunes, miércoles y viernes
    const bloquesHorarios = [
    { inicio: '11:30', fin: '12:30' },
    { inicio: '12:40', fin: '13:40' },
    { inicio: '14:00', fin: '15:00' },
    { inicio: '15:30', fin: '16:30' },
    ];

    const intencion = "";

   if(intencion.toLowerCase().includes('Propuesta')){
    return
   }
   else if(intencion.toLowerCase().includes('Especificación')){
    return
   }
    else if(intencion.toLowerCase().includes('Disponibilidad')){
    return
   }
   else if(intencion.toLowerCase().includes('Horarios')){
    return
   }
   else if(intencion.toLowerCase().includes('Fechas')){
    return
   }

    
    const proximaHoraDisponible = obtenerProximaHoraDisponible(diasLaborales, bloquesHorarios, listParse);
    const _consultarHoraDisponible = consultarHoraDisponible(fechaConsulta, bloquesHorarios, listParse);
    
    if(_consultarHoraDisponible){
        const message = `¡Perfecto! Si tenemos fecha para ese día. ¿Confirmo tu reserva? *si*`;
        await handleHistory({ content: message, role: 'assistant' }, state);
        await state.update({ desiredDate: fechaConsulta })
        await flowDynamic([{ body: message, delay: generateTimer(150, 250) }]);
    }    
        

    const desiredDate  = parse(proximaHoraDisponible, 'yyyy/MM/dd HH:mm:ss', new Date());
    const formattedDateFrom = format(desiredDate, 'hh:mm a');
    const formattedDateTo = format(addMinutes(desiredDate, +DURATION_MEET), 'hh:mm a');
    const message = `¡Perfecto! Tenemos disponibilidad de ${formattedDateFrom} a ${formattedDateTo} el día ${format(desiredDate, 'dd/MM/yyyy')}. ¿Confirmo tu reserva? *si*`;
    await handleHistory({ content: message, role: 'assistant' }, state);
    await state.update({ desiredDate })

    const chunks = message.split(/(?<!\d)\.\s+/g);
    for (const chunk of chunks) {
        await flowDynamic([{ body: chunk.trim(), delay: generateTimer(150, 250) }]);
    }
}).addAction({ capture: true }, async ({ body }, { gotoFlow, flowDynamic, state }) => {

    if (body.toLowerCase().includes('si')) return gotoFlow(flowConfirm)

    await flowDynamic('¿Alguna otra fecha y hora?')
    await state.update({ desiredDate: null })
})