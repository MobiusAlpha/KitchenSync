import { useState, useEffect } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { SettingsRepository } from '../storage/SettingsRepository.js';

/**
 * Polish: Global alarm settings page.
 * Reads/writes the global AlarmConfiguration via SettingsRepository.
 */
export function AlarmSettingsPage() {
  const [defaultEnabled, setDefaultEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void SettingsRepository.read().then(cfg => setDefaultEnabled(cfg.defaultEnabled));
  }, []);

  const handleSave = async () => {
    await SettingsRepository.write({ id: 'global', defaultEnabled });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="py-3">
      <h1 className="mb-4">Settings</h1>
      <Card>
        <Card.Header>Alarm Settings</Card.Header>
        <Card.Body>
          {saved && <Alert variant="success">Settings saved.</Alert>}
          <Form.Check
            type="switch"
            id="global-alarm-toggle"
            label="Enable alarms by default for all sessions"
            checked={defaultEnabled}
            onChange={e => setDefaultEnabled(e.target.checked)}
            className="mb-3"
          />
          <Button variant="success" onClick={() => void handleSave()}>
            Save
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
}
