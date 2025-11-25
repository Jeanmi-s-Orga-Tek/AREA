import React, { useEffect, useState } from "react";

import {
    discordMessage,
    createDiscordMessage,
    listDiscordMessages,
    discordMessageCreate
} from "./api";

const Discord: React.FC = () => {
    const [webhookUrl, setWebhookUrl] = useState("");
    const [intervalMinutesDiscord, setIntervalMinutesDiscord] = useState<number>(1);
    const [messageDiscord, setMessageDiscord] = useState("");
    const [discordMessages, setDiscordMessages] = useState<discordMessage[]>([]);
    const [loadingDiscord, setLoadingDiscord] = useState(false);
    const [loadingListDiscord, setLoadingListDiscord] = useState(false);
    const [errorDiscord, setErrorDiscord] = useState<string | null>(null);

    const loadDiscord = async () => {
        setLoadingListDiscord(true);
        setErrorDiscord(null);
        try {
            const resp = await fetch("http://localhost:8080/api/discord");
            console.log("list messages status:", resp.status);
            if (!resp.ok) {
              throw new Error("Backend error");
            }
            const data = await resp.json();
            setDiscordMessages(data);
        } catch (err) {
            console.error("Fetch error while listing discord messages:", err);
            setErrorDiscord("Unable to reach backend while listing discord messages.");
        } finally {
            setLoadingDiscord(false);
        }
    };

    useEffect(() => {
        loadDiscord();
    }, []);

    const handleSubmitDiscord = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorDiscord(null);

        if (!webhookUrl.trim() || !messageDiscord.trim()) {
            setErrorDiscord("Webhook URL and message are required.");
            return;
        }

        try {
        const resp = await fetch("/api/discord", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                webhook_url: webhookUrl,
                content: messageDiscord,
            }),
        });

        if (!resp.ok) {
            const data = await resp.json().catch(() => null);
            console.error("Discord error:", data);
            setErrorDiscord(data?.detail || "Failed to send Discord message.");
            return;
        }
        console.log("Discord message sent OK");
        alert("Discord message sent");
    } catch (err) {
        console.error("Network or server error:", err);
        setErrorDiscord("Error sending Discord message.");
    }

        if (intervalMinutesDiscord < 1) {
            setErrorDiscord("Interval must be at least 1 minute.");
            return;
        }

        const payload: discordMessageCreate = {
            name: "",
            webhookUrl: webhookUrl.trim(),
            message: messageDiscord.trim(),
            interval_minutes: intervalMinutesDiscord
        };

        setLoadingDiscord(true);
        try {
            await createDiscordMessage(payload);
            setWebhookUrl("");
            setIntervalMinutesDiscord(1);
            setMessageDiscord("");
            await loadDiscord();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to create discord message";
            setErrorDiscord(message);
        } finally {
            setLoadingDiscord(false);
        }
    };

    return (
        <main>
            <header>
                <h1>AREA POC – Timer → Discord (webhook)</h1>
                <p>
                    This page lets you configure periodic Discord webhook messages from the backend at{" "}
                    <code>server:8080</code>.
                </p>
            </header>

            <section>
                <h2>Create new Discord webhook timer</h2>
                <form onSubmit={handleSubmitDiscord}>
                    <label>
                        webhook URL
                        <input
                            type="url"
                            value={webhookUrl}
                            onChange={(event) => setWebhookUrl(event.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            required
                        />
                    </label>

                    <label>
                        Interval (minutes)
                        <input
                            type="number"
                            min={1}
                            value={intervalMinutesDiscord}
                            onChange={(event) =>
                                setIntervalMinutesDiscord(Number(event.target.value))
                            }
                            required
                        />
                    </label>

                    <label>
                        Message
                        <textarea
                            value={messageDiscord}
                            onChange={(event) => setMessageDiscord(event.target.value)}
                            placeholder="Message for discord from AREA POC"
                            rows={3}
                            required
                        />
                    </label>

                    <button type="submit" disabled={loadingDiscord}>
                        {loadingDiscord ? "Creating Discord message…" : "Create Discord message"}
                    </button>
                </form>
                {errorDiscord && <p className="error">{errorDiscord}</p>}
            </section>

            <section>
                <h2>Existing Discord messages</h2>
                {loadingListDiscord ? (
                    <p>Loading discord messages…</p>
                ) : discordMessages.length === 0 ? (
                    <p>No Discord message configured yet.</p>
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
                            {discordMessages.map((msg) => (
                                <tr key={msg.id}>
                                    <td>{msg.id}</td>
                                    <td>{msg.name}</td>
                                    <td>{msg.interval_minutes}</td>
                                    <td>{msg.enabled ? "Yes" : "No"}</td>
                                    <td>{msg.last_triggered_at ?? "never"}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}

export default Discord;