export interface AboutAction {
  name: string;
  description: string;
}

export interface AboutReaction {
  name: string;
  description: string;
}

export interface AboutService {
  name: string;
  actions: AboutAction[];
  reactions: AboutReaction[];
}

export interface AboutServer {
  current_time: number;
  services: AboutService[];
}

export interface AboutClient {
  host: string;
}

export interface AboutResponse {
  client: AboutClient;
  server: AboutServer;
}

const ABOUT_URL = "http://server:8080/about.json";

export async function fetchAbout(): Promise<AboutResponse> {
  try {
    const response = await fetch(ABOUT_URL, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch /about.json: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as AboutResponse;
    return data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown network error";
    throw new Error(`Unable to reach /about.json: ${message}`);
  }
}
