const API_BASE_URL = "http://localhost:8080";

export interface Area {
  id: number;
  name: string;
  interval_minutes: number;
  message: string;
  enabled: boolean;
  last_triggered_at: string | null;
}

export interface AreaCreate {
  name: string;
  interval_minutes: number;
  message: string;
}

export interface discordMessage {
    id: number;
    name: string;
    webhookUrl: string;
    message: string;
    interval_minutes: number;
    enabled: boolean;
    last_triggered_at: string | null;
}

export interface discordMessageCreate {
    name: string;
    webhookUrl: string;
    message: string;
    interval_minutes: number;
}

async function performFetch(
  path: string,
  init: RequestInit | undefined,
  actionDescription: string
): Promise<Response> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, init);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${actionDescription}: ${reason}`);
  }
}

async function parseJsonResponse<T>(
  response: Response,
  failurePrefix: string
): Promise<T> {
  if (!response.ok) {
    const details = await response.text().catch(() => "");
    const suffix = details ? ` - ${details}` : "";
    throw new Error(
      `${failurePrefix}: ${response.status} ${response.statusText}${suffix}`
    );
  }
  return (await response.json()) as T;
}

export async function listAreas(): Promise<Area[]> {
  const response = await performFetch("/areas", undefined, "Unable to reach backend while listing areas");
  return parseJsonResponse<Area[]>(response, "Failed to list areas");
}

export async function listDiscordMessages(): Promise<discordMessage[]> {
    const response = await performFetch("/discord/messages", undefined, "Unable to reach backend while listing discord messages");
    return parseJsonResponse<discordMessage[]>(response, "Failed to list discord messages");
}
export async function createArea(payload: AreaCreate): Promise<Area> {
  const response = await performFetch(
    "/areas",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    },
    "Unable to reach backend while creating area"
  );

  return parseJsonResponse<Area>(response, "Failed to create area");
}

export async function createDiscordMessage(payload: discordMessageCreate): Promise<discordMessage> {
    const response = await performFetch(
        "/discord/messages",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        },
        "Unable to reach backend while creating discord message"
    );

    return parseJsonResponse<discordMessage>(response, "Failed to create discord message");
}
