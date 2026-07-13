import type { AnswerResponse } from '../types/api'

/** Navigation state carried from the itinerary popover into the scan flow. */
export interface ChallengeNavState {
  points?: number
  waypointName?: string
  category?: string
  missionId?: string
  phaseId?: string
}

/** Navigation state handed from Challenge → Result (transient screen, §8.9). */
export interface ResultNavState {
  result: AnswerResponse
  points?: number
  missionId?: string
  phaseId?: string
}
