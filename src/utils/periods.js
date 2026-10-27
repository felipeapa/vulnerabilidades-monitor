export const PERIODS = [
  { value: 30, label: 'Últimos 30 días' },
  { value: 90, label: 'Últimos 90 días' },
  { value: 180, label: 'Últimos 180 días' },
  { value: 365, label: 'Último año' },
  { value: 0, label: 'Todo lo almacenado' },
];

export const PERIOD_VALUES = PERIODS.map(item => item.value);
