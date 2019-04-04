const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');


require('../models/student');
const StudentModel = mongoose.model('students');
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
};

router.post('/session/getStudent', function (req, res) {
    console.log(1)
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