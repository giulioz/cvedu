function process(data, width, height) {
  const yuvImage = imageToYUV(data);
  const mask = chromaKey(yuvImage);
  const hough = houghTransform(yuvImage, mask, width, 0.1, 4.0, 400.0);
  // console.log(hough);

  // return yuvImage;
  maskToImage(mask, data);
}

function imageToYUV(data) {
  // Crea una copia dei pixel
  const newData = data.slice();

  // Per ogni pixel...
  for (let i = 0; i < newData.length; i += 4) {
    // Estrae i valori di RGB
    const R = newData[i];
    const G = newData[i + 1];
    const B = newData[i + 2];

    // Calcola i valori di YUV applicando una moltiplicazione matriciale
    const Y = 0.257 * R + 0.504 * G + 0.098 * B + 16;
    const U = -0.148 * R - 0.291 * G + 0.439 * B + 128;
    const V = 0.439 * R - 0.368 * G - 0.071 * B + 128;

    // Salva i valori di YUV sulla copia dell'immagine
    newData[i] = Y;
    newData[i + 1] = U;
    newData[i + 2] = V;
  }

  return newData;
}

// Parametri per chromaKey
const pU = 136;
const pV = 173;
const radius = 5;

function chromaKey(data) {
  const mask = new Array(data.length / 4);

  for (let i = 0; i < data.length; i += 4) {
    // Estraggo i valori di U e V per quel pixel
    const U = data[i + 1];
    const V = data[i + 2];

    // Calcolo la distanza fra il pixel e i valori di u e v desiderati
    const du = U - pU;
    const dv = V - pV;

    // Ne faccio la somma dei quadrati
    const d2 = du * du + dv * dv;

    // E calcolo il quadrato del raggio
    const r2 = radius * radius;

    // Se la somma dei quadrati è inferiore al quadrato del raggio il pixel è valido
    mask[i / 4] = d2 < r2;
  }

  return mask;
}

function maskToImage(mask, target) {
  for (let i = 0; i < mask.length; i++) {
    target[i * 4 + 0] = mask[i] * 255;
    target[i * 4 + 1] = mask[i] * 255;
    target[i * 4 + 2] = mask[i] * 255;
    target[i * 4 + 3] = 255;
  }
}

function houghTransform(data, mask, width, a_step, r_step, max_r) {
  // Accumulatore
  const alpha_steps = Math.round(Math.PI / a_step) + 1;
  const r_steps = Math.round((max_r * 2.0) / r_step) + 1;
  const accumulator = new Array(alpha_steps * r_steps).fill(0);

  // Variabili per immagazzinare i massimi trovati
  let current_a = 0;
  let current_r = 0;
  let current_max = 0;

  for (let i = 0; i < data.length; i += 4) {
    const maskValue = mask[i / 4];
    const imgY = data[i + 0];

    const x = (i / 4) % width;
    const y = Math.floor(i / 4 / width);

    // Se un pixel è stato selezionato dalla maschera può far parte della barra
    if (maskValue) {
      // Creo la sua curva trasformata iterando per ogni angolo
      for (let a = 0.0; a < Math.PI; a += a_step) {
        // Calcolo il parametro r per tale angolo
        const r = x * Math.cos(a) + y * Math.sin(a);

        // Se tale parametro è compreso nei bound attesi...
        if (r > -max_r && r < max_r) {
          // Calcolo la cella nell'accumulatore
          const r_pos = Math.round((r + max_r) / r_step);
          const a_pos = Math.round(a / a_step);

          // E vi aggiungo il valore della luminanza
          accumulator[a_pos + r_pos * alpha_steps] += imgY;

          // Controllo se il valore ottenuto è superiore al massimo attuale
          if (accumulator[a_pos + r_pos * alpha_steps] > current_max) {
            current_max = accumulator[a_pos + r_pos * alpha_steps];
            current_a = a;
            current_r = r;
          }
        }
      }
    }
  }

  return { a: current_a, r: current_r, a_deg: current_a * (180.0 / Math.PI) };
}
