import { useState } from 'react';
import { checkPackage } from '../api/client';

export default function PackageCheckForm({ onChecked }) {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const packageName = name.trim();
    const packageVersion = version.trim();
    if (!packageName) return;

    setBusy(true);
    setFeedback(null);

    try {
      const result = await checkPackage(packageName, packageVersion);
      const found = result?.found ?? 0;
      const label = packageVersion ? `${packageName}@${packageVersion}` : packageName;

      setFeedback({
        type: 'ok',
        text: found > 0
          ? `${found} vulnerabilidad${found === 1 ? '' : 'es'} encontrada${found === 1 ? '' : 's'} para ${label}.`
          : `Sin vulnerabilidades conocidas para ${label}.`,
      });

      setName('');
      setVersion('');
      await onChecked?.();
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="check-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="check-package">Paquete npm</label>
        <input
          id="check-package"
          name="packageName"
          type="text"
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder="express"
          autoComplete="off"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="check-version">Versión (opcional)</label>
        <input
          id="check-version"
          name="version"
          type="text"
          value={version}
          onChange={event => setVersion(event.target.value)}
          placeholder="4.20.0"
          autoComplete="off"
        />
      </div>

      <button type="submit" className="btn btn--secondary" disabled={busy || !name.trim()}>
        {busy ? <span className="spinner" aria-hidden="true" /> : null}
        {busy ? 'Consultando…' : 'Consultar'}
      </button>

      <p
        className={`form-feedback${feedback ? ` form-feedback--${feedback.type}` : ''}`}
        role="status"
        aria-live="polite"
      >
        {feedback?.text || ''}
      </p>
    </form>
  );
}
