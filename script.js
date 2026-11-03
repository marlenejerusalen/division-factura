function calcular() {

    const error = document.getElementById("error");

    error.textContent = "";


    // =========================
    // DATOS EDESA
    // =========================

    const cargoFijo5 =
        Number(document.getElementById("cargoFijo5").value);

    const cargoFijo25 =
        Number(document.getElementById("cargoFijo25").value);

    const tamanoTramo1 =
        Number(document.getElementById("tamanoTramo1").value);

    const tamanoTramo2 =
        Number(document.getElementById("tamanoTramo2").value);

    const precioTramo1 =
        Number(document.getElementById("precioTramo1").value);

    const precioTramo2 =
        Number(document.getElementById("precioTramo2").value);

    const precioExcedente =
        Number(document.getElementById("precioExcedente").value);

    const ivaEdesa =
        Number(document.getElementById("ivaEdesa").value);


    // =========================
    // ALUMBRADO
    // =========================

    const alumbradoPublico =
        Number(document.getElementById("alumbradoPublico").value);


    // =========================
    // AGUAS
    // =========================

    const cargoFijoAguas =
        Number(document.getElementById("cargoFijoAguas").value);

    const consumoAguas =
        Number(document.getElementById("consumoAguas").value);

    const tasaAguas =
        Number(document.getElementById("tasaAguas").value);

    const ivaAguas =
        Number(document.getElementById("ivaAguas").value);


    // =========================
    // LUSAL
    // =========================

    const mantenimientoLusal =
        Number(document.getElementById("mantenimientoLusal").value);


    // =========================
    // CONSUMO
    // =========================

    const totalKwh =
        Number(document.getElementById("totalKwh").value);

    const persona1Kwh =
        Number(document.getElementById("persona1Kwh").value);


    // =========================
    // VALIDACIONES
    // =========================

    if (totalKwh <= 0) {

        error.textContent =
            "El consumo total debe ser mayor que cero.";

        return;
    }


    if (tamanoTramo1 < 0 || tamanoTramo2 < 0) {

        error.textContent =
            "Los kWh de los tramos no pueden ser negativos.";

        return;
    }


    if (
        persona1Kwh < 0 ||
        persona1Kwh > totalKwh
    ) {

        error.textContent =
            "El consumo de la persona 1 no puede ser negativo ni superar el consumo total.";

        return;
    }


    // =========================
    // PERSONA 2
    // =========================

    const persona2Kwh =
        totalKwh - persona1Kwh;


    // =========================
    // PORCENTAJES
    // =========================

    const porcentajePersona1 =
        (persona1Kwh / totalKwh) * 100;

    const porcentajePersona2 =
        (persona2Kwh / totalKwh) * 100;


    // =========================
    // BLOQUES DE KWh
    // =========================

    // Cada persona tiene derecho a la mitad de cada tramo barato
    // (por ejemplo, con tramos de 70 y 130 kWh: 35 y 65 kWh). Los kWh se
    // usan en orden: primero el tramo 1, después el tramo 2 y el resto va
    // al excedente. Si una persona no llega a usar su mitad de un tramo,
    // lo que le sobra lo usa la otra persona.

    function repartirTramo(capacidad, restante1, restante2) {

        let tramo1 = Math.min(restante1, capacidad / 2);

        let tramo2 = Math.min(restante2, capacidad / 2);

        const sobrante = capacidad - tramo1 - tramo2;

        const extra1 = Math.min(restante1 - tramo1, sobrante);

        tramo1 += extra1;

        tramo2 += Math.min(restante2 - tramo2, sobrante - extra1);

        return [tramo1, tramo2];
    }


    const [kwhTramo1Persona1, kwhTramo1Persona2] =
        repartirTramo(tamanoTramo1, persona1Kwh, persona2Kwh);


    const [kwhTramo2Persona1, kwhTramo2Persona2] =
        repartirTramo(
            tamanoTramo2,
            persona1Kwh - kwhTramo1Persona1,
            persona2Kwh - kwhTramo1Persona2
        );


    const kwhExcedentePersona1 =
        persona1Kwh - kwhTramo1Persona1 - kwhTramo2Persona1;


    const kwhExcedentePersona2 =
        persona2Kwh - kwhTramo1Persona2 - kwhTramo2Persona2;


    const kwhTramo1Total =
        kwhTramo1Persona1 + kwhTramo1Persona2;

    const kwhTramo2Total =
        kwhTramo2Persona1 + kwhTramo2Persona2;

    const kwhExcedenteTotal =
        kwhExcedentePersona1 + kwhExcedentePersona2;


    // =========================
    // CENTAVOS
    // =========================

    // Todo se calcula en centavos enteros para que la suma de las dos
    // personas dé exactamente el total de la factura. Cada renglón se toma
    // tal como figura en la factura (redondeado al centavo) y se reparte
    // entre las dos personas sin perder ni agregar centavos.

    function centavos(valor) {

        return Math.round(
            (valor + Number.EPSILON * Math.max(1, Math.abs(valor))) * 100
        );
    }


    // Cuando un renglón no se puede dividir justo (por ejemplo, un importe
    // impar al 50/50), el centavo que sobra se alterna entre las personas.
    let proximoCentavoPersona1 = true;

    function repartir(importeCentavos, fraccionPersona1) {

        const exacto = importeCentavos * fraccionPersona1;

        let persona1 = Math.floor(exacto);

        const resto = exacto - persona1;

        if (Math.abs(resto - 0.5) < 1e-9) {

            if (proximoCentavoPersona1) {
                persona1 += 1;
            }

            proximoCentavoPersona1 = !proximoCentavoPersona1;

        } else if (resto > 0.5) {

            persona1 += 1;
        }

        return [persona1, importeCentavos - persona1];
    }


    // =========================
    // COSTO DE ENERGÍA
    // =========================

    const lineaTramo1 = centavos(kwhTramo1Total * precioTramo1);

    const lineaTramo2 = centavos(kwhTramo2Total * precioTramo2);

    const lineaExcedente = centavos(kwhExcedenteTotal * precioExcedente);


    const [energiaTramo1Persona1, energiaTramo1Persona2] =
        repartir(
            lineaTramo1,
            kwhTramo1Total === 0 ? 0.5 : kwhTramo1Persona1 / kwhTramo1Total
        );

    const [energiaTramo2Persona1, energiaTramo2Persona2] =
        repartir(
            lineaTramo2,
            kwhTramo2Total === 0 ? 0.5 : kwhTramo2Persona1 / kwhTramo2Total
        );

    const [energiaExcedentePersona1, energiaExcedentePersona2] =
        repartir(
            lineaExcedente,
            kwhExcedenteTotal === 0 ? 0.5 : kwhExcedentePersona1 / kwhExcedenteTotal
        );


    const energiaPersona1 =
        energiaTramo1Persona1 +
        energiaTramo2Persona1 +
        energiaExcedentePersona1;


    const energiaPersona2 =
        energiaTramo1Persona2 +
        energiaTramo2Persona2 +
        energiaExcedentePersona2;


    // =========================
    // EDESA 50/50
    // =========================

    const [cargoFijo5Persona1, cargoFijo5Persona2] =
        repartir(centavos(cargoFijo5), 0.5);

    const [cargoFijo25Persona1, cargoFijo25Persona2] =
        repartir(centavos(cargoFijo25), 0.5);

    const [ivaEdesaPersona1, ivaEdesaPersona2] =
        repartir(centavos(ivaEdesa), 0.5);


    const totalEdesaPersona1 =
        energiaPersona1 +
        cargoFijo5Persona1 +
        cargoFijo25Persona1 +
        ivaEdesaPersona1;


    const totalEdesaPersona2 =
        energiaPersona2 +
        cargoFijo5Persona2 +
        cargoFijo25Persona2 +
        ivaEdesaPersona2;


    // =========================
    // AGUAS 50/50
    // =========================

    const [cargoFijoAguaPersona1, cargoFijoAguaPersona2] =
        repartir(centavos(cargoFijoAguas), 0.5);

    const [consumoAguaPersona1, consumoAguaPersona2] =
        repartir(centavos(consumoAguas), 0.5);

    const [tasaAguaPersona1, tasaAguaPersona2] =
        repartir(centavos(tasaAguas), 0.5);

    const [ivaAguaPersona1, ivaAguaPersona2] =
        repartir(centavos(ivaAguas), 0.5);


    const totalAguasPersona1 =
        cargoFijoAguaPersona1 +
        consumoAguaPersona1 +
        tasaAguaPersona1 +
        ivaAguaPersona1;


    const totalAguasPersona2 =
        cargoFijoAguaPersona2 +
        consumoAguaPersona2 +
        tasaAguaPersona2 +
        ivaAguaPersona2;


    // =========================
    // ALUMBRADO + LUSAL
    // =========================

    const [alumbradoPersona1, alumbradoPersona2] =
        repartir(centavos(alumbradoPublico), 0.5);

    const [mantenimientoPersona1, mantenimientoPersona2] =
        repartir(centavos(mantenimientoLusal), 0.5);


    const totalAlumbradoPersona1 =
        alumbradoPersona1 +
        mantenimientoPersona1;


    const totalAlumbradoPersona2 =
        alumbradoPersona2 +
        mantenimientoPersona2;


    // =========================
    // TOTAL FINAL
    // =========================

    const totalAPagarPersona1 =
        totalEdesaPersona1 +
        totalAguasPersona1 +
        totalAlumbradoPersona1;


    const totalAPagarPersona2 =
        totalEdesaPersona2 +
        totalAguasPersona2 +
        totalAlumbradoPersona2;


    const totalRepartido =
        totalAPagarPersona1 +
        totalAPagarPersona2;


    // =========================
    // FORMATO
    // =========================

    function dinero(valorCentavos) {

        return (valorCentavos / 100).toFixed(2);
    }


    function numero(valor) {

        return valor.toFixed(2);
    }


    // =========================
    // CONSUMO
    // =========================

    document.getElementById(
        "resultadoKwh1"
    ).textContent =
        numero(persona1Kwh);


    document.getElementById(
        "resultadoKwh2"
    ).textContent =
        numero(persona2Kwh);


    document.getElementById(
        "resultadoPorcentaje1"
    ).textContent =
        porcentajePersona1.toFixed(2) + "%";


    document.getElementById(
        "resultadoPorcentaje2"
    ).textContent =
        porcentajePersona2.toFixed(2) + "%";


    // =========================
    // BLOQUES
    // =========================

    document.getElementById(
        "bloqueTramo1Persona1"
    ).textContent =
        numero(kwhTramo1Persona1);


    document.getElementById(
        "bloqueTramo2Persona1"
    ).textContent =
        numero(kwhTramo2Persona1);


    document.getElementById(
        "bloqueExcedentePersona1"
    ).textContent =
        numero(kwhExcedentePersona1);


    document.getElementById(
        "bloqueTramo1Persona2"
    ).textContent =
        numero(kwhTramo1Persona2);


    document.getElementById(
        "bloqueTramo2Persona2"
    ).textContent =
        numero(kwhTramo2Persona2);


    document.getElementById(
        "bloqueExcedentePersona2"
    ).textContent =
        numero(kwhExcedentePersona2);


    // =========================
    // ENERGÍA
    // =========================

    document.getElementById(
        "energiaTramo1Persona1"
    ).textContent =
        dinero(energiaTramo1Persona1);


    document.getElementById(
        "energiaTramo2Persona1"
    ).textContent =
        dinero(energiaTramo2Persona1);


    document.getElementById(
        "energiaExcedentePersona1"
    ).textContent =
        dinero(energiaExcedentePersona1);


    document.getElementById(
        "energiaTotalPersona1"
    ).textContent =
        dinero(energiaPersona1);


    document.getElementById(
        "energiaTramo1Persona2"
    ).textContent =
        dinero(energiaTramo1Persona2);


    document.getElementById(
        "energiaTramo2Persona2"
    ).textContent =
        dinero(energiaTramo2Persona2);


    document.getElementById(
        "energiaExcedentePersona2"
    ).textContent =
        dinero(energiaExcedentePersona2);


    document.getElementById(
        "energiaTotalPersona2"
    ).textContent =
        dinero(energiaPersona2);


    // =========================
    // REPARTO
    // =========================

    document.getElementById(
        "edesaPersona1"
    ).textContent =
        dinero(totalEdesaPersona1);


    document.getElementById(
        "edesaPersona2"
    ).textContent =
        dinero(totalEdesaPersona2);


    document.getElementById(
        "aguasPersona1"
    ).textContent =
        dinero(totalAguasPersona1);


    document.getElementById(
        "aguasPersona2"
    ).textContent =
        dinero(totalAguasPersona2);


    document.getElementById(
        "alumbradoPersona1"
    ).textContent =
        dinero(totalAlumbradoPersona1);


    document.getElementById(
        "alumbradoPersona2"
    ).textContent =
        dinero(totalAlumbradoPersona2);


    // =========================
    // TOTAL FINAL
    // =========================

    document.getElementById(
        "totalPersona1"
    ).textContent =
        dinero(totalAPagarPersona1);


    document.getElementById(
        "totalPersona2"
    ).textContent =
        dinero(totalAPagarPersona2);


    document.getElementById(
        "totalRepartido"
    ).textContent =
        dinero(totalRepartido);


    // =========================
    // MOSTRAR RESULTADOS
    // =========================

    document.getElementById(
        "resultados"
    ).classList.remove("hidden");
}


document
    .getElementById("calcularBtn")
    .addEventListener("click", calcular);


// =========================
// CARGAR FACTURA PDF
// =========================

// Lee el PDF de EDESA en el navegador y completa los campos con los
// importes de la factura. El archivo no se sube a ningún lado.

function numeroArgentino(texto) {

    return Number(
        texto.replace(/\./g, "").replace(",", ".")
    );
}


async function leerTextoPdf(archivo) {

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const datos = new Uint8Array(await archivo.arrayBuffer());

    const pdf = await pdfjsLib.getDocument({ data: datos }).promise;

    const lineas = [];

    for (let numero = 1; numero <= pdf.numPages; numero++) {

        const pagina = await pdf.getPage(numero);

        const contenido = await pagina.getTextContent();

        // Agrupa los textos que están a la misma altura en una línea.
        const filas = [];

        for (const item of contenido.items) {

            if (!item.str.trim()) continue;

            const x = item.transform[4];
            const y = item.transform[5];

            let fila = filas.find(f => Math.abs(f.y - y) < 2);

            if (!fila) {
                fila = { y, items: [] };
                filas.push(fila);
            }

            fila.items.push({ x, texto: item.str });
        }

        filas.sort((a, b) => b.y - a.y);

        for (const fila of filas) {

            fila.items.sort((a, b) => a.x - b.x);

            lineas.push(
                fila.items.map(i => i.texto).join(" ").replace(/\s+/g, " ")
            );
        }
    }

    return lineas.join("\n");
}


function buscarImporte(texto, patron) {

    const encontrado = texto.match(patron);

    return encontrado ? numeroArgentino(encontrado[1]) : null;
}


function extraerFactura(texto) {

    const importe = "(\\d{1,3}(?:\\.\\d{3})*,\\d{2})";

    const cargosFijos = [
        ...texto.matchAll(
            new RegExp("Cargo Fijo Mensual \\([^)]*\\) " + importe, "gi")
        )
    ].map(m => numeroArgentino(m[1]));

    // Los tramos vienen en orden: tramo 1, tramo 2 y el excedente.
    // Sus kWh cambian de un mes a otro (por ejemplo 70/130 o 61/139).
    const tramos = [];

    const excedente = {};

    for (const m of texto.matchAll(
        /Energia activa( excedente)? \(([\d.,]+) kWh \* ([\d.,]+) \$ \/ kWh\)/gi
    )) {
        const tramo = {
            kwh: numeroArgentino(m[2]),
            precio: numeroArgentino(m[3])
        };

        if (m[1]) {
            Object.assign(excedente, tramo);
        } else {
            tramos.push(tramo);
        }
    }

    const consumo = texto.match(/Activa (\d+) (\d+) [\d,]+ (\d+)/);

    return {
        cargoFijo5: cargosFijos[0],
        cargoFijo25: cargosFijos[1],
        tamanoTramo1: tramos[0]?.kwh,
        tamanoTramo2: tramos[1]?.kwh,
        precioTramo1: tramos[0]?.precio,
        precioTramo2: tramos[1]?.precio,
        precioExcedente: excedente.precio,
        ivaEdesa: buscarImporte(
            texto, new RegExp("IVA Consumidor Final 21,00% " + importe, "i")
        ),
        alumbradoPublico: buscarImporte(
            texto, new RegExp("Incidencia Energia Alumb\\. Pub\\. \\([^)]*\\) " + importe, "i")
        ),
        cargoFijoAguas: buscarImporte(
            texto, new RegExp("Cargo Fijo " + importe)
        ),
        consumoAguas: buscarImporte(
            texto, new RegExp("Consumo Equivalente " + importe, "i")
        ),
        tasaAguas: buscarImporte(
            texto, new RegExp("Tasa de Fiscalizaci[oó]n y Control [\\d,]+% " + importe, "i")
        ),
        ivaAguas: buscarImporte(
            texto, new RegExp("IVA Consumidor Final 21% " + importe, "i")
        ),
        mantenimientoLusal: buscarImporte(
            texto, new RegExp("Mantenimiento de Alumbrado Publico - Tarifa \\w+ " + importe, "i")
        ),
        totalKwh: consumo ? Number(consumo[3]) : null,
        total: buscarImporte(
            texto, new RegExp("T o t a l: " + importe)
        )
    };
}


async function cargarFactura(evento) {

    const estado = document.getElementById("estadoFactura");

    const archivo = evento.target.files[0];

    if (!archivo) return;

    estado.style.color = "var(--text-secondary)";

    estado.textContent = "Leyendo la factura...";

    try {

        if (typeof pdfjsLib === "undefined") {
            throw new Error(
                "No se pudo cargar el lector de PDF. Revisá la conexión a internet."
            );
        }

        const factura = extraerFactura(await leerTextoPdf(archivo));

        const faltan = [];

        for (const [id, valor] of Object.entries(factura)) {

            if (id === "total") continue;

            if (valor === null || valor === undefined || Number.isNaN(valor)) {
                faltan.push(id);
                continue;
            }

            document.getElementById(id).value = valor;
        }

        if (faltan.length) {

            estado.style.color = "";

            estado.textContent =
                "No pude leer algunos datos de la factura (" +
                faltan.join(", ") +
                "). Completalos a mano.";

        } else {

            estado.textContent =
                "Factura cargada. Total de la factura: $" +
                (factura.total ?? 0).toFixed(2) +
                ". Completá el consumo de la persona 1 y calculá.";
        }

    } catch (e) {

        estado.style.color = "";

        estado.textContent =
            "No pude leer la factura: " + e.message;
    }
}


document
    .getElementById("facturaPdf")
    .addEventListener("change", cargarFactura);
