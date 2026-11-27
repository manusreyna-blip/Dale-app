import type { Cause } from './types';
import credits from '../../assets/images/causes/credits.json';

/**
 * Default cover photo for each cause. All from Unsplash under the Unsplash License
 * (free for commercial use). Credits live in assets/images/causes/credits.json and are
 * shown in the "Cómo cuidamos tus datos" screen.
 * Rule for future entity uploads: no recognizable faces of children (Ley 26.061).
 */
export const CAUSE_PHOTOS: Record<Cause, number> = {
  Niñez: require('../../assets/images/causes/ninez.jpg'),
  'Personas mayores': require('../../assets/images/causes/mayores.jpg'),
  Discapacidad: require('../../assets/images/causes/discapacidad.jpg'),
  Comedores: require('../../assets/images/causes/comedores.jpg'),
  Educación: require('../../assets/images/causes/educacion.jpg'),
  Ambiente: require('../../assets/images/causes/ambiente.jpg'),
  Animales: require('../../assets/images/causes/animales.jpg'),
  'Salud mental': require('../../assets/images/causes/salud-mental.jpg'),
};

export const WELCOME_PHOTO: number = require('../../assets/images/causes/bienvenida.jpg');

export const PHOTO_CREDITS = credits as { file: string; author: string; author_url: string; photo_url: string }[];
