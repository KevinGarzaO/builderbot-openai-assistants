import moment from 'moment';

const obtenerProximaHoraDisponible = (diasLaborales, bloquesHorarios, citasOcupadas): string => {
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
            return proximaHora.format('YYYY/MM/DD HH:mm:ss');
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
                    return  fecha.format('YYYY/MM/DD HH:mm:ss');
                }
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


  const consultarHoraDisponible = (fecha, bloquesHorarios, citasOcupadas): boolean => {
                const horaOcupada = citasOcupadas.find((cita) => cita.isSame(fecha));
                console.log("horaOcupada: ", horaOcupada)
                if (!horaOcupada) {
                    return  true
                }
            }


  export { obtenerProximaHoraDisponible, consultarHoraDisponible }