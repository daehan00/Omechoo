"""투표 방 관련 SQLAlchemy Repository 구현"""
from datetime import datetime
from collections import defaultdict
from sqlalchemy.orm import Session

from app.domain.entities.room import (
    Room,
    Participant,
    Vote,
    VoteResult,
    Candidate,
    RoomStatus,
)
from app.domain.interfaces.room import (
    RoomRepository,
    ParticipantRepository,
    VoteRepository,
)
from app.models.room import RoomModel, ParticipantModel, VoteModel


class SQLAlchemyRoomRepository(RoomRepository):
    """SQLAlchemy 기반 방 저장소"""
    
    def __init__(self, db: Session):
        self._db = db
    
    def _to_entity(self, model: RoomModel) -> Room:
        """ORM 모델 -> 도메인 엔티티 변환"""
        candidates = [
            Candidate(
                id=c["id"],
                value=c["value"],
                display_name=c.get("display_name"),
            )
            for c in model.candidates
        ]
        return Room(
            id=model.id,
            name=model.name,
            host_id=model.host_id,
            candidate_type=model.candidate_type,
            candidates=candidates,
            status=model.status,
            max_participants=model.max_participants,
            expires_at=model.expires_at,
            created_at=model.created_at,
        )
    
    def _to_model(self, entity: Room) -> RoomModel:
        """도메인 엔티티 -> ORM 모델 변환"""
        candidates_json = [
            {
                "id": c.id,
                "value": c.value,
                "display_name": c.display_name,
            }
            for c in entity.candidates
        ]
        return RoomModel(
            id=entity.id,
            name=entity.name,
            host_id=entity.host_id,
            candidate_type=entity.candidate_type,
            candidates=candidates_json,
            status=entity.status,
            max_participants=entity.max_participants,
            expires_at=entity.expires_at,
            created_at=entity.created_at,
        )
    
    def create(self, room: Room) -> Room:
        model = self._to_model(room)
        self._db.add(model)
        self._db.commit()
        self._db.refresh(model)
        return self._to_entity(model)
    
    def get_by_id(self, room_id: str) -> Room | None:
        model = self._db.query(RoomModel).filter(RoomModel.id == room_id).first()
        return self._to_entity(model) if model else None
    
    def update_status(self, room_id: str, status: RoomStatus) -> Room | None:
        model = self._db.query(RoomModel).filter(RoomModel.id == room_id).first()
        if not model:
            return None
        model.status = status
        self._db.commit()
        self._db.refresh(model)
        return self._to_entity(model)
    
    def delete(self, room_id: str) -> bool:
        model = self._db.query(RoomModel).filter(RoomModel.id == room_id).first()
        if not model:
            return False
        self._db.delete(model)
        self._db.commit()
        return True
    
    def get_expired_rooms(self) -> list[Room]:
        now = datetime.now()
        models = self._db.query(RoomModel).filter(
            RoomModel.expires_at.isnot(None),
            RoomModel.expires_at < now,
            RoomModel.status != RoomStatus.CLOSED,
        ).all()
        return [self._to_entity(m) for m in models]


class SQLAlchemyParticipantRepository(ParticipantRepository):
    """SQLAlchemy 기반 참여자 저장소"""
    
    def __init__(self, db: Session):
        self._db = db
    
    def _to_entity(self, model: ParticipantModel) -> Participant:
        return Participant(
            id=model.id,
            room_id=model.room_id,
            nickname=model.nickname,
            is_host=model.is_host,
            joined_at=model.joined_at,
        )
    
    def add(self, participant: Participant) -> Participant:
        model = ParticipantModel(
            id=participant.id,
            room_id=participant.room_id,
            nickname=participant.nickname,
            is_host=participant.is_host,
            joined_at=participant.joined_at,
        )
        self._db.add(model)
        self._db.commit()
        self._db.refresh(model)
        return self._to_entity(model)
    
    def get_by_id(self, participant_id: str) -> Participant | None:
        model = self._db.query(ParticipantModel).filter(
            ParticipantModel.id == participant_id
        ).first()
        return self._to_entity(model) if model else None
    
    def get_by_room_id(self, room_id: str) -> list[Participant]:
        models = self._db.query(ParticipantModel).filter(
            ParticipantModel.room_id == room_id
        ).all()
        return [self._to_entity(m) for m in models]
    
    def get_by_room_and_nickname(
        self, room_id: str, nickname: str
    ) -> Participant | None:
        model = self._db.query(ParticipantModel).filter(
            ParticipantModel.room_id == room_id,
            ParticipantModel.nickname == nickname,
        ).first()
        return self._to_entity(model) if model else None
    
    def count_by_room_id(self, room_id: str) -> int:
        return self._db.query(ParticipantModel).filter(
            ParticipantModel.room_id == room_id
        ).count()
    
    def remove(self, participant_id: str) -> bool:
        model = self._db.query(ParticipantModel).filter(
            ParticipantModel.id == participant_id
        ).first()
        if not model:
            return False
        self._db.delete(model)
        self._db.commit()
        return True


class SQLAlchemyVoteRepository(VoteRepository):
    """SQLAlchemy 기반 투표 저장소"""
    
    def __init__(self, db: Session):
        self._db = db
    
    def _to_entity(self, model: VoteModel) -> Vote:
        return Vote(
            id=model.id,
            room_id=model.room_id,
            participant_id=model.participant_id,
            candidate_id=model.candidate_id,
            voted_at=model.voted_at,
        )
    
    def cast(self, vote: Vote) -> Vote:
        model = VoteModel(
            id=vote.id,
            room_id=vote.room_id,
            participant_id=vote.participant_id,
            candidate_id=vote.candidate_id,
            voted_at=vote.voted_at,
        )
        self._db.add(model)
        self._db.commit()
        self._db.refresh(model)
        return self._to_entity(model)
    
    def get_by_participant(
        self, room_id: str, participant_id: str
    ) -> Vote | None:
        model = self._db.query(VoteModel).filter(
            VoteModel.room_id == room_id,
            VoteModel.participant_id == participant_id,
        ).first()
        return self._to_entity(model) if model else None
    
    def update_vote(
        self, room_id: str, participant_id: str, new_candidate_id: str
    ) -> Vote | None:
        model = self._db.query(VoteModel).filter(
            VoteModel.room_id == room_id,
            VoteModel.participant_id == participant_id,
        ).first()
        if not model:
            return None
        model.candidate_id = new_candidate_id
        model.voted_at = datetime.now()
        self._db.commit()
        self._db.refresh(model)
        return self._to_entity(model)
    
    def delete_vote(
        self, room_id: str, participant_id: str
    ) -> bool:
        """투표 취소 (삭제)"""
        model = self._db.query(VoteModel).filter(
            VoteModel.room_id == room_id,
            VoteModel.participant_id == participant_id,
        ).first()
        if not model:
            return False
        self._db.delete(model)
        self._db.commit()
        return True
    
    def get_results(self, room_id: str) -> list[VoteResult]:
        # 방 정보 조회 (후보 목록 필요)
        room_model = self._db.query(RoomModel).filter(
            RoomModel.id == room_id
        ).first()
        if not room_model:
            return []
        
        # 투표 조회
        votes = self._db.query(VoteModel).filter(
            VoteModel.room_id == room_id
        ).all()
        
        # 참여자 정보 조회 (닉네임 매핑용)
        participants = self._db.query(ParticipantModel).filter(
            ParticipantModel.room_id == room_id
        ).all()
        participant_map = {p.id: p.nickname for p in participants}
        
        # 후보별 투표 집계
        vote_by_candidate: dict[str, list[str]] = defaultdict(list)
        for vote in votes:
            voter_nickname = participant_map.get(vote.participant_id, "Unknown")
            vote_by_candidate[vote.candidate_id].append(voter_nickname)
        
        # 결과 생성
        results = []
        for c in room_model.candidates:
            candidate = Candidate(
                id=c["id"],
                value=c["value"],
                display_name=c.get("display_name"),
            )
            voters = vote_by_candidate.get(c["id"], [])
            results.append(VoteResult(
                candidate=candidate,
                vote_count=len(voters),
                voters=voters,
            ))
        
        # 득표순 정렬
        results.sort(key=lambda r: r.vote_count, reverse=True)
        return results
    
    def get_vote_count(self, room_id: str) -> int:
        return self._db.query(VoteModel).filter(
            VoteModel.room_id == room_id
        ).count()
