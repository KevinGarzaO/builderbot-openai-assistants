import { addKeyword, EVENTS } from "@builderbot/bot";
import { addMinutes, format, parse, subHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { appToCalendar } from "services/calendar";
import { clearHistory } from "~/utils/handleHistory";


const DURATION_MEET = process.env.DURATION_MEET ?? 60
const TIME_ZONE = process.env.TZ
/**
 * Encargado de pedir los datos necesarios para registrar el evento en el calendario
 */
const flowConfirm = addKeyword(EVENTS.ACTION).addAction(async (_, { flowDynamic }) => {
    console.log("Entre en confirmar")
    await flowDynamic('Ok, voy a pedirte unos datos para agendar')
    await flowDynamic('¿Cual es tu nombre?')
}).addAction({ capture: true }, async (ctx, { state, flowDynamic, endFlow }) => {

    if (ctx.body.toLocaleLowerCase().includes('cancelar')) {
        clearHistory(state)
        // eslint-disable-next-line builderbot/func-prefix-endflow-flowdynamic
        return endFlow(`¿Como puedo ayudarte?`)

    }
    await state.update({ name: ctx.body })
    await flowDynamic(`Ultima pregunta ¿Cual es tu email?`)
})
    .addAction({ capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {

        if (!ctx.body.includes('@')) {
            return fallBack(`Debes ingresar un mail correcto`)
        }

        const formattedDateFrom = format(state.get('desiredHora'), 'yyyy/MM/dd HH:mm:ss');
        console.log("formattedDateFrom", formattedDateFrom)

        const desiredDate = parse(formattedDateFrom, 'yyyy/MM/dd HH:mm:ss', new Date());

        console.log("desiredDate: ", desiredDate)

        const dateObject = {
            name: state.get('name'),
            email: ctx.body,
            startDate: subHours(desiredDate, 6),
            endData: addMinutes(subHours(desiredDate, 6), +DURATION_MEET),
            phone: ctx.from
        }

        await appToCalendar(dateObject)

        clearHistory(state)
        await flowDynamic('Listo! agendado Buen dia')
    })

export { flowConfirm }