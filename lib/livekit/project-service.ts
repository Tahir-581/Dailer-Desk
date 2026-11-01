/**
 * LiveKit Project Service
 * Handles creation of new LiveKit projects via LiveKit Cloud API
 * 
 * IMPORTANT: Set these environment variables:
 * - LIVEKIT_CLOUD_API_KEY: Your LiveKit Cloud API key
 * - LIVEKIT_CLOUD_API_SECRET: Your LiveKit Cloud API secret
 * 
 * Get these from: https://cloud.livekit.io/projects/settings
 */

import axios, { AxiosError } from "axios";

export interface LiveKitProjectResponse {
  id: string;
  name: string;
  api_key: string;
  api_secret: string;
  url: string;
}

/**
 * Create a new LiveKit project via Cloud API
 * 
 * Requires environment variables:
 * - LIVEKIT_CLOUD_API_KEY
 * - LIVEKIT_CLOUD_API_SECRET
 * 
 * @param projectName - The name for the new LiveKit project (e.g., "org-{orgId}")
 * @param region - DeploymentChoice region (default: "us-west-2")
 * @returns LiveKit project credentials
 * @throws Error if project creation fails
 */
export async function createLiveKitProject(
  projectName: string,
  region: string = "us-west-2"
): Promise<LiveKitProjectResponse> {
  const apiKey = process.env.LIVEKIT_CLOUD_API_KEY;
  const apiSecret = process.env.LIVEKIT_CLOUD_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error(
      "Missing LiveKit Cloud credentials. Set LIVEKIT_CLOUD_API_KEY and LIVEKIT_CLOUD_API_SECRET environment variables."
    );
  }

  try {
    const response = await axios.post(
      "https://api.cloud.livekit.io/projects",
      {
        name: projectName,
        deployment_choice: region,
      },
      {
        auth: {
          username: apiKey,
          password: apiSecret,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const projectData = response.data;

    if (!projectData.id || !projectData.api_key || !projectData.api_secret) {
      throw new Error(
        "Invalid response from LiveKit: missing required fields"
      );
    }

    return {
      id: projectData.id,
      name: projectData.name,
      api_key: projectData.api_key,
      api_secret: projectData.api_secret,
      url: projectData.url || "",
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    const errorMessage = axiosError.response?.data
      ? JSON.stringify(axiosError.response.data)
      : axiosError.message;

    console.error("LiveKit project creation failed:", errorMessage);
    throw new Error(`Failed to create LiveKit project: ${errorMessage}`);
  }
}

/**
 * List all LiveKit projects
 * 
 * @returns Array of LiveKit projects
 */
export async function listLiveKitProjects(): Promise<LiveKitProjectResponse[]> {
  const apiKey = process.env.LIVEKIT_CLOUD_API_KEY;
  const apiSecret = process.env.LIVEKIT_CLOUD_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error(
      "Missing LiveKit Cloud credentials. Set LIVEKIT_CLOUD_API_KEY and LIVEKIT_CLOUD_API_SECRET environment variables."
    );
  }

  try {
    const response = await axios.get("https://api.cloud.livekit.io/projects", {
      auth: {
        username: apiKey,
        password: apiSecret,
      },
    });

    return response.data || [];
  } catch (error) {
    const axiosError = error as AxiosError;
    const errorMessage = axiosError.response?.data
      ? JSON.stringify(axiosError.response.data)
      : axiosError.message;

    console.error("Failed to list LiveKit projects:", errorMessage);
    throw new Error(`Failed to list LiveKit projects: ${errorMessage}`);
  }
}
