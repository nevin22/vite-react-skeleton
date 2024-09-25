import sb_logo from '../assets/main_logo_2.svg';
import th_logo from '../assets/main_logo_1.svg';

const client: string = import.meta.env.VITE_CUSTOMER_THEME;
const sb: boolean = client === 'Starbucks';

// Define the theme object with proper types
const theme: {
  main_bg: string,
  total: string;
  date: string;
  time: string;
  bg_color: string;
  main_logo: string;
  logo_height: number;
} = {
  main_bg: sb ? 'sb_main_bg' : 'th_main_bg',
  total: sb ? 'sb_total' : 'th_total',
  date: sb ? 'sb_date' : 'th_date',
  time: sb ? 'sb_time' : 'th_time',
  bg_color: sb ? 'sb_bg_color' : 'th_bg_color',
  main_logo: sb ? sb_logo : th_logo,
  logo_height: sb ? 140 : 50,
};

export default theme;