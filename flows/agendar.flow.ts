/* eslint-disable builderbot/func-prefix-endflow-flowdynamic */
import { addKeyword, EVENTS } from "@builderbot/bot";
import { getHistoryParse, handleHistory } from "~/utils/handleHistory";
import { addMinutes, isWithinInterval, format, parse, addHours } from "date-fns";
import { getCurrentCalendar } from "services/calendar";
import { generateTimer } from "~/utils/generateTimer";
import { ChatGPTClass } from './../chatgpt.class';
import { flowConfirm } from "./confirm.flow";
import moment from 'moment';

const DURATION_MEET = process.env.DURATION_MEET ?? 60


export const agendarFlow = addKeyword(EVENTS.ACTION).addAction(async (_, { extensions, state, flowDynamic, endFlow }) => {
    await flowDynamic('Dame un momento para consultar la agenda...');
    const history = getHistoryParse(state);
    const list = await getCurrentCalendar()


        // Define los días laborales y bloques horarios
    const diasLaborales = [1, 3, 5]; // Lunes, miércoles y viernes
    const bloquesHorarios = [
    { inicio: '11:30', fin: '12:30' },
    { inicio: '12:40', fin: '13:40' },
    { inicio: '14:00', fin: '15:00' },
    { inicio: '15:30', fin: '16:30' },
    ];

    // Define las citas ocupadas (simulación)
    const citasOcupadas = [
    moment('2024-06-26 11:30', 'YYYY-MM-DD HH:mm'),
    moment('2024-06-26 13:40', 'YYYY-MM-DD HH:mm'),
    moment('2024-06-28 11:30', 'YYYY-MM-DD HH:mm'),
    moment('2024-06-28 12:40', 'YYYY-MM-DD HH:mm'),
    moment('2024-06-28 14:00', 'YYYY-MM-DD HH:mm'),
    moment('2024-06-28 15:30', 'YYYY-MM-DD HH:mm'),
    // ... otras citas ocupadas ...
    ];


    
const proximaHoraDisponible = obtenerProximaHoraDisponible(diasLaborales, bloquesHorarios, citasOcupadas);
console.log(`La próxima hora disponible es: ${proximaHoraDisponible}`);

})

function obtenerProximaHoraDisponible(diasLaborales, bloquesHorarios, citasOcupadas): string {
    const ahora = moment();
    const proximaHora = ahora.clone().add(24, 'hours'); // Inicializar con 24 horas desde ahora
  
    const horaFin = moment('16:00', 'HH:mm'); // Definir la hora de fin
  
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const diaSemana = proximaHora.day();
      if (diasLaborales.includes(diaSemana)) {
        const horaOcupada = citasOcupadas.find((cita) => cita.isSame(proximaHora, 'hour'));
      

        if (!horaOcupada) {
          // Verificar si la hora está dentro de los bloques horarios
          const horaActual = proximaHora.format('HH:mm');
          const bloqueValido = bloquesHorarios.some(
            (bloque) => horaActual >= bloque.inicio && horaActual < bloque.fin
          );

       
          
          if(!bloqueValido){
            const value = bloquesHorarios.filter(
                (bloque) => horaActual > bloque.inicio
              );

              citasOcupadas.find((cita) => cita.isSame(proximaHora, 'hour'))
          }
       

          if (bloqueValido) {
            // Formatear la fecha y hora completa
            const fechaHoraCompleta = proximaHora.format('DD/MM/YYYY HH:mm:ss');
            console.log("fechaHoraCompleta: ", fechaHoraCompleta)
            return fechaHoraCompleta;
          }
        }else{

            const dia = proximaHora.format('YYYY-MM-DD')
            const fecha = moment(dia)

            for(const element of bloquesHorarios) {
                const hora =  element.inicio.substring(0, 2); // Extrae los primeros dos caracteres (la hora)
                const minutos =  element.inicio.substring(3);
                fecha.set({ hour: hora, minute: minutos });
                const horaOcupada = citasOcupadas.find((cita) => cita.isSame(fecha));
                if (!horaOcupada) {
                    console.log("Fecha: ", fecha.format('DD/MM/YYYY HH:mm:ss'))
                    return  fecha.format('DD/MM/YYYY HH:mm:ss');
                }

                console.log("horaOcupada: ", horaOcupada)
            }
        }
      }
      proximaHora.add(1, 'hour');
  
      // Si llegamos a la hora de fin, avanzamos al siguiente día
      if (proximaHora.isSameOrAfter(horaFin)) {
        proximaHora.add(1, 'days');
        proximaHora.set('hour', parseInt(bloquesHorarios[0].inicio.split(':')[0], 10));
        proximaHora.set('minute', parseInt(bloquesHorarios[0].inicio.split(':')[1], 10));
      }
    }
  }