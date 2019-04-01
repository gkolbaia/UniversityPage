const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const SubjectSchema = new Schema({
    subject: String,
    teacherId: String,
    studentId: String,
    grades: {
        attending: { type: String, default: null },
        midTerm: { type: String, default: null },
        quiz: { type: String, default: null },
        final: { type: String, default: null }
    }
});
mongoose.model('teacher', SubjectSchema)