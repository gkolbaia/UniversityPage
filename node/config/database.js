if (process.env.NODE_ENV === 'production') {
    module.exports = { mongoURI: 'mongodb://<gioba>:<jvebesinho1>@ds257245.mlab.com:57245/universitypage' }
} else {
    module.exports = { mongoURI: 'mongodb://192.168.4.169/gio-test-2' }
}