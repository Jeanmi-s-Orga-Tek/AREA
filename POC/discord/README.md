# Discord POC – How to start

From the project root (`/home/jm/Epitech/Tek3/AREA`), start the full stack (backend + DB + front + Discord POC) with:

```bash
cd /home/jm/Epitech/Tek3/AREA
docker compose up --build
```

Once the containers are up, you can quickly check that the POC backend is running with:

```bash
curl http://localhost/health
curl http://localhost/about.json
```

To watch the trigger engine and Discord messages in real time:

```bash
cd /home/jm/Epitech/Tek3/AREA
docker compose logs backend -f
```

You should see `[TRIGGER]` and `[DISCORD]` logs, and the corresponding messages in your Discord channel.
