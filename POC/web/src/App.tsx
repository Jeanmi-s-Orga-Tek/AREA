import React, { useEffect, useState } from "react";

import "./App.css";
import { Area, AreaCreate, createArea, listAreas } from "./api";

const App: React.FC = () => {
  const [name, setName] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState<number>(1);
  const [message, setMessage] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);

  const loadAreas = async () => {
    setLoadingList(true);
    try {
      const data = await listAreas();
      setAreas(data);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load areas";
      setError(message);
      console.error(message, err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!name.trim() || !message.trim()) {
      setError("Name and message are required.");
      return;
    }

    if (intervalMinutes < 1) {
      setError("Interval must be at least 1 minute.");
      return;
    }

    const payload: AreaCreate = {
      name: name.trim(),
      interval_minutes: intervalMinutes,
      message: message.trim()
    };

    setLoading(true);
    try {
      await createArea(payload);
      setName("");
      setIntervalMinutes(1);
      setMessage("");
      await loadAreas();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create area";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <header>
        <h1>AREA POC – Timer → Discord</h1>
        <p>
          This POC lets you create a periodic timer that triggers a Discord
          webhook from the backend running at <code>server:8080</code>.
        </p>
      </header>

      <section>
        <h2>Create new Timer → Discord AREA</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Morning reminder"
              required
            />
          </label>

          <label>
            Interval (minutes)
            <input
              type="number"
              min={1}
              value={intervalMinutes}
              onChange={(event) => setIntervalMinutes(Number(event.target.value))}
              required
            />
          </label>

          <label>
            Message
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="AREA POC OK"
              rows={3}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Creating AREA…" : "Create AREA"}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      <section>
        <h2>Existing AREAs</h2>
        {loadingList ? (
          <p>Loading areas…</p>
        ) : areas.length === 0 ? (
          <p>No AREA configured yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Interval (min)</th>
                  <th>Enabled</th>
                  <th>Last triggered</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((area) => (
                  <tr key={area.id}>
                    <td>{area.id}</td>
                    <td>{area.name}</td>
                    <td>{area.interval_minutes}</td>
                    <td>{area.enabled ? "Yes" : "No"}</td>
                    <td>{area.last_triggered_at ?? "never"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
};

export default App;
