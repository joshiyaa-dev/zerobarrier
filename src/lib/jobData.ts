import constructionImg from '@/assets/icons/construction.png';
import farmingImg from '@/assets/icons/farming.png';
import cookingImg from '@/assets/icons/cooking.png';
import drivingImg from '@/assets/icons/driving.png';
import cleaningImg from '@/assets/icons/cleaning.png';
import plumbingImg from '@/assets/icons/plumbing.png';

export interface Job {
  id: string;
  icon: string;
  image: string;
  titleEn: string;
  titleTa: string;
  salary: number;
  locationEn: string;
  locationTa: string;
  skillEn: string;
  skillTa: string;
}

export const sampleJobs: Job[] = [
  { id: '1', icon: '🏗️', image: constructionImg, titleEn: 'Construction Worker', titleTa: 'கட்டுமான தொழிலாளி', salary: 15000, locationEn: 'Chennai', locationTa: 'சென்னை', skillEn: 'Building', skillTa: 'கட்டுமானம்' },
  { id: '2', icon: '🌾', image: farmingImg, titleEn: 'Farm Worker', titleTa: 'விவசாய தொழிலாளி', salary: 12000, locationEn: 'Madurai', locationTa: 'மதுரை', skillEn: 'Farming', skillTa: 'விவசாயம்' },
  { id: '3', icon: '🍳', image: cookingImg, titleEn: 'Cook', titleTa: 'சமையல்காரர்', salary: 18000, locationEn: 'Coimbatore', locationTa: 'கோயம்புத்தூர்', skillEn: 'Cooking', skillTa: 'சமையல்' },
  { id: '4', icon: '🚗', image: drivingImg, titleEn: 'Driver', titleTa: 'ஓட்டுநர்', salary: 20000, locationEn: 'Chennai', locationTa: 'சென்னை', skillEn: 'Driving', skillTa: 'வாகனம் ஓட்டுதல்' },
  { id: '5', icon: '🧹', image: cleaningImg, titleEn: 'Cleaner', titleTa: 'சுத்தம் செய்பவர்', salary: 10000, locationEn: 'Trichy', locationTa: 'திருச்சி', skillEn: 'Cleaning', skillTa: 'சுத்தம்' },
  { id: '6', icon: '🔧', image: plumbingImg, titleEn: 'Plumber', titleTa: 'குழாய் பணியாளர்', salary: 22000, locationEn: 'Salem', locationTa: 'சேலம்', skillEn: 'Plumbing', skillTa: 'குழாய் பணி' },
];
