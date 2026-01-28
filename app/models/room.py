"""투표 방 관련 SQLAlchemy ORM 모델"""
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    Boolean,
    ForeignKey,
    Enum as SQLEnum,
    JSON,
)
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.domain.entities.room import RoomStatus, CandidateType


class RoomModel(Base):
    """투표 방 테이블"""
    __tablename__ = "rooms"
    
    id = Column(String(36), primary_key=True)  # UUID
    name = Column(String(50), nullable=False)
    host_id = Column(String(36), nullable=False)  # participant_id
    candidate_type = Column(SQLEnum(CandidateType), nullable=False)
    candidates = Column(JSON, nullable=False)  # list of {id, value, display_name}
    status = Column(SQLEnum(RoomStatus), default=RoomStatus.WAITING, nullable=False)
    max_participants = Column(Integer, default=10)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    participants = relationship("ParticipantModel", back_populates="room", cascade="all, delete-orphan")
    votes = relationship("VoteModel", back_populates="room", cascade="all, delete-orphan")


class ParticipantModel(Base):
    """참여자 테이블"""
    __tablename__ = "participants"
    
    id = Column(String(36), primary_key=True)  # UUID
    room_id = Column(String(36), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    nickname = Column(String(20), nullable=False)
    is_host = Column(Boolean, default=False)
    joined_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    room = relationship("RoomModel", back_populates="participants")
    vote = relationship("VoteModel", back_populates="participant", uselist=False)


class VoteModel(Base):
    """투표 테이블"""
    __tablename__ = "votes"
    
    id = Column(String(36), primary_key=True)  # UUID
    room_id = Column(String(36), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    participant_id = Column(String(36), ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, unique=True)
    candidate_id = Column(String(36), nullable=False)
    voted_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    room = relationship("RoomModel", back_populates="votes")
    participant = relationship("ParticipantModel", back_populates="vote")
