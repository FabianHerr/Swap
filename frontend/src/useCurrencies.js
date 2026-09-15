import { useEffect, useState } from 'react';
import api from './api';

// The list only changes when the backend deploys, so fetch it once and share it between pages
let request;

// Supported currencies from the API (the same list the server validates offers against)
export default function useCurrencies() {
  const [currencies, setCurrencies] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    request ??= api.get('/offer/currencies').then((res) => res.data.currencies);
    request
      .then((list) => active && setCurrencies(list))
      .catch(() => {
        request = undefined; // let the next page mount try again
        if (active) setError("Couldn't load currencies. Is the server running?");
      });
    return () => { active = false; };
  }, []);

  return { currencies, error };
}
