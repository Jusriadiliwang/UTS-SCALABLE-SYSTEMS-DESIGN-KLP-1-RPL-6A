CREATE TABLE roles (id INT PRIMARY KEY, name VARCHAR(50), label VARCHAR(100));
CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100), email VARCHAR(100), password VARCHAR(255), role_id INT, student_id INT, teacher_id INT);
CREATE TABLE students (id INT PRIMARY KEY, nis VARCHAR(50), name VARCHAR(100), class_id INT, status VARCHAR(30), parent_name VARCHAR(100));
CREATE TABLE teachers (id INT PRIMARY KEY, nip VARCHAR(50), name VARCHAR(100), subject_id INT);
CREATE TABLE classes (id INT PRIMARY KEY, name VARCHAR(100), homeroom_teacher_id INT);
CREATE TABLE subjects (id INT PRIMARY KEY, name VARCHAR(100));
CREATE TABLE teaching_journals (id INT PRIMARY KEY, teacher_id INT, class_id INT, subject_id INT, date DATE, material TEXT, method VARCHAR(100), notes TEXT);
CREATE TABLE bk_cases (id INT PRIMARY KEY, student_id INT, teacher_id INT, date DATE, case_type VARCHAR(100), description TEXT, follow_up TEXT, status VARCHAR(50));
CREATE TABLE activity_logs (id INT PRIMARY KEY, user_id INT, user_name VARCHAR(100), role VARCHAR(50), action VARCHAR(100), detail TEXT, timestamp DATETIME);

CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_journals_teacher_id ON teaching_journals(teacher_id);
CREATE INDEX idx_journals_class_id ON teaching_journals(class_id);
CREATE INDEX idx_journals_subject_id ON teaching_journals(subject_id);
CREATE INDEX idx_bk_cases_student_id ON bk_cases(student_id);
