/**
 * studyBriefService.js
 * REST call layer for the AI-generated daily study brief.
 * Components never call the backend directly (DIP).
 */

import API_BASE_URL from "../config/api";

/**
 * Fetches a personalised study brief for the authenticated user.
 *
 * @param {string} idToken - Firebase ID token from auth.currentUser.getIdToken()
 * @returns {Promise<{ brief: string, generatedAt: string }>}
 */
export async function fetchStudyBrief(idToken) {
  const response = await fetch(`${API_BASE_URL}/study-brief/`, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch study brief: ${response.status}`);
  }

  return response.json();
}
