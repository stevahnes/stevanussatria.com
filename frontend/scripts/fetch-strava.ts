// Run this script during your build process to fetch Strava activities

import fs from "fs";
import path from "path";

// Store these in environment variables
const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
}

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  start_date: string;
  start_latlng: [number, number] | null;
  end_latlng: [number, number] | null;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  map: {
    id: string;
    summary_polyline: string;
    polyline?: string;
  };
  kudos_count: number;
}

interface ProcessedActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  start_date: string;
  start_latlng: [number, number] | null;
  end_latlng: [number, number] | null;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  map: {
    id: string;
    summary_polyline: string;
    polyline?: string;
  };
  kudos_count: number;
}

interface Stats {
  total_rides: number;
  total_distance: number;
  total_elevation: number;
  total_time: number;
  longest_ride: number;
  last_updated: string;
}

interface OutputData {
  stats: Stats;
  activities: ProcessedActivity[];
}

async function refreshAccessToken(): Promise<string> {
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  const data = (await response.json()) as TokenResponse;
  return data.access_token;
}

async function fetchActivities(accessToken: string): Promise<StravaActivity[]> {
  const activities: StravaActivity[] = [];
  let page = 1;
  const perPage = 200;
  let hasMoreData = true;

  while (hasMoreData) {
    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    const data = (await response.json()) as StravaActivity[];

    if (data.length === 0) {
      hasMoreData = false;
      break;
    }

    activities.push(...data);
    page++;

    // Optional: limit total activities
    if (activities.length >= 500) {
      hasMoreData = false;
      break;
    }
  }

  return activities;
}

async function fetchDetailedActivity(
  activityId: number,
  accessToken: string,
): Promise<StravaActivity> {
  const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return (await response.json()) as StravaActivity;
}

async function main(): Promise<void> {
  try {
    console.log("🔄 Refreshing Strava access token...");
    const accessToken = await refreshAccessToken();

    console.log("📥 Fetching activities...");
    const activities = await fetchActivities(accessToken);

    console.log(`✅ Fetched ${activities.length} activities`);

    // Filter for cycling activities only (optional)
    const cyclingActivities = activities.filter(
      activity => activity.type === "Ride" || activity.type === "VirtualRide",
    );

    // Transform data to only what you need
    const processedActivities: ProcessedActivity[] = cyclingActivities.map(activity => ({
      id: activity.id,
      name: activity.name,
      distance: activity.distance, // in meters
      moving_time: activity.moving_time, // in seconds
      elapsed_time: activity.elapsed_time,
      total_elevation_gain: activity.total_elevation_gain,
      type: activity.type,
      start_date: activity.start_date,
      start_latlng: activity.start_latlng,
      end_latlng: activity.end_latlng,
      average_speed: activity.average_speed,
      max_speed: activity.max_speed,
      average_heartrate: activity.average_heartrate,
      max_heartrate: activity.max_heartrate,
      map: activity.map, // contains polyline
      kudos_count: activity.kudos_count,
    }));

    // Optional: Fetch detailed data for featured rides
    const featuredIds: number[] = [123456, 789012]; // Your favorite ride IDs
    const detailedActivities = await Promise.all(
      featuredIds.map(id => fetchDetailedActivity(id, accessToken)),
    );

    // Calculate stats
    const stats: Stats = {
      total_rides: cyclingActivities.length,
      total_distance: cyclingActivities.reduce((sum, a) => sum + a.distance, 0),
      total_elevation: cyclingActivities.reduce((sum, a) => sum + a.total_elevation_gain, 0),
      total_time: cyclingActivities.reduce((sum, a) => sum + a.moving_time, 0),
      longest_ride: Math.max(...cyclingActivities.map(a => a.distance)),
      last_updated: new Date().toISOString(),
    };

    // Save to file
    const outputDir = path.join(process.cwd(), "..", "docs", "data");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const output: OutputData = {
      stats,
      activities: processedActivities,
      detailedActivities, // if fetching detailed data
    };

    fs.writeFileSync(path.join(outputDir, "strava-data.json"), JSON.stringify(output, null, 2));

    console.log("💾 Data saved to public/data/strava-data.json");
    console.log(
      `📊 Stats: ${stats.total_rides} rides, ${(stats.total_distance / 1000).toFixed(0)}km total`,
    );
  } catch (error) {
    console.error("❌ Error fetching Strava data:", error);
    process.exit(1);
  }
}

main();
