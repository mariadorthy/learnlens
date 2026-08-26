from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Text,
    Boolean,
    DateTime,
)
from datetime import datetime
from database import Base


class LearningAttempt(Base):
    __tablename__ = "learning_attempts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    student_id = Column(
        String,
    nullable=False,
    index=True
    )

    concept = Column(
        String
    )

    dimension = Column(
        String
    )

    score = Column(
        Float
    )

    mistake = Column(
        Text,
        nullable=True
    )

    recommendation = Column(
        Text,
        nullable=True
    )
    
    question_id = Column(
        String,
        nullable=True,
        index=True
    )

    ai_analysis = Column(
        Text,
        nullable=True
    )

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String,
        nullable=False
    )

class LearningExecution(Base):
    __tablename__ = "learning_executions"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(String, nullable=False)
    concept = Column(String, nullable=False)
    dimension = Column(String, nullable=False)

    question_id = Column(String, nullable=True)

    code = Column(Text, nullable=True)
    output = Column(Text, nullable=True)
    expected_output = Column(Text, nullable=True)

    success = Column(Boolean, default=False)
    score = Column(Float, nullable=True)

    mistake = Column(String, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

class MistakeHistory(Base):
    __tablename__ = "mistake_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    student_id = Column(
        String,
        nullable=False,
        index=True
    )

    concept = Column(
        String,
        nullable=False,
        index=True
    )

    dimension = Column(
        String,
        nullable=False,
        index=True
    )

    question_type = Column(
        String,
        nullable=False,
        index=True
    )

    question_id = Column(
        String,
        nullable=True,
        index=True
    )

    mistake_type = Column(
        String,
        nullable=True,
        index=True
    )

    mistake_detail = Column(
        Text,
        nullable=True
    )

    count = Column(
        Integer,
        default=1,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )