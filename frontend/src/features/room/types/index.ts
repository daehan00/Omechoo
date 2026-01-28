// === Request Types ===

export interface CandidateInput {
  value: string;
  display_name?: string;
}

export interface CreateRoomRequest {
  name: string;
  host_nickname: string;
  candidate_type: 'menu' | 'restaurant';
  candidates: CandidateInput[];
  max_participants?: number;
  expires_in_minutes?: number;
}

export interface JoinRoomRequest {
  nickname: string;
}

export interface CastVoteRequest {
  candidate_id: string;
}

export interface ChangeVoteRequest {
  new_candidate_id: string;
}

// === Response Types ===

export interface Candidate {
  id: string;
  value: string;
  display_name: string | null;
}

export interface Participant {
  nickname: string;
  is_host: boolean;
  joined_at: string;
}

export interface VoteResult {
  candidate: Candidate;
  vote_count: number;
  voters: string[];
}

export interface Room {
  id: string;
  name: string;
  candidate_type: 'menu' | 'restaurant';
  candidates: Candidate[];
  status: RoomStatus;
  max_participants: number;
  participant_count: number;
  expires_at: string | null;
  created_at: string;
}

export interface CreateRoomResponse {
  room_id: string;
  share_url: string;
  token: string;
}

export interface JoinRoomResponse {
  token: string;
  nickname: string;
  is_host: boolean;
  room: Room;
}

export interface RoomDetailResponse {
  room: Room;
  participants: Participant[];
  results: VoteResult[];
  my_vote: string | null;
}

export interface VoteResponse {
  success: boolean;
  message: string;
  results: VoteResult[];
}

export interface CloseRoomResponse {
  success: boolean;
  final_results: VoteResult[];
  winner: Candidate | null;
}

// === Enums ===

export type RoomStatus = 'waiting' | 'voting' | 'closed';
export type CandidateType = 'menu' | 'restaurant';

// === JWT Payload ===

export interface RoomTokenPayload {
  room_id: string;
  participant_id: string;
  nickname: string;
  is_host: boolean;
  exp: number;
}
