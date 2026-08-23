from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Float
from sqlalchemy import Text

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