                         USER
                       /  |   \
                      /   |    \
                     ↓    ↓     ↓
                STUDENT TEACHER ADMIN
                   |       |
                   |       |
              DEPARTMENT ←─┘
                   |
             ┌─────┴─────────┐
             ↓               ↓
          SUBJECT         TEACHER_SUBJECT
             |
       ┌─────┴────────┐
       ↓              ↓
   SYLLABUS       STUDENT_SUBJECT
                       |
                    STUDENT
                       |
          ┌────────────┼─────────────┐
          ↓            ↓             ↓
    STUDENT_SEMESTER TRANSACTION  EXAM_REGISTRATION
                                      |
                                      ↓
                                  ADMIT_CARD
                                      |
                                      ↓
                                    EXAM
                              ┌───────┼───────┐
                              ↓       ↓       ↓
                           SUBJECT  ROOM   SCHEDULE
                              |
                              ↓
                         ANSWER_COPY
                              |
                              ↓
                       COPY_ASSIGNMENT
                              |
                              ↓
                           TEACHER
                              |
                              ↓
                            MARKS
                              |
                              ↓
                           RESULT
                              |
                              ↓
                      RESULT_SUBJECT