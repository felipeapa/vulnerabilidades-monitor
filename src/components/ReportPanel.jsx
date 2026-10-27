import { useState } from 'react';
import { reportUrl } from '../api/client';
import { PERIODS } from '../utils/periods';

export default function ReportPanel({ technologies }) {
  const [days, setDays] = useState(90);
  const [format, setFormat] = useState('txt');

  const href = reportUrl({ days, technologies, format });
  const scope = technologies.length ? technologies.length : 'todas las';

  return (
    <section className="section panel" aria-labelledby="report-panel-title">
      <div className="panel__header">
        <h2 className="panel__title" id="report-panel-title">
          Reportes
        </h2>
      </div>

      <div className="panel__body">
        <p className="hint hint--top">
          Descarga el detalle completo para un periodo más largo. El reporte incluye {scope}{' '}
          tecnologías seleccionadas arriba, con severidad, solución y enlace al aviso.
        </p>

        <div className="report-form">
          <div className="field">
            <label htmlFor="report-days">Periodo del reporte</label>
            <select
              id="report-days"
              value={days}
              onChange={event => setDays(Number(event.target.value))}
            >
              {PERIODS.map(item => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="report-format">Formato</label>
            <select
              id="report-format"
              value={format}
              onChange={event => setFormat(event.target.value)}
            >
              <option value="txt">TXT (legible)</option>
              <option value="csv">CSV (hoja de cálculo)</option>
              <option value="json">JSON (integraciones)</option>
            </select>
          </div>

          <a className="btn btn--secondary" href={href} target="_blank" rel="noreferrer">
            Descargar reporte
          </a>
        </div>
      </div>
    </section>
  );
}
