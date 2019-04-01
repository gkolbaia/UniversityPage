const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const StudentSchema = new Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    dateOfBirth: String,
    personalNumber: String,
    phone: String
});
mongoose.model('students', StudentSchema);