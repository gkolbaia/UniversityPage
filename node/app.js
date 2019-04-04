const express = require('express');
const bcrypt = require('bcrypt');
fs = require('fs');
const jwt = require('jsonwebtoken');
bodyParser = require('body-parser');
cors = require('cors');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())
const mongoose = require('mongoose');
const db = require('./config/database')
mongoose.connect(db.mongoURI, { useNewUrlParser: true });
require('./models/student');
require('./models/subject');
require('./models/teacher');
const StudentModel = mongoose.model('students');
const SubjectModel = mongoose.model('subject');
const TeacherModel = mongoose.model('teacher');
const ObjectId = mongoose.Types.ObjectId;
const students  = require('./routes/students')

function verifyToken(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(401).send('Unauthorized request')
    }
    let token = req.headers.authorization.split(' ')[1];
    if (token === 'null') {
        return res.status(401).send('Unauthorized request')
    }
    let payload = jwt.verify(token, 'Secretkey');
    if (!payload) {
        return res.status(401).send('Unauthorized request')
    }
    req.userId = payload.subject;
    next();
};
function getLoggedInPersontId(req, res) {
    let token = req.headers.authorization.split(' ')[1];
    if (token === 'null') {
        return res.status(401).send('Unauthorized request')
    };
    let payload = jwt.verify(token, 'Secretkey');
    if (!payload) {
        return res.status(401).send('Unauthorized request')
    };
    if (payload.studentId) {
        return payload.studentId;
    } else {
        return payload.TeacherId
    }
}
app.use('/session/*', verifyToken);

app.post('/session/getSession', function (req, res) {
    let token = req.headers.authorization.split(' ')[1];
    let payload = jwt.verify(token, 'Secretkey');
    if (!payload) {
        return res.status(401).send('Unauthorized request')
    };
    res.send(payload);
});
app.post('/session/getStudent', function (req, res) {
    const studentId = getLoggedInPersontId(req, res);
    StudentModel.findOne({ _id: ObjectId(studentId) }, (err, student) => {
        if (err) {
            res.status(401).send('sada');
        } else {
            if (student) {
                res.json(student);
            } else {
                res.status(401).send('sada');
            }
        }
    });
});
app.get('/session/getTeacher', function (req, res) {
    var teacherId = getLoggedInPersontId(req, res);
    TeacherModel.findOne({ _id: ObjectId(teacherId) }, (error, teacher) => {
        if (error) {
            res.status(401).send('sada');
        } else {
            if (teacher) {
                res.status(200).send(teacher)
            } else {
                res.status(401).send('sada');
            }
        }
    })
});
app.post('/registerStudent', function (req, res) {
    var student = new StudentModel();
    student.firstName = req.body.firstName;
    student.lastName = req.body.lastName;
    student.email = req.body.email;
    student.password = req.body.password;
    student.dateOfBirth = req.body.dateOfBirth;
    student.personalNumber = req.body.personalNumber;
    student.phone = req.body.phone;
    bcrypt.hash(student.password, 6, function (err, hash) {
        if (err) {
            console.log(err)
        } else {
            student.password = hash;
            student.save((error, registeredStudent) => {
                if (error) {
                    console.log(error)
                } else {
                    let payload = { studentId: registeredStudent._id };
                    let token = jwt.sign(payload, 'Secretkey');
                    res.status(200).send({ token: token, student: registeredStudent });
                };
            });
        };
    });
});
app.post('/login', function (req, res) {
    StudentModel.findOne({ firstName: req.body.firstName, lastName: req.body.lastName }, (error, student) => {
        if (error) {
            console.log(error);
        } else {
            if (student) {
                bcrypt.compare(req.body.password, student.password).then(function (response) {
                    if (response) {
                        let payload = { studentId: student._id };
                        let token = jwt.sign(payload, 'Secretkey')
                        res.status(200).send({ token: token, student: student })
                    } else {
                        res.status(442).send({
                            message: 'wrong password'
                        });
                    }
                });
            } else {
                TeacherModel.findOne({ firstName: req.body.firstName, lastName: req.body.lastName }, (error, teacher) => {
                    if (error) {
                        console.log(error)
                    } else {
                        if (teacher) {
                            teacher1 = JSON.parse(JSON.stringify(teacher))
                            if (req.body.password === teacher1.password) {
                                let payload = { TeacherId: teacher1._id };
                                let token = jwt.sign(payload, 'Secretkey');
                                res.status(200).send({ token: token, teacher: teacher })
                            } else {
                                console.log('s')
                                res.status(442).send('Wrong Password')
                            }
                        } else {
                            res.status(442).send({
                                message: 'wrong name or last name'
                            });
                        }

                    }
                })

            }
        }
    });
});
app.get('/session/getTeachers', function (req, res) {
    TeacherModel.find({}, (error, teachers) => {
        if (error) {
            res.status(401).send('sada');
        } else {
            if (teachers) {
                res.status(200).send(teachers);
            } else {
                res.status(404).send('could not find teachers or there ar no teachers')
            }
        }
    });
});
app.post('/session/saveSubject', function (req, res) {
    const studentId = getLoggedInPersontId(req, res);
    var subject = new SubjectModel();
    subject.subject = req.body.subject;
    subject.teacherId = req.body.teacherId;
    subject.studentId = studentId;
    subject.save();
    res.json(subject)
});
app.post('/session/getSubjectsForStudent', function (req, res) {
    const studentId = getLoggedInPersontId(req, res);
    SubjectModel.find({ studentId }, (error, subjects) => {
        if (error) {
            res.status(401).send('sada');
        } else {
            if (subjects) {
                res.status(200).send(subjects);
            } else {
                res.status(404).send('there ar no subjects for this student');
            }
        }
    });
});
app.get('/session/getSubjectsForTeacher', function (req, res) {
    const teacherId = getLoggedInPersontId(req, res);
    SubjectModel.find({ teacherId }, (err, subjects) => {
        if (err) {
            console.log(err)
        } else {
            if (subjects) {
                res.status(200).send(subjects);
            } else {
                res.status(404).send('there ar no subjects for this teacher');
            }
        }
    });
})
app.get('/session/getNeededTeachersForStudetn', function (req, res) {
    const studentId = getLoggedInPersontId(req, res);
    SubjectModel.find({ studentId }, (error, subjects) => {
        if (error) {
            res.status(401).send('sada');
        } else {
            if (subjects) {
                const teachers = subjects.map(subject => subject.teacherId);
                TeacherModel.find({ _id: { $in: teachers } }, 'email firstName lastName phone subject times ', function (err, neededTeachers) {
                    if (err) {
                        res.status(404).send('error')
                    } else {
                        res.json(neededTeachers)
                    }
                });
            } else {
                res.status(401).send('sada')
            }
        }
    });




});
app.get('/session/getPersonStatus', function (req, res) {
    const personId = getLoggedInPersontId(req, res);
    StudentModel.findOne({ _id: ObjectId(personId) }, function (err, student) {
        if (err) {
            console.log(err);
        } else {
            if (student) {
                res.status(200).send({ person: 'student' });
            } else {
                TeacherModel.findOne({ _id: ObjectId(personId) }, (error, teacher) => {
                    if (error) {
                        console.log(error);
                    } else {
                        if (teacher) {
                            res.status(200).send({ person: 'teacher' });
                        } else {
                            res.status(404).send('not student, neather teacher ')
                        }
                    }
                })
            }
        }
    })
});
app.get('/session/getStudentsForTeacher', function (req, res) {
    var students = [];
    var teacherId = getLoggedInPersontId(req, res);
    TeacherModel.findOne({ _id: ObjectId(teacherId) }, (err, teacher) => {
        if (err) {
            res.status(401).send('sada');
        } else {
            var subject = teacher.subject;
            SubjectModel.find({ teacherId: ObjectId(teacherId) }, (err, subjects) => {
                if (err) {
                    res.status(401).send('sada');
                } else {
                    var studentIds = subjects.map(subject => subject.studentId);
                    StudentModel.find({ _id: { $in: studentIds } }, (err, students) => {
                        if (err) {
                            res.status(404).send('error')
                        } else {
                            res.status(200).send(students)
                        }
                    });
                }
            })

        }
    })

});
app.post('/session/editingGrades', function (req, res) {
    studentId = req.body.studentId;
    teacherId = req.body.teacherId
    SubjectModel.findOne({ teacherId: teacherId, studentId: studentId }, (err, subject) => {
        subject.grades.quiz = req.body.grades.quiz;
        subject.grades.midTerm = req.body.grades.midTerm;
        subject.grades.attending = req.body.grades.attending;
        subject.grades.final = req.body.grades.final;
        subject.save();
    })
});
app.get('/session/getSubjectsForGrid', function (req, res) {
    var subjectsTosend = [];
    const studentId = getLoggedInPersontId(req, res);

    SubjectModel.find({ studentId }, (err, subjects) => {
        teacherIds = subjects.map(subject => subject.teacherId);
        TeacherModel.find({ _id: { $in: teacherIds } }, (err, teachers) => {
            var subjectNeddedforms = {};
            teachers.forEach((teacher, index) => {
                subjects.forEach(subject => {

                    if (JSON.stringify(subject.teacherId) === JSON.stringify(teacher._id)) {
                        var teacher1 = JSON.parse(JSON.stringify(teacher))
                        subjectNeddedform = {
                            subject: subject.subject,
                            day: teacher1.times[0].day,
                            starts: teacher1.times[0].startingTime,
                            ends: teacher1.times[0].endingTime
                        }
                        subjectsTosend.push(subjectNeddedform)
                    }
                });
            });
            res.status(200).send(subjectsTosend)
        })



    });
})
app.get('/session/getSubjectsForLearningCard', function (req, res) {
    var formToSend = [];
    const studentId = getLoggedInPersontId(req, res);
    SubjectModel.find({ studentId }, (err, subjects) => {
        var teacherIds = subjects.map(subject => subject.teacherId)
        TeacherModel.find({ _id: { $in: teacherIds } }, function (err, teachers) {
            teachers.forEach(teacher => {
                subjects.forEach(subject => {
                    if (JSON.stringify(subject.teacherId) === JSON.stringify(teacher._id)) {
                        var form = {
                            grades: subject.grades,
                            subject: subject.subject,
                            teacher: `${teacher.firstName} ${teacher.lastName}`
                        };
                        formToSend.push(form);
                    };
                });
            });
            res.status(200).send(formToSend);
        });
    });
});
const port = process.env.PORT || 8000
app.listen(port, () => {
    console.log(`serer is listenint on port ${port}`);
});